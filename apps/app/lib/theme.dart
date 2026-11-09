import 'package:flutter/material.dart';
import 'widgets/app_icons.dart';

/// 纯黑白设计系统
/// 规则：UI 零色彩，唯一颜色来自名片本身
class C {
  static const ground = Color(0xFF000000);   // 真黑
  static const surface = Color(0xFF111111);  // 卡片：明度 +17
  static const raised = Color(0xFF2A2A2A);   // 嵌套：明度 +25
  static const line = Color(0xFF1A1A1A);

  static const text = Color(0xFFFFFFFF);
  static const muted = Color(0xFFB4B4B4);   // 次级：对比 8.6:1
  static const faint = Color(0xFF949494);   // 三级：对比 4.6:1

  static const white = Color(0xFFFFFFFF);
  static const onWhite = Color(0xFF000000);

  static const danger = Color(0xFFE5484D);
}

/// 字号体系 —— 只有这 8 档，不允许出现其它数字
///
///  display 34  页面主数字 / 大标题
///  number  46  关键数字（打开次数）
///  title   26  页面标题
///  h2      20  区块标题
///  body    16  正文 / 输入
///  body2   15  正文次
///  secondary 13 次要说明
///  caption 12  最小（中文再小会糊，禁止更小）
class T {
  static const display = 30.0;
  static const number = 30.0;
  static const title = 24.0;
  static const h2 = 20.0;
  static const body = 16.0;
  static const body2 = 15.0;
  static const secondary = 14.0;
  static const caption = 12.0;
}

/// 行高
class Lh {
  static const tight = 1.2;
  static const normal = 1.45;
  static const loose = 1.65;
}

class AppTheme {
  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: C.ground,
        colorScheme: const ColorScheme.dark(
          surface: C.ground,
          primary: C.white,
          onPrimary: C.onWhite,
          secondary: C.surface,
          onSecondary: C.text,
        ),
        splashFactory: InkRipple.splashFactory,
        appBarTheme: const AppBarTheme(
          backgroundColor: C.ground,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: C.text,
            fontSize: T.title,
            fontWeight: FontWeight.w300,
            letterSpacing: -0.4,
          ),
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: C.raised,
          contentTextStyle: TextStyle(color: C.text, fontSize: T.body2),
          behavior: SnackBarBehavior.floating,
        ),
      );
}

/// 文字样式 —— 所有界面必须从这里取，不允许内联 fontSize
class Ts {
  /// 关键数字
  static const number = TextStyle(
    fontSize: T.number,
    height: Lh.tight,
    fontWeight: FontWeight.w300,
    color: C.text,
    letterSpacing: -1.2,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  /// 页面大标题
  static const title = TextStyle(
    fontSize: T.title,
    height: Lh.tight,
    fontWeight: FontWeight.w300,
    color: C.text,
    letterSpacing: -0.4, // 大字要收，不能放
  );

  /// 区块标题
  static const h2 = TextStyle(
    fontSize: T.h2,
    height: Lh.tight,
    fontWeight: FontWeight.w400,
    color: C.text,
    letterSpacing: -0.2,
  );

  /// 正文
  static const body = TextStyle(
    fontSize: T.body,
    height: Lh.loose,
    color: C.text,
  );

  /// 正文次
  static const body2 = TextStyle(
    fontSize: T.body2,
    height: Lh.normal,
    color: C.text,
  );

  /// 次要说明
  static const secondary = TextStyle(
    fontSize: T.secondary,
    height: Lh.normal,
    color: C.muted,
  );

  /// 最小号
  static const caption = TextStyle(
    fontSize: T.caption,
    height: Lh.normal,
    color: C.faint,
  );

  /// 小节标签（带字距）
  /// 小节标签 —— 唯一允许宽字距的地方，上限 0.08em
  static const label = TextStyle(
    fontSize: T.caption,
    color: C.muted,
    letterSpacing: 0.8,
  );

  /// 数字（中号）
  static const metric = TextStyle(
    fontSize: T.display,
    height: Lh.tight,
    fontWeight: FontWeight.w300,
    color: C.text,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  static const metricSmall = TextStyle(
    fontSize: T.h2,
    height: Lh.tight,
    fontWeight: FontWeight.w300,
    color: C.text,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  // ---- 旧命名兼容 ----
  static const section = h2;
  static const big = metric;
  static const display = metric;
  static const cardName = TextStyle(
    fontSize: T.title,
    height: Lh.tight,
    fontWeight: FontWeight.w300,
    color: C.text,
    letterSpacing: -0.4,
  );
}

/// 统一页面骨架：标题固定，内容滚动
///
/// 解决「标题跟着内容滚走」和「每页标题样式不一致」
class AppPage extends StatelessWidget {
  /// 小标签，如「名 片 数 据」
  final String? label;

  /// 页面标题，如「数据」
  final String title;

  /// 标题右侧操作
  final Widget? action;

  /// 滚动内容
  final List<Widget> children;

  /// 吸底区域（如保存按钮）
  final Widget? bottomBar;

  /// 是否显示返回按钮
  final bool back;

  const AppPage({
    super.key,
    this.label,
    required this.title,
    this.action,
    required this.children,
    this.bottomBar,
    this.back = false,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: bottomBar == null,
      child: Column(
        children: [
          // ===== 固定头部 =====
          Padding(
            padding: EdgeInsetsDirectional.fromSTEB(back ? 6 : 22, 10, 22, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (back)
                  GestureDetector(
                    onTap: () => Navigator.of(context).maybePop(),
                    behavior: HitTestBehavior.opaque,
                    child: const Padding(
                      padding: EdgeInsets.only(right: 8, top: 6, bottom: 6),
                      child: AppIcon(AppIco.back,
                          size: 18, color: C.text),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (label != null) ...[
                        Text(label!, style: Ts.label),
                        const SizedBox(height: 6),
                      ],
                      Text(title, style: Ts.title),
                    ],
                  ),
                ),
                if (action != null) action!,
              ],
            ),
          ),
          // ===== 滚动内容 =====
          Expanded(
            child: ListView(
              padding: const EdgeInsetsDirectional.fromSTEB(22, 0, 22, 28),
              children: children,
            ),
          ),
          // ===== 吸底 =====
          if (bottomBar != null)
            Container(
              padding: EdgeInsets.fromLTRB(
                  20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
              decoration: const BoxDecoration(
                color: C.ground,
                border: Border(top: BorderSide(color: C.line)),
              ),
              child: bottomBar!,
            ),
        ],
      ),
    );
  }
}

/// 区块标题 + 右侧操作
class SectionHead extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;
  const SectionHead({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: Text(title, style: Ts.h2)),
              if (action != null) action!,
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: Ts.secondary),
          ],
        ],
      ),
    );
  }
}

