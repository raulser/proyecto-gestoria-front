import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../domain/models.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({super.key});
  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  String query = '';
  String status = 'TODAS';
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final items = app.solicitudes.where((item) {
      final matchesText = '${item.titulo} ${item.nombreCliente}'
          .toLowerCase()
          .contains(query.toLowerCase());
      return matchesText && (status == 'TODAS' || item.estado == status);
    }).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PageHeader(
          eyebrow: 'Seguimiento',
          title: 'Solicitudes documentales',
          subtitle: 'Qué falta, para quién y en qué estado. Sin acciones que no expliquen qué hacen.',
          action: app.usuario?.esCliente == true
              ? null
              : FilledButton.icon(
                  onPressed: () => showDialog<void>(
                    context: context,
                    builder: (_) => const _CreateRequestDialog(),
                  ),
                  icon: const Icon(Icons.add_task_rounded),
                  label: const Text('Nueva solicitud'),
                ),
        ),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: 390,
              child: SearchField(
                onChanged: (v) => setState(() => query = v),
                hint: 'Buscar solicitud o cliente',
              ),
            ),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'TODAS', label: Text('Todas')),
                ButtonSegment(value: 'ABIERTA', label: Text('Abiertas')),
                ButtonSegment(value: 'PARCIAL', label: Text('Parciales')),
                ButtonSegment(value: 'COMPLETADA', label: Text('Completadas')),
              ],
              selected: {status},
              onSelectionChanged: (value) =>
                  setState(() => status = value.first),
              showSelectedIcon: false,
            ),
          ],
        ),
        const SizedBox(height: 18),
        if (items.isEmpty)
          const SectionCard(
            child: EmptyState(
              icon: Icons.task_alt_rounded,
              title: 'Nada por aquí',
              message: 'No hay solicitudes que coincidan con estos filtros.',
            ),
          )
        else
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _RequestCard(request: item),
            ),
          ),
      ],
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request});
  final Solicitud request;
  @override
  Widget build(BuildContext context) {
    final app = context.read<AppController>();
    final docs = app.documentsForRequest(request.id);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppColors.tealSoft,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.assignment_outlined,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        request.titulo,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        request.nombreCliente,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                StatusChip(request.estado),
              ],
            ),
            if (request.descripcion?.isNotEmpty == true) ...[
              const SizedBox(height: 15),
              Text(request.descripcion!),
            ],
            const SizedBox(height: 17),
            Wrap(
              spacing: 18,
              runSpacing: 8,
              children: [
                _Meta(
                  icon: Icons.event_outlined,
                  text: request.fechaVencimiento == null
                      ? 'Sin fecha límite'
                      : 'Límite ${dateFormat.format(request.fechaVencimiento!)}',
                ),
                _Meta(
                  icon: Icons.attach_file_rounded,
                  text: '${docs.length} documentos',
                ),
                if (request.nombreAsesor != null)
                  _Meta(
                    icon: Icons.support_agent_rounded,
                    text: request.nombreAsesor!,
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => showModalBottomSheet<void>(
                    context: context,
                    showDragHandle: true,
                    isScrollControlled: true,
                    builder: (_) => _RequestDetail(request: request),
                  ),
                  icon: const Icon(Icons.forum_outlined),
                  label: const Text('Detalle y mensajes'),
                ),
                TextButton.icon(
                  onPressed: () => showModalBottomSheet<void>(
                    context: context,
                    showDragHandle: true,
                    builder: (_) =>
                        _RequestDocuments(request: request, documents: docs),
                  ),
                  icon: const Icon(Icons.folder_open_outlined),
                  label: const Text('Ver documentos'),
                ),
                const SizedBox(width: 8),
                if (request.editable && app.usuario?.esCliente != true)
                  FilledButton.tonalIcon(
                    onPressed: () => showDialog<void>(
                      context: context,
                      builder: (_) => _EditRequestDialog(request: request),
                    ),
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Editar solicitud'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 18, color: AppColors.teal),
      const SizedBox(width: 6),
      Text(text),
    ],
  );
}

