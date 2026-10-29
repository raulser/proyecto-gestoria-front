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
            app.api.asignaciones(),
          ])
        : Future.value([
            <Json>[],
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
            final assignments = snapshot.data![4] as List<Json>;
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
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Organización',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ),
                              if (app.usuario?.esAdmin == true)
                                IconButton(
                                  tooltip: 'Editar organización',
                                  onPressed: () async {
                                    final changed = await showDialog<bool>(
                                      context: context,
                                      builder: (_) =>
                                          _CompanyDialog(company: company),
                                    );
                                    if (changed == true) _reload(app);
                                  },
                                  icon: const Icon(Icons.edit_outlined),
                                ),
                            ],
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
                            const SizedBox(width: 10),
                            FilledButton.tonalIcon(
                              onPressed: () async {
                                final changed = await showDialog<bool>(
                                  context: context,
                                  builder: (_) => const _UserDialog(),
                                );
                                if (changed == true) _reload(app);
                              },
                              icon: const Icon(Icons.person_add_alt_1_rounded),
                              label: const Text('Añadir'),
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
                              onTap: () async {
                                final changed = await showDialog<bool>(
                                  context: context,
                                  builder: (_) => _UserDialog(user: user),
                                );
                                if (changed == true) _reload(app);
                              },
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
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  StatusChip(stringValue(user['rol'])),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.edit_outlined, size: 18),
                                ],
                              ),
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
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Asignaciones asesor–cliente',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ),
                            FilledButton.tonalIcon(
                              onPressed: () async {
                                final changed = await showDialog<bool>(
                                  context: context,
                                  builder: (_) => _AssignmentDialog(
                                    users: users,
                                    clients: app.clientes,
                                  ),
                                );
                                if (changed == true) _reload(app);
                              },
                              icon: const Icon(Icons.link_rounded),
                              label: const Text('Asignar'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        if (assignments.isEmpty)
                          const Text('No hay asignaciones registradas.')
                        else
                          ...assignments.map(
                            (item) => ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: const Icon(
                                Icons.account_tree_outlined,
                                color: AppColors.teal,
                              ),
                              title: Text(
                                stringValue(item['nombreCliente']),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              subtitle: Text(
                                'Asesor: ${stringValue(item['nombreAsesor'])}',
                              ),
                              trailing: IconButton(
                                tooltip: 'Quitar asignación',
                                onPressed: () async {
                                  final ok = await app.removeAssignment(
                                    intValue(item['asesorId']),
                                    intValue(item['clienteId']),
                                  );
                                  if (ok) _reload(app);
                                },
                                icon: const Icon(Icons.link_off_rounded),
                              ),
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

  void _reload(AppController app) {
    setState(() {
      data = Future.wait([
        app.api.usuarios(),
        app.api.plan(),
        app.api.empresa(),
        app.api.auditoria(),
        app.api.asignaciones(),
      ]);
    });
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

class _CompanyDialog extends StatefulWidget {
  const _CompanyDialog({required this.company});
  final Json company;
  @override
  State<_CompanyDialog> createState() => _CompanyDialogState();
}

class _CompanyDialogState extends State<_CompanyDialog> {
  late final billing = TextEditingController(
    text: stringValue(widget.company['correoFacturacion']),
  );
  late final brand = TextEditingController(
    text: stringValue(widget.company['nombreMarca']),
  );
  late final color = TextEditingController(
    text: stringValue(widget.company['colorPrincipalMarca'], '#0C7C86'),
  );
  bool saving = false;
  @override
  void dispose() {
    billing.dispose();
    brand.dispose();
    color.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Editar organización'),
    content: SizedBox(
      width: 480,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: billing,
            decoration: const InputDecoration(
              labelText: 'Correo de facturación',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: brand,
            decoration: const InputDecoration(labelText: 'Nombre de marca'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: color,
            decoration: const InputDecoration(
              labelText: 'Color principal (#RRGGBB)',
            ),
          ),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: saving ? null : () => Navigator.pop(context),
        child: const Text('Cancelar'),
      ),
      FilledButton(
        onPressed: saving
            ? null
            : () async {
                setState(() => saving = true);
                final ok = await context.read<AppController>().saveCompany({
                  'correoFacturacion': billing.text.trim(),
                  'nombreMarca': brand.text.trim(),
                  'colorPrincipalMarca': color.text.trim(),
                });
                if (ok && context.mounted) Navigator.pop(context, true);
                if (mounted) setState(() => saving = false);
              },
        child: saving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Text('Guardar'),
      ),
    ],
  );
}

class _UserDialog extends StatefulWidget {
  const _UserDialog({this.user});
  final Json? user;
  @override
  State<_UserDialog> createState() => _UserDialogState();
}

class _UserDialogState extends State<_UserDialog> {
  late final name = TextEditingController(
    text: stringValue(widget.user?['nombre']),
  );
  late final email = TextEditingController(
    text: stringValue(widget.user?['email']),
  );
  final password = TextEditingController();
  late String role = stringValue(widget.user?['rol'], 'ASESOR');
  late int? clientId = widget.user?['clienteId'] == null
      ? null
      : intValue(widget.user?['clienteId']);
  late bool active = widget.user == null || boolValue(widget.user?['activo']);
  bool saving = false;
  @override
  void dispose() {
    name.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppController>();
    final creating = widget.user == null;
    return AlertDialog(
      title: Text(creating ? 'Añadir usuario' : 'Editar usuario'),
      content: SizedBox(
        width: 500,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(labelText: 'Nombre'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: email,
                onChanged: (_) => setState(() {}),
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Correo'),
              ),
              if (creating) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: password,
                  onChanged: (_) => setState(() {}),
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña inicial',
                    helperText:
                        '12 caracteres, mayúscula, minúscula, número y símbolo',
                  ),
                ),
              ],
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: role,
                decoration: const InputDecoration(labelText: 'Rol'),
                items: const ['ADMIN', 'ASESOR', 'CLIENTE']
                    .map(
                      (v) =>
                          DropdownMenuItem(value: v, child: Text(etiqueta(v))),
                    )
                    .toList(),
                onChanged: (v) => setState(() {
                  role = v ?? role;
                  if (role != 'CLIENTE') clientId = null;
                }),
              ),
              if (role == 'CLIENTE') ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: clientId,
                  decoration: const InputDecoration(
                    labelText: 'Ficha de cliente',
                  ),
                  items: app.clientes
                      .map(
                        (c) => DropdownMenuItem(
                          value: c.id,
                          child: Text(c.nombre),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => clientId = v),
                ),
              ],
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Usuario activo'),
                value: active,
                onChanged: (v) => setState(() => active = v),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: saving ? null : () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed:
              saving ||
                  name.text.trim().isEmpty ||
                  !email.text.contains('@') ||
                  (creating && password.text.length < 12) ||
                  (role == 'CLIENTE' && clientId == null)
              ? null
              : () async {
                  setState(() => saving = true);
                  final data = {
                    'nombre': name.text.trim(),
                    'email': email.text.trim(),
                    if (creating) 'contrasena': password.text,
                    'rol': role,
                    'clienteId': clientId,
                    'activo': active,
                  };
                  final ok = await app.saveUser(
                    data,
                    id: widget.user == null
                        ? null
                        : intValue(widget.user!['id']),
                  );
                  if (ok && context.mounted) Navigator.pop(context, true);
                  if (mounted) setState(() => saving = false);
                },
          child: saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Guardar'),
        ),
      ],
    );
  }
}

