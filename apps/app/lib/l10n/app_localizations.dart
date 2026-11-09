import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of L10n
/// returned by `L10n.of(context)`.
///
/// Applications need to include `L10n.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: L10n.localizationsDelegates,
///   supportedLocales: L10n.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the L10n.supportedLocales
/// property.
abstract class L10n {
  L10n(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static L10n of(BuildContext context) {
    return Localizations.of<L10n>(context, L10n)!;
  }

  static const LocalizationsDelegate<L10n> delegate = _L10nDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('zh'),
  ];

  /// No description provided for @appName.
  ///
  /// In zh, this message translates to:
  /// **'名片'**
  String get appName;

  /// No description provided for @navCards.
  ///
  /// In zh, this message translates to:
  /// **'名片'**
  String get navCards;

  /// No description provided for @navStats.
  ///
  /// In zh, this message translates to:
  /// **'数据'**
  String get navStats;

  /// No description provided for @navProfile.
  ///
  /// In zh, this message translates to:
  /// **'资料'**
  String get navProfile;

  /// No description provided for @navWrite.
  ///
  /// In zh, this message translates to:
  /// **'写卡'**
  String get navWrite;

  /// No description provided for @navMe.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get navMe;

  /// No description provided for @greetNight.
  ///
  /// In zh, this message translates to:
  /// **'夜深了'**
  String get greetNight;

  /// No description provided for @greetMorning.
  ///
  /// In zh, this message translates to:
  /// **'早上好'**
  String get greetMorning;

  /// No description provided for @greetAfternoon.
  ///
  /// In zh, this message translates to:
  /// **'下午好'**
  String get greetAfternoon;

  /// No description provided for @greetEvening.
  ///
  /// In zh, this message translates to:
  /// **'晚上好'**
  String get greetEvening;

  /// No description provided for @greetYou.
  ///
  /// In zh, this message translates to:
  /// **'你好'**
  String get greetYou;

  /// No description provided for @homeLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在读取你的数据'**
  String get homeLoading;

  /// No description provided for @homeTodayPeople.
  ///
  /// In zh, this message translates to:
  /// **'今天 {n} 个人认识了你'**
  String homeTodayPeople(int n);

  /// No description provided for @homeFetchFailed.
  ///
  /// In zh, this message translates to:
  /// **'读取失败'**
  String get homeFetchFailed;

  /// No description provided for @loginTitle.
  ///
  /// In zh, this message translates to:
  /// **'每一张名片\n都值得被记住'**
  String get loginTitle;

  /// No description provided for @loginEmail.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get loginEmail;

  /// No description provided for @loginPassword.
  ///
  /// In zh, this message translates to:
  /// **'密码'**
  String get loginPassword;

  /// No description provided for @loginEmailHint.
  ///
  /// In zh, this message translates to:
  /// **'you@company.com'**
  String get loginEmailHint;

  /// No description provided for @loginPasswordHint.
  ///
  /// In zh, this message translates to:
  /// **'至少 8 位'**
  String get loginPasswordHint;

  /// No description provided for @loginSubmit.
  ///
  /// In zh, this message translates to:
  /// **'登录'**
  String get loginSubmit;

  /// No description provided for @loginNoAccount.
  ///
  /// In zh, this message translates to:
  /// **'还没有账号 · 创建一个'**
  String get loginNoAccount;

  /// No description provided for @loginHasAccount.
  ///
  /// In zh, this message translates to:
  /// **'已有账号 · 去登录'**
  String get loginHasAccount;

  /// No description provided for @loginRegister.
  ///
  /// In zh, this message translates to:
  /// **'注册'**
  String get loginRegister;

  /// No description provided for @loginName.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get loginName;

  /// No description provided for @loginNameHint.
  ///
  /// In zh, this message translates to:
  /// **'怎么称呼你'**
  String get loginNameHint;

  /// No description provided for @loginIncomplete.
  ///
  /// In zh, this message translates to:
  /// **'请填写完整信息'**
  String get loginIncomplete;

  /// No description provided for @loginFailed.
  ///
  /// In zh, this message translates to:
  /// **'登录失败'**
  String get loginFailed;

