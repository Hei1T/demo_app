import 'package:flutter/material.dart';

/// 品牌图标：全部 1.4px 细线、圆角端点、24 网格
/// 不用 emoji（各设备渲染不一致、颜色失控），不用 Material 内置（样式太杂）
enum AppIco {
  phone, mail, chat, pin, person, link,
  card, chart, write, user, layers,
  add, back, forward, close, check, search,
  up, down, block, restore, trash, edit, lock, power,
}

class AppIcon extends StatelessWidget {
  final AppIco kind;
  final double size;
  final Color color;

  const AppIcon(this.kind, {super.key, this.size = 20, this.color = Colors.white});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _IcoPainter(kind, color)),
    );
  }
}

class _IcoPainter extends CustomPainter {
  final AppIco kind;
  final Color color;
  _IcoPainter(this.kind, this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24.0; // 24 网格缩放
    // 线宽固定为物理 1.5px：小图标不会变粗，大图标不会变细
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5 / s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // 统一变换到 24x24
    canvas.save();
    canvas.scale(s);

    switch (kind) {
      case AppIco.phone:
        // 听筒：一条弯曲的听筒轮廓
        final ph = Path()
          ..moveTo(6.5, 4.5)
          ..lineTo(9.2, 4.5)
          ..lineTo(10.4, 8.2)
          ..lineTo(8.6, 9.6)
          ..cubicTo(9.8, 12.6, 11.4, 14.2, 14.4, 15.4)
          ..lineTo(15.8, 13.6)
          ..lineTo(19.5, 14.8)
          ..lineTo(19.5, 17.5)
          ..cubicTo(19.5, 18.6, 18.6, 19.5, 17.5, 19.5)
          ..cubicTo(10.4, 19.5, 4.5, 13.6, 4.5, 6.5)
          ..cubicTo(4.5, 5.4, 5.4, 4.5, 6.5, 4.5)
          ..close();
        canvas.drawPath(ph, p);

      case AppIco.mail:
        // 信封
        canvas.drawRRect(
            RRect.fromRectAndRadius(
                const Rect.fromLTWH(3.5, 5.5, 17, 13), const Radius.circular(2.2)),
            p);
        canvas.drawPath(
            Path()
              ..moveTo(3.9, 6.4)
              ..lineTo(12, 12.4)
              ..lineTo(20.1, 6.4),
            p);

      case AppIco.chat:
        // 对话气泡（小）+ 一个点
        canvas.drawRRect(
            RRect.fromRectAndRadius(
                const Rect.fromLTWH(3.5, 5, 14, 10.5), const Radius.circular(3)),
            p);
        canvas.drawPath(
            Path()
              ..moveTo(7, 15.5)
              ..lineTo(7, 18.6)
              ..lineTo(10.6, 15.5),
            p);
        // 三个点
        for (final x in [7.2, 10.5, 13.8]) {
          canvas.drawCircle(Offset(x, 10.2), 1.0, Paint()..color = color);
        }

      case AppIco.pin:
        // 定位针
        final pin = Path()
          ..moveTo(12, 20.5)
          ..cubicTo(12, 20.5, 5, 14.2, 5, 9.6)
          ..cubicTo(5, 5.7, 8.1, 3.5, 12, 3.5)
          ..cubicTo(15.9, 3.5, 19, 5.7, 19, 9.6)
          ..cubicTo(19, 14.2, 12, 20.5, 12, 20.5)
          ..close();
        canvas.drawPath(pin, p);
        canvas.drawCircle(const Offset(12, 9.6), 2.6, p);

      case AppIco.person:
        canvas.drawCircle(const Offset(12, 8), 3.6, p);
        canvas.drawPath(
            Path()
              ..moveTo(5, 20)
              ..cubicTo(5, 16.2, 8.1, 14, 12, 14)
              ..cubicTo(15.9, 14, 19, 16.2, 19, 20),
            p);

      case AppIco.link:
        // 链环
        canvas.drawArc(const Rect.fromLTWH(2.5, 8.5, 10, 7), -0.5, 2.1, false, p);
        canvas.drawArc(const Rect.fromLTWH(11.5, 8.5, 10, 7), 2.6, 2.1, false, p);
        canvas.drawLine(const Offset(9, 12), const Offset(15, 12), p);

      case AppIco.card:
        canvas.drawRRect(
            RRect.fromRectAndRadius(
                const Rect.fromLTWH(2.5, 6, 19, 12), const Radius.circular(2.4)),
            p);
        canvas.drawLine(const Offset(2.5, 10.2), const Offset(21.5, 10.2), p);

      case AppIco.chart:
        canvas.drawLine(const Offset(3.5, 20), const Offset(20.5, 20), p);
        canvas.drawLine(const Offset(7, 20), const Offset(7, 13), p);
        canvas.drawLine(const Offset(12, 20), const Offset(12, 8), p);
        canvas.drawLine(const Offset(17, 20), const Offset(17, 15.5), p);

      case AppIco.write:
        // 感应波纹：以 (7,12) 为原点，两道弧向右侧展开
        // 视觉重心落在 x≈11，接近网格中心，不会看起来偏右
        canvas.drawCircle(const Offset(7, 12), 1.7, Paint()..color = color);
        canvas.drawArc(
            Rect.fromCircle(center: const Offset(7, 12), radius: 4.6),
            -0.92, 1.84, false, p);
        canvas.drawArc(
            Rect.fromCircle(center: const Offset(7, 12), radius: 8.6),
            -0.78, 1.56, false, p);

      case AppIco.user:
        canvas.drawCircle(const Offset(12, 8.5), 3.4, p);
        canvas.drawPath(
            Path()
              ..moveTo(5.5, 20)
              ..cubicTo(5.5, 16.4, 8.4, 14.3, 12, 14.3)
              ..cubicTo(15.6, 14.3, 18.5, 16.4, 18.5, 20),
            p);

      case AppIco.power:
        canvas.drawArc(const Rect.fromLTWH(4, 4, 16, 16), -1.6, 4.4, false, p);
        canvas.drawLine(const Offset(12, 3), const Offset(12, 11), p);

      case AppIco.forward:
        canvas.drawPath(
            Path()
              ..moveTo(9.5, 5.5)
              ..lineTo(16, 12)
              ..lineTo(9.5, 18.5),
            p);

      case AppIco.back:
        canvas.drawPath(
            Path()
              ..moveTo(14.5, 5.5)
              ..lineTo(8, 12)
              ..lineTo(14.5, 18.5),
            p);

      case AppIco.add:
        canvas.drawLine(const Offset(12, 5), const Offset(12, 19), p);
        canvas.drawLine(const Offset(5, 12), const Offset(19, 12), p);

      case AppIco.close:
        canvas.drawLine(const Offset(6.5, 6.5), const Offset(17.5, 17.5), p);
        canvas.drawLine(const Offset(17.5, 6.5), const Offset(6.5, 17.5), p);

      case AppIco.check:
        canvas.drawPath(
            Path()
              ..moveTo(5, 12.5)
              ..lineTo(10, 17.5)
              ..lineTo(19, 6.5),
            p);

      case AppIco.search:
        canvas.drawCircle(const Offset(10.5, 10.5), 6.2, p);
        canvas.drawLine(const Offset(15.2, 15.2), const Offset(20, 20), p);

      case AppIco.up:
        canvas.drawLine(const Offset(12, 19), const Offset(12, 6), p);
        canvas.drawPath(
            Path()
              ..moveTo(6.5, 11)
              ..lineTo(12, 5.5)
              ..lineTo(17.5, 11),
            p);

      case AppIco.down:
        canvas.drawLine(const Offset(12, 5), const Offset(12, 18), p);
        canvas.drawPath(
            Path()
              ..moveTo(6.5, 13)
              ..lineTo(12, 18.5)
              ..lineTo(17.5, 13),
            p);

      case AppIco.block:
        canvas.drawCircle(const Offset(12, 12), 8.2, p);
        canvas.drawLine(const Offset(6.2, 17.8), const Offset(17.8, 6.2), p);

      case AppIco.restore:
        canvas.drawArc(const Rect.fromLTWH(4, 4, 16, 16), -0.4, 5.1, false, p);
        canvas.drawPath(
            Path()
              ..moveTo(12, 2.8)
              ..lineTo(12, 7.4)
              ..lineTo(7.4, 7.4),
            p);

      case AppIco.trash:
        canvas.drawLine(const Offset(4.5, 6.5), const Offset(19.5, 6.5), p);
        canvas.drawPath(
            Path()
              ..moveTo(6.5, 6.5)
              ..lineTo(7.4, 19.5)
              ..lineTo(16.6, 19.5)
              ..lineTo(17.5, 6.5),
            p);
        canvas.drawPath(
            Path()
              ..moveTo(9.5, 6.5)
              ..lineTo(9.5, 4)
              ..lineTo(14.5, 4)
              ..lineTo(14.5, 6.5),
            p);
        canvas.drawLine(const Offset(10.5, 10), const Offset(10.5, 16), p);
        canvas.drawLine(const Offset(13.5, 10), const Offset(13.5, 16), p);

      case AppIco.edit:
        canvas.drawPath(
            Path()
              ..moveTo(4.5, 19.5)
              ..lineTo(5.4, 15.4)
              ..lineTo(16.2, 4.6)
              ..lineTo(19.4, 7.8)
              ..lineTo(8.6, 18.6)
              ..close(),
            p);

      case AppIco.lock:
        canvas.drawRRect(
            RRect.fromRectAndRadius(
                const Rect.fromLTWH(5, 10.5, 14, 9.5), const Radius.circular(2.2)),
            p);
        canvas.drawPath(
            Path()
              ..moveTo(8.2, 10.5)
              ..lineTo(8.2, 8)
              ..cubicTo(8.2, 5.2, 15.8, 5.2, 15.8, 8)
              ..lineTo(15.8, 10.5),
            p);

      case AppIco.layers:
        // 后层（只画上边和右边，形成「两张卡错开」）
        canvas.drawPath(
            Path()
              ..moveTo(6.5, 6.5)
              ..lineTo(19.5, 6.5)
              ..lineTo(19.5, 17),
            p);
        // 前层
        canvas.drawRRect(
            RRect.fromRectAndRadius(
                const Rect.fromLTWH(4.5, 9.5, 13, 10), const Radius.circular(2)),
            p);

    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _IcoPainter old) =>
      old.kind != kind || old.color != color;
}
