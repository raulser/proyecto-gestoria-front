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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 920;
            if (wide) {
              return Row(
                children: [
                  Expanded(
                    child: ColoredBox(
                      color: const Color(0xFFF2F1EE),
                      child: Center(
                        child: _Identity(
                          name: app.config.organizationName,
                          expanded: true,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: _ScrollCenter(
                      height: constraints.maxHeight,
                      child: _SignIn(app: app),
                    ),
                  ),
                ],
              );
            }
            return _ScrollCenter(
              height: constraints.maxHeight,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _Identity(name: app.config.organizationName),
                  const SizedBox(height: 52),
                  _SignIn(app: app),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ScrollCenter extends StatelessWidget {
  const _ScrollCenter({required this.height, required this.child});

  final double height;
  final Widget child;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
    child: ConstrainedBox(
      constraints: BoxConstraints(
        minHeight: (height - 72).clamp(0, double.infinity),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: child,
        ),
      ),
    ),
  );
}

class _Identity extends StatelessWidget {
  const _Identity({required this.name, this.expanded = false});

  final String name;
  final bool expanded;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Image.asset(
        'assets/brand/gestoria-symbol.png',
        width: expanded ? 270 : 132,
        height: expanded ? 270 : 132,
        filterQuality: FilterQuality.high,
        excludeFromSemantics: true,
      ),
      Text(
        name,
        textAlign: TextAlign.center,
        style: TextStyle(
          color: AppColors.ink,
          fontSize: expanded ? 42 : 30,
          letterSpacing: -1.2,
          fontWeight: FontWeight.w700,
        ),
      ),
    ],
  );
}

class _SignIn extends StatelessWidget {
  const _SignIn({required this.app});

  final AppController app;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Align(
        alignment: Alignment.centerLeft,
        child: Container(width: 32, height: 3, color: AppColors.coral),
      ),
      const SizedBox(height: 22),
      const Text(
        'Iniciar sesión',
        style: TextStyle(
          color: AppColors.ink,
          fontSize: 32,
          height: 1.15,
          letterSpacing: -.9,
          fontWeight: FontWeight.w700,
        ),
      ),
      const SizedBox(height: 12),
      const Text(
        'Accede con tu cuenta de la gestoría.',
        style: TextStyle(color: AppColors.inkSoft, fontSize: 15, height: 1.5),
      ),
      const SizedBox(height: 32),
      SizedBox(
        height: 54,
        child: FilledButton(
          onPressed: app.loading ? null : app.login,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.ink,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(9),
            ),
          ),
          child: app.loading
              ? const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    ),
                    SizedBox(width: 12),
                    Text('Conectando…'),
                  ],
                )
              : const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Iniciar sesión', style: TextStyle(fontSize: 15)),
                    Icon(Icons.arrow_forward_rounded, size: 20),
                  ],
                ),
        ),
      ),
      if (app.config.supportEmail.trim().isNotEmpty) ...[
        const SizedBox(height: 24),
        Text(
          'Ayuda: ${app.config.supportEmail}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.inkSoft, fontSize: 12),
        ),
      ],
    ],
  );
}