class _AssignmentDialog extends StatefulWidget {
  const _AssignmentDialog({required this.users, required this.clients});
  final List<Json> users;
  final List<Cliente> clients;
  @override
  State<_AssignmentDialog> createState() => _AssignmentDialogState();
}

class _AssignmentDialogState extends State<_AssignmentDialog> {
  int? advisorId;
  int? clientId;
  bool saving = false;
  @override
  Widget build(BuildContext context) {
    final advisors = widget.users.where((u) => u['rol'] == 'ASESOR').toList();
    return AlertDialog(
      title: const Text('Asignar cliente'),
      content: SizedBox(
        width: 470,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<int>(
              initialValue: advisorId,
              decoration: const InputDecoration(labelText: 'Asesor'),
              items: advisors
                  .map(
                    (u) => DropdownMenuItem(
                      value: intValue(u['id']),
                      child: Text(stringValue(u['nombre'])),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => advisorId = v),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: clientId,
              decoration: const InputDecoration(labelText: 'Cliente'),
              items: widget.clients
                  .map(
                    (c) => DropdownMenuItem(value: c.id, child: Text(c.nombre)),
                  )
                  .toList(),
              onChanged: (v) => setState(() => clientId = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: saving || advisorId == null || clientId == null
              ? null
              : () async {
                  setState(() => saving = true);
                  final ok = await context.read<AppController>().addAssignment(
                    advisorId!,
                    clientId!,
                  );
                  if (ok && context.mounted) Navigator.pop(context, true);
                  if (mounted) setState(() => saving = false);
                },
          child: const Text('Asignar'),
        ),
      ],
    );
  }
}
