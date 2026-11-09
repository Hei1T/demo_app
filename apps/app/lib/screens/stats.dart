import 'dart:async';

import 'package:flutter/material.dart';

import '../api.dart';

import '../theme.dart';
import '../widgets/app_icons.dart';

import '../i18n.dart';

import '../l10n/app_localizations.dart';

/// 数据：只看自己的卡，不含任何排名/他人对比

class StatsScreen extends StatefulWidget {

  const StatsScreen({super.key});

  @override

  State<StatsScreen> createState() => _StatsScreenState();

}

class _StatsScreenState extends State<StatsScreen> {

  bool _loading = true;

  int _days = 30;

  Map<String, dynamic>? _d;

  List<Map<String, dynamic>> _cards = [];

  int _total = 0;

  @override

  void initState() {

    super.initState();

    _load();

    Session.dataChanged.addListener(_load);

  }

  Future<void> _load() async {

    setState(() => _loading = true);

    try {

      final results = await Future.wait([

        Api.statsInsights(_days),

        Api.statsCards(_days),

      ]);

      if (!mounted) return;

      setState(() {

        _d = Map<String, dynamic>.from(results[0] as Map);

        final m = results[1] as Map;

        final cs = m['items'] as List? ?? [];

        _cards =

            cs.map((e) => Map<String, dynamic>.from(e as Map)).toList();

        _total = (m['total'] ?? 0) as int;

      });

    } catch (_) {

      if (mounted) setState(() => _d = null);

    } finally {

      if (mounted) setState(() => _loading = false);

    }

  }

  @override