  /// No description provided for @homeTodayOpens.
  ///
  /// In zh, this message translates to:
  /// **'今天打开'**
  String get homeTodayOpens;

  /// No description provided for @homeVisitors.
  ///
  /// In zh, this message translates to:
  /// **'访客'**
  String get homeVisitors;

  /// No description provided for @homeClickRate.
  ///
  /// In zh, this message translates to:
  /// **'点击率'**
  String get homeClickRate;

  /// No description provided for @homeMyCards.
  ///
  /// In zh, this message translates to:
  /// **'我的名片'**
  String get homeMyCards;

  /// No description provided for @homeOtherCards.
  ///
  /// In zh, this message translates to:
  /// **'其他名片'**
  String get homeOtherCards;

  /// No description provided for @homeAllCardsShort.
  ///
  /// In zh, this message translates to:
  /// **'{n} 张'**
  String homeAllCardsShort(int n);

  /// No description provided for @homeRecent.
  ///
  /// In zh, this message translates to:
  /// **'最近动态'**
  String get homeRecent;

  /// No description provided for @homeNoViews.
  ///
  /// In zh, this message translates to:
  /// **'还没有人看过你的名片'**
  String get homeNoViews;

  /// No description provided for @homeTimes.
  ///
  /// In zh, this message translates to:
  /// **'共 {n} 次'**
  String homeTimes(int n);

  /// No description provided for @homeNoCards.
  ///
  /// In zh, this message translates to:
  /// **'还没有名片'**
  String get homeNoCards;

  /// No description provided for @homeNoCardsHint.
  ///
  /// In zh, this message translates to:
  /// **'创建第一张名片\n写进卡片里'**
  String get homeNoCardsHint;

  /// No description provided for @homeOpensLabel.
  ///
  /// In zh, this message translates to:
  /// **'打 开'**
  String get homeOpensLabel;

  /// No description provided for @homeVisitorsLabel.
  ///
  /// In zh, this message translates to:
  /// **'访 客'**
  String get homeVisitorsLabel;

  /// No description provided for @homeCtrLabel.
  ///
  /// In zh, this message translates to:
  /// **'点 击 率'**
  String get homeCtrLabel;

  /// No description provided for @homeUnknown.
  ///
  /// In zh, this message translates to:
  /// **'未命名'**
  String get homeUnknown;

  /// No description provided for @revokeTitle.
  ///
  /// In zh, this message translates to:
  /// **'作废这张卡'**
  String get revokeTitle;

  /// No description provided for @restoreTitle.
  ///
  /// In zh, this message translates to:
  /// **'恢复这张卡'**
  String get restoreTitle;

  /// No description provided for @revokeHint.
  ///
  /// In zh, this message translates to:
  /// **'作废后所有入口失效，只有你能恢复'**
  String get revokeHint;

  /// No description provided for @restoreHint.
  ///
  /// In zh, this message translates to:
  /// **'恢复后短链重新可用'**
  String get restoreHint;

  /// No description provided for @revokeConfirmTitle.
  ///
  /// In zh, this message translates to:
  /// **'确认作废？'**
  String get revokeConfirmTitle;

  /// No description provided for @revokeConfirmBody.
  ///
  /// In zh, this message translates to:
  /// **'作废后，这张 NFC 卡扫开只会显示「名片已作废」。\n\n只有你能恢复。别人的手机、NFC Tools、任何入口都看不到名片内容。'**
  String get revokeConfirmBody;

  /// No description provided for @revokeDone.
  ///
  /// In zh, this message translates to:
  /// **'已作废，短链立即失效'**
  String get revokeDone;

  /// No description provided for @revokeAction.
  ///
  /// In zh, this message translates to:
  /// **'作废'**
  String get revokeAction;

  /// No description provided for @actOpenCard.
  ///
  /// In zh, this message translates to:
  /// **'有人打开了你的名片'**
  String get actOpenCard;

  /// No description provided for @actSaveContact.
  ///
  /// In zh, this message translates to:
  /// **'有人保存了你的联系人'**
  String get actSaveContact;

  /// No description provided for @actSocialLink.
  ///
  /// In zh, this message translates to:
  /// **'有人点了你的社交链接'**
  String get actSocialLink;

