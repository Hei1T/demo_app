import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../l10n/app_localizations.dart';

/// 模板库
///
/// 用 WebView 直接渲染后端 /preview/:slug 的真实名片页 ——
/// 跟用户扫码看到的完全一致，不是简化的色块。
class TemplatesScreen extends StatefulWidget {
  const TemplatesScreen({super.key});
  @override
  State<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends State<TemplatesScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _templates = [];
  String _current = 'noir';
  late WebViewController _web;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.disabled)
      ..setBackgroundColor(C.ground);
    _load();
  }

  Future<void> _load() async {
    try {
      final t = await Api.templates();
      setState(() {
        _templates =
            t.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        if (_templates.isNotEmpty) {
          _current = (_templates.first['id'] ?? 'noir') as String;
        }
      });
      _open(_current);
    } catch (_) {
      setState(() => _templates = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _open(String slug) {
    _web.loadRequest(Uri.parse('$kApiBase/preview/$slug'));
  }

  void _select(String slug) {
    if (slug == _current) return;
    setState(() => _current = slug);
    _open(slug);
  }

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // 头部（固定）
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(8, 10, 20, 12),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    behavior: HitTestBehavior.opaque,
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: AppIcon(AppIco.back,
                          size: 18, color: C.text),
                    ),
                  ),
                  Text(l.templatesTitle, style: Ts.title),
                  const Spacer(),
                  Text(l.templatesCount(_templates.length), style: Ts.caption),
                ],
              ),
            ),

            // 真实名片预览
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: _loading
                      ? Container(
                          color: C.surface,
                          child: const Center(
                            child: CircularProgressIndicator(
                                color: C.white, strokeWidth: 2),
                          ),
                        )
                      : WebViewWidget(controller: _web),
                ),
              ),
            ),

            // 版式选择器
            const SizedBox(height: 14),
            SizedBox(
              height: 92,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: _templates.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final t = _templates[i];
                  final slug = (t['id'] ?? 'noir') as String;
                  final on = slug == _current;
                  final pro = t['tier'] == 'pro';
                  return GestureDetector(
                    onTap: () => _select(slug),
                    child: Column(
                      children: [
                        Container(
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            color: _swatch(slug),
                            border: Border.all(
                              color: on ? C.white : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          child: pro
                              ? Align(
                                  alignment: Alignment.topRight,
                                  child: Container(
                                    margin: const EdgeInsets.all(4),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: .5),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text('PRO',
                                        style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.white,
                                            letterSpacing: 0.1)),
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 7),
                        Text(
                          (t['name'] ?? slug) as String,
                          style: TextStyle(
                            fontSize: 12,
                            color: on ? C.text : C.muted,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Color _swatch(String slug) {
    switch (slug) {
      case 'noir':
        return const Color(0xFF1A1A1A);
      case 'paper':
        return const Color(0xFFF2F0EA);
      case 'wood':
        return const Color(0xFFE8D9BF);
      case 'neon':
        return const Color(0xFF101024);
      case 'sunset':
        return const Color(0xFF2A140C);
      case 'ocean':
        return const Color(0xFF0C1A2A);
      default:
        return C.surface;
    }
  }
}
