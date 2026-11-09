import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager/platform_tags.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../i18n.dart';
import '../l10n/app_localizations.dart';
import '../widgets/card_face.dart';

enum WriteMode { temporary, permanent }

class WriteScreen extends StatefulWidget {
  const WriteScreen({super.key});
  @override
  State<WriteScreen> createState() => _WriteScreenState();
}

class _WriteScreenState extends State<WriteScreen>
    with SingleTickerProviderStateMixin {
  bool _loading = true;
  List<dynamic> _cards = [];
  int _selected = 0;

  /// 0 = 写入, 1 = 清除
  int _tab = 0;
  WriteMode _mode = WriteMode.temporary;

  bool _busy = false;
  int _done = 0;
  bool _revokeAfterClear = true;
  String? _error;
  bool _justCleared = false;

  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
    _load();
  }

  @override
  void dispose() {
    _pulse.dispose();
    NfcManager.instance.stopSession().catchError((_) {});
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final c = await Api.myCards(size: 50);
      setState(() => _cards = c);
    } catch (_) {
      setState(() => _cards = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic>? get _card => _cards.isEmpty
      ? null
      : _cards[_selected.clamp(0, _cards.length - 1)] as Map<String, dynamic>;

  String get _url {
    final c = _card;
    if (c == null) return '';
    return '$kApiBase/${c['code']}';
  }

  // ==================== 会话控制 ====================

  Future<void> _toggle() async {
    if (_busy) {
      await _stop();
      return;
    }
    setState(() {
      _busy = true;
      _done = 0;
      _error = null;
    });

    final available = await NfcManager.instance.isAvailable();
    if (!available) {
      setState(() {
        _busy = false;
        _error = L10n.of(context).writeNfcUnavailable;
      });
      return;
    }

    try {
      await NfcManager.instance.startSession(
        pollingOptions: {NfcPollingOption.iso14443, NfcPollingOption.iso15693},
        onDiscovered: (NfcTag tag) async {
          try {
            if (_tab == 0) {
              await _writeTag(tag);
            } else {
              await _clearTag(tag);
            }
          } catch (e) {
            HapticFeedback.mediumImpact();
            if (mounted) {
              setState(() => _error = e.toString().split('\n').first);
            }
          }
        },
        onError: (e) async {
          if (mounted) setState(() => _error = 'NFC error: $e');
          await _stop();
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = 'NFC start failed: $e';
        });
      }
    }
  }

  Future<void> _stop() async {
    try {
      await NfcManager.instance.stopSession();
    } catch (_) {}
    if (!mounted) return;
    setState(() => _busy = false);
  }

  // ==================== 写入 ====================

  Future<void> _writeTag(NfcTag tag) async {
    final ndef = Ndef.from(tag);
    if (ndef == null || !ndef.isWritable) {
      throw 'tag not writable';
    }
    await ndef.write(NdefMessage([NdefRecord.createUri(Uri.parse(_url))]));

    // 永久写入：写完立刻锁死标签
    if (_mode == WriteMode.permanent) {
      await _lockTag(tag);
    }

    HapticFeedback.heavyImpact();
    if (!mounted) return;
    setState(() {
      _done += 1;
      _error = null;
    });
  }

  /// NTAG21x 永久只读：CC 第 3 页写权限字节设为 0x0F
  Future<void> _lockTag(NfcTag tag) async {
    final ul = MifareUltralight.from(tag);
    if (ul != null) {
      await ul.writePage(
        pageOffset: 3,
        data: Uint8List.fromList([0xE1, 0x10, 0x12, 0x0F]),
      );
      return;
    }
    final nfca = NfcA.from(tag);
    if (nfca != null) {
      // WRITE 指令：A2 + 页号 + 4 字节
      await nfca.transceive(
        data: Uint8List.fromList([0xA2, 0x03, 0xE1, 0x10, 0x12, 0x0F]),
      );
      return;
    }
    throw 'tag not writable';
  }

  // ==================== 清除 ====================

  Future<void> _clearTag(NfcTag tag) async {
    // 1) 擦掉标签里的 NDEF 内容
    final ndef = Ndef.from(tag);
    if (ndef != null) {
      if (!ndef.isWritable) throw 'tag locked';
      await ndef.write(NdefMessage([]));
    } else {
      final fmt = NdefFormatable.from(tag);
      if (fmt == null) throw 'tag cannot be cleared';
      await fmt.format(NdefMessage([]));
    }

    // 2) 服务端作废（只有所有者能成功）
    final c = _card;
    if (c != null && _revokeAfterClear) {
      await Api.revokeCard(c['code'] as String);
    }

    HapticFeedback.heavyImpact();
    if (!mounted) return;
    setState(() {
      _done += 1;
      _error = null;
    });
  }

  // ==================== UI ====================

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: C.white, strokeWidth: 2));
    }
    if (_cards.isEmpty) return _emptyState();

    final clearing = _tab == 1;
    final card = _card!;
    final code = (card['code'] ?? '') as String;
    final revoked = card['revokedAt'] != null;

    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 固定头部：标题 + 写入/清除 切换
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(clearing ? l.writeClearLabel : l.writeLabel, style: Ts.label),
                const SizedBox(height: 6),
                Text(clearing ? l.writeClearTitle : l.writeTitle, style: Ts.title),
                const SizedBox(height: 16),
                _segmented(),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 30),
              children: [

          // 当前资料（只有一份，所有卡片共用）
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: C.surface,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ((_card!['profile'] ?? {}) as Map)['name']?.toString() ??
                            l.homeUnknown,
                        style: const TextStyle(fontSize: 15, color: C.text),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${(_card!['code'] ?? '')} · ${_card!['templateSlug'] ?? ''}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12, color: C.faint, letterSpacing: 0.2),
                      ),
                    ],
                  ),
                ),
                if (_card!['revokedAt'] != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0x33E5484D),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(l.writeRevoked,
                        style: TextStyle(
                            fontSize: 12, color: Color(0xFFE5484D))),
                  ),
              ],
            ),
          ),
          if (!clearing) _modeSelector(),
          if (clearing) _clearOption(),
          const SizedBox(height: 14),

          // 圆环 + 按钮
          SizedBox(
            height: 268,
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                if (_busy)
                  AnimatedBuilder(
                    animation: _pulse,
                    builder: (_, __) => Stack(
                      alignment: Alignment.center,
                      children: [
                        for (var i = 0; i < 3; i++)
                          _ring(
                            size: 150 + i * 48 + _pulse.value * 26,
                            opacity: (0.30 - i * 0.08) -
                                _pulse.value * (0.22 - i * 0.06),
                          ),
                      ],
                    ),
                  )
                else
                  for (var i = 0; i < 3; i++)
                    _ring(size: 150 + i * 48, opacity: 0.15 - i * 0.04),
                GestureDetector(
                  onTap: _toggle,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 164,
                    height: 164,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _busy ? C.raised : C.white,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: _busy
                          ? [
                              Text('$_done',
                                  style: const TextStyle(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w200,
                                      color: C.text,
                                      height: 1)),
                              const SizedBox(height: 6),
                              Text(clearing ? l.writeCleared : l.writeWritten,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: C.muted,
                                      letterSpacing: 0.3)),
                              const SizedBox(height: 8),
                              Text(l.writeTapAgainToStop,
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: C.faint,
                                      letterSpacing: 0.2)),
                            ]
                          : [
                              AppIcon(clearing ? AppIco.trash : AppIco.write,
                                  size: 34,
                                  color: clearing
                                      ? const Color(0xFFE5484D)
                                      : C.onWhite),
                              const SizedBox(height: 10),
                              Text(clearing ? l.writeStartClear : l.writeStart,
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: clearing
                                          ? const Color(0xFFE5484D)
                                          : C.onWhite,
                                      letterSpacing: 0.5)),
                              const SizedBox(height: 4),
                              Text(l.writeTapHint,
                                  style: TextStyle(
                                      fontSize: 12,
                                      color:
                                          C.onWhite.withValues(alpha: 0.55),
                                      letterSpacing: 0.2)),
                            ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          Center(
            child: Text(_busy ? l.writeHoldCardNear : l.writeHoldNear,
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 0.5,
                    color: C.text)),
          ),
          // 只有「清除」模式才需要这句警告；写入模式的说明已在模式选择器里，不重复
          if (clearing) ...[
            const SizedBox(height: 8),
            Center(
              child: Text(
                revoked ? l.writeCardRevokedHint : l.writeClearImmediately,
                maxLines: 2,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 13, color: Color(0xFFE5484D), height: 1.6),
              ),
            ),
          ],

          // 清除完成后：提示可以重新录入
          if (clearing && _justCleared && !_busy) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: C.surface,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.writeClearedNotice,
                      style: TextStyle(fontSize: 15, color: C.text)),
                  const SizedBox(height: 4),
                  Text(
                    _revokeAfterClear
                        ? l.writeClearedRewritten
                        : l.writeClearedCanRewrite,
                    style: const TextStyle(
                        fontSize: 12, color: C.faint, height: 1.6),
                  ),
                  if (!_revokeAfterClear) ...[
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => setState(() {
                        _tab = 0;
                        _justCleared = false;
                      }),
                      child: Container(
                        height: 40,
                        decoration: BoxDecoration(
                          color: C.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        alignment: Alignment.center,
                        child: Text(l.writeRewriteThis,
                            style: TextStyle(
                                fontSize: 13,
                                color: C.onWhite,
                                letterSpacing: 0.4)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 14),
            Center(
              child: Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 13, color: Color(0xFFE5484D))),
            ),
          ],

              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _segmented() {
    final l = L10n.of(context);
    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [_seg(0, l.writeTabWrite), _seg(1, l.writeTabClear)]),
    );
  }

  Widget _seg(int i, String label) {
    final on = _tab == i;
    return Expanded(
      child: GestureDetector(
        onTap: _busy
            ? null
            : () => setState(() {
                _tab = i;
                _justCleared = false;
              }),
        child: Container(
          decoration: BoxDecoration(
            color: on ? C.white : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          alignment: Alignment.center,
          child: Text(label,
              style: TextStyle(
                  fontSize: 13,
                  letterSpacing: 0.5,
                  fontWeight: on ? FontWeight.w600 : FontWeight.w400,
                  color: on ? C.onWhite : C.muted)),
        ),
      ),
    );
  }

  Widget _modeSelector() {
    final l = L10n.of(context);
    return Column(
      children: [
        _modeTile(WriteMode.temporary, l.writeModeTemp, l.writeModeTempDesc,
            AppIco.edit),
        const SizedBox(height: 10),
        _modeTile(WriteMode.permanent, l.writeModePerm, l.writeModePermDesc,
            AppIco.lock),
      ],
    );
  }

  Widget _modeTile(WriteMode m, String title, String desc, AppIco icon) {
    final on = _mode == m;
    return GestureDetector(
      onTap: _busy ? null : () => setState(() => _mode = m),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: on ? C.raised : C.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: on ? C.white : Colors.transparent, width: 1),
        ),
        child: Row(
          children: [
            AppIcon(icon, size: 20, color: on ? C.text : C.muted),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          fontSize: 15,
                          color: on ? C.text : C.muted,
                          fontWeight: on ? FontWeight.w600 : FontWeight.w400)),
                  const SizedBox(height: 2),
                  Text(desc,
                      style: const TextStyle(fontSize: 12, color: C.faint)),
                ],
              ),
            ),
            if (on) const AppIcon(AppIco.check, size: 18, color: C.white),
          ],
        ),
      ),
    );
  }

  Widget _clearOption() {
    final l = L10n.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const AppIcon(AppIco.block, size: 20, color: Color(0xFFE5484D)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l.writeRevokeToo,
                    style: const TextStyle(fontSize: 15, color: C.text)),
                const SizedBox(height: 2),
                Text(l.writeRevokeTooDesc,
                    style: TextStyle(fontSize: 12, color: C.faint)),
              ],
            ),
          ),
          Switch(
            value: _revokeAfterClear,
            onChanged:
                _busy ? null : (v) => setState(() => _revokeAfterClear = v),
            activeThumbColor: C.onWhite,
            activeTrackColor: C.white,
            inactiveThumbColor: C.muted,
            inactiveTrackColor: C.raised,
          ),
        ],
      ),
    );
  }

  Widget _ring({required double size, required double opacity}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: C.white.withValues(alpha: opacity.clamp(0.0, 1.0)),
          width: 1,
        ),
      ),
    );
  }



  Widget _emptyState() {
    final l = L10n.of(context);
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: C.raised)),
              alignment: Alignment.center,
              child: const AppIcon(AppIco.write, color: C.faint, size: 32),
            ),
            const SizedBox(height: 26),
            Text(l.writeNoCards,
                style: TextStyle(fontSize: 16, color: C.muted)),
            const SizedBox(height: 10),
            Text(l.writeCreateFirst,
                style: TextStyle(fontSize: 15, color: C.faint)),
          ],
        ),
      ),
    );
  }
}
