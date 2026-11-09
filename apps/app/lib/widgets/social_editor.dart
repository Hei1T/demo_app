import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';

/// 社交平台录入器
///
/// 形式：已添加列表 + 「＋ 添加社交平台」→ 底部弹层
///   弹层内：搜索框 + 常用 + 国内/国际 分组网格
///   点平台 → 同一弹层切换到输入账号 → 添加
class SocialEditor extends StatefulWidget {
  final List<Map<String, String>> links;
  final ValueChanged<List<Map<String, String>>> onChanged;
  const SocialEditor({super.key, required this.links, required this.onChanged});

  @override
  State<SocialEditor> createState() => _SocialEditorState();
}

class _SocialEditorState extends State<SocialEditor> {
  List<Map<String, dynamic>> _platforms = [];
  bool _loading = true;

  // 常用平台
  static const _frequent = [
    'wechat', 'linkedin', 'instagram', 'x',
    'douyin', 'xiaohongshu', 'telegram', 'whatsapp',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await Api.platforms();
      setState(() => _platforms =
          p.map((e) => Map<String, dynamic>.from(e as Map)).toList());
    } catch (_) {
      setState(() => _platforms = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _color(String? hex) {
    try {
      return Color(int.parse('FF${(hex ?? '#888888').replaceAll('#', '')}',
          radix: 16));
    } catch (_) {
      return C.muted;
    }
  }

  Map<String, dynamic>? _byId(String id) {
    for (final p in _platforms) {
      if (p['id'] == id) return p;
    }
    return null;
  }

  void _remove(int i) {
    final next = [...widget.links]..removeAt(i);
    widget.onChanged(next);
    setState(() {});
  }

  Future<void> _openSheet() async {
    final added = await showModalBottomSheet<List<Map<String, String>>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111111),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _PlatformSheet(
        platforms: _platforms,
        frequent: _frequent,
        colorOf: _color,
      ),
    );
    if (added != null && added.isNotEmpty) {
      final next = [...widget.links, ...added];
      widget.onChanged(next);
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: C.white),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 已添加的平台，一行一个，清楚
        for (var i = 0; i < widget.links.length; i++) ...[
          _addedRow(widget.links[i], i),
          const SizedBox(height: 10),
        ],

        // 添加入口
        GestureDetector(
          onTap: _openSheet,
          child: Container(
            height: 52,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: C.raised),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const AppIcon(AppIco.add, size: 18, color: C.muted),
                const SizedBox(width: 8),
                Text('添加社交平台',
                    style: Ts.secondary.copyWith(fontSize: 15, color: C.muted)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _addedRow(Map<String, String> link, int index) {
    final p = _byId(link['platform'] ?? '');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: _color(p?['color'] as String?),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              (p?['short'] ?? '·') as String,
              style: const TextStyle(
                  fontSize: 12, color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((p?['name'] ?? link['platform']) as String,
                    style: const TextStyle(fontSize: 15, color: C.text)),
                const SizedBox(height: 2),
                Text(link['value'] ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: C.faint)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _remove(index),
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: AppIcon(AppIco.close, size: 16, color: C.faint),
            ),
          ),
        ],
      ),
    );
  }
}

/// 底部弹层：搜索 + 常用 + 分组
class _PlatformSheet extends StatefulWidget {
  final List<Map<String, dynamic>> platforms;
  final List<String> frequent;
  final Color Function(String?) colorOf;
  const _PlatformSheet({
    required this.platforms,
    required this.frequent,
    required this.colorOf,
  });

  @override
  State<_PlatformSheet> createState() => _PlatformSheetState();
}

class _PlatformSheetState extends State<_PlatformSheet> {
  final _search = TextEditingController();
  final _value = TextEditingController();
  final _results = <Map<String, String>>[];
  Map<String, dynamic>? _picked;

