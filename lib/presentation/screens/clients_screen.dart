import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../domain/models.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});
  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  String query = '';
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    if (app.usuario?.esCliente == true) {
      final client = app.clienteSeleccionado;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PageHeader(
            eyebrow: 'Mi espacio',
            title: 'Mi expediente',
            subtitle: 'Obligaciones, solicitudes y documentos organizados en un solo lugar.',
          ),
          if (client == null)
            const SectionCard(
              child: EmptyState(
                icon: Icons.person_off_outlined,
                title: 'Expediente no vinculado',
                message: 'Tu usuario todavía no está asociado a una ficha de cliente.',
              ),
            )
          else
            ClientDossier(client: client),
        ],
      );
    }
    final filtered = app.clientes
        .where(
          (client) => '${client.nombre} ${client.nif} ${client.email}'
              .toLowerCase()
              .contains(query.toLowerCase()),
        )
        .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PageHeader(
          eyebrow: 'Cartera',
          title: 'Clientes',
          subtitle: 'Busca una ficha y entra en todo su contexto sin saltar entre pantallas.',
          action: FilledButton.icon(
            onPressed: () => showDialog<void>(
              context: context,
              builder: (_) => const _ClientDialog(),
            ),
            icon: const Icon(Icons.person_add_alt_1_rounded),
            label: const Text('Nuevo cliente'),
          ),
        ),
        SearchField(
          onChanged: (value) => setState(() => query = value),
          hint: 'Buscar por nombre, NIF o correo',
        ),
        const SizedBox(height: 18),
        if (filtered.isEmpty)
          const SectionCard(
            child: EmptyState(
              icon: Icons.search_off_rounded,
              title: 'No hay coincidencias',
              message: 'Prueba con otro nombre, NIF o correo.',
            ),
          )
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final count = width > 1100
                  ? 3
                  : width > 650
                  ? 2
                  : 1;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filtered.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: count,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: count == 1 ? 3.2 : 2.25,
                ),
                itemBuilder: (context, index) {
                  final client = filtered[index];
                  return Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () async {
                        await app.selectClient(client);
                        if (context.mounted) {
                          await showDialog<void>(
                            context: context,
                            builder: (_) => Dialog.fullscreen(
                              child: _DossierDialog(client: client),
                            ),
                          );
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.tealSoft,
                                  foregroundColor: AppColors.teal,
                                  child: Text(
                                    client.nombre.isEmpty
                                        ? '?'
                                        : client.nombre[0].toUpperCase(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    client.nombre,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium,
                                  ),
                                ),
                                PopupMenuButton<String>(
                                  tooltip: 'Acciones del cliente',
                                  onSelected: (value) async {
                                    if (value == 'edit') {
                                      await showDialog<void>(
                                        context: context,
                                        builder: (_) =>
                                            _ClientDialog(client: client),
                                      );
                                    }
                                  },
                                  itemBuilder: (_) => const [
                                    PopupMenuItem(
                                      value: 'edit',
                                      child: ListTile(
                                        contentPadding: EdgeInsets.zero,
                                        leading: Icon(Icons.edit_outlined),
                                        title: Text('Editar ficha'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              client.nif,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              client.email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                StatusChip(
                                  client.activo ? 'ACTIVO' : 'INACTIVO',
                                ),
                                const Spacer(),
                                Text(
                                  etiqueta(client.tipo),
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
      ],
    );
  }
}

class _DossierDialog extends StatelessWidget {
  const _DossierDialog({required this.client});
  final Cliente client;
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.canvas,
    appBar: AppBar(
      backgroundColor: AppColors.canvas,
      title: Text(client.nombre),
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: const Icon(Icons.close_rounded),
      ),
    ),
    body: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 40),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1180),
          child: ClientDossier(client: client),
        ),
      ),
    ),
  );
}

class ClientDossier extends StatefulWidget {
  const ClientDossier({super.key, required this.client});
  final Cliente client;
  @override
  State<ClientDossier> createState() => _ClientDossierState();
}

