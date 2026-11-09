import 'package:flutter/material.dart';
import '../theme.dart';

class TemplateStyle {
  final Color from;
  final Color to;
  final Color ink;
  final Color sub;
  const TemplateStyle(this.from, this.to, this.ink, this.sub);
}

const Map<String, TemplateStyle> kTemplates = {
  'noir': TemplateStyle(Color(0xFF1E1E1E), Color(0xFF0D0D0D), Color(0xFFFAFAFA), Color(0xFFB0B0B0)),
  'paper': TemplateStyle(Color(0xFFF8F6F1), Color(0xFFE8E4DB), Color(0xFF1A1815), Color(0xFF7A7268)),
  'wood': TemplateStyle(Color(0xFFF2E8D8), Color(0xFFDDCBB0), Color(0xFF6B4F28), Color(0xFF8B6B3D)),
  'neon': TemplateStyle(Color(0xFF0A0A12), Color(0xFF05050A), Color(0xFF7CF3FF), Color(0xFF8A8AB8)),
  'sunset': TemplateStyle(Color(0xFF1A0D08), Color(0xFF0A0503), Color(0xFFFF9466), Color(0xFFB08870)),
  'ocean': TemplateStyle(Color(0xFF08131F), Color(0xFF040910), Color(0xFF6FC5F5), Color(0xFF7A9AB8)),
};

class CardFace extends StatelessWidget {
  final Map<String, dynamic> profile;
  final String templateSlug;
  final bool compact;
  const CardFace({
    super.key,
    required this.profile,
    required this.templateSlug,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = kTemplates[templateSlug] ?? kTemplates['noir']!;
    final name = (profile['name'] ?? '未命名') as String;
    final role = (profile['role'] ?? '') as String;

    return Container(
      padding: EdgeInsets.all(compact ? 14 : 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(compact ? 14 : 18),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [t.from, t.to],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: compact ? 13 : 16,
              color: t.ink,
              fontWeight: FontWeight.w400,
              letterSpacing: 0.2,
            ),
          ),
          if (role.isNotEmpty)
            Text(
              role,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12, color: t.sub, letterSpacing: 0.6),
            ),
          Text(
            templateSlug,
            style: TextStyle(fontSize: 12, color: t.sub, letterSpacing: 0.2),
          ),
        ],
      ),
    );
  }
}