class _EditRequestDialog extends StatefulWidget {
  const _EditRequestDialog({required this.request});
  final Solicitud request;
  @override
  State<_EditRequestDialog> createState() => _EditRequestDialogState();
}

class _EditRequestDialogState extends State<_EditRequestDialog> {
  late final title = TextEditingController(text: widget.request.titulo);
  late final description = TextEditingController(
    text: widget.request.descripcion ?? '',
  );
  late DateTime dueDate =
      widget.request.fechaVencimiento ??
      DateTime.now().add(const Duration(days: 7));
  bool saving = false;
  @override
  void dispose() {
    title.dispose();
    description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Editar solicitud'),
    content: SizedBox(
      width: 520,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Los cambios se guardarán y el cliente verá la solicitud actualizada.',
              style: TextStyle(color: AppColors.inkSoft),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: title,
              decoration: const InputDecoration(labelText: 'Título'),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: description,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Descripción',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 14),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 1095)),
                  initialDate: dueDate,
                );
                if (picked != null) setState(() => dueDate = picked);
              },
              borderRadius: BorderRadius.circular(14),
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Fecha límite',
                  prefixIcon: Icon(Icons.event_outlined),
                ),
                child: Text(dateFormat.format(dueDate)),
              ),
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
        onPressed: saving || title.text.trim().isEmpty
            ? null
            : () async {
                setState(() => saving = true);
                final ok = await context.read<AppController>().updateRequest(
                  widget.request,
                  title: title.text.trim(),
                  description: description.text.trim(),
                  dueDate: dueDate,
                );
                if (ok && context.mounted) Navigator.pop(context);
                if (mounted) setState(() => saving = false);
              },
        child: saving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Text('Guardar cambios'),
      ),
    ],
  );
}

