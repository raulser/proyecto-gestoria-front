import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../state/app_controller.dart';
import 'widgets/savia_wordmark.dart';

/// Recovery screen for a cancelled, failed or explicitly closed session.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final app = context.read<AppController>();
      if (app.consumeAutomaticLogin()) app.login();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final signedOut = Uri.base.queryParameters.containsKey('signed_out');
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: (constraints.maxHeight - 64).clamp(
                  0,
                  double.infinity,
                ),
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Container(
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE6E8EC)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A151C2A),
                          blurRadius: 60,
                          offset: Offset(0, 24),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: SaviaWordmark(
                            name: app.config.organizationName,
                            size: 36,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          app.loading
                              ? 'Conectando…'
                              : signedOut
                              ? 'Sesión cerrada'
                              : 'Inicia sesión',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          app.loading
                              ? 'Un momento, por favor.'
                              : signedOut
                              ? 'Puedes volver a entrar cuando quieras.'
                              : 'Accede con tu cuenta para continuar.',
                        ),
                        if (app.notice?.error == true && !app.loading) ...[
                          const SizedBox(height: 22),
                          Semantics(
                            liveRegion: true,
                            child: Text(
                              app.notice!.message,
                              style: const TextStyle(color: AppColors.danger),
                            ),
                          ),
                        ],
                        const SizedBox(height: 28),
                        SizedBox(
                          height: 52,
                          child: FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.ink,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: app.loading ? null : app.login,
                            child: app.loading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text('Iniciar sesión'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