class _ClientDossierState extends State<ClientDossier>
    with SingleTickerProviderStateMixin {
  late final TabController tabs = TabController(length: 4, vsync: this);
  @override
  void dispose() {
    tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final docs = app.documentsForClient(widget.client.id);
    final requests = app.requestsForClient(widget.client.id);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionCard(
          child: Wrap(
            runSpacing: 18,
            spacing: 28,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              CircleAvatar(
                radius: 31,
                backgroundColor: AppColors.ink,
                foregroundColor: Colors.white,
                child: Text(
                  widget.client.nombre.isEmpty ? '?' : widget.client.nombre[0],
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              SizedBox(
                width: 310,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.client.nombre,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 5),
                    Text(
                      '${widget.client.nif} · ${etiqueta(widget.client.tipo)}',
                    ),
                  ],
                ),
              ),
              _MiniStat(
                value:
                    '${app.obligaciones.where((o) => o.clienteId == widget.client.id && o.activa).length}',
                label: 'Obligaciones',
              ),
              _MiniStat(
                value:
                    '${requests.where((r) => r.estado == 'ABIERTA' || r.estado == 'PARCIAL').length}',
                label: 'Solicitudes abiertas',
              ),
              _MiniStat(value: '${docs.length}', label: 'Documentos'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SectionCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              TabBar(
                controller: tabs,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                tabs: const [
                  Tab(text: 'Obligaciones'),
                  Tab(text: 'Solicitudes'),
                  Tab(text: 'Documentos'),
                  Tab(text: 'Perfil fiscal'),
                ],
              ),
              SizedBox(
                height: 470,
                child: TabBarView(
                  controller: tabs,
                  children: [
                    _ObligationsTab(client: widget.client),
                    _RequestsTab(requests: requests),
                    _DocumentsTab(documents: docs, requests: requests),
                    _FiscalTab(client: widget.client),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.value, required this.label});
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: 120,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium
              ?.copyWith(fontSize: 25),
        ),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    ),
  );
}

class _ObligationsTab extends StatelessWidget {
  const _ObligationsTab({required this.client});
  final Cliente client;
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final items = app.obligaciones
        .where((o) => o.clienteId == client.id)
        .toList();
    final editable = app.usuario?.esCliente != true;
    return Column(
      children: [
        if (editable)
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
            child: Align(
              alignment: Alignment.centerRight,
              child: FilledButton.tonalIcon(
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (_) => _ObligationDialog(client: client),
                ),
                icon: const Icon(Icons.add_task_rounded),
                label: const Text('Añadir obligación'),
              ),
            ),
          ),
        Expanded(
          child: items.isEmpty
              ? const EmptyState(
                  icon: Icons.fact_check_outlined,
                  title: 'Sin obligaciones',
                  message: 'Todavía no se han asignado obligaciones a este expediente.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(18),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final docs = app.documentsForObligation(item.id);
                    return ListTile(
                      tileColor: AppColors.canvas,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      leading: Container(
                        width: 45,
                        height: 45,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.tealSoft,
                          borderRadius: BorderRadius.circular(13),
                        ),
                        child: Text(
                          item.codigo,
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppColors.teal,
                          ),
                        ),
                      ),
                      title: Text(
                        item.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      subtitle: Text(
                        '${etiqueta(item.categoria)} · ${etiqueta(item.periodicidad)} · ${docs.length} documentos',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (editable)
                            IconButton(
                              tooltip: 'Editar obligación',
                              onPressed: () => showDialog<void>(
                                context: context,
                                builder: (_) => _ObligationDialog(
                                  client: client,
                                  obligation: item,
                                ),
                              ),
                              icon: const Icon(Icons.edit_outlined),
                            ),
                          const Icon(Icons.chevron_right_rounded),
                        ],
                      ),
                      onTap: () => showModalBottomSheet<void>(
                        context: context,
                        showDragHandle: true,
                        isScrollControlled: true,
                        builder: (_) => _ObligationDocuments(
                          obligation: item,
                          documents: docs,
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _ObligationDocuments extends StatelessWidget {
  const _ObligationDocuments({
    required this.obligation,
    required this.documents,
  });
  final Obligacion obligation;
  final List<Documento> documents;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(22, 0, 22, 28),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .62,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${obligation.codigo} · ${obligation.nombre}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            const Text(
              'Documentos asociados mediante sus solicitudes documentales.',
            ),
            const SizedBox(height: 18),
            Expanded(
              child: documents.isEmpty
                  ? const EmptyState(
                      icon: Icons.folder_open_rounded,
                      title: 'Aún no hay documentos',
                      message: 'Cuando se adjunten a una solicitud de esta obligación aparecerán aquí.',
                    )
                  : ListView.separated(
                      itemCount: documents.length,
                      separatorBuilder: (_, _) => const Divider(),
                      itemBuilder: (_, i) =>
                          _DocumentRow(document: documents[i]),
                    ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _RequestsTab extends StatelessWidget {
  const _RequestsTab({required this.requests});
  final List<Solicitud> requests;
  @override
  Widget build(BuildContext context) => requests.isEmpty
      ? const EmptyState(
          icon: Icons.inbox_outlined,
          title: 'Sin solicitudes',
          message: 'No hay documentación pendiente para este cliente.',
        )
      : ListView.separated(
          padding: const EdgeInsets.all(18),
          itemCount: requests.length,
          separatorBuilder: (_, _) => const Divider(),
          itemBuilder: (_, i) {
            final item = requests[i];
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 4,
                vertical: 5,
              ),
              leading: const Icon(
                Icons.task_alt_rounded,
                color: AppColors.teal,
              ),
              title: Text(
                item.titulo,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text(
                item.fechaVencimiento == null
                    ? 'Sin fecha límite'
                    : 'Límite ${dateFormat.format(item.fechaVencimiento!)}',
              ),
              trailing: StatusChip(item.estado),
            );
          },
        );
}

class _DocumentsTab extends StatelessWidget {
  const _DocumentsTab({required this.documents, required this.requests});
  final List<Documento> documents;
  final List<Solicitud> requests;
  @override
  Widget build(BuildContext context) => documents.isEmpty
      ? const EmptyState(
          icon: Icons.folder_open_rounded,
          title: 'Expediente vacío',
          message: 'Los documentos subidos por el cliente o la gestoría aparecerán aquí.',
        )
      : ListView.separated(
          padding: const EdgeInsets.all(18),
          itemCount: documents.length,
          separatorBuilder: (_, _) => const Divider(),
          itemBuilder: (_, i) => _DocumentRow(
            document: documents[i],
            request: _findRequest(documents[i].solicitudId),
          ),
        );
  Solicitud? _findRequest(int? id) {
    for (final request in requests) {
      if (request.id == id) return request;
    }
    return null;
  }
}

class _DocumentRow extends StatelessWidget {
  const _DocumentRow({required this.document, this.request});
  final Documento document;
  final Solicitud? request;
  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 5),
    leading: Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: AppColors.tealSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.description_outlined, color: AppColors.teal),
    ),
    title: Text(
      document.titulo?.isNotEmpty == true
          ? document.titulo!
          : document.nombreArchivo,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(fontWeight: FontWeight.w800),
    ),
    subtitle: Text(
      request == null
          ? etiqueta(document.tipo)
          : '${request!.titulo} · ${etiqueta(document.tipo)}',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    ),
    trailing: StatusChip(document.estado),
    onTap: () => context.read<AppController>().downloadDocument(document),
  );
}

class _ClientDialog extends StatefulWidget {
  const _ClientDialog({this.client});
  final Cliente? client;
  @override
  State<_ClientDialog> createState() => _ClientDialogState();
}

class _ClientDialogState extends State<_ClientDialog> {
  final formKey = GlobalKey<FormState>();
  late final name = TextEditingController(text: widget.client?.nombre);
  late final nif = TextEditingController(text: widget.client?.nif);
  late final email = TextEditingController(text: widget.client?.email);
  late final phone = TextEditingController(text: widget.client?.telefono);
  late String type = widget.client?.tipo ?? 'AUTONOMO';
  late bool active = widget.client?.activo ?? true;
  bool saving = false;
  @override
  void dispose() {
    name.dispose();
    nif.dispose();
    email.dispose();
    phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.client == null ? 'Nuevo cliente' : 'Editar cliente'),
    content: SizedBox(
      width: 520,
      child: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: name,
                decoration: const InputDecoration(
                  labelText: 'Nombre o razón social',
                ),
                validator: (v) => v == null || v.trim().isEmpty
                    ? 'Introduce el nombre'
                    : null,
              ),
              if (widget.client != null) ...[
                const SizedBox(height: 8),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Cliente activo'),
                  subtitle: const Text(
                    'Los clientes inactivos conservan todo su histórico.',
                  ),
                  value: active,
                  onChanged: (value) => setState(() => active = value),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: nif,
                      decoration: const InputDecoration(labelText: 'NIF / CIF'),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Introduce el NIF'
                          : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: type,
                      decoration: const InputDecoration(labelText: 'Tipo'),
                      items:
                          const [
                                'AUTONOMO',
                                'EMPRESA',
                                'PARTICULAR',
                                'COMUNIDAD_BIENES',
                                'SOCIEDAD_CIVIL',
                                'COMUNIDAD_PROPIETARIOS',
                                'ASOCIACION_FUNDACION',
                                'ENTIDAD_SIN_PERSONALIDAD',
                                'OTRO',
                              ]
                              .map(
                                (v) => DropdownMenuItem(
                                  value: v,
                                  child: Text(etiqueta(v)),
                                ),
                              )
                              .toList(),
                      onChanged: (v) => setState(() => type = v ?? type),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Correo'),
                validator: (v) => v == null || !v.contains('@')
                    ? 'Introduce un correo válido'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Teléfono (opcional)',
                ),
              ),
            ],
          ),
        ),
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
                if (formKey.currentState?.validate() != true) return;
                setState(() => saving = true);
                final ok = await context.read<AppController>().saveClient({
                  'nombre': name.text.trim(),
                  'nif': nif.text.trim(),
                  'email': email.text.trim(),
                  'telefono': phone.text.trim().isEmpty
                      ? null
                      : phone.text.trim(),
                  'tipo': type,
                  'activo': active,
                }, id: widget.client?.id);
                if (ok && context.mounted) Navigator.pop(context);
                if (mounted) setState(() => saving = false);
              },
        child: saving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(widget.client == null ? 'Crear cliente' : 'Guardar cambios'),
      ),
    ],
  );
}