  Widget build(BuildContext context) {

    final l = L10n.of(context);

    final s = (_d?['summary'] ?? {}) as Map<String, dynamic>;

    final views = (s['views'] ?? 0) as num;

    final visitors = (s['visitors'] ?? 0) as num;

    final clicks = (s['clicks'] ?? 0) as num;

    final ctr = ((s['ctr'] ?? 0) as num) * 100;

    final avgDwell = (s['avgDwell'] ?? 0) as num;

    final prevViews = (s['prevViews'] ?? 0) as num;

    return SafeArea(

      bottom: false,

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.stretch,

        children: [

          // 固定头部：标题 + 时间范围

          Padding(

            padding: const EdgeInsetsDirectional.fromSTEB(20, 10, 20, 12),

            child: Column(

              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                Text(l.statsLabel, style: Ts.label),

                const SizedBox(height: 6),

                Text(l.statsTitle, style: Ts.title),

                const SizedBox(height: 14),

                RangeChips(

                  index: _days == 1 ? 0 : (_days == 7 ? 1 : 2),

                  days: const [1, 7, 30],

                  labels: [l.statsRangeToday, l.statsRange7, l.statsRange30],

                  onTap: (i) {

                    final d = [1, 7, 30][i];

                    if (d == _days) return;

                    setState(() => _days = d);

                    _load();

                  },

                ),

              ],

            ),

          ),

          Expanded(

            child: ListView(

              padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 40),

              children: [

          if (_loading)

            const Padding(

              padding: EdgeInsets.symmetric(vertical: 80),

              child: Center(

                  child: CircularProgressIndicator(

                      color: C.white, strokeWidth: 2)),

            )

          else ...[

            // ===== KPI 条：一个容器 + 竖线 =====

            _kpiStrip(views, visitors, ctr, avgDwell, prevViews),

            const SizedBox(height: 4),

            // ===== 转化漏斗 =====

            SectionHead(

              title: l.statsFunnel,

              subtitle: '',

            ),

            _funnel(),

            // ===== 趋势 =====

            if ((_d?['daily'] as List?)?.isNotEmpty == true) ...[

              SectionHead(title: l.statsTrend),

              _dailyChart((_d!['daily'] as List)),

              _hint(_trendConclusion()),

              const SizedBox(height: 6),

            ],

            // ===== 每张卡的独立数据 =====

            Row(

              crossAxisAlignment: CrossAxisAlignment.end,

              children: [

                Text(l.statsPerCard, style: Ts.h2),

                const Spacer(),

                if (_total > 5)

                  GestureDetector(

                    onTap: () => Navigator.of(context).push(

                      MaterialPageRoute(

                        builder: (_) => CardStatsListPage(days: _days),

                      ),

                    ),

                    child: Text('${l.statsSeeAll(_total)} ›',

                        style: const TextStyle(

                            fontSize: 12, color: C.muted)),

                  ),

              ],

            ),

            const SizedBox(height: 6),

            Text(l.statsTapCardHint, style: Ts.secondary),

            const SizedBox(height: 16),

            ..._cardRows(limit: 5),

            const SizedBox(height: 28),

            // ===== 互动明细 =====

            SectionHead(title: l.statsInteractions),

            ..._interactions(),

            _hint(_interactionConclusion()),

            const SizedBox(height: 28),

            // ===== 时段 =====

            if ((_d?['hours'] as List?)?.isNotEmpty == true) ...[

              SectionHead(title: l.statsHours),

              _hoursChart((_d!['hours'] as List)),

              _hint(_hourConclusion()),

              const SizedBox(height: 28),

            ],

            // ===== 城市 =====

            if ((_d?['cities'] as List?)?.isNotEmpty == true) ...[

              SectionHead(title: l.statsCities),

              ..._cities(),

              const SizedBox(height: 28),

            ],

            // ===== 设备 & 来源 =====

            SectionHead(title: l.statsDevices + ' / ' + l.statsSources),

            const SizedBox(height: 16),

            _distCard(l.statsDevices, (_d?['devices'] as List?) ?? []),

            const SizedBox(height: 12),

            _distCard(l.statsSources, (_d?['referers'] as List?) ?? []),

            const SizedBox(height: 28),

            // ===== 最近访客 =====

            if ((_d?['recent'] as List?)?.isNotEmpty == true) ...[

              SectionHead(title: l.statsRecentVisitors),

              const SizedBox(height: 6),

              Text('',

                  style: Ts.secondary.copyWith(fontSize: 13)),

              const SizedBox(height: 14),

              ..._recent(),

            ],

            ],

              ],

            ),

          ),

        ],

      ),

    );

  }

  // ---------- 组件 ----------

  /// 漏斗

  Widget _funnel() {

    final l = L10n.of(context);

    final s = (_d?['summary'] ?? {}) as Map;

    final byType = (_d?['byType'] ?? {}) as Map;

    final views = (s['views'] ?? 0) as num;

    final visitors = (s['visitors'] ?? 0) as num;

    final clicks = (s['clicks'] ?? 0) as num;

    final saved = (byType['save_contact'] ?? 0) as num;

    double rate(num a, num b) => b <= 0 ? 0 : (a / b).clamp(0, 1).toDouble();

    int pct(num a, num b) => (rate(a, b) * 100).round();

    final rows = <List<dynamic>>[

      [l.statsFunnelOpened, views, 1.0],

      [l.statsFunnelSaw, visitors, rate(visitors, views)],

      [l.statsFunnelTapped, clicks, rate(clicks, views)],

      [l.statsFunnelSaved, saved, rate(saved, views)],

    ];

    return Container(

      padding: const EdgeInsets.all(18),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(18),

      ),

      child: Column(

        children: [

          for (var i = 0; i < rows.length; i++) ...[

            if (i > 0) const SizedBox(height: 10),

            Row(

              children: [

                SizedBox(

                  width: 66,

                  child: Text(
                      rows[i][0] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      softWrap: false,
                      style: Ts.secondary,
                    ),

                ),

                Expanded(

                  child: ClipRRect(

                    borderRadius: BorderRadius.circular(4),

                    child: Container(

                      height: 26,

                      color: C.raised,

                      alignment: Alignment.centerLeft,

                      child: FractionallySizedBox(

                        widthFactor: (rows[i][2] as double).clamp(0.02, 1.0),

                        child: Container(

                          decoration: BoxDecoration(

                            color: i == 0 ? C.white : C.muted,

                            borderRadius: BorderRadius.circular(4),

                          ),

                        ),

                      ),

                    ),

                  ),

                ),

                const SizedBox(width: 10),

                SizedBox(

                  width: 52,

                  child: Text(

                    _short((rows[i][1] as num).toInt()),

                    textAlign: TextAlign.right,

                    style: Ts.body2.copyWith(fontWeight: FontWeight.w500),

                  ),

                ),

                SizedBox(

                  width: 44,

                  child: Text(

                    i == 0 ? '' : '${pct(rows[i][1] as num, views)}%',

                    textAlign: TextAlign.right,

                    maxLines: 1,

                    overflow: TextOverflow.ellipsis,

                    style: Ts.caption,

                  ),

                ),

              ],

            ),

          ],

        ],

      ),

    );

  }

  String _short(int n) {

    final l = L10n.of(context);

    if (n >= 10000) return Fmt.compact(n);

    return '$n';

  }

  /// 结论句

  Widget _hint(String text) {

    final l = L10n.of(context);

    if (text.isEmpty) return const SizedBox.shrink();

    return Padding(

      padding: const EdgeInsets.only(top: 10),

      child: Row(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          const Text('·', style: TextStyle(fontSize: 15, color: C.faint)),

          const SizedBox(width: 8),

          Expanded(

            child: Text(text, style: Ts.secondary),

          ),

        ],

      ),

    );

  }

  /// 趋势结论

  String _trendConclusion() {

    final l = L10n.of(context);

    final daily = (_d?['daily'] as List?) ?? [];

    if (daily.isEmpty) return '';

    var maxV = 0;

    String maxDay = '';

    for (final d in daily) {

      final m = d as Map;

      final v = (m['views'] ?? 0) as int;

      if (v > maxV) {

        maxV = v;

        maxDay = (m['day'] ?? '').toString();

      }

    }

    if (maxV == 0) return '';

    final parts = maxDay.split('-');

    final label = parts.length == 3 ? '${parts[1]}/${parts[2]}' : maxDay;

    return l.trendBest(label, maxV);

  }

  /// 互动结论

  String _interactionConclusion() {

    final l = L10n.of(context);

    final byType = (_d?['byType'] ?? {}) as Map;

    final names = {

      'click_phone': l.actionCall,

      'click_email': l.actionEmail,

      'click_wechat': l.actionCopyWechat,

      'click_map': l.actionDirections,

      'save_contact': l.actionSaveContact,

      'click_social': l.actionSocialLink,

    };

    String best = '';

    var bestV = 0;

    names.forEach((k, v) {

      final n = (byType[k] ?? 0) as num;

      if (n > bestV) {

        bestV = n.toInt();

        best = v;

      }

    });

    if (bestV == 0) return '';

    return l.interactionLead(best, bestV);

  }

  /// 时段结论

  String _hourConclusion() {

    final l = L10n.of(context);

    final hours = (_d?['hours'] as List?) ?? [];

    if (hours.isEmpty) return '';

    var peak = 0;

    var peakV = 0;

    for (final h in hours) {

      final m = h as Map;

      final v = (m['count'] ?? 0) as int;

      if (v > peakV) {

        peakV = v;

        peak = (m['hour'] ?? 0) as int;

      }

    }

    if (peakV == 0) return '';

    return l.hourPeak(peak, peakV);

  }

  Widget _chip(String label, int days) {

    final l = L10n.of(context);

    final on = _days == days;

    return GestureDetector(

      onTap: () {

        if (_days == days) return;

        setState(() => _days = days);

        _load();

      },

      child: Container(

        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),

        decoration: BoxDecoration(

          color: on ? C.white : C.surface,

          borderRadius: BorderRadius.circular(20),

        ),

        child: Text(label,

            style: TextStyle(

                fontSize: 13,

                color: on ? C.onWhite : C.muted,

                fontWeight: on ? FontWeight.w600 : FontWeight.w400)),

      ),

    );

  }

  Widget _trendBadge(int now, int prev) {

    final l = L10n.of(context);

    final up = now >= prev;

    final pct = prev == 0 ? 100 : ((now - prev) / prev * 100).round();

    return Container(

      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),

      decoration: BoxDecoration(

        color: C.raised,

        borderRadius: BorderRadius.circular(10),

      ),

      child: Row(

        children: [

          AppIcon(up ? AppIco.up : AppIco.down,

              size: 12, color: up ? C.text : C.faint),

          const SizedBox(width: 3),

          Text('${pct.abs()}%',

              style: TextStyle(

                  fontSize: 12, color: up ? C.text : C.faint)),

        ],

      ),

    );

  }

  Widget _miniStat(String v, String label) {

    final l = L10n.of(context);

    return Row(

      crossAxisAlignment: CrossAxisAlignment.end,

      children: [

        Text(v,

            style: const TextStyle(

                fontSize: 20,

                height: 1,

                fontWeight: FontWeight.w300,

                color: C.text)),

        const SizedBox(width: 6),

        Padding(

          padding: const EdgeInsets.only(bottom: 2),

          child: Text(label,

              style: const TextStyle(fontSize: 12, color: C.muted)),

        ),

      ],

    );

  }

  Widget _box(String label, String value, {String? sub}) {

    final l = L10n.of(context);

    return Container(

      padding: const EdgeInsets.all(18),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(18),

      ),

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          Text(label,

              style: const TextStyle(

                  fontSize: 13, color: C.muted, letterSpacing: 0.2)),

          const SizedBox(height: 10),

          Text(value,

              style: const TextStyle(

                  fontSize: 26,

                  height: 1,

                  fontWeight: FontWeight.w300,

                  color: C.text)),

          const SizedBox(height: 8),

          if (sub != null)

            Text(sub,

                style: const TextStyle(

                    fontSize: 12, color: C.faint, height: 1.5)),

        ],

      ),

    );

  }

  String _dwellText(num sec) {

    final l = L10n.of(context);

    if (sec <= 0 || sec > 3600) return Fmt.dash;

    return Fmt.duration(sec);

  }

  /// 每日趋势：带 y 轴刻度、基线、最高点标注

  Widget _dailyChart(List daily) {

    final pts = daily

        .map((e) => Map<String, dynamic>.from(e as Map))

        .toList();

    if (pts.isEmpty) return const SizedBox();

    var maxV = 1;

    var maxIdx = 0;

    for (var i = 0; i < pts.length; i++) {

      final v = (pts[i]['views'] ?? 0) as num;

      if (v > maxV) {

        maxV = v.toInt();

        maxIdx = i;

      }

    }

    final top = (maxV * 1.15).ceil();

    final first = (pts.first['day'] ?? '').toString();

    final last = (pts.last['day'] ?? '').toString();

    String short(String d) {

      final p = d.split('-');

      return p.length == 3 ? (p[1] + "/" + p[2]) : d;

    }

    return Container(

      padding: const EdgeInsetsDirectional.fromSTEB(10, 14, 12, 8),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(20),

      ),

      child: Column(

        children: [

          SizedBox(

            height: 116,

            child: Row(

              crossAxisAlignment: CrossAxisAlignment.stretch,

              children: [

                // y 轴刻度

                SizedBox(

                  width: 34,

                  child: Column(

                    mainAxisAlignment: MainAxisAlignment.spaceBetween,

                    crossAxisAlignment: CrossAxisAlignment.end,

                    children: [

                      Text(Fmt.compact(top), style: Ts.caption),

                      Text(Fmt.compact((top / 2).round()), style: Ts.caption),

                      Text('0', style: Ts.caption),

                    ],

                  ),

                ),

                const SizedBox(width: 8),

                // 柱形

                Expanded(

                  child: Stack(

                    children: [

                      // 网格线

                      Positioned.fill(

                        child: Column(

                          mainAxisAlignment: MainAxisAlignment.spaceBetween,

                          children: [

                            Container(height: 1, color: C.line),

                            Container(height: 1, color: C.line),

                            Container(height: 1, color: C.line),

                          ],

                        ),

                      ),

                      Row(

                        crossAxisAlignment: CrossAxisAlignment.end,

                        children: [

                          for (var i = 0; i < pts.length; i++)

                            Expanded(

                              child: Padding(

                                padding: const EdgeInsets.symmetric(

                                    horizontal: 1.5),

                                child: Container(

                                  height: ((pts[i]['views'] ?? 0) as num) /

                                          top *

                                      112 +

                                      1,

                                  decoration: BoxDecoration(

                                    color: i == maxIdx

                                        ? C.white

                                        : C.muted.withValues(alpha: .85),

                                    borderRadius:

                                        BorderRadius.circular(2),

                                  ),

                                ),

                              ),

                            ),

                        ],

                      ),

                    ],

                  ),

                ),

              ],

            ),

          ),

          const SizedBox(height: 6),

          Padding(

            padding: const EdgeInsetsDirectional.only(start: 42),

            child: Row(

              mainAxisAlignment: MainAxisAlignment.spaceBetween,

              children: [

                Text(short(first), style: Ts.caption),

                Text(short(last), style: Ts.caption),

              ],

            ),

          ),

        ],

      ),

    );

  }

  List<Widget> _interactions() {

    final l = L10n.of(context);

    final byType = (_d?['byType'] ?? {}) as Map;

    final map = <List<Object>>[

      ['click_phone', l.actionCall, AppIco.phone],

      ['click_email', l.actionEmail, AppIco.mail],

      ['click_wechat', l.actionCopyWechat, AppIco.chat],

      ['click_map', l.actionDirections, AppIco.pin],

      ['save_contact', l.actionSaveContact, AppIco.person],

      ['click_social', l.actionSocialLink, AppIco.link],

    ];

    var maxV = 1;

    for (final m in map) {

      final v = (byType[m[0]] ?? 0) as num;

      if (v > maxV) maxV = v.toInt();

    }

    return [

      for (final m in map)

        Padding(

          padding: const EdgeInsets.only(bottom: 14),

          child: Row(

            children: [

              AppIcon(m[2] as AppIco, size: 18, color: C.muted),
              const SizedBox(width: 10),
              SizedBox(
                width: 82,
                child: Text(
                  m[1] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  softWrap: false,
                  style: const TextStyle(
                      fontSize: 13, color: C.muted, height: 1.2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(

                child: ClipRRect(

                  borderRadius: BorderRadius.circular(3),

                  child: Container(

                    height: 6,

                    color: C.raised,

                    alignment: Alignment.centerLeft,

                    child: FractionallySizedBox(

                      widthFactor:

                          ((byType[m[0]] ?? 0) as num) / maxV,

                      child: Container(color: C.white),

                    ),

                  ),

                ),

              ),

              const SizedBox(width: 12),

              SizedBox(

                width: 34,

                child: Text('${byType[m[0]] ?? 0}',

                    textAlign: TextAlign.right,

                    style: const TextStyle(

                        fontSize: 15,

                        color: C.text,

                        fontWeight: FontWeight.w500)),

              ),

            ],

          ),

        ),

    ];

  }

  Widget _hoursChart(List hours) {

    final l = L10n.of(context);

    final list = hours.map((e) => Map<String, dynamic>.from(e as Map)).toList();

    final byHour = <int, int>{};

    for (final h in list) {

      byHour[(h['hour'] ?? 0) as int] = (h['count'] ?? 0) as int;

    }

    var maxV = 1;

    for (final v in byHour.values) {

      if (v > maxV) maxV = v;

    }

    return Container(

      height: 110,

      padding: const EdgeInsetsDirectional.fromSTEB(8, 12, 8, 4),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(18),

      ),

      child: Column(

        children: [

          Expanded(

            child: Row(

              crossAxisAlignment: CrossAxisAlignment.end,

              children: [

                for (var i = 0; i < 24; i++)

                  Expanded(

                    child: Padding(

                      padding: const EdgeInsets.symmetric(horizontal: 1),

                      child: Container(

                        height: (byHour[i] ?? 0) / maxV * 62 + 2,

                        decoration: BoxDecoration(

                          color: (byHour[i] ?? 0) > 0

                              ? C.white

                              : const Color(0xFF2A2A2A),

                          borderRadius: BorderRadius.circular(2),

                        ),

                      ),

                    ),

                  ),

              ],

            ),

          ),

          const SizedBox(height: 6),

          Row(

            mainAxisAlignment: MainAxisAlignment.spaceBetween,

            children: [

              Text(Fmt.hourLabel(0), style: const TextStyle(fontSize: 12, color: C.faint)),

              Text(Fmt.hourLabel(6), style: const TextStyle(fontSize: 12, color: C.faint)),

              Text(Fmt.hourLabel(12), style: const TextStyle(fontSize: 12, color: C.faint)),

              Text(Fmt.hourLabel(18), style: const TextStyle(fontSize: 12, color: C.faint)),

              Text(Fmt.hourLabel(23), style: const TextStyle(fontSize: 12, color: C.faint)),

            ],

          ),

        ],

      ),

    );

  }

  List<Widget> _cities() {

    final l = L10n.of(context);

    final cities = (_d?['cities'] as List?) ?? [];

    var maxV = 1;

    for (final c in cities) {

      final v = ((c as Map)['count'] ?? 0) as num;

      if (v > maxV) maxV = v.toInt();

    }

    return [

      for (final c in cities)

        Padding(

          padding: const EdgeInsets.only(bottom: 12),

          child: Row(

            children: [

              SizedBox(

                width: 90,

                child: Text(

                  ((c as Map)['city'] ?? l.commonUnknown).toString(),

                  style: const TextStyle(fontSize: 13, color: C.text),

                ),

              ),

              Expanded(

                child: ClipRRect(

                  borderRadius: BorderRadius.circular(3),

                  child: Container(

                    height: 6,

                    color: C.raised,

                    alignment: Alignment.centerLeft,

                    child: FractionallySizedBox(

                      widthFactor: ((c['count'] ?? 0) as num) / maxV,

                      child: Container(color: C.white),

                    ),

                  ),

                ),

              ),

              const SizedBox(width: 12),

              SizedBox(

                width: 34,

                child: Text('${c['count']}',

                    textAlign: TextAlign.right,

                    style: const TextStyle(fontSize: 13, color: C.muted)),

              ),

            ],

          ),

        ),

    ];

  }

  Widget _distCard(String title, List items) {

    final l = L10n.of(context);

    final total = items.fold<int>(

        0, (s, e) => s + (((e as Map)['count'] ?? 0) as int));

    return Container(

      padding: const EdgeInsets.all(16),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(18),

      ),

      child: Column(

        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          Text(title,

              style: const TextStyle(

                  fontSize: 13, color: C.muted, letterSpacing: 0.2)),

          const SizedBox(height: 14),

          if (items.isEmpty)

            Text(l.statsEmpty,

                style: TextStyle(fontSize: 13, color: C.faint))

          else

            ...items.map((e) {

              final m = e as Map;

              final cnt = (m['count'] ?? 0) as int;

              final name = (m['device'] ?? m['source'] ?? l.commonUnknown).toString();

              final pct = total > 0 ? cnt / total : 0.0;

              return Padding(

                padding: const EdgeInsets.only(bottom: 10),

                child: Row(

                  children: [

                    SizedBox(

                      width: 80,

                      child: Text(name,

                          style: const TextStyle(

                              fontSize: 13, color: C.text)),

                    ),

                    Expanded(

                      child: ClipRRect(

                        borderRadius: BorderRadius.circular(3),

                        child: Container(

                          height: 5,

                          color: C.raised,

                          alignment: Alignment.centerLeft,

                          child: FractionallySizedBox(

                            widthFactor: pct,

                            child: Container(color: C.muted),

                          ),

                        ),

                      ),

                    ),

                    const SizedBox(width: 10),

                    Text('${(pct * 100).round()}%',

                        style: const TextStyle(

                            fontSize: 12, color: C.muted)),

                  ],

                ),

              );

            }),

        ],

      ),

    );

  }

  List<Widget> _recent() {

    final l = L10n.of(context);

    final recent = (_d?['recent'] as List?) ?? [];

    return [

      for (final r in recent)

        Builder(builder: (_) {

          final m = r as Map;

          final at = DateTime.tryParse(m['at'].toString())?.toLocal();

          final time = at == null

              ? '—'

              : '${at.month.toString().padLeft(2, '0')}-${at.day.toString().padLeft(2, '0')} ${at.hour.toString().padLeft(2, '0')}:${at.minute.toString().padLeft(2, '0')}';

          final dur = (m['duration'] ?? 0) as num;

          return Padding(

            padding: const EdgeInsets.only(bottom: 14),

            child: Row(

              children: [

                Container(

                  width: 6,

                  height: 6,

                  decoration: const BoxDecoration(

                      shape: BoxShape.circle, color: C.faint),

                ),

                const SizedBox(width: 12),

                Expanded(

                  child: Text('${m['city']} · ${m['device']}',

                      style: const TextStyle(fontSize: 13, color: C.text)),

                ),

                if (dur > 0)

                  Text(Fmt.duration(dur),

                      style: const TextStyle(fontSize: 12, color: C.faint)),

                const SizedBox(width: 12),

                Text(time,

                    style: const TextStyle(fontSize: 12, color: C.faint)),

              ],

            ),

          );

        }),

    ];

  }

  List<Widget> _cardRows({int limit = 999}) {

    final l = L10n.of(context);

    if (_cards.isEmpty) {

      return [

        Text(l.statsEmpty,

            style: TextStyle(fontSize: 13, color: C.faint)),

      ];

    }

    return [

      for (final c in _cards.take(limit))

        GestureDetector(

          onTap: () => Navigator.of(context).push(

            MaterialPageRoute(

              builder: (_) => CardStatsPage(

                code: (c['code'] ?? '') as String,

                name: (c['name'] ?? '') as String,

                days: _days,

              ),

            ),

          ),

          behavior: HitTestBehavior.opaque,

          child: Container(

            margin: const EdgeInsets.only(bottom: 10),

            padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 14, 14),

            decoration: BoxDecoration(

              color: C.surface,

              borderRadius: BorderRadius.circular(16),

            ),

            child: Row(

              children: [

                Expanded(

                  child: Column(

                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [

                      Row(

                        children: [

                          Text((c['name'] ?? l.homeUnknown).toString(),

                                  maxLines: 1,

                                  overflow: TextOverflow.ellipsis,

                              style: const TextStyle(

                                  fontSize: 15, color: C.text)),

                          const SizedBox(width: 8),

                          if (c['revoked'] == true)

                            Container(

                              padding: const EdgeInsets.symmetric(

                                  horizontal: 6, vertical: 2),

                              decoration: BoxDecoration(

                                color: const Color(0x33E5484D),

                                borderRadius: BorderRadius.circular(5),

                              ),

                              child: Text(l.writeRevoked,

                                  style: TextStyle(

                                      fontSize: 12,

                                      color: Color(0xFFE5484D))),

                            ),

                        ],

                      ),

                      const SizedBox(height: 4),

                      Text(

                        '${c['code']} · ${c['views']} · ${c['visitors']}',

                        maxLines: 1,

                        overflow: TextOverflow.ellipsis,

                        style: const TextStyle(

                            fontSize: 12,

                            color: C.faint,

                            letterSpacing: 0.1),

                      ),

                    ],

                  ),

                ),

                Column(

                  crossAxisAlignment: CrossAxisAlignment.end,

                  children: [

                    Text(

                      '${(((c['ctr'] ?? 0) as num) * 100).toStringAsFixed(0)}%',

                      maxLines: 1,

                      overflow: TextOverflow.ellipsis,

                      style: const TextStyle(

                          fontSize: 20,

                          height: 1,

                          fontWeight: FontWeight.w300,

                          color: C.text),

                    ),

                    const SizedBox(height: 3),

                    Text(l.statsClickRate,

                        style: TextStyle(fontSize: 12, color: C.faint)),

                  ],

                ),

                const SizedBox(width: 8),

                const AppIcon(AppIco.forward, size: 18, color: C.faint),

              ],

            ),

          ),

        ),

    ];

  }

  /// KPI 条：一个容器，2 条竖线分成 3 列

  Widget _kpiStrip(num views, num visitors, num ctr, num dwell, num prevViews) {

    final l = L10n.of(context);

    return Row(

      crossAxisAlignment: CrossAxisAlignment.start,

      children: [

        Expanded(

          flex: 5,

          child: Column(

            crossAxisAlignment: CrossAxisAlignment.start,

            children: [

              MetricText(Fmt.compact(views), size: 30),

              const SizedBox(height: 8),

              Text(l.statsOpens, style: Ts.secondary),

            ],

          ),

        ),

        _kpiDivider(),

        Expanded(

          flex: 4,

          child: Padding(

            padding: const EdgeInsetsDirectional.only(start: 14),

            child: Column(

              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                MetricText(Fmt.pct(ctr / 100), size: 20, color: C.muted),

                const SizedBox(height: 8),

                Text(l.statsClickRate, style: Ts.secondary),

              ],

            ),

          ),

        ),

        _kpiDivider(),

        Expanded(

          flex: 4,

          child: Padding(

            padding: const EdgeInsetsDirectional.only(start: 14),

            child: Column(

              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                MetricText(Fmt.duration(dwell), size: 20, color: C.muted),

                const SizedBox(height: 8),

                Text(l.statsAvgDwell, style: Ts.secondary),

              ],

            ),

          ),

        ),

      ],

    );

  }

  Widget _kpiDivider() {

    return Container(

      width: 1,

      margin: const EdgeInsetsDirectional.only(bottom: 20),

      color: C.line,

    );

  }

}

