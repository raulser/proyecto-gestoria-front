import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_theme.dart';
import '../state/app_controller.dart';
import 'widgets/savia_wordmark.dart';
import 'screens/clients_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/documents_screen.dart';
import 'screens/more_screen.dart';
import 'screens/requests_screen.dart';
import 'screens/upload_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int shownNotice = 0;
  static const screens = <Widget>[
    DashboardScreen(),
    ClientsScreen(),
    RequestsScreen(),
    DocumentsScreen(),
    UploadScreen(),
    MoreScreen(),
  ];

  void _showNotice(AppNotice? notice) {
    if (notice == null || notice.id == shownNotice) return;
    shownNotice = notice.id;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            backgroundColor: notice.error
                ? AppColors.danger
                : AppColors.success,
            content: Row(
              children: [
                Icon(
                  notice.error
                      ? Icons.error_outline_rounded
                      : Icons.check_circle_outline_rounded,
                  color: Colors.white,
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Text(
                    notice.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            duration: Duration(seconds: notice.error ? 6 : 3),
            action: notice.error
                ? SnackBarAction(
                    label: 'Cerrar',
                    textColor: Colors.white,
                    onPressed: () {},
                  )
                : null,
          ),
        );
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    _showNotice(app.notice);
    return LayoutBuilder(
      builder: (context, constraints) {
        final desktop = constraints.maxWidth >= 860;
        return Scaffold(
          appBar: desktop
              ? null
              : AppBar(
                  backgroundColor: AppColors.surface,
                  title: const _Brand(compact: true),
                  actions: [
                    _NotificationButton(
                      count: app.notificaciones.where((n) => !n.leida).length,
                    ),
                    const SizedBox(width: 6),
                  ],
                ),
          floatingActionButton: desktop
              ? null
              : FloatingActionButton.extended(
                  onPressed: () => app.selectSection(4),
                  icon: const Icon(Icons.upload_rounded),
                  label: const Text('Subir'),
                ),
          bottomNavigationBar: desktop
              ? null
              : NavigationBar(
                  selectedIndex: _mobileIndex(app.section),
                  onDestinationSelected: (index) =>
                      app.selectSection([0, 1, 2, 3, 5][index]),
                  destinations: [
                    const NavigationDestination(
                      icon: Icon(Icons.space_dashboard_outlined),
                      selectedIcon: Icon(Icons.space_dashboard_rounded),
                      label: 'Inicio',
                    ),
                    NavigationDestination(
                      icon: const Icon(Icons.people_outline_rounded),
                      selectedIcon: const Icon(Icons.people_rounded),
                      label: app.usuario?.esCliente == true
                          ? 'Expediente'
                          : 'Clientes',
                    ),
                    const NavigationDestination(
                      icon: Icon(Icons.task_alt_outlined),
                      selectedIcon: Icon(Icons.task_alt_rounded),
                      label: 'Solicitudes',
                    ),
                    const NavigationDestination(
                      icon: Icon(Icons.folder_outlined),
                      selectedIcon: Icon(Icons.folder_rounded),
                      label: 'Documentos',
                    ),
                    const NavigationDestination(
                      icon: Icon(Icons.more_horiz_rounded),
                      label: 'Más',
                    ),
                  ],
                ),
          body: Row(
            children: [
              if (desktop)
                _DesktopNavigation(
                  app: app,
                  extended: constraints.maxWidth >= 1120,
                ),
              Expanded(
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: RefreshIndicator(
                        onRefresh: app.refresh,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: EdgeInsets.fromLTRB(
                            desktop ? 34 : 18,
                            desktop ? 30 : 20,
                            desktop ? 34 : 18,
                            app.uploadFileName == null ? 48 : 130,
                          ),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 1320),
                              child: IndexedStack(
                                index: app.section,
                                children: screens,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (app.loading)
                      const Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        child: LinearProgressIndicator(minHeight: 3),
                      ),
                    if (app.uploadFileName != null)
                      Positioned(
                        left: 18,
                        right: 18,
                        bottom: 18,
                        child: _UploadOverlay(
                          fileName: app.uploadFileName!,
                          progress: app.uploadProgress,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  int _mobileIndex(int section) => switch (section) {
    0 => 0,
    1 => 1,
    2 => 2,
    3 => 3,
    _ => 4,
  };
}

class _DesktopNavigation extends StatelessWidget {
  const _DesktopNavigation({required this.app, required this.extended});
  final AppController app;
  final bool extended;
  @override
  Widget build(BuildContext context) => Container(
    width: extended ? 250 : 86,
    color: AppColors.ink,
    child: SafeArea(
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: extended ? 22 : 16,
              vertical: 24,
            ),
            child: _Brand(compact: !extended, dark: true),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: NavigationRail(
              backgroundColor: AppColors.ink,
              extended: extended,
              minExtendedWidth: 250,
              selectedIndex: app.section,
              onDestinationSelected: app.selectSection,
              labelType: extended
                  ? NavigationRailLabelType.none
                  : NavigationRailLabelType.all,
              indicatorColor: AppColors.teal,
              selectedIconTheme: const IconThemeData(color: Colors.white),
              unselectedIconTheme: const IconThemeData(
                color: Color(0xFFACB6CC),
              ),
              selectedLabelTextStyle: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
              unselectedLabelTextStyle: const TextStyle(
                color: Color(0xFFACB6CC),
              ),
              destinations: [
                const NavigationRailDestination(
                  icon: Icon(Icons.space_dashboard_outlined),
                  selectedIcon: Icon(Icons.space_dashboard_rounded),
                  label: Text('Inicio'),
                ),
                NavigationRailDestination(
                  icon: const Icon(Icons.people_outline_rounded),
                  selectedIcon: const Icon(Icons.people_rounded),
                  label: Text(
                    app.usuario?.esCliente == true
                        ? 'Mi expediente'
                        : 'Clientes',
                  ),
                ),
                const NavigationRailDestination(
                  icon: Icon(Icons.task_alt_outlined),
                  selectedIcon: Icon(Icons.task_alt_rounded),
                  label: Text('Solicitudes'),
                ),
                const NavigationRailDestination(
                  icon: Icon(Icons.folder_outlined),
                  selectedIcon: Icon(Icons.folder_rounded),
                  label: Text('Documentos'),
                ),
                const NavigationRailDestination(
                  icon: Icon(Icons.cloud_upload_outlined),
                  selectedIcon: Icon(Icons.cloud_upload_rounded),
                  label: Text('Subir documento'),
                ),
                NavigationRailDestination(
                  icon: const Icon(Icons.settings_outlined),
                  selectedIcon: const Icon(Icons.settings_rounded),
                  label: Text(
                    app.usuario?.esAdmin == true
                        ? 'Equipo y ajustes'
                        : 'Mi cuenta',
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: extended
                ? ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    tileColor: Colors.white.withValues(alpha: .06),
                    leading: CircleAvatar(
                      backgroundColor: AppColors.coral,
                      foregroundColor: Colors.white,
                      child: Text(
                        app.usuario?.nombre.isNotEmpty == true
                            ? app.usuario!.nombre[0]
                            : '?',
                      ),
                    ),
                    title: Text(
                      app.usuario?.nombre ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    subtitle: Text(
                      app.usuario?.rol ?? '',
                      style: const TextStyle(
                        color: Color(0xFFACB6CC),
                        fontSize: 11,
                      ),
                    ),
                    trailing: IconButton(
                      onPressed: app.logout,
                      tooltip: 'Cerrar sesión',
                      icon: const Icon(
                        Icons.logout_rounded,
                        color: Colors.white,
                      ),
                    ),
                  )
                : IconButton.filledTonal(
                    onPressed: app.logout,
                    tooltip: 'Cerrar sesión',
                    icon: const Icon(Icons.logout_rounded),
                  ),
          ),
        ],
      ),
    ),
  );
}

class _Brand extends StatelessWidget {
  const _Brand({required this.compact, this.dark = false});
  final bool compact;
  final bool dark;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      SaviaWordmark(
        name: context.read<AppController>().config.organizationName,
        size: compact ? 28 : 34,
        color: dark ? Colors.white : AppColors.ink,
      ),
    ],
  );
}

class _NotificationButton extends StatelessWidget {
  const _NotificationButton({required this.count});
  final int count;
  @override
  Widget build(BuildContext context) => Badge(
    isLabelVisible: count > 0,
    label: Text('$count'),
    child: IconButton(
      onPressed: () => context.read<AppController>().selectSection(0),
      icon: const Icon(Icons.notifications_none_rounded),
    ),
  );
}

class _UploadOverlay extends StatelessWidget {
  const _UploadOverlay({required this.fileName, required this.progress});
  final String fileName;
  final double? progress;
  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 680),
      child: Material(
        elevation: 14,
        borderRadius: BorderRadius.circular(18),
        color: AppColors.ink,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Icon(Icons.cloud_upload_rounded, color: Colors.white),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      fileName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(6),
                      color: AppColors.coral,
                      backgroundColor: Colors.white24,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                progress == null ? '…' : '${(progress! * 100).round()}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
