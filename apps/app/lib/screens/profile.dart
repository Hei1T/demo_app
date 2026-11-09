import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../i18n.dart';
import '../l10n/app_localizations.dart';
import '../widgets/card_face.dart';
import '../widgets/social_editor.dart';

/// 我的资料 = 一份资料 + 一个模板，所有短链卡片共用
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loading = true;
  bool _saving = false;
  String _template = 'noir';
  List<Map<String, dynamic>> _templates = [];
  List<Map<String, String>> _links = [];

  final _name = TextEditingController();
  final _role = TextEditingController();
  final _org = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _wechat = TextEditingController();
  final _website = TextEditingController();
  final _bio = TextEditingController();

  Map<String, dynamic> get _preview => {
        'name': _name.text.isEmpty ? '·' : _name.text,
        'role': _role.text,
        'org': _org.text,
      };

  @override
  void initState() {
    super.initState();
    for (final c in [
      _name,
      _role,
      _org,
      _phone,
      _email,
      _wechat,
      _website,
      _bio
    ]) {
      c.addListener(() {
        if (mounted) setState(() {});
      });
    }
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([Api.myCards(size: 1), Api.templates()]);
      final cards = results[0] as List<dynamic>;
      final tpls = (results[1] as List<dynamic>)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      final links = <Map<String, String>>[];

      if (cards.isNotEmpty) {
        final c = cards.first as Map<String, dynamic>;
        _template = (c['templateSlug'] ?? 'noir') as String;
        final p = (c['profile'] ?? {}) as Map<String, dynamic>;
        _name.text = (p['name'] ?? '') as String;
        _role.text = (p['role'] ?? '') as String;
        _org.text = (p['org'] ?? '') as String;
        _phone.text = (p['phone'] ?? '') as String;
        _email.text = (p['email'] ?? '') as String;
        _wechat.text = (p['wechat'] ?? '') as String;
        _website.text = (p['website'] ?? '') as String;
        _bio.text = (p['bio'] ?? '') as String;
        final lk = p['links'];
        if (lk is List) {
          for (final e in lk) {
            if (e is Map) {
              final platform = (e['platform'] ?? '').toString();
              if (platform.isNotEmpty) {
                links.add({
                  'platform': platform,
                  'value': (e['value'] ?? '').toString(),
                });
              }
            }
          }
        }
      }
      setState(() {
        _templates = tpls;
        _links = links;
      });
    } catch (_) {
      setState(() => _templates = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _payload() => {
        'name': _name.text.trim(),
        'role': _role.text.trim(),
        'org': _org.text.trim(),
        'phone': _phone.text.trim(),
        'email': _email.text.trim(),
        'bio': _bio.text.trim(),
        'website': _website.text.trim(),
        'wechat': _wechat.text.trim(),
        'links': _links,
      };

  Future<void> _save(L10n l) async {
    if (_name.text.trim().isEmpty) {
      _toast(l.profileNameRequired);
      return;
    }
    setState(() => _saving = true);
    try {
      final cards = await Api.myCards(size: 1);
      if (cards.isEmpty) {
        await Api.createCard(
          name: _name.text.trim(),
          role: _role.text.trim(),
          org: _org.text.trim(),
          phone: _phone.text.trim(),
          email: _email.text.trim(),
          bio: _bio.text.trim(),
          website: _website.text.trim(),
          wechat: _wechat.text.trim(),
          links: _links,
          templateSlug: _template,
        );
      } else {
        await Api.bulkUpdateProfile(_payload(), _template);
      }
      if (!mounted) return;
      await Api.refreshMe();
      _toast(l.profileSaved);
      Navigator.of(context).pop(true);
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  int get _filledCount => [
        _name.text.isNotEmpty,
        _role.text.isNotEmpty,
        _org.text.isNotEmpty,
        _phone.text.isNotEmpty,
        _email.text.isNotEmpty,
        _wechat.text.isNotEmpty,
        _website.text.isNotEmpty,
        _bio.text.isNotEmpty,
        _links.isNotEmpty,
        _template.isNotEmpty,
      ].where((e) => e).length;

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(
                    color: C.white, strokeWidth: 2))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(6, 10, 22, 10),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          behavior: HitTestBehavior.opaque,
                          child: const Padding(
                            padding: EdgeInsets.all(8),
                            child: AppIcon(AppIco.back,
                                size: 18, color: C.text),
                          ),
                        ),
                        Expanded(
                          child: Text(l.profileTitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Ts.title),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      padding:
                          const EdgeInsetsDirectional.fromSTEB(22, 0, 22, 30),
                      children: [
                        Text(l.profileSubtitle, style: Ts.secondary),
                        const SizedBox(height: 18),

                        GestureDetector(
                          onTap: () => _openPreview(
                            _template,
                            _templates
                                    .where((e) => e['id'] == _template)
                                    .map((e) =>
                                        (e['name'] ?? _template) as String)
                                    .firstOrNull ??
                                _template,
                          ),
                          child: SizedBox(
                            height: 196,
                            child: Stack(
                              children: [
                                Positioned.fill(
                                  child: CardFace(
                                    profile: _preview,
                                    templateSlug: _template,
                                  ),
                                ),
                                Positioned(
                                  right: 10,
                                  bottom: 10,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color:
                                          Colors.black.withValues(alpha: .5),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(l.profileFullPreview,
                                        style: const TextStyle(
                                            fontSize: T.caption,
                                            color: Colors.white)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),
                        _completion(l, _filledCount),

                        SectionHead(title: l.profileBasics),
                        UnderlineField(
                            label: l.profileName, hint: '', controller: _name),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                                child: UnderlineField(
                                    label: l.profileRole,
                                    hint: '',
                                    controller: _role)),
                            const SizedBox(width: 16),
                            Expanded(
                                child: UnderlineField(
                                    label: l.profileOrg,
                                    hint: '',
                                    controller: _org)),
                          ],
                        ),

                        SectionHead(title: l.profileContact),
                        UnderlineField(
                            label: l.profilePhone,
                            hint: '',
                            controller: _phone,
                            keyboardType: TextInputType.phone),
                        const SizedBox(height: 18),
                        UnderlineField(
                            label: l.profileEmail,
                            hint: '',
                            controller: _email,
                            keyboardType: TextInputType.emailAddress),
                        const SizedBox(height: 18),
                        UnderlineField(
                            label: l.profileWechat,
                            hint: '',
                            controller: _wechat),
                        const SizedBox(height: 18),
                        UnderlineField(
                            label: l.profileWebsite,
                            hint: '',
                            controller: _website,
                            keyboardType: TextInputType.url),
                        const SizedBox(height: 18),
                        UnderlineField(
                            label: l.profileBio, hint: '', controller: _bio),

                        SectionHead(title: l.profileSocial),
                        SocialEditor(
                          links: _links,
                          onChanged: (v) => setState(() => _links = v),
                        ),

                        SectionHead(title: l.profileTemplate),
                        SizedBox(
                          height: 118,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _templates.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (_, i) {
                              final t = _templates[i];
                              final slug = (t['id'] ?? 'noir') as String;
                              final on = slug == _template;
                              final pro = t['tier'] == 'pro';
                              return GestureDetector(
                                onTap: () => _openPreview(
                                    slug, (t['name'] ?? slug) as String),
                                child: Column(
                                  children: [
                                    Container(
                                      width: 90,
                                      height: 90,
                                      padding: const EdgeInsets.all(2),
                                      decoration: BoxDecoration(
                                        borderRadius:
                                            BorderRadius.circular(14),
                                        border: Border.all(
                                            color: on
                                                ? C.white
                                                : Colors.transparent,
                                            width: 2),
                                      ),
                                      child: Stack(
                                        children: [
                                          Positioned.fill(
                                            child: CardFace(
                                              profile: _preview,
                                              templateSlug: slug,
                                              compact: true,
                                            ),
                                          ),
                                          if (pro)
                                            Positioned(
                                              right: 4,
                                              top: 4,
                                              child: Container(
                                                padding:
                                                    const EdgeInsets
                                                        .symmetric(
                                                        horizontal: 4,
                                                        vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: Colors.black
                                                      .withValues(alpha: .5),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                ),
                                                child: const Text('PRO',
                                                    style: TextStyle(
                                                        fontSize: 9,
                                                        color: Colors.white)),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 7),
                                    Text((t['name'] ?? slug) as String,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                            fontSize: T.caption,
                                            color: on ? C.text : C.faint)),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                    ),
                  ),
                  Container(
                    padding: EdgeInsetsDirectional.fromSTEB(
                        22, 12, 22, 12 + MediaQuery.of(context).padding.bottom),
                    decoration: const BoxDecoration(
                      color: C.ground,
                      border: Border(top: BorderSide(color: C.line)),
                    ),
                    child: PrimaryButton(
                        text: l.profileSave,
                        loading: _saving,
                        onTap: () => _save(l)),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _completion(L10n l, int filled) {
    return Row(
      children: [
        Text(l.profileCompletion, style: Ts.secondary),
        const SizedBox(width: 12),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: Container(
              height: 4,
              color: C.raised,
              alignment: AlignmentDirectional.centerStart,
              child: FractionallySizedBox(
                widthFactor: filled / 10,
                child: Container(color: C.white),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text('$filled/10', style: Ts.secondary),
      ],
    );
  }

  Future<void> _openPreview(String slug, String name) async {
    final picked = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => _TemplatePreviewPage(
          slug: slug,
          name: name,
          inUse: slug == _template,
        ),
      ),
    );
    if (picked != null && mounted) {
      setState(() => _template = picked);
    }
  }
}

/// 全屏模板预览（WebView 渲染后端真实名片页）
class _TemplatePreviewPage extends StatefulWidget {
  final String slug;
  final String name;
  final bool inUse;
  const _TemplatePreviewPage({
    required this.slug,
    required this.name,
    required this.inUse,
  });
  @override
  State<_TemplatePreviewPage> createState() => _TemplatePreviewPageState();
}

class _TemplatePreviewPageState extends State<_TemplatePreviewPage> {
  late final WebViewController _web;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.disabled)
      ..setBackgroundColor(C.ground)
      ..loadRequest(Uri.parse('$kApiBase/preview/${widget.slug}'));
  }

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    return Scaffold(
      backgroundColor: C.ground,
      body: SizedBox.expand(
        child: Stack(
          children: [
            Positioned.fill(child: WebViewWidget(controller: _web)),
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 16, 0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: .55),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(widget.name,
                            style: const TextStyle(
                                fontSize: T.secondary,
                                color: Colors.white,
                                letterSpacing: 0.1)),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.black.withValues(alpha: .55),
                          ),
                          child: const AppIcon(AppIco.close,
                              size: 20, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: MediaQuery.of(context).padding.bottom + 18,
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(widget.slug),
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: C.white,
                    borderRadius: BorderRadius.circular(25),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    widget.inUse ? l.templatesInUse : l.templatesUse,
                    style: const TextStyle(
                        fontSize: T.body2,
                        color: C.onWhite,
                        letterSpacing: 0.1,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
