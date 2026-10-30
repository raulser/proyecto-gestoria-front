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
            final compact = constraints.maxWidth < 520;
            return SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: compact ? 24 : 36,
                vertical: compact ? 28 : 42,
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - (compact ? 56 : 84),
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: _AccessContent(app: app, compact: compact),
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

class _AccessContent extends StatelessWidget {
  const _AccessContent({required this.app, required this.compact});

  final AppController app;
  final bool compact;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _Brand(organizationName: app.config.organizationName),
      SizedBox(height: compact ? 42 : 54),
      Text(
        'Inicia sesión',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: AppColors.ink,
          fontSize: compact ? 30 : 34,
          height: 1.15,
          letterSpacing: -0.8,
          fontWeight: FontWeight.w700,
        ),
      ),
      const SizedBox(height: 12),
      const Text(
        'Continúa para acceder a tu cuenta.',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.inkSoft, fontSize: 16, height: 1.5),
      ),
      const SizedBox(height: 32),
      SizedBox(
        height: 54,
        child: FilledButton(
          onPressed: app.loading ? null : app.login,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.teal,
            foregroundColor: Colors.white,
            disabledBackgroundColor: AppColors.teal.withValues(alpha: .55),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: app.loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    color: Colors.white,
                  ),
                )
              : const Text(
                  'Continuar',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
        ),
      ),
      const SizedBox(height: 18),
      const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline_rounded, size: 16, color: AppColors.inkSoft),
          SizedBox(width: 7),
          Text(
            'Acceso seguro',
            style: TextStyle(
              color: AppColors.inkSoft,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      if (app.config.supportEmail.trim().isNotEmpty) ...[
        const SizedBox(height: 22),
        Text(
          'Ayuda: ${app.config.supportEmail}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.inkSoft, fontSize: 12),
        ),
      ],
      SizedBox(height: compact ? 52 : 68),
      Text(
        '© ${DateTime.now().year} ${app.config.organizationName}',
        textAlign: TextAlign.center,
        style: const TextStyle(color: Color(0xFF9A958E), fontSize: 11),
      ),
    ],
  );
}

class _Brand extends StatelessWidget {
  const _Brand({required this.organizationName});

  final String organizationName;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Container(
        width: 76,
        height: 76,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.teal,
          borderRadius: BorderRadius.circular(22),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1F263E33),
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: const Icon(
          Icons.account_balance_outlined,
          color: Colors.white,
          size: 36,
        ),
      ),
      const SizedBox(height: 16),
      Text(
        organizationName,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: AppColors.ink,
          fontSize: 25,
          letterSpacing: -0.7,
          fontWeight: FontWeight.w800,
        ),
      ),
      const SizedBox(height: 3),
      const Text(
        'Área de clientes',
        textAlign: TextAlign.center,
        style: TextStyle(
          color: AppColors.inkSoft,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
    ],
  );
}
