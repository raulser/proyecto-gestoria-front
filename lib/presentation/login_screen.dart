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
          Positioned.fill(child: CustomPaint(painter: _LoginPainter())),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1060),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final wide = constraints.maxWidth > 760;
                      final intro = Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const _Brand(),
                          const SizedBox(height: 42),
                          Text(
                            'Tu gestoría,\nmás clara cada día.',
                            style: Theme.of(context).textTheme.displaySmall
                                ?.copyWith(fontSize: wide ? 52 : 40),
                          ),
                          const SizedBox(height: 18),
                          const Text(
                            'Documentos, vencimientos y conversaciones en un único lugar. Sin perderte entre correos ni carpetas.',
                            style: TextStyle(fontSize: 18, height: 1.5),
                            maxLines: 4,
                          ),
                          const SizedBox(height: 30),
                          const Wrap(
                            spacing: 20,
                            runSpacing: 12,
                            children: [
                              _Benefit(
                                icon: Icons.shield_outlined,
                                text: 'Acceso seguro',
                              ),
                              _Benefit(
                                icon: Icons.devices_rounded,
                                text: 'Web y móvil',
                              ),
                              _Benefit(
                                icon: Icons.notifications_none_rounded,
                                text: 'Avisos útiles',
                              ),
                            ],
                          ),
                        ],
                      );
                      final form = Card(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AppColors.tealSoft,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Icon(
                                  Icons.lock_open_rounded,
                                  color: AppColors.teal,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'Accede a tu espacio',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(fontSize: 27),
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'Utiliza la cuenta que te ha proporcionado tu gestoría.',
                              ),
                              const SizedBox(height: 28),
                              FilledButton.icon(
                                onPressed: app.loading ? null : app.login,
                                icon: app.loading
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(Icons.arrow_forward_rounded),
                                label: const Text('Iniciar sesión'),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                '¿Necesitas ayuda? ${app.config.supportEmail}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.inkSoft,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                      return wide
                          ? Row(
                              children: [
                                Expanded(flex: 6, child: intro),
                                const SizedBox(width: 68),
                                Expanded(flex: 4, child: form),
                              ],
                            )
                          : Column(
                              children: [
                                intro,
                                const SizedBox(height: 34),
                                form,
                              ],
                            );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();
  @override
  Widget build(BuildContext context) => const Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      CircleAvatar(
        backgroundColor: AppColors.ink,
        foregroundColor: Colors.white,
        child: Icon(Icons.balance_rounded),
      ),
      SizedBox(width: 12),
      Text(
        'Gestoría',
        style: TextStyle(
          fontSize: 21,
          color: AppColors.ink,
          fontWeight: FontWeight.w800,
        ),
      ),
    ],
  );
}

class _Benefit extends StatelessWidget {
  const _Benefit({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 19, color: AppColors.teal),
      const SizedBox(width: 7),
      Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
    ],
  );
}

class _LoginPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawCircle(
      Offset(size.width * .88, size.height * .10),
      size.width * .22,
      Paint()..color = AppColors.tealSoft.withValues(alpha: .65),
    );
    canvas.drawCircle(
      Offset(size.width * .08, size.height * .95),
      size.width * .16,
      Paint()..color = AppColors.coral.withValues(alpha: .08),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