  @override
  void dispose() {
    _search.dispose();
    _value.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filtered {
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return widget.platforms;
    return widget.platforms.where((p) {
      final name = (p['name'] ?? '').toString().toLowerCase();
      final en = (p['en'] ?? '').toString().toLowerCase();
      final id = (p['id'] ?? '').toString().toLowerCase();
      return name.contains(q) || en.contains(q) || id.contains(q);
    }).toList();
  }

  void _confirm() {
    final v = _value.text.trim();
    if (_picked == null || v.isEmpty) return;
    _results.add({'platform': _picked!['id'] as String, 'value': v});
    _value.clear();
    setState(() => _picked = null);
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.82),
      padding: EdgeInsets.only(bottom: bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
                color: C.raised, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 16),

          // 标题栏
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                if (_picked != null)
                  GestureDetector(
                    onTap: () => setState(() => _picked = null),
                    child: const Padding(
                      padding: EdgeInsets.only(right: 12),
                      child: AppIcon(AppIco.back,
                          size: 16, color: C.text),
                    ),
                  ),
                Expanded(
                  child: Text(
                    _picked == null ? '添加社交平台' : (_picked!['name'] ?? '') as String,
                    style: const TextStyle(
                        fontSize: 16, color: C.text, fontWeight: FontWeight.w400),
                  ),
                ),
                if (_results.isNotEmpty)
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(_results),
                    child: Text('完成 ${_results.length}',
                        style: const TextStyle(color: C.white, fontSize: 15)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (_picked == null) ..._picker(context) else ..._input(context),
        ],
      ),
    );
  }

  /// 选平台
  List<Widget> _picker(BuildContext context) {
    final filtered = _filtered;
    final cn = filtered.where((p) => p['region'] == 'cn').toList();
    final intl = filtered.where((p) => p['region'] == 'intl').toList();
    final both = filtered.where((p) => p['region'] == 'both').toList();
    final freq = filtered
        .where((p) => widget.frequent.contains(p['id']))
        .toList();
    final searching = _search.text.trim().isNotEmpty;

    return [
      // 搜索
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: TextField(
          controller: _search,
          onChanged: (_) => setState(() {}),
          style: const TextStyle(fontSize: 15, color: C.text),
          cursorColor: C.white,
          decoration: InputDecoration(
            isDense: true,
            hintText: '搜索微信、领英、Instagram…',
            hintStyle: const TextStyle(fontSize: 15, color: C.faint),
            prefixIcon: const AppIcon(AppIco.search, size: 18, color: C.faint),
            filled: true,
            fillColor: C.surface,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ),
      const SizedBox(height: 8),

      Expanded(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            if (!searching && freq.isNotEmpty) ...[
              _sectionLabel('常 用'),
              _grid(freq),
              const SizedBox(height: 18),
            ],
            if (cn.isNotEmpty) ...[
              _sectionLabel('国 内'),
              _grid(cn),
              const SizedBox(height: 18),
            ],
            if (intl.isNotEmpty) ...[
              _sectionLabel('国 际'),
              _grid(intl),
              const SizedBox(height: 18),
            ],
            if (both.isNotEmpty && searching) ...[
              _sectionLabel('其 他'),
              _grid(both),
            ],
            if (filtered.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Text('没有找到这个平台',
                      style: TextStyle(fontSize: 15, color: C.faint)),
                ),
              ),
          ],
        ),
      ),
    ];
  }

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(t,
            style: const TextStyle(
                fontSize: 12, color: C.faint, letterSpacing: 0.5)),
      );

  Widget _grid(List<Map<String, dynamic>> items) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 14,
        crossAxisSpacing: 8,
        childAspectRatio: 0.82,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final p = items[i];
        return GestureDetector(
          onTap: () => setState(() {
            _picked = p;
            _value.clear();
          }),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: widget.colorOf(p['color'] as String?),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  (p['short'] ?? '·') as String,
                  style: const TextStyle(
                      fontSize: 15,
                      color: Colors.white,
                      fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 7),
              Text(
                (p['name'] ?? '') as String,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: C.muted),
              ),
            ],
          ),
        );
      },
    );
  }

  /// 输入账号
  List<Widget> _input(BuildContext context) {
    final p = _picked!;
    return [
      Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: widget.colorOf(p['color'] as String?),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    (p['short'] ?? '·') as String,
                    style: const TextStyle(
                        fontSize: 16,
                        color: Colors.white,
                        fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((p['name'] ?? '') as String,
                          style: const TextStyle(fontSize: 16, color: C.text)),
                      const SizedBox(height: 4),
                      Text((p['hint'] ?? '账号') as String,
                          style:
                              const TextStyle(fontSize: 13, color: C.faint)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _value,
              autofocus: true,
              style: const TextStyle(fontSize: 16, color: C.text),
              cursorColor: C.white,
              decoration: InputDecoration(
                hintText: (p['hint'] ?? '账号或链接') as String,
                hintStyle: const TextStyle(fontSize: 15, color: C.faint),
                enabledBorder: const UnderlineInputBorder(
                    borderSide: BorderSide(color: C.raised)),
                focusedBorder: const UnderlineInputBorder(
                    borderSide: BorderSide(color: C.white)),
              ),
              onSubmitted: (_) => _confirm(),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 52,
              width: double.infinity,
              child: TextButton(
                onPressed: _confirm,
                style: TextButton.styleFrom(
                  backgroundColor: C.white,
                  shape: const StadiumBorder(),
                ),
                child: const Text('添 加',
                    style: TextStyle(
                        fontSize: 15,
                        color: C.onWhite,
                        letterSpacing: 0.6,
                        fontWeight: FontWeight.w600)),
              ),
            ),
            if (_results.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text('已添加 ${_results.length} 个 · 继续添加或点右上角完成',
                  style: const TextStyle(fontSize: 12, color: C.faint)),
            ],
          ],
        ),
      ),
    ];
  }
}