class _ObligationDialog extends StatefulWidget {
  const _ObligationDialog({required this.client, this.obligation});
  final Cliente client;
  final Obligacion? obligation;
  @override
  State<_ObligationDialog> createState() => _ObligationDialogState();
}

class _ObligationDialogState extends State<_ObligationDialog> {
  final formKey = GlobalKey<FormState>();
  late final code = TextEditingController(text: widget.obligation?.codigo);
  late final name = TextEditingController(text: widget.obligation?.nombre);
  late final months = TextEditingController(
    text: widget.obligation?.mesesPresentacion,
  );
  late final day = TextEditingController(
    text: widget.obligation?.diaLimite?.toString(),
  );
  late final notes = TextEditingController(
    text: widget.obligation?.observaciones,
  );
  late String category = widget.obligation?.categoria ?? 'FISCAL';
  late String periodicity = widget.obligation?.periodicidad ?? 'TRIMESTRAL';
  late bool active = widget.obligation?.activa ?? true;
  late final Set<String> documentTypes = {
    ...?widget.obligation?.tiposDocumentoEsperados,
  };
  bool saving = false;

  static const types = [
    'FACTURA_EMITIDA',
    'FACTURA_RECIBIDA',
    'NOMINA',
    'EXTRACTO_BANCARIO',
    'CONTRATO',
    'MODELO_TRIBUTARIO',
    'OTRO',
  ];