/// 卡片容器
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final Color color;
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.color = C.surface,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: child,
    );
  }
}

/// 白色胶囊主按钮
class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final bool loading;
  const PrimaryButton(
      {super.key, required this.text, this.onTap, this.loading = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: TextButton(
        onPressed: loading ? null : onTap,
        style: TextButton.styleFrom(
          backgroundColor: C.white,
          foregroundColor: C.onWhite,
          shape: const StadiumBorder(),
          disabledBackgroundColor: C.raised,
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child:
                    CircularProgressIndicator(strokeWidth: 2, color: C.onWhite),
              )
            : Text(
                text,
                style: const TextStyle(
                  fontSize: T.body2,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.4,
                  color: C.onWhite,
                ),
              ),
      ),
    );
  }
}

/// 幽灵按钮
class GhostButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  const GhostButton({super.key, required this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: double.infinity,
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          foregroundColor: C.text,
          shape: const StadiumBorder(),
          side: const BorderSide(color: C.raised),
        ),
        child: Text(text, style: Ts.body2),
      ),
    );
  }
}

/// 下划线输入框
class UnderlineField extends StatelessWidget {
  final String label;
  final String hint;
  final bool obscure;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  const UnderlineField({
    super.key,
    required this.label,
    required this.hint,
    required this.controller,
    this.obscure = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Ts.label),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          style: Ts.body,
          cursorColor: C.white,
          decoration: InputDecoration(
            isDense: true,
            hintText: hint,
            hintStyle: Ts.body.copyWith(color: C.faint),
            contentPadding: const EdgeInsets.only(bottom: 12),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: C.raised),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: C.white),
            ),
          ),
        ),
      ],
    );
  }
}

/// 分段选择器
class Segmented extends StatelessWidget {
  final List<String> items;
  final int index;
  final ValueChanged<int> onTap;
  const Segmented({
    super.key,
    required this.items,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: C.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++)
            Expanded(
              child: GestureDetector(
                onTap: () => onTap(i),
                child: Container(
                  decoration: BoxDecoration(
                    color: index == i ? C.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    items[i],
                    style: TextStyle(
                      fontSize: T.secondary,
                      letterSpacing: 0.2,
                      fontWeight:
                          index == i ? FontWeight.w600 : FontWeight.w400,
                      color: index == i ? C.onWhite : C.muted,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// 时间范围切换
class RangeChips extends StatelessWidget {
  final int index;
  final List<int> days;
  final List<String> labels;
  final ValueChanged<int> onTap;
  const RangeChips({
    super.key,
    required this.index,
    required this.days,
    required this.labels,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < days.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          GestureDetector(
            onTap: () => onTap(i),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: index == i ? C.white : C.surface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: T.secondary,
                  color: index == i ? C.onWhite : C.muted,
                  fontWeight:
                      index == i ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
/// 统一文本组件：默认单行 + 省略号，防止换行把布局撑破
/// 需要换行时显式传 lines: 2
class Txt extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final int lines;
  final TextAlign? align;
  final Color? color;

  const Txt(
    this.data, {
    super.key,
    this.style,
    this.lines = 1,
    this.align,
    this.color,
  });

  /// 允许自动换行（正文用）
  const Txt.wrap(
    this.data, {
    super.key,
    this.style,
    this.align,
    this.color,
  }) : lines = 0;

  @override
  Widget build(BuildContext context) {
    return Text(
      data,
      style: color != null ? (style ?? const TextStyle()).copyWith(color: color) : style,
      textAlign: align,
      maxLines: lines == 0 ? null : lines,
      overflow: lines == 0 ? TextOverflow.clip : TextOverflow.ellipsis,
      softWrap: true,
    );
  }
}