/// 单张卡的详细数据

class CardStatsPage extends StatefulWidget {

  final String code;

  final String name;

  final int days;

  const CardStatsPage({

    super.key,

    required this.code,

    required this.name,

    required this.days,

  });

  @override

  State<CardStatsPage> createState() => _CardStatsPageState();

}

class _CardStatsPageState extends State<CardStatsPage> {

  bool _loading = true;

  Map<String, dynamic>? _d;

  @override

  void initState() {

    super.initState();

    _load();

  }

  Future<void> _load() async {

    try {

      final r = await Api.statsCard(widget.code, widget.days);

      if (mounted) setState(() => _d = Map<String, dynamic>.from(r as Map));

    } catch (_) {

    } finally {

      if (mounted) setState(() => _loading = false);

    }

  }

  @override

  Widget build(BuildContext context) {

    final l = L10n.of(context);

    final views = (_d?['views'] ?? 0) as num;

    final visitors = (_d?['uniqueVisitors'] ?? 0) as num;

    final clicks = (_d?['clicks'] ?? 0) as num;

    final ctr = ((_d?['ctr'] ?? 0) as num) * 100;

    final byType = (_d?['byType'] ?? {}) as Map;

    final daily = (_d?['daily'] as List?) ?? [];

    return Scaffold(

      body: SafeArea(

        bottom: false,

        child: _loading

            ? const Center(

                child: CircularProgressIndicator(

                    color: C.white, strokeWidth: 2))

            : ListView(

                padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 40),

                children: [

                  Row(

                    children: [

                      GestureDetector(

                        onTap: () => Navigator.of(context).pop(),

                        behavior: HitTestBehavior.opaque,

                        child: const Padding(

                          padding:

                              EdgeInsetsDirectional.only(end: 16, top: 8, bottom: 8),

                          child: AppIcon(AppIco.back,

                              size: 20, color: C.text),

                        ),

                      ),

                      Expanded(

                        child: Text(widget.name,

                            style: const TextStyle(

                                fontSize: 26,

                                fontWeight: FontWeight.w200,

                                color: C.text,

                                letterSpacing: 0.5)),

                      ),

                    ],

                  ),

                  const SizedBox(height: 6),

                  Text(widget.code,

                      style: const TextStyle(

                          fontSize: 12,

                          color: C.faint,

                          letterSpacing: 0.3)),

                  const SizedBox(height: 22),

                  Container(

                    padding: const EdgeInsets.all(22),

                    decoration: BoxDecoration(

                      color: C.surface,

                      borderRadius: BorderRadius.circular(20),

                    ),

                    child: Column(

                      crossAxisAlignment: CrossAxisAlignment.start,

                      children: [

                        Text(l.statsOpens,

                            style: TextStyle(

                                fontSize: 13,

                                color: C.muted,

                                letterSpacing: 0.2)),

                        const SizedBox(height: 10),

                        Row(

                          crossAxisAlignment: CrossAxisAlignment.end,

                          children: [

                            Text('$views',

                                style: const TextStyle(

                                    fontSize: 34,

                                    height: 1,

                                    fontWeight: FontWeight.w200,

                                    color: C.text)),

                            const SizedBox(width: 8),

                            Padding(

                              padding: const EdgeInsets.only(bottom: 8),

                              child: Text(Fmt.unitTimes(),

                                  style: const TextStyle(

                                      fontSize: 15, color: C.faint)),

                            ),

                          ],

                        ),

                        const SizedBox(height: 14),

                        Row(

                          children: [

                            Text('$visitors ' + l.statsUniqueVisitors,

                                style: const TextStyle(

                                    fontSize: 15, color: C.muted)),

                            const SizedBox(width: 24),

                            Text('$clicks ' + l.statsInteractions,

                                style: const TextStyle(

                                    fontSize: 15, color: C.muted)),

                            const Spacer(),

                            Text(Fmt.pct(ctr / 100) + ' ' + l.statsClickRate,

                                style: const TextStyle(

                                    fontSize: 15, color: C.text)),

                          ],

                        ),

                      ],

                    ),

                  ),

                  if (daily.isNotEmpty) ...[

                    const SizedBox(height: 26),

                    Text(l.statsTrend, style: Ts.h2),

                    const SizedBox(height: 14),

                    _chart(daily),

                  ],

                  const SizedBox(height: 26),

                  Text(l.statsInteractions, style: Ts.h2),

                  const SizedBox(height: 16),

                  ..._breakdown(byType),

                ],

              ),

      ),

    );

  }

  Widget _chart(List daily) {

    final l = L10n.of(context);

    var maxV = 1;

    for (final d in daily) {

      final v = ((d as Map)['count'] ?? 0) as num;

      if (v > maxV) maxV = v.toInt();

    }

    return Container(

      height: 130,

      padding: const EdgeInsetsDirectional.fromSTEB(4, 14, 4, 6),

      decoration: BoxDecoration(

        color: C.surface,

        borderRadius: BorderRadius.circular(18),

      ),

      child: Row(

        crossAxisAlignment: CrossAxisAlignment.end,

        children: [

          for (final d in daily)

            Expanded(

              child: Padding(

                padding: const EdgeInsets.symmetric(horizontal: 1.5),

                child: Container(

                  height: ((d as Map)['count'] ?? 0) / maxV * 90 + 2,

                  decoration: BoxDecoration(

                    color: C.white,

                    borderRadius: BorderRadius.circular(3),

                  ),

                ),

              ),

            ),

        ],

      ),

    );

  }

  List<Widget> _breakdown(Map byType) {

    final l = L10n.of(context);

    final map = <List<Object>>[

      ['click_phone', l.actionCall, AppIco.phone],

      ['click_email', l.actionEmail, AppIco.mail],

      ['click_wechat', l.actionCopyWechat, AppIco.chat],

      ['click_map', l.actionDirections, AppIco.pin],

      ['save_contact', l.actionSaveContact, AppIco.person],

      ['click_social', l.actionSocialLink, AppIco.link],

    ];

    var maxV = 1;

    for (final m in map) {

      final v = (byType[m[0]] ?? 0) as num;

      if (v > maxV) maxV = v.toInt();

    }

    return [

      for (final m in map)

        Padding(

          padding: const EdgeInsets.only(bottom: 14),

          child: Row(

            children: [

              AppIcon(m[2] as AppIco, size: 18, color: C.muted),
              const SizedBox(width: 10),
              SizedBox(
                width: 82,
                child: Text(
                  m[1] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  softWrap: false,
                  style: const TextStyle(
                      fontSize: 13, color: C.muted, height: 1.2),
                ),
              ),
              const SizedBox(width: 10),

              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: Container(
                    height: 6,
                    color: C.raised,
                    alignment: Alignment.centerLeft,
                    child: FractionallySizedBox(
                      widthFactor: ((byType[m[0]] ?? 0) as num) / maxV,
                      child: Container(color: C.white),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 12),

              SizedBox(

                width: 34,

                child: Text('${byType[m[0]] ?? 0}',

                    textAlign: TextAlign.right,

                    style: const TextStyle(

                        fontSize: 15,

                        color: C.text,

                        fontWeight: FontWeight.w500)),

              ),

            ],

          ),

        ),

    ];

  }

}

