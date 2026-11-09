import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../i18n.dart';
import '../l10n/app_localizations.dart';
import 'login.dart';
import 'templates.dart';

class MeScreen extends StatefulWidget {
  const MeScreen({super.key});
  @override
  State<MeScreen> createState() => _MeScreenState();
}

class _MeScreenState extends State<MeScreen> {
  Map<String, dynamic> _summary = {};

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    try {
      final s = await Api.userSummary();
      if (mounted) setState(() => _summary = s);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final email = (Session.user?['email'] ?? '') as String;
    final name = (Session.user?['name'] as String?) ??
        (email.contains('@') ? email.split('@').first : email);
    final plan = (Session.user?['plan'] ?? 'free') as String;

    return AppPage(
      title: l.meTitle,
      children: [
        Row(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: C.raised,
              ),
              alignment: Alignment.center,
              child: Text(
                name.isNotEmpty ? name.characters.first : '·',
                style: const TextStyle(
                    fontSize: 20, color: C.text, fontWeight: FontWeight.w300),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 20, color: C.text)),
                  const SizedBox(height: 5),
                  Text(email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Ts.caption),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            _badge(plan.toUpperCase(), primary: true),
            const SizedBox(width: 8),
            _badge(l.navMe),
          ],
        ),

        const SizedBox(height: 22),
        _meStats(context),

        const SizedBox(height: 10),
        _group([
          _row(l.meAccount, email),
          _row(l.mePlan, plan.toUpperCase()),
          _row(l.meDataScope, l.meDataScopeValue),
        ]),

        const SizedBox(height: 24),
        _group([
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const TemplatesScreen()),
            ),
            child: _row(l.meTemplates, '', arrow: true),
          ),
          LanguageRow(),
          _row(l.meHelp, '', arrow: true),
          _row(l.meAbout, 'v1.0', arrow: true),
        ]),

        const SizedBox(height: 28),
        GhostButton(
          text: l.meLogout,
          onTap: () async {
            await Api.logout();
            if (context.mounted) {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            }
          },
        ),
        const SizedBox(height: 22),
        Center(child: Text(l.mePrivacyNote, style: Ts.caption)),
      ],
    );
  }

  Widget _group(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(children: children),
    );
  }

  Widget _badge(String text, {bool primary = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: primary ? C.white : C.raised),
      ),
      child: Text(text,
          style: TextStyle(
              fontSize: T.caption,
              color: primary ? C.white : C.muted,
              letterSpacing: 0.2)),
    );
  }

  Widget _row(String label, String value, {bool arrow = false}) {
    return Padding(
      padding: const EdgeInsetsDirectional.symmetric(
          horizontal: 18, vertical: 15),
      child: Row(
        children: [
          Text(label, style: Ts.body2.copyWith(color: C.muted)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Ts.caption,
            ),
          ),
          if (arrow) ...[
            const SizedBox(width: 4),
            // 方向性图标：RTL 下自动翻转
            const AppIcon(AppIco.forward, size: 17, color: C.faint),
          ],
        ],
      ),
    );
  }
  /// 三个总览数字：卡片数 / 总打开 / 使用天数
  Widget _meStats(BuildContext context) {
    final l = L10n.of(context);
    final cards = (_summary['cards'] ?? 0) as num;
    final opens = (_summary['totalViews'] ?? 0) as num;
    final days = (_summary['daysUsed'] ?? 0) as num;
    return SizedBox(
      height: 60,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 5,
            child: _meStat(Fmt.compact(cards), l.meCards, big: true),
          ),
          _divider(),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsetsDirectional.only(start: 14),
              child: _meStat(Fmt.compact(opens), l.meTotalOpens),
            ),
          ),
          _divider(),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsetsDirectional.only(start: 14),
              child: _meStat(Fmt.compact(days), l.meDays),
            ),
          ),
        ],
      ),
    );
  }

  Widget _meStat(String v, String k, {bool big = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        big
            ? MetricText(v, size: 26)
            : MetricText(v, size: 20, color: C.muted),
        const SizedBox(height: 6),
        Text(k, style: Ts.secondary),
      ],
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      margin: const EdgeInsetsDirectional.only(bottom: 20),
      color: C.line,
    );
  }
}

/// 语言切换行：跟随系统 / 中文 / English
class LanguageRow extends StatelessWidget {
  const LanguageRow({super.key});

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final cur = AppLocale.instance.override;
    final label = cur == null
        ? l.meLanguageSystem
        : (cur.languageCode == 'zh' ? '中文' : 'English');

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => _pick(context, l),
      child: Padding(
        padding:
            const EdgeInsetsDirectional.symmetric(horizontal: 18, vertical: 15),
        child: Row(
          children: [
            Text(l.meLanguage, style: Ts.body2.copyWith(color: C.muted)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  textAlign: TextAlign.end,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Ts.caption),
            ),
            const SizedBox(width: 4),
            const AppIcon(AppIco.forward, size: 17, color: C.faint),
          ],
        ),
      ),
    );
  }

  void _pick(BuildContext context, L10n l) {
    showModalBottomSheet(
      context: context,
      backgroundColor: C.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final cur = AppLocale.instance.override;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                    color: C.raised, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 12),
              _opt(ctx, l.meLanguageSystem, null, cur == null),
              _opt(ctx, '中文', const Locale('zh'), cur?.languageCode == 'zh'),
              _opt(ctx, 'English', const Locale('en'), cur?.languageCode == 'en'),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _opt(BuildContext ctx, String label, Locale? loc, bool selected) {
    return ListTile(
      title: Text(label,
          style: TextStyle(
              fontSize: T.body,
              color: selected ? C.text : C.muted,
              fontWeight: selected ? FontWeight.w500 : FontWeight.w400)),
      trailing: selected
          ? const AppIcon(AppIco.check, size: 18, color: C.white)
          : null,
      onTap: () async {
        await AppLocale.instance.setLocale(loc);
        if (ctx.mounted) Navigator.of(ctx).pop();
      },
    );
  }
}