  @override
  void dispose() {
    code.dispose();
    name.dispose();
    months.dispose();
    day.dispose();
    notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(
      widget.obligation == null ? 'Añadir obligación' : 'Editar obligación',
    ),
    content: SizedBox(
      width: 620,
      child: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: code,
                      decoration: const InputDecoration(
                        labelText: 'Modelo o código',
                      ),
                      validator: _required,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: name,
                      decoration: const InputDecoration(labelText: 'Nombre'),
                      validator: _required,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: category,
                      decoration: const InputDecoration(labelText: 'Categoría'),
                      items:
                          const [
                                'FISCAL',
                                'LABORAL',
                                'CONTABLE',
                                'MERCANTIL',
                                'OTRA',
                              ]
                              .map(
                                (value) => DropdownMenuItem(
                                  value: value,
                                  child: Text(etiqueta(value)),
                                ),
                              )
                              .toList(),
                      onChanged: (value) =>
                          setState(() => category = value ?? category),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: periodicity,
                      decoration: const InputDecoration(
                        labelText: 'Periodicidad',
                      ),
                      items: const ['MENSUAL', 'TRIMESTRAL', 'ANUAL', 'PUNTUAL']
                          .map(
                            (value) => DropdownMenuItem(
                              value: value,
                              child: Text(etiqueta(value)),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => periodicity = value ?? periodicity),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: months,
                      decoration: const InputDecoration(
                        labelText: 'Meses de presentación',
                        hintText: 'Ej. 4,7,10,1',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: day,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Día límite',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) return null;
                        final parsed = int.tryParse(value);
                        return parsed == null || parsed < 1 || parsed > 31
                            ? 'Indica un día entre 1 y 31'
                            : null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Documentos habituales',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: types
                    .map(
                      (value) => FilterChip(
                        label: Text(etiqueta(value)),
                        selected: documentTypes.contains(value),
                        onSelected: (selected) => setState(
                          () => selected
                              ? documentTypes.add(value)
                              : documentTypes.remove(value),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: notes,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Observaciones',
                  alignLabelWithHint: true,
                ),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Obligación activa'),
                value: active,
                onChanged: (value) => setState(() => active = value),
              ),
            ],
          ),
        ),
      ),
    ),
    actions: [
      TextButton(
        onPressed: saving ? null : () => Navigator.pop(context),
        child: const Text('Cancelar'),
      ),
      FilledButton(
        onPressed: saving ? null : _save,
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

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Campo obligatorio' : null;

  Future<void> _save() async {
    if (formKey.currentState?.validate() != true) return;
    final app = context.read<AppController>();
    setState(() => saving = true);
    final ok = await app.saveObligation(widget.client, {
      'codigo': code.text.trim(),
      'nombre': name.text.trim(),
      'categoria': category,
      'periodicidad': periodicity,
      'mesesPresentacion': months.text.trim().isEmpty
          ? null
          : months.text.trim(),
      'diaLimite': int.tryParse(day.text.trim()),
      'observaciones': notes.text.trim().isEmpty ? null : notes.text.trim(),
      'tiposDocumentoEsperados': documentTypes.toList(),
      'activa': active,
    }, id: widget.obligation?.id);
    if (ok && mounted) Navigator.pop(context);
    if (mounted) setState(() => saving = false);
  }
}

class _FiscalTab extends StatefulWidget {
  const _FiscalTab({required this.client});
  final Cliente client;
  @override
  State<_FiscalTab> createState() => _FiscalTabState();
}

class _FiscalTabState extends State<_FiscalTab> {
  Future<List<dynamic>>? future;
  PerfilFiscal? profile;
  List<RecomendacionFiscal> recommendations = const [];
  bool saving = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    future ??= Future.wait([
      context.read<AppController>().api.perfilFiscal(widget.client.id),
      context.read<AppController>().api.recomendaciones(widget.client.id),
    ]);
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<List<dynamic>>(
    future: future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return const EmptyState(
          icon: Icons.rule_folder_outlined,
          title: 'Perfil fiscal no disponible',
          message: 'No se pudo cargar la información fiscal de este cliente.',
        );
      }
      profile ??= snapshot.data![0] as PerfilFiscal;
      if (recommendations.isEmpty) {
        recommendations = snapshot.data![1] as List<RecomendacionFiscal>;
      }
      final editable = context.read<AppController>().usuario?.esCliente != true;
      return ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Datos fiscales',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${profile!.porcentajeCompletado}% completado · ${etiqueta(profile!.estadoRevision)}',
                    ),
                  ],
                ),
              ),
              if (editable)
                FilledButton.tonalIcon(
                  onPressed: saving ? null : () => _save(reviewed: true),
                  icon: const Icon(Icons.verified_outlined),
                  label: const Text('Guardar y revisar'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              SizedBox(
                width: 240,
                child: _SelectFiscal(
                  label: 'Territorio fiscal',
                  value: profile!.territorioFiscal,
                  values: const [
                    'COMUN',
                    'CANARIAS',
                    'PAIS_VASCO',
                    'NAVARRA',
                    'CEUTA_MELILLA',
                  ],
                  enabled: editable,
                  onChanged: (v) => setState(
                    () => profile = profile!.copyWith(territorioFiscal: v),
                  ),
                ),
              ),
              SizedBox(
                width: 260,
                child: _SelectFiscal(
                  label: 'Régimen IRPF',
                  value: profile!.regimenIrpf,
                  values: const [
                    'PENDIENTE',
                    'NO_APLICA',
                    'ESTIMACION_DIRECTA_NORMAL',
                    'ESTIMACION_DIRECTA_SIMPLIFICADA',
                    'ESTIMACION_OBJETIVA',
                  ],
                  enabled: editable,
                  onChanged: (v) => setState(
                    () => profile = profile!.copyWith(regimenIrpf: v),
                  ),
                ),
              ),
              SizedBox(
                width: 240,
                child: _SelectFiscal(
                  label: 'Régimen IVA',
                  value: profile!.regimenIva,
                  values: const [
                    'PENDIENTE',
                    'NO_SUJETO_EXENTO',
                    'GENERAL',
                    'SIMPLIFICADO',
                    'RECARGO_EQUIVALENCIA',
                    'SII',
                  ],
                  enabled: editable,
                  onChanged: (v) => setState(
                    () => profile = profile!.copyWith(regimenIva: v),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: profile!.valores.entries
                .map(
                  (entry) => SizedBox(
                    width: 255,
                    child: _SelectFiscal(
                      label: etiqueta(entry.key),
                      value: entry.value,
                      values: const ['PENDIENTE', 'SI', 'NO'],
                      enabled: editable,
                      onChanged: (v) {
                        final values = {...profile!.valores, entry.key: v};
                        setState(
                          () => profile = profile!.copyWith(valores: values),
                        );
                      },
                    ),
                  ),
                )
                .toList(),
          ),
          if (editable) ...[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton.icon(
                onPressed: saving ? null : _save,
                icon: const Icon(Icons.save_outlined),
                label: const Text('Guardar borrador'),
              ),
            ),
          ],
          const Divider(height: 38),
          Text(
            'Recomendaciones de modelos',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          if (recommendations.isEmpty)
            const Text('Completa el perfil para obtener recomendaciones.')
          else
            ...recommendations.map(
              (item) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        item.codigo,
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppColors.teal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.nombre,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(item.razon),
                          if (item.advertencia != null)
                            Text(
                              item.advertencia!,
                              style: const TextStyle(
                                color: AppColors.warning,
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusChip(item.estado),
                    if (editable)
                      PopupMenuButton<String>(
                        onSelected: (action) => _recommend(item, action),
                        itemBuilder: (_) => [
                          if (item.estado != 'CONFIRMADA')
                            const PopupMenuItem(
                              value: 'confirmar',
                              child: Text('Confirmar obligación'),
                            ),
                          if (item.estado != 'DESCARTADA')
                            const PopupMenuItem(
                              value: 'descartar',
                              child: Text('Descartar'),
                            ),
                          if (item.estado == 'DESCARTADA')
                            const PopupMenuItem(
                              value: 'reabrir',
                              child: Text('Reabrir recomendación'),
                            ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
        ],
      );
    },
  );

  Future<void> _save({bool reviewed = false}) async {
    setState(() => saving = true);
    final saved = await context.read<AppController>().saveFiscalProfile(
      widget.client.id,
      profile!,
      reviewed: reviewed,
    );
    if (saved != null && mounted) {
      final recs = await context.read<AppController>().api.recomendaciones(
        widget.client.id,
      );
      setState(() {
        profile = saved;
        recommendations = recs;
      });
    }
    if (mounted) setState(() => saving = false);
  }

  Future<void> _recommend(RecomendacionFiscal item, String action) async {
    final app = context.read<AppController>();
    String? reason;
    if (action == 'descartar') {
      reason = await _askReason(context, 'Motivo para descartar');
      if (reason == null) return;
    }
    final values = await app.recommendationAction(
      widget.client.id,
      item,
      action,
      reason: reason,
    );
    if (values != null && mounted) setState(() => recommendations = values);
  }
}

class _SelectFiscal extends StatelessWidget {
  const _SelectFiscal({
    required this.label,
    required this.value,
    required this.values,
    required this.enabled,
    required this.onChanged,
  });
  final String label;
  final String value;
  final List<String> values;
  final bool enabled;
  final ValueChanged<String> onChanged;
  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    initialValue: values.contains(value) ? value : values.first,
    decoration: InputDecoration(labelText: label),
    items: values
        .map(
          (v) => DropdownMenuItem(
            value: v,
            child: Text(etiqueta(v), overflow: TextOverflow.ellipsis),
          ),
        )
        .toList(),
    onChanged: enabled
        ? (v) {
            if (v != null) onChanged(v);
          }
        : null,
  );
}

Future<String?> _askReason(BuildContext context, String title) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: TextField(
        controller: controller,
        maxLines: 3,
        autofocus: true,
        decoration: const InputDecoration(
          labelText: 'Motivo',
          alignLabelWithHint: true,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            final value = controller.text.trim();
            if (value.isNotEmpty) Navigator.pop(dialogContext, value);
          },
          child: const Text('Confirmar'),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}
