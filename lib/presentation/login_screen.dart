import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../state/app_controller.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 820;
            return SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: wide ? 36 : 20,
                vertical: wide ? 30 : 20,
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - (wide ? 60 : 40),
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1160),
                    child: wide
                        ? _DesktopLogin(app: app)
                        : _MobileLogin(app: app),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _DesktopLogin extends StatelessWidget {
  const _DesktopLogin({required this.app});
  final AppController app;

  @override
  Widget build(BuildContext context) => Container(
    height: 650,
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: AppColors.line),
      boxShadow: const [
        BoxShadow(
          color: Color(0x120F2942),
          blurRadius: 36,
          offset: Offset(0, 14),
        ),
      ],
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 11,
          child: _InstitutionalPanel(
            organizationName: app.config.organizationName,
          ),
        ),
        Expanded(
          flex: 9,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 54, vertical: 48),
            child: _AccessPanel(app: app),
          ),
        ),
      ],
    ),
  );
}

class _MobileLogin extends StatelessWidget {
  const _MobileLogin({required this.app});
  final AppController app;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _Brand(organizationName: app.config.organizationName),
      const SizedBox(height: 42),
      const Text(
        'Área privada',
        style: TextStyle(
          color: AppColors.teal,
          fontSize: 13,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
        ),
      ),
      const SizedBox(height: 10),
      Text(
        'Gestión segura de su expediente',
        style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 35),
      ),
      const SizedBox(height: 14),
      const Text(
        'Consulte documentación, solicitudes, comunicaciones y próximos vencimientos.',
        style: TextStyle(fontSize: 16, height: 1.5),
      ),
      const SizedBox(height: 30),
      Card(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
          child: _AccessPanel(app: app, compact: true),
        ),
      ),
      const SizedBox(height: 24),
      _LegalFooter(organizationName: app.config.organizationName),
    ],
  );
}

class _InstitutionalPanel extends StatelessWidget {
  const _InstitutionalPanel({required this.organizationName});
  final String organizationName;

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: AppColors.ink,
    child: Padding(
      padding: const EdgeInsets.all(54),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Brand(organizationName: organizationName, dark: true),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .08),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withValues(alpha: .12)),
            ),
            child: const Text(
              'PORTAL PROFESIONAL',
              style: TextStyle(
                color: Color(0xFFB9E4E5),
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 22),
          const Text(
            'Su información fiscal y documental, siempre accesible.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 39,
              height: 1.14,
              fontWeight: FontWeight.w700,
              letterSpacing: -.7,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Un entorno privado para consultar documentación, atender solicitudes y mantener el seguimiento de sus obligaciones.',
            style: TextStyle(
              color: Color(0xFFC5D1DE),
              fontSize: 17,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 34),
          const _TrustItem(
            icon: Icons.verified_user_outlined,
            text: 'Acceso protegido mediante identidad segura',
          ),
          const SizedBox(height: 14),
          const _TrustItem(
            icon: Icons.folder_shared_outlined,
            text: 'Documentación organizada por expediente',
          ),
          const Spacer(),
          _LegalFooter(organizationName: organizationName, dark: true),
        ],
      ),
    ),
  );
}

class _AccessPanel extends StatelessWidget {
  const _AccessPanel({required this.app, this.compact = false});
  final AppController app;
  final bool compact;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Align(
        alignment: Alignment.centerLeft,
        child: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.tealSoft,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.lock_outline_rounded, color: AppColors.teal),
        ),
      ),
      SizedBox(height: compact ? 20 : 28),
      Text(
        'Acceso al portal',
        style: Theme.of(context).textTheme.headlineMedium
            ?.copyWith(fontSize: compact ? 26 : 30),
      ),
      const SizedBox(height: 12),
      const Text(
        'Identifíquese con las credenciales facilitadas por su asesoría.',
        style: TextStyle(fontSize: 16, height: 1.5),
      ),
      const SizedBox(height: 30),
      FilledButton.icon(
        onPressed: app.loading ? null : app.login,
        icon: app.loading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.login_rounded),
        label: Text(app.loading ? 'Conectando…' : 'Acceder al área privada'),
      ),
      const SizedBox(height: 22),
      const Divider(),
      const SizedBox(height: 15),
      const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield_outlined, size: 19, color: AppColors.teal),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Uso exclusivo de clientes y personal autorizado.',
              style: TextStyle(fontSize: 13),
            ),
          ),
        ],
      ),
      if (app.config.supportEmail.trim().isNotEmpty) ...[
        const SizedBox(height: 14),
        Text(
          'Soporte: ${app.config.supportEmail}',
          style: const TextStyle(fontSize: 13, color: AppColors.inkSoft),
        ),
      ],
    ],
  );
}

class _Brand extends StatelessWidget {
  const _Brand({required this.organizationName, this.dark = false});
  final String organizationName;
  final bool dark;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: dark ? Colors.white : AppColors.ink,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Icon(
          Icons.account_balance_outlined,
          color: dark ? AppColors.ink : Colors.white,
          size: 23,
        ),
      ),
      const SizedBox(width: 13),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            organizationName,
            style: TextStyle(
              color: dark ? Colors.white : AppColors.ink,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          Text(
            'Área privada',
            style: TextStyle(
              color: dark ? const Color(0xFFB8C7D9) : AppColors.inkSoft,
              fontSize: 12,
            ),
          ),
        ],
      ),
    ],
  );
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 20, color: const Color(0xFF80CED2)),
      const SizedBox(width: 11),
      Expanded(
        child: Text(text, style: const TextStyle(color: Color(0xFFD7E1EC))),
      ),
    ],
  );
}

class _LegalFooter extends StatelessWidget {
  const _LegalFooter({required this.organizationName, this.dark = false});
  final String organizationName;
  final bool dark;

  @override
  Widget build(BuildContext context) => Text(
    '© ${DateTime.now().year} $organizationName · Acceso confidencial',
    textAlign: dark ? TextAlign.left : TextAlign.center,
    style: TextStyle(
      color: dark ? const Color(0xFF91A4BA) : AppColors.inkSoft,
      fontSize: 12,
    ),
  );
}
