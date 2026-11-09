import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';

/// 社交平台选择器：品牌色圆点 + 平台名，支持中英文
class SocialPicker extends StatefulWidget {
  final List<Map<String, String>> links;
  final ValueChanged<List<Map<String, String>>> onChanged;
  const SocialPicker({super.key, required this.links, required this.onChanged});

  @override
  State<SocialPicker> createState() => _SocialPickerState();
}

class _SocialPickerState extends State<SocialPicker> {
  List<dynamic> _platforms = [];
  bool _loading = true;
  Map<String, dynamic>? _picked;
  final _value = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await Api.platforms();
      setState(() {
        _platforms = p;
        if (p.isNotEmpty) _picked = p.first as Map<String, dynamic>;
      });
    } catch (_) {
      setState(() => _platforms = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _add() {
    final v = _value.text.trim();
    if (_picked == null || v.isEmpty) return;
    final id = _picked!['id'] as String;
    final next = [...widget.links, {'platform': id, 'value': v}];
    widget.onChanged(next);
    _value.clear();
    setState(() {});
  }

  void _remove(int i) {
    final next = [...widget.links]..removeAt(i);
    widget.onChanged(next);
    setState(() {});
  }

  Color _color(String hex) {
    try {
      return Color(int.parse('FF${hex.replaceAll('#', '')}', radix: 16));
    } catch (_) {
      return C.muted;
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
                child: CircularProgressIndicator(strokeWidth: 2, color: C.white))),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 已添加
        if (widget.links.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var i = 0; i < widget.links.length; i++)
                Container(
                  padding: const EdgeInsets.fromLTRB(10, 8, 8, 8),
                  decoration: BoxDecoration(
                    color: C.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.links[i]['value'] ?? '',
                        style: const TextStyle(fontSize: 13, color: C.text),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () => _remove(i),
                        child: const AppIcon(AppIco.close, size: 14, color: C.faint),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
        ],

        // 选择平台
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _platforms.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final p = _platforms[i] as Map<String, dynamic>;
              final on = _picked?['id'] == p['id'];
              final color = _color((p['color'] ?? '#888888') as String);
              return GestureDetector(
                onTap: () => setState(() => _picked = p),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: on ? C.raised : C.surface,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                        color: on ? C.white : Colors.transparent, width: 1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration:
                            BoxDecoration(color: color, shape: BoxShape.circle),
                        alignment: Alignment.center,
                        child: Text(
                          (p['short'] ?? '·') as String,
                          style: const TextStyle(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 7),
                      Text(
                        (p['name'] ?? '') as String,
                        style: TextStyle(
                            fontSize: 13, color: on ? C.white : C.muted),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),

        // 输入 + 添加
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _value,
                style: const TextStyle(fontSize: 15, color: C.text),
                cursorColor: C.white,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: (_picked?['hint'] ?? '账号或链接') as String,
                  hintStyle: const TextStyle(fontSize: 15, color: C.faint),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  enabledBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: C.raised)),
                  focusedBorder: const UnderlineInputBorder(
                      borderSide: BorderSide(color: C.white)),
                ),
                onSubmitted: (_) => _add(),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: _add,
              child: Container(
                width: 40,
                height: 40,
                decoration:
                    const BoxDecoration(color: C.white, shape: BoxShape.circle),
                child: const AppIcon(AppIco.add, size: 20, color: C.onWhite),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
