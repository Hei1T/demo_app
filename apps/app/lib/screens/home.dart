import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../i18n.dart';
import '../l10n/app_localizations.dart';
import '../widgets/card_face.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _cards = [];
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _load();
    Session.dataChanged.addListener(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        Api.myCards(size: 8),
        Api.myStats(),
      ]);
      setState(() {
        _cards = results[0] as List<dynamic>;
        _stats = results[1] as Map<String, dynamic>;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _greeting(L10n l) {
    final h = DateTime.now().hour;
    if (h < 6) return l.greetNight;
    if (h < 12) return l.greetMorning;
    if (h < 18) return l.greetAfternoon;
    return l.greetEvening;
  }

  String get _dateLabel {
    final n = DateTime.now();
    return Fmt.monthDay(n);
  }

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final name = (Session.user?['name'] as String?) ??
        (Session.user?['email'] as String?)?.split('@').first ??
        l.greetYou;

    return SafeArea(
      bottom: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 固定头部：日期 + 问候
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 20, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_dateLabel, style: Ts.label),
                const SizedBox(height: 6),
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Ts.title),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: C.white,
              backgroundColor: C.surface,
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 32),
                children: [
                  Text(
                    _stats == null
                        ? l.homeLoading
                        : l.homeTodayPeople(_todayViews()),
                    style: Ts.body2.copyWith(color: C.muted),
                  ),
                  const SizedBox(height: 20),

            if (_loading) ...[
              const _SkeletonCard(),
              const SizedBox(height: 14),
              const _SkeletonCard(),
            ] else if (_error != null) ...[
              _ErrorBox(message: _error!, onRetry: _load),
            ] else if (_cards.isEmpty) ...[
              _EmptyState(onCreate: () {}),
            ] else ...[
              // 主卡
              _MainCard(
                card: _cards.first,
                views: (_stats?['views'] ?? 0) as num,
                visitors: (_stats?['uniqueVisitors'] ?? 0) as num,
                ctr: ((_stats?['ctr'] ?? 0) as num).toDouble(),
              ),
              const SizedBox(height: 28),

              if (_cards.length > 1) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(l.homeOtherCards, style: Ts.h2),
                    Text('${l.homeAllCardsShort(Api.lastCardsTotal - 1)} ›',
                        style: Ts.secondary.copyWith(fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 108,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _cards.length - 1,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) {
                      final c = _cards[i + 1] as Map<String, dynamic>;
                      return SizedBox(
                        width: 140,
                        child: CardFace(
                          profile: (c['profile'] ?? {}) as Map<String, dynamic>,
                          templateSlug: (c['templateSlug'] ?? 'noir') as String,
                          compact: true,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 28),
              ],
            ],

                  Text(l.homeRecent, style: Ts.h2),
                  const SizedBox(height: 14),
                  _ActivityList(stats: _stats),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showCardActions(Map<String, dynamic> card) async {
    final l = L10n.of(context);
    final code = (card['code'] ?? '') as String;
    final revoked = card['revokedAt'] != null;
    await showModalBottomSheet(
      context: context,
      backgroundColor: C.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 14),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                  color: C.raised, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 18),
            Text(code,
                style: const TextStyle(
                    fontSize: 13, color: C.faint, letterSpacing: 0.3)),
            const SizedBox(height: 18),
            ListTile(
              leading: AppIcon(revoked ? AppIco.restore : AppIco.block,
                  color: revoked ? C.text : const Color(0xFFE5484D)),
              title: Text(revoked ? l.restoreTitle : l.revokeTitle,
                  style: TextStyle(
                      fontSize: 15,
                      color: revoked ? C.text : const Color(0xFFE5484D))),
              subtitle: Text(
                  revoked ? l.restoreHint : l.revokeHint,
                  style: const TextStyle(fontSize: 12, color: C.faint)),
              onTap: () async {
                Navigator.of(ctx).pop();
                if (revoked) {
                  await Api.restoreCard(code);
                  _load();
                } else {
                  await _confirmRevoke(code, l);
                }
              },
            ),
            ListTile(
              leading: const AppIcon(AppIco.close, color: C.muted),
              title: Text(l.commonCancel,
                  style: TextStyle(fontSize: 15, color: C.muted)),
              onTap: () => Navigator.of(ctx).pop(),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmRevoke(String code, L10n l) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.surface,
        title: Text(l.revokeConfirmTitle,
            style: TextStyle(fontSize: 16, color: C.text)),
        content: Text(
          l.revokeConfirmBody,
          style: const TextStyle(fontSize: 15, color: C.muted, height: 1.7),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(l.commonCancel, style: TextStyle(color: C.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(l.revokeAction,
                style: TextStyle(color: Color(0xFFE5484D))),
          ),
        ],
      ),
    );
    if (ok == true) {
      try {
        await Api.revokeCard(code);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l.revokeDone)),
        );
        _load();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  int _todayViews() {
    final daily = (_stats?['daily'] as List?) ?? [];
    if (daily.isEmpty) return 0;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    for (final d in daily) {
      if ((d as Map)['day'] == today) return (d['count'] as num).toInt();
    }
    return 0;
  }
}

class _MainCard extends StatelessWidget {
  final Map<String, dynamic> card;
  final num views;
  final num visitors;
  final double ctr;
  const _MainCard({
    required this.card,
    required this.views,
    required this.visitors,
    required this.ctr,
  });

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final p = (card['profile'] ?? {}) as Map<String, dynamic>;
    final name = (p['name'] ?? l.homeUnknown) as String;
    final role = (p['role'] ?? '') as String;
    final org = (p['org'] ?? '') as String;
    final sub = [role, org].where((e) => e.isNotEmpty).join(' · ');

    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(22, 22, 22, 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E1E1E), Color(0xFF0D0D0D)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Ts.cardName),
                    if (sub.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(sub,
                          style: TextStyle(
                              fontSize: 13,
                              color: C.muted,
                              letterSpacing: 0.2,
                              height: 1.4)),
                    ],
                  ],
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFFE8E8E8), Color(0xFF9A9A9A)],
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.characters.first,
                  style: const TextStyle(
                      fontSize: 15,
                      color: Color(0xFF1A1A1A),
                      fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          const SizedBox(height: 26),
          const SizedBox(height: 26),
          SizedBox(
            height: 58,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 5,
                  child: _stat(Fmt.compact(views), l.homeOpensLabel, big: true),
                ),
                _divider(),
                Expanded(
                  flex: 4,
                  child: Padding(
                    padding: const EdgeInsetsDirectional.only(start: 14),
                    child: _stat(Fmt.compact(visitors), l.homeVisitorsLabel),
                  ),
                ),
                _divider(),
                Expanded(
                  flex: 4,
                  child: Padding(
                    padding: const EdgeInsetsDirectional.only(start: 14),
                    child: _stat(Fmt.pct(ctr), l.homeCtrLabel),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text(
            '${card['code']} · ${card['templateSlug']}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                fontSize: 12, color: C.faint, letterSpacing: 0.3),
          ),
        ],
      ),
    );
  }

  Widget _stat(String v, String k, {bool big = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Align(
            alignment: AlignmentDirectional.bottomStart,
            child: big
                ? MetricText(v, size: 30)
                : MetricText(v, size: 20, color: C.muted),
          ),
        ),
        const SizedBox(height: 6),
        Text(k,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Ts.secondary),
      ],
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      margin: const EdgeInsetsDirectional.only(bottom: 22),
      color: C.line,
    );
  }
}