  /// No description provided for @actDirections.
  ///
  /// In zh, this message translates to:
  /// **'有人查看了你的位置'**
  String get actDirections;

  /// No description provided for @actEmail.
  ///
  /// In zh, this message translates to:
  /// **'有人给你发了邮件'**
  String get actEmail;

  /// No description provided for @actCopyWechat.
  ///
  /// In zh, this message translates to:
  /// **'有人复制了你的微信'**
  String get actCopyWechat;

  /// No description provided for @actCall.
  ///
  /// In zh, this message translates to:
  /// **'有人拨打了你的电话'**
  String get actCall;

  /// No description provided for @statsLabel.
  ///
  /// In zh, this message translates to:
  /// **'名片数据'**
  String get statsLabel;

  /// No description provided for @statsTitle.
  ///
  /// In zh, this message translates to:
  /// **'数据'**
  String get statsTitle;

  /// No description provided for @statsRangeToday.
  ///
  /// In zh, this message translates to:
  /// **'今天'**
  String get statsRangeToday;

  /// No description provided for @statsRange7.
  ///
  /// In zh, this message translates to:
  /// **'近 7 天'**
  String get statsRange7;

  /// No description provided for @statsRange30.
  ///
  /// In zh, this message translates to:
  /// **'近 30 天'**
  String get statsRange30;

  /// No description provided for @statsOpens.
  ///
  /// In zh, this message translates to:
  /// **'打开次数'**
  String get statsOpens;

  /// No description provided for @statsUniqueVisitors.
  ///
  /// In zh, this message translates to:
  /// **'访客'**
  String get statsUniqueVisitors;

  /// No description provided for @statsClickRate.
  ///
  /// In zh, this message translates to:
  /// **'点击率'**
  String get statsClickRate;

  /// No description provided for @statsAvgDwell.
  ///
  /// In zh, this message translates to:
  /// **'平均停留'**
  String get statsAvgDwell;

  /// No description provided for @statsFunnel.
  ///
  /// In zh, this message translates to:
  /// **'转化漏斗'**
  String get statsFunnel;

  /// No description provided for @statsFunnelOpened.
  ///
  /// In zh, this message translates to:
  /// **'打开'**
  String get statsFunnelOpened;

  /// No description provided for @statsFunnelSaw.
  ///
  /// In zh, this message translates to:
  /// **'浏览'**
  String get statsFunnelSaw;

  /// No description provided for @statsFunnelTapped.
  ///
  /// In zh, this message translates to:
  /// **'点击'**
  String get statsFunnelTapped;

  /// No description provided for @statsFunnelSaved.
  ///
  /// In zh, this message translates to:
  /// **'保存'**
  String get statsFunnelSaved;

  /// No description provided for @statsTrend.
  ///
  /// In zh, this message translates to:
  /// **'每日趋势'**
  String get statsTrend;

  /// No description provided for @statsPerCard.
  ///
  /// In zh, this message translates to:
  /// **'每张卡的数据'**
  String get statsPerCard;

  /// No description provided for @statsSeeAll.
  ///
  /// In zh, this message translates to:
  /// **'全部 {n} 张'**
  String statsSeeAll(int n);

  /// No description provided for @statsInteractions.
  ///
  /// In zh, this message translates to:
  /// **'访客做了什么'**
  String get statsInteractions;

  /// No description provided for @statsCities.
  ///
  /// In zh, this message translates to:
  /// **'访客来自'**
  String get statsCities;

  /// No description provided for @statsDevices.
  ///
  /// In zh, this message translates to:
  /// **'设备'**
  String get statsDevices;

  /// No description provided for @statsSources.
  ///
  /// In zh, this message translates to:
  /// **'来源'**
  String get statsSources;

  /// No description provided for @statsRecentVisitors.
  ///
  /// In zh, this message translates to:
  /// **'最近访客'**
  String get statsRecentVisitors;

  /// No description provided for @statsHours.
  ///
  /// In zh, this message translates to:
  /// **'什么时候被打开'**
  String get statsHours;

  /// No description provided for @statsEmpty.
  ///
  /// In zh, this message translates to:
  /// **'这段时间还没有数据'**
  String get statsEmpty;

