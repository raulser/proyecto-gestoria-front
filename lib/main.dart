import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/app_theme.dart';
import 'presentation/app_shell.dart';
import 'presentation/login_screen.dart';
import 'presentation/widgets/savia_wordmark.dart';
import 'state/app_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es');
  final controller = await AppController.bootstrap();
  runApp(
    ChangeNotifierProvider.value(value: controller, child: const GestoriaApp()),
  );
}

class GestoriaApp extends StatelessWidget {
  const GestoriaApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title:
        '${context.watch<AppController>().config.organizationName} · Área privada',
    theme: buildAppTheme(),
    locale: const Locale('es'),
    supportedLocales: const [Locale('es')],
    localizationsDelegates: const [
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: Consumer<AppController>(
      builder: (context, app, _) => switch (app.status) {
        SessionStatus.booting => const _SplashScreen(),
        SessionStatus.signedOut => const LoginScreen(),
        SessionStatus.signedIn => const AppShell(),
      },
    ),
  );
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SaviaWordmark(size: 54),
          SizedBox(height: 22),
          CircularProgressIndicator(),
          SizedBox(height: 13),
          Text('Preparando tu espacio…'),
        ],
      ),
    ),
  );
}