class _ActivityList extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _ActivityList({this.stats});

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final byType = (stats?['byType'] as Map?) ?? {};
    final entries = byType.entries
        .where((e) => e.key != 'view')
        .toList()
      ..sort((a, b) => (b.value as num).compareTo(a.value as num));

    if (entries.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Text(l.homeNoViews,
            style: const TextStyle(fontSize: 15, color: C.faint)),
      );
    }

    final labels = {
      'click_phone': l.actCall,
      'click_email': l.actEmail,
      'click_map': l.actDirections,
      'click_wechat': l.actCopyWechat,
      'click_social': l.actSocialLink,
      'save_contact': l.actSaveContact,
      'view': l.actOpenCard,
    };

    return Column(
      children: [
        for (final e in entries.take(4))
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 5,
                  height: 5,
                  margin: const EdgeInsets.only(top: 8, right: 12),
                  decoration: const BoxDecoration(
                      color: C.white, shape: BoxShape.circle),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(labels[e.key] ?? e.key,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 15, color: C.muted, height: 1.5)),
                      const SizedBox(height: 4),
                      Text(l.homeTimes(e.value),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: T.caption, color: C.faint)),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBox({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    return Column(
      children: [
        Text(message, style: Ts.secondary),
        const SizedBox(height: 16),
        TextButton(onPressed: onRetry, child: Text(l.commonRetry)),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onCreate;
  const _EmptyState({required this.onCreate});
  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: C.raised),
            ),
            alignment: Alignment.center,
            child: const AppIcon(AppIco.card, color: C.faint, size: 32),
          ),
          const SizedBox(height: 26),
          Text(l.homeNoCards,
              style: TextStyle(
                  fontSize: 16, color: C.muted, letterSpacing: 0.3)),
          const SizedBox(height: 10),
          Text(l.homeNoCardsHint,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: C.faint, height: 1.6)),
        ],
      ),
    );
  }
}
