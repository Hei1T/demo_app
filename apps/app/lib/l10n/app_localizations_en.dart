// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class L10nEn extends L10n {
  L10nEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Card';

  @override
  String get navCards => 'Cards';

  @override
  String get navStats => 'Stats';

  @override
  String get navProfile => 'Profile';

  @override
  String get navWrite => 'Write';

  @override
  String get navMe => 'Me';

  @override
  String get greetNight => 'Late night';

  @override
  String get greetMorning => 'Good morning';

  @override
  String get greetAfternoon => 'Good afternoon';

  @override
  String get greetEvening => 'Good evening';

  @override
  String get greetYou => 'Hello';

  @override
  String get homeLoading => 'Reading your data';

  @override
  String homeTodayPeople(int n) {
    return '$n people met you today';
  }

  @override
  String get homeFetchFailed => 'Could not load';

  @override
  String get loginTitle => 'Every card\ndeserves to be remembered';

  @override
  String get loginEmail => 'Email';

  @override
  String get loginPassword => 'Password';

  @override
  String get loginEmailHint => 'you@company.com';

  @override
  String get loginPasswordHint => 'At least 8 characters';

  @override
  String get loginSubmit => 'Sign in';

  @override
  String get loginNoAccount => 'No account yet · Create one';

  @override
  String get loginHasAccount => 'Already have an account · Sign in';

  @override
  String get loginRegister => 'Sign up';

  @override
  String get loginName => 'Name';

  @override
  String get loginNameHint => 'What should we call you';

  @override
  String get loginIncomplete => 'Please fill in every field';

  @override
  String get loginFailed => 'Sign-in failed';

  @override
  String get homeTodayOpens => 'Opens today';

  @override
  String get homeVisitors => 'Visitors';

  @override
  String get homeClickRate => 'Click rate';

  @override
  String get homeMyCards => 'My cards';

  @override
  String get homeOtherCards => 'Other cards';

  @override
  String homeAllCardsShort(int n) {
    return '$n';
  }

  @override
  String get homeRecent => 'Recent activity';

  @override
  String get homeNoViews => 'Nobody has opened your card yet';

  @override
  String homeTimes(int n) {
    return '$n times';
  }

  @override
  String get homeNoCards => 'No cards yet';

  @override
  String get homeNoCardsHint => 'Create your first card\nand write it to a tag';

  @override
  String get homeOpensLabel => 'OPENS';

  @override
  String get homeVisitorsLabel => 'VISITORS';

  @override
  String get homeCtrLabel => 'CLICK RATE';

  @override
  String get homeUnknown => 'Untitled';

  @override
  String get revokeTitle => 'Revoke this card';

  @override
  String get restoreTitle => 'Restore this card';

  @override
  String get revokeHint =>
      'Every entry point stops working. Only you can restore it';

  @override
  String get restoreHint => 'The short link works again';

  @override
  String get revokeConfirmTitle => 'Revoke this card?';

  @override
  String get revokeConfirmBody =>
      'Once revoked, scanning this NFC card shows only \"Card revoked\".\n\nOnly you can restore it. Other phones, NFC Tools, any entry point — none of them can see the card content.';

  @override
  String get revokeDone => 'Revoked. The short link is dead.';

  @override
  String get revokeAction => 'Revoke';

  @override
  String get actOpenCard => 'Someone opened your card';

  @override
  String get actSaveContact => 'Someone saved your contact';

  @override
  String get actSocialLink => 'Someone tapped a social link';

  @override
  String get actDirections => 'Someone opened your location';

  @override
  String get actEmail => 'Someone emailed you';

  @override
  String get actCopyWechat => 'Someone copied your WeChat';

  @override
  String get actCall => 'Someone called you';

  @override
  String get statsLabel => 'CARD ANALYTICS';

  @override
  String get statsTitle => 'Analytics';

  @override
  String get statsRangeToday => 'Today';

  @override
  String get statsRange7 => '7 days';

  @override
  String get statsRange30 => '30 days';

  @override
  String get statsOpens => 'Opens';

  @override
  String get statsUniqueVisitors => 'Visitors';

  @override
  String get statsClickRate => 'Click rate';

  @override
  String get statsAvgDwell => 'Avg. time';

  @override
  String get statsFunnel => 'Conversion funnel';

  @override
  String get statsFunnelOpened => 'Opened';

  @override
  String get statsFunnelSaw => 'Viewed';

  @override
  String get statsFunnelTapped => 'Tapped';

  @override
  String get statsFunnelSaved => 'Saved';

  @override
  String get statsTrend => 'Daily trend';

  @override
  String get statsPerCard => 'Per card';

  @override
  String statsSeeAll(int n) {
    return 'All $n';
  }

  @override
  String get statsInteractions => 'What visitors did';

  @override
  String get statsCities => 'Where visitors are';

  @override
  String get statsDevices => 'Device';

  @override
  String get statsSources => 'Source';

  @override
  String get statsRecentVisitors => 'Recent visitors';

  @override
  String get statsHours => 'When it gets opened';

  @override
  String get statsEmpty => 'No data in this period';

  @override
  String get statsSearchHint => 'Search name or code';

  @override
  String get statsAllCards => 'All cards';

  @override
  String statsTotalCards(int n) {
    return '$n cards';
  }

  @override
  String get statsLoading => 'Loading';

  @override
  String get statsTapCardHint => 'Tap a card for details';

  @override
  String get actionSaveContact => 'Contact';

  @override
  String get actionSocialLink => 'Social link';

  @override
  String get actionDirections => 'Map';

  @override
  String get actionEmail => 'Email';

  @override
  String get actionCopyWechat => 'WeChat';

  @override
  String get actionCall => 'Call';

  @override
  String funnelHint(int tap) {
    return '$tap of every 100 tapped contact';
  }

  @override
  String trendBest(String date, int n) {
    return 'Best on $date: $n opens';
  }

  @override
  String interactionLead(String name, int n) {
    return '$name leads with $n';
  }

  @override
  String hourPeak(int h, int n) {
    return 'Busiest around $h:00, $n opens';
  }

  @override
  String get profileTitle => 'My profile';

  @override
  String get profileSubtitle => 'One profile, one template, every card';

  @override
  String get profileCompletion => 'Complete';

  @override
  String get profileBasics => 'Basics';

  @override
  String get profileContact => 'Contact';

  @override
  String get profileSocial => 'Social';

  @override
  String get profileTemplate => 'Template';

  @override
  String get profileName => 'Name';

  @override
  String get profileRole => 'Role';

  @override
  String get profileOrg => 'Company';

  @override
  String get profilePhone => 'Phone';

  @override
  String get profileEmail => 'Email';

  @override
  String get profileWechat => 'WeChat ID';

  @override
  String get profileWebsite => 'Website';

  @override
  String get profileBio => 'One-line intro';

  @override
  String get profileSave => 'Save';

  @override
  String get profileSaved => 'Saved. Every card updated.';

  @override
  String get profileNameRequired => 'Please enter a name';

  @override
  String get profileFullPreview => 'Full preview';

  @override
  String get profileAddSocial => 'Add a platform';

  @override
  String get profilePreviewTitle => 'Current template';

  @override
  String get writeLabel => 'WRITE CARD';

  @override
  String get writeTitle => 'Write';

  @override
  String get writeClearTitle => 'Clear';

  @override
  String get writeClearLabel => 'CLEAR CARD';

  @override
  String get writeTabWrite => 'Write';

  @override
  String get writeTabClear => 'Clear';

  @override
  String get writeModeTemp => 'Temporary';

  @override
  String get writeModeTempDesc => 'Can be rewritten any time';

  @override
  String get writeModePerm => 'Permanent';

  @override
  String get writeModePermDesc => 'Locks the tag, nobody can rewrite it';

  @override
  String get writeStart => 'Start writing';

  @override
  String get writeStartClear => 'Start clearing';

  @override
  String get writeTapHint => 'Hold to the card';

  @override
  String get writeHoldNear => 'Hold your phone to the card';

  @override
  String get writeHoldCardNear => 'Hold the card to your phone';

  @override
  String get writeWritten => 'written';

  @override
  String get writeCleared => 'cleared';

  @override
  String get writeTapAgainToStop => 'Tap again to stop';

  @override
  String get writeTempFootnote => 'Temporary · can be rewritten';

  @override
  String get writePermFootnote => 'Permanent · locked for good';

  @override
  String get writeStep1 => 'Choose temporary or permanent';

  @override
  String get writeStep2 => 'Hold the card to the back of your phone';

  @override
  String get writeStep3 => 'Keep going to write the next card';

  @override
  String get writeClearStep1 =>
      'Temporary cards can be rewritten after clearing';

  @override
  String get writeClearStep2 =>
      'Permanent cards are locked and cannot be cleared';

  @override
  String get writeClearStep3 => 'Revoking kills the card for good';

  @override
  String get writeNoCards => 'No cards yet';

  @override
  String get writeCreateFirst => 'Create a card first';

  @override
  String get writeRevokeToo => 'Revoke this card too';

  @override
  String get writeRevokeTooDesc => 'Off = tag cleared only, still rewritable';

  @override
  String get writeClearedNotice => 'Tag cleared';

  @override
  String get writeClearedCanRewrite =>
      'Switch to Write to record this card again';

  @override
  String get writeClearedRewritten =>
      'This card is also revoked. Restore it in Me first';

  @override
  String get writeRewriteThis => 'Record this card again';

  @override
  String get writeRevoked => 'Revoked';

  @override
  String get writeCardRevokedHint => 'This card is revoked';

  @override
  String get writeClearImmediately => 'Clearing kills this card immediately';

  @override
  String get writeNfcUnavailable => 'This device has no NFC';

  @override
  String get writeTagUnsupported => 'This tag is not writable or is locked';

  @override
  String get writeTagLocked => 'This tag is locked and cannot be cleared';

  @override
  String get writeTagNoSupport => 'This tag cannot be cleared';

  @override
  String get writeNeedRealDevice => 'Use a real Android phone with NFC';

  @override
  String get templatesTitle => 'Templates';

  @override
  String templatesCount(int n) {
    return '$n templates';
  }

  @override
  String get templatesUse => 'Use this template';

  @override
  String get templatesInUse => 'In use';

  @override
  String get templatesPro => 'PRO';

  @override
  String get meTitle => 'Me';

  @override
  String get meCards => 'Cards';

  @override
  String get meTotalOpens => 'Total opens';

  @override
  String get meDays => 'Days';

  @override
  String get meAccount => 'Account';

  @override
  String get meAccountEmail => 'Account email';

  @override
  String get mePlan => 'Plan';

  @override
  String get meDataScope => 'Data scope';

  @override
  String get meDataScopeValue => 'Only you can see it';

  @override
  String get meTools => 'Tools';

  @override
  String get meTemplates => 'Templates';

  @override
  String get meTemplatesValue => 'View all';

  @override
  String get meWriteLog => 'Write history';

  @override
  String get meExport => 'Export data';

  @override
  String get meOther => 'Other';

  @override
  String get meHelp => 'Help';

  @override
  String get meAbout => 'About';

  @override
  String get meLogout => 'Sign out';

  @override
  String get mePrivacyNote => 'Only you can see your own card data';

  @override
  String get meLanguage => 'Language';

  @override
  String get meLanguageSystem => 'Follow system';

  @override
  String get meLoggedIn => 'Signed in';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonConfirm => 'OK';

  @override
  String get commonRetry => 'Retry';

  @override
  String get commonUnknown => 'Unknown';

  @override
  String get commonDash => '—';

  @override
  String get commonSearch => 'Search';
}
