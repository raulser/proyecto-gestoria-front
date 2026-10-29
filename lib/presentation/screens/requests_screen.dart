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
        const PageHeader(
          eyebrow: 'Seguimiento',
          title: 'Solicitudes documentales',
          subtitle: 'Qué falta, para quién y en qué estado. Sin acciones que no expliquen qué hacen.',
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
