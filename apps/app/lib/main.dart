import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'api.dart';
import 'i18n.dart';
import 'theme.dart';
import 'widgets/app_icons.dart';
import 'l10n/app_localizations.dart';
import 'screens/login.dart';
import 'screens/home.dart';
import 'screens/stats.dart';
import 'screens/me.dart';
import 'screens/write.dart';
import 'screens/profile.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.light,
    systemNavigationBarDividerColor: Colors.transparent,
  ));
  await Session.load();
  await AppLocale.instance.load();
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: AppLocale.instance,
      builder: (context, _) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.theme,

          // ── 国际化：优先用户选择，否则跟随系统 ──
          locale: AppLocale.instance.override,
          supportedLocales: AppLocale.supported,
          localizationsDelegates: const [
            L10n.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          localeResolutionCallback: (sys, supported) =>
              AppLocale.resolve(sys, supported),

          home: const _Root(),
          builder: (context, child) {
            final mq = MediaQuery.of(context);
            // 记录当前 locale，供数字/日期格式化用
            AppLocale.current = Localizations.localeOf(context);
            // 跟随系统字体大小，但限制上限防止布局崩
            final scale = mq.textScaler.scale(1.0).clamp(1.0, 1.35);
            return MediaQuery(
              data: mq.copyWith(textScaler: TextScaler.linear(scale)),
              child: child ?? const SizedBox(),
            );
          },
        );
      },
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: Session.authChanged,
      builder: (context, _, __) =>
          Session.loggedIn ? const Shell() : const LoginScreen(),
    );
  }
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  /// 资料/卡片变化时 +1，用它重建各页面，保证所有屏拿到新数据
  int _rev = 0;

  @override
  void initState() {
    super.initState();
    Session.dataChanged.addListener(_onDataChanged);
  }

  @override
  void dispose() {
    Session.dataChanged.removeListener(_onDataChanged);
    super.dispose();
  }

  void _onDataChanged() {
    if (mounted) setState(() => _rev++);
  }

  List<Widget> get _pages => [
        HomeScreen(key: ValueKey('home-$_rev')),
        StatsScreen(key: ValueKey('stats-$_rev')),
        WriteScreen(key: ValueKey('write-$_rev')),
        MeScreen(key: ValueKey('me-$_rev')),
      ];

  Future<void> _openProfile() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const ProfileScreen()),
    );
    if (changed == true) setState(() => _rev++);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: AppBottomBar(
        index: _index,
        onTap: (i) => setState(() => _index = i),
        onProfile: _openProfile,
      ),
    );
  }
}

/// 底部导航：名片 / 数据 / [头像=资料] / 写卡 / 我的
class AppBottomBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  final VoidCallback onProfile;
  const AppBottomBar({
    super.key,
    required this.index,
    required this.onTap,
    required this.onProfile,
  });

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final bottom = MediaQuery.of(context).padding.bottom;
    final email = (Session.user?['email'] ?? '') as String;
    final name = (Session.user?['name'] as String?) ??
        (email.contains('@') ? email.split('@').first : email);
    final initial = name.isNotEmpty ? name.characters.first : '·';

    return Container(
      height: 74 + bottom,
      decoration: const BoxDecoration(
        color: C.ground,
        border: Border(top: BorderSide(color: C.line, width: 1)),
      ),
      child: Padding(
        padding: EdgeInsetsDirectional.only(bottom: bottom),
        child: Row(
          children: [
            _item(0, l.navCards, AppIco.layers),
            _item(1, l.navStats, AppIco.chart),
            _center(initial, l.navProfile),
            _item(2, l.navWrite, AppIco.write),
            _item(3, l.navMe, AppIco.person),
          ],
        ),
      ),
    );
  }

  Widget _item(int i, String label, AppIco icon) {
    final on = index == i;
    final color = on ? C.white : const Color(0xFF6E6E6E);
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(i),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppIcon(icon, size: 21, color: color),
            const SizedBox(height: 4),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: T.caption,
                    letterSpacing: .3,
                    color: color,
                    fontWeight: on ? FontWeight.w600 : FontWeight.w400)),
          ],
        ),
      ),
    );
  }

  Widget _center(String initial, String label, {bool active = false}) {
    final color = active ? C.white : const Color(0xFF6E6E6E);
    return Expanded(
      child: GestureDetector(
        onTap: onProfile,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: C.raised,
                border: Border.all(
                    color: active ? C.white : Colors.transparent,
                    width: 1.5),
              ),
              alignment: Alignment.center,
              child: Text(initial,
                  style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w300,
                      color: color)),
            ),
            const SizedBox(height: 3),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    fontSize: T.caption,
                    letterSpacing: .3,
                    color: color,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w400)),
          ],
        ),
      ),
    );
  }
}