  /// No description provided for @statsSearchHint.
  ///
  /// In zh, this message translates to:
  /// **'搜索姓名或短码'**
  String get statsSearchHint;

  /// No description provided for @statsAllCards.
  ///
  /// In zh, this message translates to:
  /// **'全部卡片'**
  String get statsAllCards;

  /// No description provided for @statsTotalCards.
  ///
  /// In zh, this message translates to:
  /// **'共 {n} 张'**
  String statsTotalCards(int n);

  /// No description provided for @statsLoading.
  ///
  /// In zh, this message translates to:
  /// **'加载中'**
  String get statsLoading;

  /// No description provided for @statsTapCardHint.
  ///
  /// In zh, this message translates to:
  /// **'点开看单张卡的明细'**
  String get statsTapCardHint;

  /// No description provided for @actionSaveContact.
  ///
  /// In zh, this message translates to:
  /// **'存联系人'**
  String get actionSaveContact;

  /// No description provided for @actionSocialLink.
  ///
  /// In zh, this message translates to:
  /// **'社交'**
  String get actionSocialLink;

  /// No description provided for @actionDirections.
  ///
  /// In zh, this message translates to:
  /// **'导航'**
  String get actionDirections;

  /// No description provided for @actionEmail.
  ///
  /// In zh, this message translates to:
  /// **'发邮件'**
  String get actionEmail;

  /// No description provided for @actionCopyWechat.
  ///
  /// In zh, this message translates to:
  /// **'微信'**
  String get actionCopyWechat;

  /// No description provided for @actionCall.
  ///
  /// In zh, this message translates to:
  /// **'打电话'**
  String get actionCall;

  /// No description provided for @funnelHint.
  ///
  /// In zh, this message translates to:
  /// **'每 100 人打开，{tap} 人点联系方式'**
  String funnelHint(int tap);

  /// No description provided for @trendBest.
  ///
  /// In zh, this message translates to:
  /// **'{date} 最好，{n} 次打开'**
  String trendBest(String date, int n);

  /// No description provided for @interactionLead.
  ///
  /// In zh, this message translates to:
  /// **'{name} 最多，共 {n} 次'**
  String interactionLead(String name, int n);

  /// No description provided for @hourPeak.
  ///
  /// In zh, this message translates to:
  /// **'{h} 点前后最活跃，{n} 次打开'**
  String hourPeak(int h, int n);

  /// No description provided for @profileTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的资料'**
  String get profileTitle;

  /// No description provided for @profileSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'一份资料 + 一个模板，所有短链卡片共用'**
  String get profileSubtitle;

  /// No description provided for @profileCompletion.
  ///
  /// In zh, this message translates to:
  /// **'完成度'**
  String get profileCompletion;

  /// No description provided for @profileBasics.
  ///
  /// In zh, this message translates to:
  /// **'基础信息'**
  String get profileBasics;

  /// No description provided for @profileContact.
  ///
  /// In zh, this message translates to:
  /// **'联系方式'**
  String get profileContact;

  /// No description provided for @profileSocial.
  ///
  /// In zh, this message translates to:
  /// **'社交平台'**
  String get profileSocial;

  /// No description provided for @profileTemplate.
  ///
  /// In zh, this message translates to:
  /// **'模板'**
  String get profileTemplate;

  /// No description provided for @profileName.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get profileName;

  /// No description provided for @profileRole.
  ///
  /// In zh, this message translates to:
  /// **'职位'**
  String get profileRole;

  /// No description provided for @profileOrg.
  ///
  /// In zh, this message translates to:
  /// **'公司'**
  String get profileOrg;

  /// No description provided for @profilePhone.
  ///
  /// In zh, this message translates to:
  /// **'电话'**
  String get profilePhone;

  /// No description provided for @profileEmail.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get profileEmail;

  /// No description provided for @profileWechat.
  ///
  /// In zh, this message translates to:
  /// **'微信号'**
  String get profileWechat;

  /// No description provided for @profileWebsite.
  ///
  /// In zh, this message translates to:
  /// **'网站'**
  String get profileWebsite;

  /// No description provided for @profileBio.
  ///
  /// In zh, this message translates to:
  /// **'一句话介绍'**
  String get profileBio;

  /// No description provided for @profileSave.
  ///
  /// In zh, this message translates to:
  /// **'保存'**
  String get profileSave;