/// 全部卡片数据：分页 + 搜索，几千张也扛得住

class CardStatsListPage extends StatefulWidget {

  final int days;

  const CardStatsListPage({super.key, required this.days});

  @override

  State<CardStatsListPage> createState() => _CardStatsListPageState();

}

class _CardStatsListPageState extends State<CardStatsListPage> {

  final _search = TextEditingController();

  final _scroll = ScrollController();

  final List<Map<String, dynamic>> _items = [];

  int _page = 1;

  int _total = 0;

  bool _loading = false;

  bool _hasMore = true;

  Timer? _debounce;

  @override

  void initState() {

    super.initState();

    _scroll.addListener(() {

      if (_scroll.position.pixels >

          _scroll.position.maxScrollExtent - 300) {

        _load();

      }

    });

    _load(reset: true);

  }

  @override

  void dispose() {

    _debounce?.cancel();

    _search.dispose();

    _scroll.dispose();

    super.dispose();

  }

  Future<void> _load({bool reset = false}) async {

    if (_loading) return;

    if (reset) {

      _page = 1;

      _hasMore = true;

      _items.clear();

    }

    if (!_hasMore) return;

    setState(() => _loading = true);

    try {

      final r = await Api.statsCardsPaged(

        widget.days,

        page: _page,

        size: 20,

        q: _search.text.trim(),

      );

      final m = Map<String, dynamic>.from(r as Map);

      final list = (m['items'] as List? ?? [])

          .map((e) => Map<String, dynamic>.from(e as Map))

          .toList();

      if (!mounted) return;

      setState(() {

        _items.addAll(list);

        _total = (m['total'] ?? 0) as int;

        _hasMore = _items.length < _total;

        _page++;

      });

    } catch (_) {

    } finally {

      if (mounted) setState(() => _loading = false);

    }

  }

