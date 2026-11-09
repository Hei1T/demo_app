import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme.dart';

/// 语言管理
///
/// 优先级：用户手动选择 > 系统语言 > 中文
/// 支持「跟随系统」，切换系统语言后 App 立即跟随。
class AppLocale extends ChangeNotifier {
  static final AppLocale instance = AppLocale._();
  AppLocale._();

  /// null = 跟随系统
  Locale? _override;
  Locale? get override => _override;

  /// 最近一次生效的 locale（由 MaterialApp 回写，用于数字/日期格式化）
  static Locale current = const Locale('zh');

  static const supported = [Locale('zh'), Locale('en')];

  static bool isSupported(Locale l) =>
      supported.any((s) => s.languageCode == l.languageCode);

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    final code = sp.getString('locale');
    if (code != null && code.isNotEmpty) {
      _override = Locale(code);
    }
    notifyListeners();
  }

  Future<void> setLocale(Locale? locale) async {
    _override = locale;
    final sp = await SharedPreferences.getInstance();
    if (locale == null) {
      await sp.remove('locale');
    } else {
      await sp.setString('locale', locale.languageCode);
    }
    notifyListeners();
  }

  /// 系统里找第一个支持的语言；都没有就中文
  static Locale resolve(Locale? sys, Iterable<Locale> supportedList) {
    if (sys != null && isSupported(sys)) return Locale(sys.languageCode);
    for (final l in supportedList) {
      if (isSupported(l)) return Locale(l.languageCode);
    }
    return const Locale('zh');
  }

  /// 是否 RTL 语言（当前只支持 LTR 语言，留接口）
  static bool isRtl(Locale l) => const ['ar', 'he', 'fa', 'ur'].contains(l.languageCode);

  String get label {
    if (_override == null) return 'system';
    return _override!.languageCode;
  }
}

/// 数字 / 日期 / 时长格式化
///
/// 全部走 intl，跟随当前 locale：
///   中文  24,313 / 2.4万 / 71% / 11/08
///   英文  24,313 / 24.3K / 71% / Nov 8
class Fmt {
  static Locale get _l => AppLocale.current;

  /// 整数千分位
  static String thousands(num n) =>
      NumberFormat.decimalPattern(_l.languageCode).format(n.round());

  /// 紧凑写法：≥1万缩写
  static String compact(num n) {
    final v = n.abs();
    if (v < 10000) return thousands(n);
    return NumberFormat.compact(locale: _l.languageCode).format(n);
  }

  /// 百分比（0-1 或 0-100 都支持）
  static String pct(num ratio, {int digits = 0}) {
    final v = ratio <= 1 ? ratio * 100 : ratio;
    return '${v.toStringAsFixed(digits)}%';
  }

  /// 时长：秒 → 45秒 / 12分34秒 / 1时23分
  static String duration(num seconds) {
    final s = seconds.round();
    if (s <= 0) return '—';
    if (s < 60) return _isZh ? '$s秒' : '${s}s';
    if (s < 3600) {
      final m = s ~/ 60, r = s % 60;
      if (_isZh) return r == 0 ? '$m分' : '$m分$r秒';
      return r == 0 ? '${m}m' : '${m}m ${r}s';
    }
    final h = s ~/ 3600, m = (s % 3600) ~/ 60;
    if (_isZh) return m == 0 ? '$h时' : '$h时$m分';
    return m == 0 ? '${h}h' : '${h}h ${m}m';
  }

  /// 小时标签：中文「6 点」，英文「6:00」
  static String hourLabel(int h) => _isZh ? '$h 点' : '$h:00';

  /// 月份日期：中文「十一月 · 第 8 日」，英文「Nov 8」
  static String monthDay(DateTime d) => DateFormat.MMMMd(_l.languageCode).format(d);

  /// 日期：11/08 或 Nov 8
  static String date(DateTime d) =>
      DateFormat.Md(_l.languageCode).format(d);

  /// 时间：22:14
  static String time(DateTime d) =>
      DateFormat.Hm(_l.languageCode).format(d);

  /// 相对时间：3 分钟前 / 3m ago
  static String ago(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 1) return _isZh ? '刚刚' : 'just now';
    if (diff.inMinutes < 60) {
      return _isZh ? '${diff.inMinutes} 分钟前' : '${diff.inMinutes}m ago';
    }
    if (diff.inHours < 24) {
      return _isZh ? '${diff.inHours} 小时前' : '${diff.inHours}h ago';
    }
    return _isZh ? '${diff.inDays} 天前' : '${diff.inDays}d ago';
  }

  static String get dash => '—';

  static bool get _isZh => _l.languageCode == 'zh';

  /// 单位后缀
  static String unitTimes() => _isZh ? '次' : '';
}

/// 数字样式：超长自动降档 + 兜底缩放
class MetricText extends StatelessWidget {
  final String text;
  final double size;
  final TextStyle Function(double size)? styleOf;
  final Color? color;

  const MetricText(
    this.text, {
    super.key,
    this.size = 30,
    this.styleOf,
    this.color,
  });

  /// 按字符数决定字号：≤6 → 原尺寸，7-8 → 0.8，>8 → 0.63
  double get _effective {
    final n = text.characters.length;
    if (n <= 6) return size;
    if (n <= 8) return size * 0.8;
    return size * 0.63;
  }

  @override
  Widget build(BuildContext context) {
    final s = _effective;
    final base = styleOf?.call(s) ??
        TextStyle(
          fontSize: s,
          height: 1.1,
          fontWeight: FontWeight.w300,
          color: color ?? C.text,
          fontFeatures: const [FontFeature.tabularFigures()],
        );
    // 兜底：任何情况下不溢出、不换行
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: AlignmentDirectional.centerStart,
      child: Text(
        text,
        maxLines: 1,
        softWrap: false,
        style: base.copyWith(color: color ?? base.color),
      ),
    );
  }
}