  /// No description provided for @profileSaved.
  ///
  /// In zh, this message translates to:
  /// **'已保存，所有卡片同步更新'**
  String get profileSaved;

  /// No description provided for @profileNameRequired.
  ///
  /// In zh, this message translates to:
  /// **'请填写姓名'**
  String get profileNameRequired;

  /// No description provided for @profileFullPreview.
  ///
  /// In zh, this message translates to:
  /// **'全屏预览'**
  String get profileFullPreview;

  /// No description provided for @profileAddSocial.
  ///
  /// In zh, this message translates to:
  /// **'添加社交平台'**
  String get profileAddSocial;

  /// No description provided for @profilePreviewTitle.
  ///
  /// In zh, this message translates to:
  /// **'当前模板'**
  String get profilePreviewTitle;

  /// No description provided for @writeLabel.
  ///
  /// In zh, this message translates to:
  /// **'写入卡片'**
  String get writeLabel;

  /// No description provided for @writeTitle.
  ///
  /// In zh, this message translates to:
  /// **'写卡'**
  String get writeTitle;

  /// No description provided for @writeClearTitle.
  ///
  /// In zh, this message translates to:
  /// **'清除'**
  String get writeClearTitle;

  /// No description provided for @writeClearLabel.
  ///
  /// In zh, this message translates to:
  /// **'清除卡片'**
  String get writeClearLabel;

  /// No description provided for @writeTabWrite.
  ///
  /// In zh, this message translates to:
  /// **'写入'**
  String get writeTabWrite;

  /// No description provided for @writeTabClear.
  ///
  /// In zh, this message translates to:
  /// **'清除'**
  String get writeTabClear;

  /// No description provided for @writeModeTemp.
  ///
  /// In zh, this message translates to:
  /// **'暂时写入'**
  String get writeModeTemp;

  /// No description provided for @writeModeTempDesc.
  ///
  /// In zh, this message translates to:
  /// **'可以反复改写，适合自己用'**
  String get writeModeTempDesc;

  /// No description provided for @writeModePerm.
  ///
  /// In zh, this message translates to:
  /// **'永久写入'**
  String get writeModePerm;

  /// No description provided for @writeModePermDesc.
  ///
  /// In zh, this message translates to:
  /// **'写完锁定标签，任何人都无法改写'**
  String get writeModePermDesc;

  /// No description provided for @writeStart.
  ///
  /// In zh, this message translates to:
  /// **'开始写入'**
  String get writeStart;

  /// No description provided for @writeStartClear.
  ///
  /// In zh, this message translates to:
  /// **'开始清除'**
  String get writeStartClear;

  /// No description provided for @writeTapHint.
  ///
  /// In zh, this message translates to:
  /// **'点击后贴卡'**
  String get writeTapHint;

  /// No description provided for @writeHoldNear.
  ///
  /// In zh, this message translates to:
  /// **'把手机贴近卡片'**
  String get writeHoldNear;

  /// No description provided for @writeHoldCardNear.
  ///
  /// In zh, this message translates to:
  /// **'把卡片贴近手机'**
  String get writeHoldCardNear;

  /// No description provided for @writeWritten.
  ///
  /// In zh, this message translates to:
  /// **'已写入'**
  String get writeWritten;

  /// No description provided for @writeCleared.
  ///
  /// In zh, this message translates to:
  /// **'已清除'**
  String get writeCleared;

  /// No description provided for @writeTapAgainToStop.
  ///
  /// In zh, this message translates to:
  /// **'再点一下结束'**
  String get writeTapAgainToStop;

  /// No description provided for @writeTempFootnote.
  ///
  /// In zh, this message translates to:
  /// **'暂时写入 · 可反复改写'**
  String get writeTempFootnote;

  /// No description provided for @writePermFootnote.
  ///
  /// In zh, this message translates to:
  /// **'永久写入 · 锁定后不可改写'**
  String get writePermFootnote;

  /// No description provided for @writeStep1.
  ///
  /// In zh, this message translates to:
  /// **'选择暂时写入或永久写入'**
  String get writeStep1;

