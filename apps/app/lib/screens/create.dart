import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../widgets/app_icons.dart';
import '../i18n.dart';
import '../l10n/app_localizations.dart';
import '../widgets/card_face.dart';
import '../widgets/social_editor.dart';

class CreateScreen extends StatefulWidget {
  const CreateScreen({super.key});
  @override
  State<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends State<CreateScreen> {
  final _name = TextEditingController();
  final _role = TextEditingController();
  final _org = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _bio = TextEditingController();
  final _website = TextEditingController();
  final _wechat = TextEditingController();
  List<Map<String, String>> _links = [];

  String _template = 'noir';
  bool _busy = false;
  bool _loadingTemplates = true;
  List<dynamic> _templates = [];

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    try {
      final t = await Api.templates();
      setState(() {
        _templates = t;
        if (t.isNotEmpty) {
          _template = ((t.first as Map)['id'] ?? 'noir') as String;
        }
      });
    } catch (_) {
      setState(() => _templates = []);
    } finally {
      if (mounted) setState(() => _loadingTemplates = false);
    }
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      _toast('name required');
      return;
    }
    setState(() => _busy = true);
    try {
      final created = await Api.createCard(
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
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      _toast(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    final l = L10n.of(context);
    final preview = {
      'name': _name.text.isEmpty ? 'your name' : _name.text,
      'role': _role.text,
      'org': _org.text,
    };

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 固定头部
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(8, 10, 20, 10),
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
                  Text(l.profileTitle, style: Ts.title),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 20, 40),
                children: [
            Text(l.profileSubtitle,
                style: Ts.body2.copyWith(color: C.muted)),
          const SizedBox(height: 24),

          // 实时预览
          SizedBox(
            height: 120,
            child: CardFace(profile: preview, templateSlug: _template),
          ),
          const SizedBox(height: 28),

          UnderlineField(label: l.profileName, hint: '', controller: _name),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                  child: UnderlineField(
                      label: l.profileRole, hint: '', controller: _role)),
              const SizedBox(width: 20),
              Expanded(
                  child: UnderlineField(
                      label: l.profileOrg, hint: '', controller: _org)),
            ],
          ),
          const SizedBox(height: 24),
          UnderlineField(
              label: l.profilePhone,
              hint: '138 0000 0000',
              controller: _phone,
              keyboardType: TextInputType.phone),
          const SizedBox(height: 24),
          UnderlineField(
              label: l.profileEmail,
              hint: 'you@company.com',
              controller: _email,
              keyboardType: TextInputType.emailAddress),

          const SizedBox(height: 24),
          UnderlineField(
              label: l.profileWechat, hint: '', controller: _wechat),
          const SizedBox(height: 24),
          UnderlineField(
              label: l.profileWebsite,
              hint: 'https://your.site',
              controller: _website,
              keyboardType: TextInputType.url),
          const SizedBox(height: 24),
          UnderlineField(
              label: l.profileBio,
              hint: '',
              controller: _bio),

          const SizedBox(height: 36),
          SectionHead(title: l.profileSocial),
          const SizedBox(height: 8),
          Text('',
              style: Ts.secondary.copyWith(fontSize: 13)),
          const SizedBox(height: 18),
          SocialEditor(
            links: _links,
            onChanged: (v) => setState(() => _links = v),
          ),

          const SizedBox(height: 36),
          SectionHead(title: l.profileTemplate),
          const SizedBox(height: 16),

          if (_loadingTemplates)
            const Center(
                child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(color: C.white, strokeWidth: 2),
            ))
          else
            SizedBox(
              height: 150,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _templates.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) {
                  final t = _templates[i] as Map<String, dynamic>;
                  final slug = (t['id'] ?? t['slug'] ?? 'noir') as String;
                  final on = slug == _template;
                  return GestureDetector(
                    onTap: () => setState(() => _template = slug),
                    child: Column(
                      children: [
                        Container(
                          width: 100,
                          height: 124,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: on ? C.white : Colors.transparent,
                                width: 2),
                          ),
                          padding: const EdgeInsets.all(2),
                          child: CardFace(
                            profile: preview,
                            templateSlug: slug,
                            compact: true,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          (t['name'] ?? slug) as String,
                          style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 0.2,
                            color: on ? C.white : C.muted,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

          const SizedBox(height: 36),
          PrimaryButton(text: l.profileSave, loading: _busy, onTap: _submit),
          ],
            ),
          ),
        ],
          ),
      ),
    );
  }
}
