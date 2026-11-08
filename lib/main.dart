import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/ndef.dart' as ndef;

void main() {
  runApp(const NfcWriterApp());
}

const kBg = Color(0xFF0B0D12);
const kSurface = Color(0xFF151A23);
const kLine = Color(0xFF242B38);
const kGold = Color(0xFFE8C86A);
const kDim = Color(0xFF8B93A7);

class NfcWriterApp extends StatelessWidget {
  const NfcWriterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NFC 名片写入器',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBg,
        colorScheme: const ColorScheme.dark(
          primary: kGold,
          surface: kSurface,
        ),
        useMaterial3: true,
      ),
      home: const WriterPage(),
    );
  }
}

class WriteRecord {
  final String code;
  final String url;
  final DateTime time;
  WriteRecord(this.code, this.url, this.time);
}

class WriterPage extends StatefulWidget {
  const WriterPage({super.key});

  @override
  State<WriterPage> createState() => _WriterPageState();
}

class _WriterPageState extends State<WriterPage> {
  final _urlCtrl = TextEditingController();
  final _baseCtrl = TextEditingController(text: 'https://example.com/c/');
  final _history = <WriteRecord>[];

  String _status = '就绪';
  String _detail = '把 NFC 卡贴到手机背面即可写入';
  bool _busy = false;
  bool _available = false;
  String _availText = '检测中…';
  Color _statusColor = kDim;

  @override
  void initState() {
    super.initState();
    _genCode();
    _checkNfc();
  }

  @override
  void dispose() {
    _urlCtrl.dispose();
    _baseCtrl.dispose();
    super.dispose();
  }