  void _onSearch(String v) {

    _debounce?.cancel();

    _debounce = Timer(const Duration(milliseconds: 350), () {

      _load(reset: true);

    });

  }

  @override

  Widget build(BuildContext context) {

    final l = L10n.of(context);

    return Scaffold(

      body: SafeArea(

        bottom: false,

        child: Column(

          children: [

            Padding(

              padding: const EdgeInsetsDirectional.fromSTEB(24, 8, 24, 0),

              child: Row(

                children: [

                  GestureDetector(

                    onTap: () => Navigator.of(context).pop(),

                    behavior: HitTestBehavior.opaque,

                    child: const Padding(

                      padding: EdgeInsetsDirectional.only(end: 16, top: 8, bottom: 8),

                      child: AppIcon(AppIco.back,

                          size: 20, color: C.text),

                    ),

                  ),

                  Text(l.statsAllCards,

                      style: TextStyle(

                          fontSize: 26,

                          fontWeight: FontWeight.w200,

                          color: C.text,

                          letterSpacing: 0.5)),

                  const Spacer(),

                  Text(l.statsTotalCards(_total),

                      style: const TextStyle(fontSize: 12, color: C.faint)),

                ],

              ),

            ),

            Padding(

              padding: const EdgeInsetsDirectional.fromSTEB(24, 14, 24, 12),

              child: Container(

                height: 44,

                padding: const EdgeInsets.symmetric(horizontal: 16),

                decoration: BoxDecoration(

                  color: C.surface,

                  borderRadius: BorderRadius.circular(22),

                ),

                child: Row(

                  children: [

                    const AppIcon(AppIco.search, size: 18, color: C.faint),

                    const SizedBox(width: 10),

                    Expanded(

                      child: TextField(

                        controller: _search,

                        onChanged: _onSearch,

                        style: const TextStyle(fontSize: 15, color: C.text),

                        decoration: InputDecoration(

                          hintText: l.statsSearchHint,

                          hintStyle: const TextStyle(fontSize: 15, color: C.faint),

                          border: InputBorder.none,

                          isDense: true,

                        ),

                      ),

                    ),

                  ],

                ),

              ),

            ),

            Expanded(

              child: ListView.builder(

                controller: _scroll,

                padding: const EdgeInsetsDirectional.fromSTEB(24, 4, 24, 30),

                itemCount: _items.length + (_hasMore ? 1 : 0),

                itemBuilder: (_, i) {

                  if (i >= _items.length) {

                    return const Padding(

                      padding: EdgeInsets.symmetric(vertical: 24),

                      child: Center(

                        child: SizedBox(

                          width: 18,

                          height: 18,

                          child: CircularProgressIndicator(

                              strokeWidth: 2, color: C.muted),

                        ),

                      ),

                    );

                  }

                  final c = _items[i];

                  return GestureDetector(

                    onTap: () => Navigator.of(context).push(

                      MaterialPageRoute(

                        builder: (_) => CardStatsPage(

                          code: (c['code'] ?? '') as String,

                          name: (c['name'] ?? '') as String,

                          days: widget.days,

                        ),

                      ),

                    ),

                    behavior: HitTestBehavior.opaque,

                    child: Container(

                      margin: const EdgeInsets.only(bottom: 10),

                      padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 14, 14),

                      decoration: BoxDecoration(

                        color: C.surface,

                        borderRadius: BorderRadius.circular(16),

                      ),

                      child: Row(

                        children: [

                          Expanded(

                            child: Column(

                              crossAxisAlignment: CrossAxisAlignment.start,

                              children: [

                                Text((c['name'] ?? l.homeUnknown).toString(),

                                  maxLines: 1,

                                  overflow: TextOverflow.ellipsis,

                                    style: const TextStyle(

                                        fontSize: 15, color: C.text)),

                                const SizedBox(height: 4),

                                Text(

                                  '${c['code']} · ${c['views']} · ${c['visitors']}',

                                  maxLines: 1,

                                  overflow: TextOverflow.ellipsis,

                                  style: const TextStyle(

                                      fontSize: 12,

                                      color: C.faint,

                                      letterSpacing: 0.1),

                                ),

                              ],

                            ),

                          ),

                          Text(

                            '${(((c['ctr'] ?? 0) as num) * 100).toStringAsFixed(0)}%',

                            maxLines: 1,

                            overflow: TextOverflow.ellipsis,

                            style: const TextStyle(

                                fontSize: 16,

                                fontWeight: FontWeight.w300,

                                color: C.text),

                          ),

                          const SizedBox(width: 8),

                          const AppIcon(AppIco.forward,

                              size: 18, color: C.faint),

                        ],

                      ),

                    ),

                  );

                },

              ),

            ),

          ],

        ),

      ),

    );

  }

  }

