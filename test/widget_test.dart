// NFC 名片写入器 —— 基础冒烟测试
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nfc_card_writer/main.dart';

void main() {
  testWidgets('页面能渲染出标题和写入按钮', (WidgetTester tester) async {
    await tester.pumpWidget(const NfcWriterApp());
    await tester.pump();

    expect(find.text('NFC 名片写入器'), findsOneWidget);
    expect(find.text('开始写入'), findsOneWidget);
    expect(find.byType(TextField), findsWidgets);
  });
}
