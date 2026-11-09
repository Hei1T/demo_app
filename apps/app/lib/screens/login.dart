import 'package:flutter/material.dart';
import '../api.dart';
import '../theme.dart';
import '../l10n/app_localizations.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  final _name = TextEditingController();
  bool _register = false;
  bool _busy = false;

  Future<void> _submit(L10n l) async {
    final email = _email.text.trim();
    final pass = _pass.text;
    if (email.isEmpty ||
        pass.isEmpty ||
        (_register && _name.text.trim().isEmpty)) {
      _toast(l.loginIncomplete);
      return;
    }
    setState(() => _busy = true);
    try {
      if (_register) {
        await Api.register(email, pass, _name.text.trim());
      } else {
        await Api.login(email, pass);
      }
      // 登出/登录由 Session.authChanged 驱动 _Root 自动切换，这里不需要跳转
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
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsetsDirectional.fromSTEB(26, 40, 26, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              // 品牌标：一个字母环
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: C.raised, width: 1),
                ),
                alignment: Alignment.center,
                child: Text(
                  l.appName,
                  style: const TextStyle(
                      fontSize: T.caption,
                      color: C.text,
                      letterSpacing: 0.2,
                      fontWeight: FontWeight.w500),
                ),
              ),
              const SizedBox(height: 36),
              Text(l.loginTitle, style: Ts.title.copyWith(height: 1.4)),
              const SizedBox(height: 52),

              if (_register) ...[
                UnderlineField(
                    label: l.loginName,
                    hint: l.loginNameHint,
                    controller: _name),
                const SizedBox(height: 26),
              ],
              UnderlineField(
                label: l.loginEmail,
                hint: l.loginEmailHint,
                controller: _email,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 26),
              UnderlineField(
                label: l.loginPassword,
                hint: l.loginPasswordHint,
                controller: _pass,
                obscure: true,
              ),
              const SizedBox(height: 42),
              PrimaryButton(
                text: _register ? l.loginRegister : l.loginSubmit,
                loading: _busy,
                onTap: () => _submit(l),
              ),
              const SizedBox(height: 20),
              Center(
                child: TextButton(
                  onPressed: () => setState(() => _register = !_register),
                  child: Text(
                    _register ? l.loginHasAccount : l.loginNoAccount,
                    textAlign: TextAlign.center,
                    style: Ts.secondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
