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
      body: Stack(
        children: [
          const Positioned.fill(child: _Background()),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 560;
                return SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: compact ? 18 : 32,
                    vertical: compact ? 24 : 38,
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - (compact ? 48 : 76),
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 480),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _LoginCard(app: app, compact: compact),
                            const SizedBox(height: 22),
                            Text(
                              '© ${DateTime.now().year} ${app.config.organizationName}',
                              style: const TextStyle(
                                color: Color(0xFF8E879C),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({required this.app, required this.compact});

  final AppController app;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.fromLTRB(
      compact ? 26 : 44,
      compact ? 28 : 40,
      compact ? 26 : 44,
      compact ? 30 : 42,
    ),
    decoration: BoxDecoration(
      color: Colors.white.withValues(alpha: .96),
      borderRadius: BorderRadius.circular(compact ? 24 : 28),
      border: Border.all(color: Colors.white),
      boxShadow: const [
        BoxShadow(
          color: Color(0x1F30284F),
          blurRadius: 48,
          offset: Offset(0, 22),
        ),
        BoxShadow(
          color: Color(0x0D30284F),
          blurRadius: 10,
          offset: Offset(0, 3),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Brand(organizationName: app.config.organizationName),
        SizedBox(height: compact ? 42 : 48),
        Text(
          'Bienvenido',
          style: TextStyle(
            color: AppColors.ink,
            fontSize: compact ? 30 : 34,
            height: 1.15,
            letterSpacing: -0.8,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'Inicia sesión para continuar.',
          style: TextStyle(color: AppColors.inkSoft, fontSize: 16, height: 1.5),
        ),
        const SizedBox(height: 30),
        SizedBox(
          height: 54,
          child: FilledButton(
            onPressed: app.loading ? null : app.login,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.teal,
              foregroundColor: Colors.white,
              disabledBackgroundColor: AppColors.teal.withValues(alpha: .55),
              elevation: 0,
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
                    'Iniciar sesión',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
          ),
        ),
        const SizedBox(height: 18),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 15,
              color: Color(0xFF8A8497),
            ),
            SizedBox(width: 7),
            Text(
              'Acceso protegido',
              style: TextStyle(
                color: Color(0xFF8A8497),
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
      ],
    ),
  );
}

class _Brand extends StatelessWidget {
  const _Brand({required this.organizationName});

  final String organizationName;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      const _BrandMark(),
      const SizedBox(width: 16),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              organizationName,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.ink,
                fontSize: 22,
                height: 1.15,
                letterSpacing: -0.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Portal profesional',
              style: TextStyle(
                color: AppColors.inkSoft,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 66,
    height: 66,
    child: Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 60,
          height: 60,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF584CC8), Color(0xFF8A6BE8)],
            ),
            borderRadius: BorderRadius.circular(19),
            boxShadow: const [
              BoxShadow(
                color: Color(0x386558D6),
                blurRadius: 22,
                offset: Offset(0, 9),
              ),
            ],
          ),
          child: const Text(
            'G',
            style: TextStyle(
              color: Colors.white,
              fontSize: 34,
              height: 1,
              letterSpacing: -2,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            width: 25,
            height: 25,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE3DFF5), width: 2),
              boxShadow: const [
                BoxShadow(color: Color(0x1F30284F), blurRadius: 8),
              ],
            ),
            child: const Icon(
              Icons.check_rounded,
              color: AppColors.teal,
              size: 15,
              weight: 800,
            ),
          ),
        ),
      ],
    ),
  );
}

class _Background extends StatelessWidget {
  const _Background();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFF8F7FC), Color(0xFFF0EDF8)],
      ),
    ),
    child: Stack(
      children: [
        Positioned(
          top: -170,
          right: -130,
          child: _Glow(
            size: 430,
            colors: [Color(0x2B8B75EE), Color(0x008B75EE)],
          ),
        ),
        Positioned(
          bottom: -190,
          left: -140,
          child: _Glow(
            size: 390,
            colors: [Color(0x24D77C8A), Color(0x00D77C8A)],
          ),
        ),
      ],
    ),
  );
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.colors});

  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: RadialGradient(colors: colors),
    ),
  );
}
