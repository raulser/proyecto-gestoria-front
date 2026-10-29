import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../domain/models.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

class MoreScreen extends StatefulWidget {
  const MoreScreen({super.key});
  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen> {
  Future<List<dynamic>>? data;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final app = context.read<AppController>();
    data ??= app.usuario?.esAdmin == true
        ? Future.wait([
            app.api.usuarios(),
            app.api.plan(),
            app.api.empresa(),
            app.api.auditoria(),
          ])
        : Future.value([
            <Json>[],
            <String, dynamic>{},
            <String, dynamic>{},
            <Json>[],
          ]);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PageHeader(
          eyebrow: 'Gestión',
          title: 'Equipo y configuración',
          subtitle: 'Cuenta, organización, plan y actividad administrativa en un único espacio.',
        ),
        FutureBuilder<List<dynamic>>(
          future: data,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            if (snapshot.hasError) {
              return SectionCard(
                child: EmptyState(
                  icon: Icons.cloud_off_rounded,
                  title: 'No se pudo cargar la configuración',
                  message: 'Actualiza la pantalla para volver a intentarlo.',
                  action: FilledButton.tonal(
                    onPressed: () => setState(() => data = null),
                    child: const Text('Reintentar'),
                  ),
                ),
              );
            }
            final users = snapshot.data![0] as List<Json>;
            final plan = snapshot.data![1] as Json;
            final company = snapshot.data![2] as Json;
            final audit = snapshot.data![3] as List<Json>;
            return Column(
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final wide = constraints.maxWidth > 780;
                    final profile = SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Mi cuenta',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 18),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: AppColors.ink,
                              foregroundColor: Colors.white,
                              child: Text(
                                app.usuario?.nombre.isNotEmpty == true
                                    ? app.usuario!.nombre[0]
                                    : '?',
                              ),
                            ),
                            title: Text(app.usuario?.nombre ?? ''),
                            subtitle: Text(app.usuario?.email ?? ''),
                            trailing: StatusChip(app.usuario?.rol ?? ''),
                          ),
                          const Divider(height: 28),
                          const Text(
                            'La sesión se gestiona de forma segura mediante Keycloak. No se almacenan contraseñas en esta aplicación.',
                          ),
                        ],
                      ),
                    );
                    final organization = SectionCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Organización',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 18),
                          _Info(
                            label: 'Nombre',
                            value: stringValue(
                              company['nombre'],
                              'No disponible',
                            ),
                          ),
                          _Info(
                            label: 'NIF',
                            value: stringValue(company['nif'], 'No disponible'),
                          ),
                          _Info(
                            label: 'Plan',
                            value: stringValue(
                              plan['nombre'] ?? plan['codigo'],
                              'No disponible',
                            ),
                          ),
                          _Info(
                            label: 'Usuarios',
                            value: plan.isEmpty
                                ? '—'
                                : '${intValue(plan['usuariosInternos'])} de ${intValue(plan['maxUsuariosInternos'])}',
                          ),
                          _Info(
                            label: 'Clientes',
                            value: plan.isEmpty
                                ? '—'
                                : '${intValue(plan['clientesActivos'])} de ${intValue(plan['maxClientesActivos'])}',
                          ),
                        ],
                      ),
                    );
                    return wide
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: profile),
                              const SizedBox(width: 16),
                              Expanded(child: organization),
                            ],
                          )
                        : Column(
                            children: [
                              profile,
                              const SizedBox(height: 16),
                              organization,
                            ],
                          );
                  },
                ),
                if (app.usuario?.esAdmin == true) ...[
                  const SizedBox(height: 16),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Equipo',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ),
                            Text(
                              '${users.length} usuarios',
                              style: const TextStyle(
                                color: AppColors.teal,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        if (users.isEmpty)
                          const EmptyState(
                            icon: Icons.group_outlined,
                            title: 'Sin usuarios',
                            message: 'No hay miembros visibles en el equipo.',
                          )
                        else
                          ...users.map(
                            (user) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: const CircleAvatar(
                                backgroundColor: AppColors.tealSoft,
                                foregroundColor: AppColors.teal,
                                child: Icon(Icons.person_outline_rounded),
                              ),
                              title: Text(
                                stringValue(user['nombre']),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              subtitle: Text(stringValue(user['email'])),
                              trailing: StatusChip(stringValue(user['rol'])),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Actividad reciente',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 14),
                        if (audit.isEmpty)
                          const Text('No hay eventos recientes.')
                        else
                          ...audit
                              .take(10)
                              .map(
                                (event) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(
                                    Icons.history_rounded,
                                    color: AppColors.teal,
                                  ),
                                  title: Text(
                                    stringValue(
                                      event['descripcion'] ?? event['accion'],
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${stringValue(event['nombreActor'])} · ${stringValue(event['creadoEn'])}',
                                  ),
                                ),
                              ),
                      ],
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _Info extends StatelessWidget {
  const _Info({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Row(
      children: [
        SizedBox(
          width: 95,
          child: Text(label, style: const TextStyle(color: AppColors.inkSoft)),
        ),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
        ),
      ],
    ),
  );
}