  /// No description provided for @writeStep2.
  ///
  /// In zh, this message translates to:
  /// **'把卡片靠近手机背部上方'**
  String get writeStep2;

  /// No description provided for @writeStep3.
  ///
  /// In zh, this message translates to:
  /// **'写完后可以继续贴下一张'**
  String get writeStep3;

  /// No description provided for @writeClearStep1.
  ///
  /// In zh, this message translates to:
  /// **'暂时写入的卡：清空后可以重新录入'**
  String get writeClearStep1;

  /// No description provided for @writeClearStep2.
  ///
  /// In zh, this message translates to:
  /// **'永久写入的卡：标签已锁定，清不掉'**
  String get writeClearStep2;

  /// No description provided for @writeClearStep3.
  ///
  /// In zh, this message translates to:
  /// **'开「同时作废」则这张卡彻底失效'**
  String get writeClearStep3;

  /// No description provided for @writeNoCards.
  ///
  /// In zh, this message translates to:
  /// **'还没有名片'**
  String get writeNoCards;

  /// No description provided for @writeCreateFirst.
  ///
  /// In zh, this message translates to:
  /// **'先创建一张名片'**
  String get writeCreateFirst;

  /// No description provided for @writeRevokeToo.
  ///
  /// In zh, this message translates to:
  /// **'同时作废这张卡'**
  String get writeRevokeToo;

  /// No description provided for @writeRevokeTooDesc.
  ///
  /// In zh, this message translates to:
  /// **'关掉 = 只清空标签，还能重新写入'**
  String get writeRevokeTooDesc;

  /// No description provided for @writeClearedNotice.
  ///
  /// In zh, this message translates to:
  /// **'标签已清空'**
  String get writeClearedNotice;

  /// No description provided for @writeClearedCanRewrite.
  ///
  /// In zh, this message translates to:
  /// **'可以切到「写入」重新录入这张卡'**
  String get writeClearedCanRewrite;

  /// No description provided for @writeClearedRewritten.
  ///
  /// In zh, this message translates to:
  /// **'这张卡同时已作废，先在「我的」里恢复才能重新使用'**
  String get writeClearedRewritten;

  /// No description provided for @writeRewriteThis.
  ///
  /// In zh, this message translates to:
  /// **'重新写入这张卡'**
  String get writeRewriteThis;

  /// No description provided for @writeRevoked.
  ///
  /// In zh, this message translates to:
  /// **'已作废'**
  String get writeRevoked;

  /// No description provided for @writeCardRevokedHint.
  ///
  /// In zh, this message translates to:
  /// **'这张卡已作废'**
  String get writeCardRevokedHint;

  /// No description provided for @writeClearImmediately.
  ///
  /// In zh, this message translates to:
  /// **'清除后这张卡立即失效'**
  String get writeClearImmediately;

  /// No description provided for @writeNfcUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'这台设备没有 NFC'**
  String get writeNfcUnavailable;

  /// No description provided for @writeTagUnsupported.
  ///
  /// In zh, this message translates to:
  /// **'这张卡不支持写入或已锁定'**
  String get writeTagUnsupported;

  /// No description provided for @writeTagLocked.
  ///
  /// In zh, this message translates to:
  /// **'这张卡已锁定，无法清除内容'**
  String get writeTagLocked;

  /// No description provided for @writeTagNoSupport.
  ///
  /// In zh, this message translates to:
  /// **'这张卡不支持清除'**
  String get writeTagNoSupport;

  /// No description provided for @writeNeedRealDevice.
  ///
  /// In zh, this message translates to:
  /// **'请用带 NFC 的安卓真机贴卡写入'**
  String get writeNeedRealDevice;

  /// No description provided for @templatesTitle.
  ///
  /// In zh, this message translates to:
  /// **'模板库'**
  String get templatesTitle;

  /// No description provided for @templatesCount.
  ///
  /// In zh, this message translates to:
  /// **'{n} 套'**
  String templatesCount(int n);

  /// No description provided for @templatesUse.
  ///
  /// In zh, this message translates to:
  /// **'使用这个模板'**
  String get templatesUse;

  /// No description provided for @templatesInUse.
  ///
  /// In zh, this message translates to:
  /// **'正在使用'**
  String get templatesInUse;