class _RequestDocuments extends StatelessWidget {
  const _RequestDocuments({required this.request, required this.documents});
  final Solicitud request;
  final List<Documento> documents;
  @override
  Widget build(BuildContext context) => SafeArea(
    child: SizedBox(
      height: MediaQuery.sizeOf(context).height * .55,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 0, 22, 25),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(request.titulo, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 5),
            Text(request.nombreCliente),
            const SizedBox(height: 18),
            Expanded(
              child: documents.isEmpty
                  ? const EmptyState(
                      icon: Icons.folder_open_rounded,
                      title: 'Sin documentos todavía',
                      message: 'La solicitud sigue abierta y aún no tiene archivos asociados.',
                    )
                  : ListView.separated(
                      itemCount: documents.length,
                      separatorBuilder: (_, _) => const Divider(),
                      itemBuilder: (_, i) => ListTile(
                        leading: const Icon(
                          Icons.description_outlined,
                          color: AppColors.teal,
                        ),
                        title: Text(documents[i].nombreArchivo),
                        subtitle: Text(etiqueta(documents[i].tipo)),
                        trailing: StatusChip(documents[i].estado),
                      ),
                    ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _CreateRequestDialog extends StatefulWidget {
  const _CreateRequestDialog();
  @override
  State<_CreateRequestDialog> createState() => _CreateRequestDialogState();
}

class _CreateRequestDialogState extends State<_CreateRequestDialog> {
  final title = TextEditingController();
  final description = TextEditingController();
  int? clientId;
  DateTime dueDate = DateTime.now().add(const Duration(days: 10));
  String recurrence = 'NINGUNA';
  final types = <String>{'OTRO'};
  bool saving = false;
  @override
  void dispose() {
    title.dispose();
    description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppController>();
    return AlertDialog(
      title: const Text('Nueva solicitud'),
      content: SizedBox(
        width: 580,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                initialValue: clientId,
                decoration: const InputDecoration(labelText: 'Cliente'),
                items: app.clientes
                    .map(
                      (c) =>
                          DropdownMenuItem(value: c.id, child: Text(c.nombre)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => clientId = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: title,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(labelText: 'Título'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: description,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Qué debe aportar',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(
                            const Duration(days: 1095),
                          ),
                          initialDate: dueDate,
                        );
                        if (picked != null) setState(() => dueDate = picked);
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Fecha límite',
                          prefixIcon: Icon(Icons.event_outlined),
                        ),
                        child: Text(dateFormat.format(dueDate)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: recurrence,
                      decoration: const InputDecoration(
                        labelText: 'Recurrencia',
                      ),
                      items: const ['NINGUNA', 'MENSUAL', 'TRIMESTRAL', 'ANUAL']
                          .map(
                            (v) => DropdownMenuItem(
                              value: v,
                              child: Text(etiqueta(v)),
                            ),
                          )
                          .toList(),
                      onChanged: (v) =>
                          setState(() => recurrence = v ?? recurrence),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Documentos esperados',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children:
                    const [
                          'FACTURA_EMITIDA',
                          'FACTURA_RECIBIDA',
                          'NOMINA',
                          'CONTRATO',
                          'EXTRACTO_BANCARIO',
                          'JUSTIFICANTE',
                          'MODELO_TRIBUTARIO',
                          'OTRO',
                        ]
                        .map(
                          (v) => FilterChip(
                            label: Text(etiqueta(v)),
                            selected: types.contains(v),
                            onSelected: (selected) => setState(() {
                              if (selected) {
                                types.add(v);
                              } else if (types.length > 1) {
                                types.remove(v);
                              }
                            }),
                          ),
                        )
                        .toList(),
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
          onPressed: saving || clientId == null || title.text.trim().isEmpty
              ? null
              : () async {
                  setState(() => saving = true);
                  final ok = await app.createRequest({
                    'clienteId': clientId,
                    'asesorAsignadoId': null,
                    'titulo': title.text.trim(),
                    'descripcion': description.text.trim(),
                    'tiposDocumentoEsperados': types.toList(),
                    'anio': dueDate.year,
                    'trimestre': ((dueDate.month - 1) ~/ 3) + 1,
                    'fechaVencimiento': dueDate
                        .toIso8601String()
                        .split('T')
                        .first,
                    'recurrencia': recurrence,
                    'cumplimientoObligacionId': null,
                  });
                  if (ok && context.mounted) Navigator.pop(context);
                  if (mounted) setState(() => saving = false);
                },
          child: saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Crear solicitud'),
        ),
      ],
    );
  }
}

class _RequestDetail extends StatefulWidget {
  const _RequestDetail({required this.request});
  final Solicitud request;
  @override
  State<_RequestDetail> createState() => _RequestDetailState();
}

class _RequestDetailState extends State<_RequestDetail> {
  late Future<List<ComentarioSolicitud>> comments;
  final message = TextEditingController();
  bool busy = false;
  @override
  void initState() {
    super.initState();
    comments = context.read<AppController>().api.comentarios(widget.request.id);
  }

  @override
  void dispose() {
    message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = context.read<AppController>();
    final client = app.usuario?.esCliente == true;
    return SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * .82,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 0, 22, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.request.titulo,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(widget.request.nombreCliente),
                      ],
                    ),
                  ),
                  StatusChip(widget.request.estado),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (client && widget.request.editable)
                    FilledButton.tonalIcon(
                      onPressed: busy ? null : () => _action('enviar'),
                      icon: const Icon(Icons.send_rounded),
                      label: const Text('Marcar documentación enviada'),
                    ),
                  if (client && widget.request.estado == 'COMPLETADA')
                    OutlinedButton.icon(
                      onPressed: busy
                          ? null
                          : () => _actionWithReason(
                              'solicitar-reapertura',
                              '¿Por qué necesitas reabrirla?',
                            ),
                      icon: const Icon(Icons.lock_open_outlined),
                      label: const Text('Solicitar reapertura'),
                    ),
                  if (!client &&
                      widget.request.reaperturaSolicitadaEn != null) ...[
                    FilledButton.tonal(
                      onPressed: busy
                          ? null
                          : () => _action('aprobar-reapertura'),
                      child: const Text('Aprobar reapertura'),
                    ),
                    OutlinedButton(
                      onPressed: busy
                          ? null
                          : () => _actionWithReason(
                              'rechazar-reapertura',
                              'Motivo del rechazo',
                            ),
                      child: const Text('Rechazar'),
                    ),
                  ],
                  if (!client && widget.request.editable) ...[
                    FilledButton.icon(
                      onPressed: busy
                          ? null
                          : () => _changeState(
                              'COMPLETADA',
                              'Notas de cierre (opcional)',
                              optionalReason: true,
                            ),
                      icon: const Icon(Icons.check_circle_outline_rounded),
                      label: const Text('Completar'),
                    ),
                    OutlinedButton.icon(
                      onPressed: busy
                          ? null
                          : () => _changeState(
                              'CANCELADA',
                              'Motivo de cancelación',
                            ),
                      icon: const Icon(Icons.cancel_outlined),
                      label: const Text('Cancelar'),
                    ),
                  ],
                  if (!client &&
                      !widget.request.editable &&
                      widget.request.reaperturaSolicitadaEn == null)
                    OutlinedButton.icon(
                      onPressed: busy
                          ? null
                          : () => _actionWithReason(
                              'reabrir',
                              'Motivo de reapertura',
                            ),
                      icon: const Icon(Icons.lock_open_outlined),
                      label: const Text('Reabrir solicitud'),
                    ),
                ],
              ),
              const Divider(height: 28),
              Text(
                'Conversación',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              Expanded(
                child: FutureBuilder<List<ComentarioSolicitud>>(
                  future: comments,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState != ConnectionState.done) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    final values = snapshot.data ?? const [];
                    if (values.isEmpty) {
                      return const EmptyState(
                        icon: Icons.chat_bubble_outline_rounded,
                        title: 'Sin mensajes',
                        message: 'Utiliza esta conversación para resolver dudas sobre la documentación.',
                      );
                    }
                    return ListView.builder(
                      itemCount: values.length,
                      itemBuilder: (_, i) {
                        final item = values[i];
                        return Align(
                          alignment: item.rolAutor == app.usuario?.rol
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 520),
                            margin: const EdgeInsets.only(bottom: 9),
                            padding: const EdgeInsets.all(13),
                            decoration: BoxDecoration(
                              color: item.rolAutor == app.usuario?.rol
                                  ? AppColors.tealSoft
                                  : AppColors.canvas,
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.nombreAutor,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    color: AppColors.teal,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(item.texto),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: message,
                      minLines: 1,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Escribe un mensaje…',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: busy ? null : _sendComment,
                    icon: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _sendComment() async {
    final value = message.text.trim();
    if (value.isEmpty) return;
    setState(() => busy = true);
    final app = context.read<AppController>();
    try {
      final ok = await app.addRequestComment(widget.request, value);
      if (!ok) return;
      message.clear();
      setState(() => comments = app.api.comentarios(widget.request.id));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _action(String action, {String? reason}) async {
    setState(() => busy = true);
    final ok = await context.read<AppController>().requestAction(
      widget.request,
      action,
      reason: reason,
    );
    if (ok && mounted) Navigator.pop(context);
    if (mounted) setState(() => busy = false);
  }

  Future<void> _actionWithReason(String action, String title) async {
    final reason = await _requestReason(context, title);
    if (reason == null) return;
    await _action(action, reason: reason);
  }

  Future<void> _changeState(
    String state,
    String title, {
    bool optionalReason = false,
  }) async {
    final reason = await _requestReason(
      context,
      title,
      optional: optionalReason,
    );
    if (!optionalReason && reason == null) return;
    if (!mounted) return;
    setState(() => busy = true);
    final ok = await context.read<AppController>().updateRequestState(
      widget.request,
      state,
      description: reason,
    );
    if (ok && mounted) Navigator.pop(context);
    if (mounted) setState(() => busy = false);
  }
}

Future<String?> _requestReason(
  BuildContext context,
  String title, {
  bool optional = false,
}) async {
  final controller = TextEditingController();
  final result = await showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: TextField(
        controller: controller,
        autofocus: true,
        maxLines: 3,
        decoration: const InputDecoration(labelText: 'Motivo'),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            final text = controller.text.trim();
            if (text.isNotEmpty || optional) Navigator.pop(dialogContext, text);
          },
          child: const Text('Continuar'),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}