  String _randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混字符
    final r = Random.secure();
    return List.generate(8, (_) => chars[r.nextInt(chars.length)]).join();
  }

  void _genCode() {
    final code = _randomCode();
    _urlCtrl.text = '${_baseCtrl.text}$code';
    setState(() {});
  }

  Future<void> _checkNfc() async {
    try {
      final a = await FlutterNfcKit.nfcAvailability;
      setState(() {
        switch (a) {
          case NFCAvailability.available:
            _available = true;
            _availText = 'NFC 可用';
            break;
          case NFCAvailability.disabled:
            _available = false;
            _availText = 'NFC 已关闭，请到系统设置里打开';
            break;
          case NFCAvailability.not_supported:
            _available = false;
            _availText = '这台设备没有 NFC 硬件（或系统未开放）';
            break;
        }
      });
    } catch (e) {
      setState(() {
        _available = false;
        _availText = '检测失败：$e';
      });
    }
  }

  void _setStatus(String s, String d, Color c) {
    setState(() {
      _status = s;
      _detail = d;
      _statusColor = c;
    });
  }

  Future<void> _write() async {
    if (_busy) return;
    final raw = _urlCtrl.text.trim();
    if (raw.isEmpty) {
      _setStatus('地址为空', '先填一个网址再写卡', Colors.orangeAccent);
      return;
    }
    Uri uri;
    try {
      uri = Uri.parse(raw);
      if (!uri.hasScheme) throw const FormatException('缺少 https://');
    } catch (e) {
      _setStatus('网址格式不对', '要以 https:// 开头', Colors.orangeAccent);
      return;
    }

    setState(() => _busy = true);
    _setStatus('等待贴卡…', '把 NFC 卡贴到手机背面', kGold);

    try {
      final tag = await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 25),
        iosAlertMessage: '请将 iPhone 顶部靠近 NFC 卡',
      );

      _setStatus('正在写入…', '请保持卡片贴着不要动', kGold);

      final uriRecord = ndef.UriRecord()..uriString = uri.toString();
      await FlutterNfcKit.writeNDEFRecords([uriRecord]);

      await FlutterNfcKit.finish(iosAlertMessage: '写入成功');

      final code = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : uri.toString();
      setState(() {
        _history.insert(0, WriteRecord(code, uri.toString(), DateTime.now()));
      });

      _setStatus(
        '写入成功 ✓',
        '卡号 $code ｜ ${tag.type.name.toUpperCase()}\n${uri.toString()}',
        const Color(0xFF4ADE80),
      );
    } catch (e) {
      await FlutterNfcKit.finish();
      _setStatus('写入失败', _friendlyError(e), Colors.redAccent);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _read() async {
    if (_busy) return;
    setState(() => _busy = true);
    _setStatus('等待贴卡…', '把 NFC 卡贴到手机背面读取', kGold);
    try {
      await FlutterNfcKit.poll(
        timeout: const Duration(seconds: 25),
        iosAlertMessage: '请将 iPhone 顶部靠近 NFC 卡',
      );
      final records = await FlutterNfcKit.readNDEFRecords();
      await FlutterNfcKit.finish();

      final uris = <String>[];
      for (final r in records) {
        if (r is ndef.UriRecord && r.uriString != null) {
          uris.add(r.uriString!);
        } else if (r is ndef.TextRecord && r.text != null) {
          uris.add(r.text!);
        }
      }

      if (uris.isEmpty) {
        _setStatus('读到了卡，但没有网址', '这张卡是空白的，可以直接写入', Colors.orangeAccent);
      } else {
        _setStatus('读取成功', uris.join('\n'), const Color(0xFF4ADE80));
        if (uris.first.startsWith('http')) {
          _urlCtrl.text = uris.first;
        }
      }
    } catch (e) {
      await FlutterNfcKit.finish();
      _setStatus('读取失败', _friendlyError(e), Colors.redAccent);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _friendlyError(Object e) {
    final s = e.toString();
    if (s.contains('408') || s.toLowerCase().contains('timeout')) {
      return '没读到卡，超时了。\n检查：NFC 是否打开、卡片是否贴对位置（手机背面中上部）';
    }
    if (s.toLowerCase().contains('cancelled')) return '已取消';
    if (s.toLowerCase().contains('notsupported') || s.contains('not supported')) {
      return '这台设备不支持 NFC';
    }
    return s;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
          children: [
            _header(),
            const SizedBox(height: 18),
            _availabilityCard(),
            const SizedBox(height: 22),
            _sectionLabel('要写入的网址'),
            const SizedBox(height: 8),
            _urlField(),
            const SizedBox(height: 10),
            _baseField(),
            const SizedBox(height: 22),
            _writeButton(),
            const SizedBox(height: 10),
            _readButton(),
            const SizedBox(height: 18),
            _statusCard(),
            if (_history.isNotEmpty) ...[
              const SizedBox(height: 26),
              _sectionLabel('本次已写入'),
              const SizedBox(height: 8),
              ..._history.take(8).map(_historyTile),
            ],
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [kGold, Color(0xFFC9A227)]),
            borderRadius: BorderRadius.circular(13),
          ),
          child: const Icon(Icons.nfc_rounded, color: Color(0xFF1A1406), size: 26),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('NFC 名片写入器',
                  style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: Colors.white)),
              SizedBox(height: 2),
              Text('贴卡即写，写入后永久生效',
                  style: TextStyle(fontSize: 12.5, color: kDim)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _availabilityCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kLine),
      ),
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _available ? const Color(0xFF4ADE80) : Colors.orangeAccent,
              boxShadow: [
                BoxShadow(
                  color: (_available ? const Color(0xFF4ADE80) : Colors.orangeAccent)
                      .withValues(alpha: 0.5),
                  blurRadius: 8,
                )
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(_availText, style: const TextStyle(fontSize: 13, color: Colors.white70)),
          ),
          TextButton(
            onPressed: _checkNfc,
            child: const Text('重新检测', style: TextStyle(fontSize: 12, color: kGold)),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11.5,
        letterSpacing: 1.4,
        fontWeight: FontWeight.w700,
        color: kDim,
      ),
    );
  }

  InputDecoration _inputDeco(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF5B6478), fontSize: 13),
      filled: true,
      fillColor: kSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: kLine),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: kLine),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: kGold, width: 1.4),
      ),
    );
  }

  Widget _urlField() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _urlCtrl,
            style: const TextStyle(fontSize: 14, color: Colors.white),
            decoration: _inputDeco('https://your-domain.com/c/XXXXXXXX'),
            keyboardType: TextInputType.url,
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          height: 52,
          child: OutlinedButton(
            onPressed: _genCode,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: kLine),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: const Icon(Icons.autorenew_rounded, color: kGold, size: 20),
          ),
        ),
      ],
    );
  }

  Widget _baseField() {
    return TextField(
      controller: _baseCtrl,
      style: const TextStyle(fontSize: 13, color: Colors.white70),
      decoration: _inputDeco('网址前缀（改这里，点⟳自动生成）'),
      onChanged: (_) => _genCode(),
    );
  }

  Widget _writeButton() {
    return SizedBox(
      height: 58,
      child: ElevatedButton(
        onPressed: _busy ? null : _write,
        style: ElevatedButton.styleFrom(
          backgroundColor: kGold,
          foregroundColor: const Color(0xFF1A1406),
          disabledBackgroundColor: const Color(0xFF3A3423),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: _busy
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: Color(0xFF1A1406)),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.contactless_rounded, size: 22),
                  SizedBox(width: 8),
                  Text('开始写入', style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800)),
                ],
              ),
      ),
    );
  }

  Widget _readButton() {
    return SizedBox(
      height: 52,
      child: OutlinedButton(
        onPressed: _busy ? null : _read,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: kLine),
          foregroundColor: Colors.white70,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.download_rounded, size: 19),
            SizedBox(width: 7),
            Text('读取卡片当前内容', style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _statusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _statusColor.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 17, color: _statusColor),
              const SizedBox(width: 7),
              Text(
                _status,
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: _statusColor),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _detail,
            style: const TextStyle(fontSize: 12.5, height: 1.6, color: kDim),
          ),
        ],
      ),
    );
  }

  Widget _historyTile(WriteRecord r) {
    final t = r.time;
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    final ss = t.second.toString().padLeft(2, '0');
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kLine),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF4ADE80)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.code,
                    style: const TextStyle(
                        fontSize: 13.5, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 2),
                Text(r.url,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: kDim)),
              ],
            ),
          ),
          Text('$hh:$mm:$ss', style: const TextStyle(fontSize: 11, color: Color(0xFF5B6478))),
        ],
      ),
    );
  }
}