  /// No description provided for @templatesPro.
  ///
  /// In zh, this message translates to:
  /// **'PRO'**
  String get templatesPro;

  /// No description provided for @meTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get meTitle;

  /// No description provided for @meCards.
  ///
  /// In zh, this message translates to:
  /// **'张卡'**
  String get meCards;

  /// No description provided for @meTotalOpens.
  ///
  /// In zh, this message translates to:
  /// **'总打开'**
  String get meTotalOpens;

  /// No description provided for @meDays.
  ///
  /// In zh, this message translates to:
  /// **'使用天数'**
  String get meDays;

  /// No description provided for @meAccount.
  ///
  /// In zh, this message translates to:
  /// **'账号'**
  String get meAccount;

  /// No description provided for @meAccountEmail.
  ///
  /// In zh, this message translates to:
  /// **'账号邮箱'**
  String get meAccountEmail;

  /// No description provided for @mePlan.
  ///
  /// In zh, this message translates to:
  /// **'套餐'**
  String get mePlan;

  /// No description provided for @meDataScope.
  ///
  /// In zh, this message translates to:
  /// **'数据范围'**
  String get meDataScope;

  /// No description provided for @meDataScopeValue.
  ///
  /// In zh, this message translates to:
  /// **'仅本人可见'**
  String get meDataScopeValue;

  /// No description provided for @meTools.
  ///
  /// In zh, this message translates to:
  /// **'工具'**
  String get meTools;

  /// No description provided for @meTemplates.
  ///
  /// In zh, this message translates to:
  /// **'模板库'**
  String get meTemplates;

  /// No description provided for @meTemplatesValue.
  ///
  /// In zh, this message translates to:
  /// **'查看全部'**
  String get meTemplatesValue;

  /// No description provided for @meWriteLog.
  ///
  /// In zh, this message translates to:
  /// **'写卡记录'**
  String get meWriteLog;

  /// No description provided for @meExport.
  ///
  /// In zh, this message translates to:
  /// **'导出数据'**
  String get meExport;

  /// No description provided for @meOther.
  ///
  /// In zh, this message translates to:
  /// **'其他'**
  String get meOther;

  /// No description provided for @meHelp.
  ///
  /// In zh, this message translates to:
  /// **'帮助'**
  String get meHelp;

  /// No description provided for @meAbout.
  ///
  /// In zh, this message translates to:
  /// **'关于'**
  String get meAbout;

  /// No description provided for @meLogout.
  ///
  /// In zh, this message translates to:
  /// **'退出登录'**
  String get meLogout;

  /// No description provided for @mePrivacyNote.
  ///
  /// In zh, this message translates to:
  /// **'仅本人可见自己名片的数据'**
  String get mePrivacyNote;

  /// No description provided for @meLanguage.
  ///
  /// In zh, this message translates to:
  /// **'语言'**
  String get meLanguage;

  /// No description provided for @meLanguageSystem.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get meLanguageSystem;

  /// No description provided for @meLoggedIn.
  ///
  /// In zh, this message translates to:
  /// **'已登录'**
  String get meLoggedIn;

  /// No description provided for @commonCancel.
  ///
  /// In zh, this message translates to:
  /// **'取消'**
  String get commonCancel;

  /// No description provided for @commonConfirm.
  ///
  /// In zh, this message translates to:
  /// **'确定'**
  String get commonConfirm;

  /// No description provided for @commonRetry.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get commonRetry;

  /// No description provided for @commonUnknown.
  ///
  /// In zh, this message translates to:
  /// **'未知'**
  String get commonUnknown;

  /// No description provided for @commonDash.
  ///
  /// In zh, this message translates to:
  /// **'—'**
  String get commonDash;

  /// No description provided for @commonSearch.
  ///
  /// In zh, this message translates to:
  /// **'搜索'**
  String get commonSearch;
}

class _L10nDelegate extends LocalizationsDelegate<L10n> {
  const _L10nDelegate();

  @override
  Future<L10n> load(Locale locale) {
    return SynchronousFuture<L10n>(lookupL10n(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_L10nDelegate old) => false;
}

L10n lookupL10n(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return L10nEn();
    case 'zh':
      return L10nZh();
  }

  throw FlutterError(
    'L10n.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
