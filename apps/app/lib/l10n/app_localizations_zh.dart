// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class L10nZh extends L10n {
  L10nZh([String locale = 'zh']) : super(locale);

  @override
  String get appName => '名片';

  @override
  String get navCards => '名片';

  @override
  String get navStats => '数据';

  @override
  String get navProfile => '资料';

  @override
  String get navWrite => '写卡';

  @override
  String get navMe => '我的';

  @override
  String get greetNight => '夜深了';

  @override
  String get greetMorning => '早上好';

  @override
  String get greetAfternoon => '下午好';

  @override
  String get greetEvening => '晚上好';

  @override
  String get greetYou => '你好';

  @override
  String get homeLoading => '正在读取你的数据';

  @override
  String homeTodayPeople(int n) {
    return '今天 $n 个人认识了你';
  }

  @override
  String get homeFetchFailed => '读取失败';

  @override
  String get loginTitle => '每一张名片\n都值得被记住';

  @override
  String get loginEmail => '邮箱';

  @override
  String get loginPassword => '密码';

  @override
  String get loginEmailHint => 'you@company.com';

  @override
  String get loginPasswordHint => '至少 8 位';

  @override
  String get loginSubmit => '登录';

  @override
  String get loginNoAccount => '还没有账号 · 创建一个';

  @override
  String get loginHasAccount => '已有账号 · 去登录';

  @override
  String get loginRegister => '注册';

  @override
  String get loginName => '姓名';

  @override
  String get loginNameHint => '怎么称呼你';

  @override
  String get loginIncomplete => '请填写完整信息';

  @override
  String get loginFailed => '登录失败';

  @override
  String get homeTodayOpens => '今天打开';

  @override
  String get homeVisitors => '访客';

  @override
  String get homeClickRate => '点击率';

  @override
  String get homeMyCards => '我的名片';

  @override
  String get homeOtherCards => '其他名片';

  @override
  String homeAllCardsShort(int n) {
    return '$n 张';
  }

  @override
  String get homeRecent => '最近动态';

  @override
  String get homeNoViews => '还没有人看过你的名片';

  @override
  String homeTimes(int n) {
    return '共 $n 次';
  }

  @override
  String get homeNoCards => '还没有名片';

  @override
  String get homeNoCardsHint => '创建第一张名片\n写进卡片里';

  @override
  String get homeOpensLabel => '打 开';

  @override
  String get homeVisitorsLabel => '访 客';

  @override
  String get homeCtrLabel => '点 击 率';

  @override
  String get homeUnknown => '未命名';

  @override
  String get revokeTitle => '作废这张卡';

  @override
  String get restoreTitle => '恢复这张卡';

  @override
  String get revokeHint => '作废后所有入口失效，只有你能恢复';

  @override
  String get restoreHint => '恢复后短链重新可用';

  @override
  String get revokeConfirmTitle => '确认作废？';

  @override
  String get revokeConfirmBody =>
      '作废后，这张 NFC 卡扫开只会显示「名片已作废」。\n\n只有你能恢复。别人的手机、NFC Tools、任何入口都看不到名片内容。';

  @override
  String get revokeDone => '已作废，短链立即失效';

  @override
  String get revokeAction => '作废';

  @override
  String get actOpenCard => '有人打开了你的名片';

  @override
  String get actSaveContact => '有人保存了你的联系人';

  @override
  String get actSocialLink => '有人点了你的社交链接';

  @override
  String get actDirections => '有人查看了你的位置';

  @override
  String get actEmail => '有人给你发了邮件';

  @override
  String get actCopyWechat => '有人复制了你的微信';

  @override
  String get actCall => '有人拨打了你的电话';

  @override
  String get statsLabel => '名片数据';

  @override
  String get statsTitle => '数据';

  @override
  String get statsRangeToday => '今天';

  @override
  String get statsRange7 => '近 7 天';

  @override
  String get statsRange30 => '近 30 天';

  @override
  String get statsOpens => '打开次数';

  @override
  String get statsUniqueVisitors => '访客';

  @override
  String get statsClickRate => '点击率';

  @override
  String get statsAvgDwell => '平均停留';

  @override
  String get statsFunnel => '转化漏斗';

  @override
  String get statsFunnelOpened => '打开';

  @override
  String get statsFunnelSaw => '浏览';

  @override
  String get statsFunnelTapped => '点击';

  @override
  String get statsFunnelSaved => '保存';

  @override
  String get statsTrend => '每日趋势';

  @override
  String get statsPerCard => '每张卡的数据';

  @override
  String statsSeeAll(int n) {
    return '全部 $n 张';
  }

  @override
  String get statsInteractions => '访客做了什么';

  @override
  String get statsCities => '访客来自';

  @override
  String get statsDevices => '设备';

  @override
  String get statsSources => '来源';

  @override
  String get statsRecentVisitors => '最近访客';

  @override
  String get statsHours => '什么时候被打开';

  @override
  String get statsEmpty => '这段时间还没有数据';

  @override
  String get statsSearchHint => '搜索姓名或短码';

  @override
  String get statsAllCards => '全部卡片';

  @override
  String statsTotalCards(int n) {
    return '共 $n 张';
  }

  @override
  String get statsLoading => '加载中';

  @override
  String get statsTapCardHint => '点开看单张卡的明细';

  @override
  String get actionSaveContact => '存联系人';

  @override
  String get actionSocialLink => '社交';

  @override
  String get actionDirections => '导航';

  @override
  String get actionEmail => '发邮件';

  @override
  String get actionCopyWechat => '微信';

  @override
  String get actionCall => '打电话';

  @override
  String funnelHint(int tap) {
    return '每 100 人打开，$tap 人点联系方式';
  }

  @override
  String trendBest(String date, int n) {
    return '$date 最好，$n 次打开';
  }

  @override
  String interactionLead(String name, int n) {
    return '$name 最多，共 $n 次';
  }

  @override
  String hourPeak(int h, int n) {
    return '$h 点前后最活跃，$n 次打开';
  }

  @override
  String get profileTitle => '我的资料';

  @override
  String get profileSubtitle => '一份资料 + 一个模板，所有短链卡片共用';

  @override
  String get profileCompletion => '完成度';

  @override
  String get profileBasics => '基础信息';

  @override
  String get profileContact => '联系方式';

  @override
  String get profileSocial => '社交平台';

  @override
  String get profileTemplate => '模板';

  @override
  String get profileName => '姓名';

  @override
  String get profileRole => '职位';

  @override
  String get profileOrg => '公司';

  @override
  String get profilePhone => '电话';

  @override
  String get profileEmail => '邮箱';

  @override
  String get profileWechat => '微信号';

  @override
  String get profileWebsite => '网站';

  @override
  String get profileBio => '一句话介绍';

  @override
  String get profileSave => '保存';

  @override
  String get profileSaved => '已保存，所有卡片同步更新';

  @override
  String get profileNameRequired => '请填写姓名';

  @override
  String get profileFullPreview => '全屏预览';

  @override
  String get profileAddSocial => '添加社交平台';

  @override
  String get profilePreviewTitle => '当前模板';

  @override
  String get writeLabel => '写入卡片';

  @override
  String get writeTitle => '写卡';

  @override
  String get writeClearTitle => '清除';

  @override
  String get writeClearLabel => '清除卡片';

  @override
  String get writeTabWrite => '写入';

  @override
  String get writeTabClear => '清除';

  @override
  String get writeModeTemp => '暂时写入';

  @override
  String get writeModeTempDesc => '可以反复改写，适合自己用';

  @override
  String get writeModePerm => '永久写入';

  @override
  String get writeModePermDesc => '写完锁定标签，任何人都无法改写';

  @override
  String get writeStart => '开始写入';

  @override
  String get writeStartClear => '开始清除';

  @override
  String get writeTapHint => '点击后贴卡';

  @override
  String get writeHoldNear => '把手机贴近卡片';

  @override
  String get writeHoldCardNear => '把卡片贴近手机';

  @override
  String get writeWritten => '已写入';

  @override
  String get writeCleared => '已清除';

  @override
  String get writeTapAgainToStop => '再点一下结束';

  @override
  String get writeTempFootnote => '暂时写入 · 可反复改写';

  @override
  String get writePermFootnote => '永久写入 · 锁定后不可改写';

  @override
  String get writeStep1 => '选择暂时写入或永久写入';

  @override
  String get writeStep2 => '把卡片靠近手机背部上方';

  @override
  String get writeStep3 => '写完后可以继续贴下一张';

  @override
  String get writeClearStep1 => '暂时写入的卡：清空后可以重新录入';

  @override
  String get writeClearStep2 => '永久写入的卡：标签已锁定，清不掉';

  @override
  String get writeClearStep3 => '开「同时作废」则这张卡彻底失效';

  @override
  String get writeNoCards => '还没有名片';

  @override
  String get writeCreateFirst => '先创建一张名片';

  @override
  String get writeRevokeToo => '同时作废这张卡';

  @override
  String get writeRevokeTooDesc => '关掉 = 只清空标签，还能重新写入';

  @override
  String get writeClearedNotice => '标签已清空';

  @override
  String get writeClearedCanRewrite => '可以切到「写入」重新录入这张卡';

  @override
  String get writeClearedRewritten => '这张卡同时已作废，先在「我的」里恢复才能重新使用';

  @override
  String get writeRewriteThis => '重新写入这张卡';

  @override
  String get writeRevoked => '已作废';

  @override
  String get writeCardRevokedHint => '这张卡已作废';

  @override
  String get writeClearImmediately => '清除后这张卡立即失效';

  @override
  String get writeNfcUnavailable => '这台设备没有 NFC';

  @override
  String get writeTagUnsupported => '这张卡不支持写入或已锁定';

  @override
  String get writeTagLocked => '这张卡已锁定，无法清除内容';

  @override
  String get writeTagNoSupport => '这张卡不支持清除';

  @override
  String get writeNeedRealDevice => '请用带 NFC 的安卓真机贴卡写入';

  @override
  String get templatesTitle => '模板库';

  @override
  String templatesCount(int n) {
    return '$n 套';
  }

  @override
  String get templatesUse => '使用这个模板';

  @override
  String get templatesInUse => '正在使用';

  @override
  String get templatesPro => 'PRO';

  @override
  String get meTitle => '我的';

  @override
  String get meCards => '张卡';

  @override
  String get meTotalOpens => '总打开';

  @override
  String get meDays => '使用天数';

  @override
  String get meAccount => '账号';

  @override
  String get meAccountEmail => '账号邮箱';

  @override
  String get mePlan => '套餐';

  @override
  String get meDataScope => '数据范围';

  @override
  String get meDataScopeValue => '仅本人可见';

  @override
  String get meTools => '工具';

  @override
  String get meTemplates => '模板库';

  @override
  String get meTemplatesValue => '查看全部';

  @override
  String get meWriteLog => '写卡记录';

  @override
  String get meExport => '导出数据';

  @override
  String get meOther => '其他';

  @override
  String get meHelp => '帮助';

  @override
  String get meAbout => '关于';

  @override
  String get meLogout => '退出登录';

  @override
  String get mePrivacyNote => '仅本人可见自己名片的数据';

  @override
  String get meLanguage => '语言';

  @override
  String get meLanguageSystem => '跟随系统';

  @override
  String get meLoggedIn => '已登录';

  @override
  String get commonCancel => '取消';

  @override
  String get commonConfirm => '确定';

  @override
  String get commonRetry => '重试';

  @override
  String get commonUnknown => '未知';

  @override
  String get commonDash => '—';

  @override
  String get commonSearch => '搜索';
}
