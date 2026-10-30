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
      backgroundColor: AppColors.ink,
      body: Stack(
        children: [
          const Positioned.fill(
            child: CustomPaint(painter: _BackdropPainter()),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final desktop = constraints.maxWidth >= 860;
                return SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: desktop ? 40 : 20,
                    vertical: desktop ? 30 : 20,
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight - (desktop ? 60 : 40),
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1180),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _Header(app: app),
                            SizedBox(height: desktop ? 76 : 48),
                            desktop
                                ? Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      const Expanded(
                                        flex: 6,
                                        child: _WelcomePanel(),
                                      ),
                                      const SizedBox(width: 80),
                                      SizedBox(
                                        width: 430,
                                        child: _LoginCard(app: app),
                                      ),
                                    ],
                                  )
                                : Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      const _WelcomePanel(compact: true),
                                      const SizedBox(height: 32),
                                      _LoginCard(app: app, compact: true),
                                    ],
                                  ),
                            SizedBox(height: desktop ? 70 : 36),
                            _Footer(
                              organizationName: app.config.organizationName,
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

class _Header extends StatelessWidget {
  const _Header({required this.app});
  final AppController app;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      _Brand(organizationName: app.config.organizationName),
      const Spacer(),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: .07),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white.withValues(alpha: .12)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shield_outlined, size: 17, color: Color(0xFF8FD5D8)),
            SizedBox(width: 7),
            Text(
              'Acceso seguro',
              style: TextStyle(
                color: Color(0xFFD9E4EE),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

class _WelcomePanel extends StatelessWidget {
  const _WelcomePanel({this.compact = false});
  final bool compact;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 32, height: 3, color: const Color(0xFF66C2C7)),
          const SizedBox(width: 10),
          const Text(
            'ÁREA PRIVADA',
            style: TextStyle(
              color: Color(0xFF91D9DC),
              fontSize: 12,
              letterSpacing: 1.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
      const SizedBox(height: 24),
      Text(
        'Su gestoría, accesible cuando la necesite.',
        style: TextStyle(
          color: Colors.white,
          fontSize: compact ? 36 : 52,
          height: 1.08,
          letterSpacing: compact ? -.5 : -1.1,
          fontWeight: FontWeight.w700,
        ),
      ),
      SizedBox(height: compact ? 18 : 24),
      Text(
        'Consulte su documentación, atienda solicitudes y mantenga el control de sus próximos vencimientos desde un único espacio.',
        style: TextStyle(
          color: const Color(0xFFC3D0DD),
          fontSize: compact ? 16 : 18,
          height: 1.55,
        ),
      ),
      SizedBox(height: compact ? 26 : 36),
      const Wrap(
        spacing: 26,
        runSpacing: 14,
        children: [
          _Feature(icon: Icons.folder_copy_outlined, text: 'Documentación'),
          _Feature(icon: Icons.event_available_outlined, text: 'Vencimientos'),
          _Feature(icon: Icons.forum_outlined, text: 'Comunicación'),
        ],
      ),
    ],
  );
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({required this.app, this.compact = false});
  final AppController app;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.all(compact ? 26 : 38),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: const [
        BoxShadow(
          color: Color(0x40061222),
          blurRadius: 42,
          offset: Offset(0, 18),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Container(
            width: 50,
            height: 50,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.tealSoft,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: AppColors.teal,
              size: 26,
            ),
          ),
        ),
        const SizedBox(height: 25),
        Text(
          'Bienvenido',
          style: Theme.of(context).textTheme.headlineMedium
              ?.copyWith(fontSize: compact ? 28 : 31),
        ),
        const SizedBox(height: 9),
        const Text(
          'Acceda con las credenciales facilitadas por su asesoría.',
          style: TextStyle(fontSize: 15, height: 1.5),
        ),
        const SizedBox(height: 28),
        FilledButton.icon(
          onPressed: app.loading ? null : app.login,
          icon: app.loading
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.arrow_forward_rounded),
          label: Text(
            app.loading ? 'Conectando…' : 'Entrar en mi área privada',
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.lock_outline_rounded, size: 18, color: AppColors.teal),
              SizedBox(width: 9),
              Expanded(
                child: Text(
                  'Identificación protegida. Sus credenciales no se almacenan en esta aplicación.',
                  style: TextStyle(fontSize: 12, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        if (app.config.supportEmail.trim().isNotEmpty) ...[
          const SizedBox(height: 15),
          Text(
            '¿Necesita ayuda? ${app.config.supportEmail}',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: AppColors.inkSoft),
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
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 44,
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(11),
        ),
        child: const Icon(
          Icons.account_balance_outlined,
          color: AppColors.ink,
          size: 23,
        ),
      ),
      const SizedBox(width: 13),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            organizationName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Text(
            'Portal de clientes',
            style: TextStyle(color: Color(0xFF9FB1C4), fontSize: 12),
          ),
        ],
      ),
    ],
  );
}

class _Feature extends StatelessWidget {
  const _Feature({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, color: const Color(0xFF79CED2), size: 19),
      const SizedBox(width: 8),
      Text(
        text,
        style: const TextStyle(
          color: Color(0xFFD7E1EA),
          fontWeight: FontWeight.w600,
        ),
      ),
    ],
  );
}

class _Footer extends StatelessWidget {
  const _Footer({required this.organizationName});
  final String organizationName;

  @override
  Widget build(BuildContext context) => Wrap(
    alignment: WrapAlignment.spaceBetween,
    runSpacing: 8,
    children: [
      Text(
        '© ${DateTime.now().year} $organizationName',
        style: const TextStyle(color: Color(0xFF8FA3B7), fontSize: 12),
      ),
      const Text(
        'Uso exclusivo de clientes y personal autorizado',
        style: TextStyle(color: Color(0xFF8FA3B7), fontSize: 12),
      ),
    ],
  );
}

class _BackdropPainter extends CustomPainter {
  const _BackdropPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = Colors.white.withValues(alpha: .025)
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 72) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), line);
    }
    for (double y = 0; y < size.height; y += 72) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), line);
    }
    canvas.drawRect(
      Rect.fromLTWH(0, 0, 5, size.height),
      Paint()..color = AppColors.teal,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
