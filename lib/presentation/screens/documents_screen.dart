import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../domain/models.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});
  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  String query = '';
  String status = 'TODOS';
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final items = app.documentos
        .where(
          (doc) =>
              '${doc.nombreArchivo} ${doc.nombreCliente} ${doc.tipo}'
                  .toLowerCase()
                  .contains(query.toLowerCase()) &&
              (status == 'TODOS' || doc.estado == status),
        )
        .toList();
    final groups = <String, List<Documento>>{};
    for (final item in items) {
      groups.putIfAbsent(item.nombreCliente, () => []).add(item);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PageHeader(
          eyebrow: 'Archivo',
          title: 'Documentos',
          subtitle: 'Ordenados primero por cliente y después por la solicitud u obligación que les da contexto.',
          action: OutlinedButton.icon(
            onPressed: () => app.exportDocuments(),
            icon: const Icon(Icons.archive_outlined),
            label: Text('Exportar ${app.year}'),
          ),
        ),
        _DocumentFilters(
          status: status,
          onQueryChanged: (value) => setState(() => query = value),
          onStatusChanged: (value) => setState(() => status = value),
        ),
        const SizedBox(height: 18),
        if (groups.isEmpty)
          const SectionCard(
            child: EmptyState(
              icon: Icons.folder_open_rounded,
              title: 'No hay documentos',
              message: 'No hay archivos que coincidan con estos filtros.',
            ),
          )
        else
          ...groups.entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.ink,
                          foregroundColor: Colors.white,
                          child: Text(entry.key.isEmpty ? '?' : entry.key[0]),
                        ),
                        const SizedBox(width: 11),
                        Expanded(
                          child: Text(
                            entry.key,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        Text(
                          '${entry.value.length} archivos',
                          style: const TextStyle(
                            color: AppColors.teal,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    _ClientDocumentGroups(
                      documents: entry.value,
                      requests: app.solicitudes,
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ClientDocumentGroups extends StatelessWidget {
  const _ClientDocumentGroups({
    required this.documents,
    required this.requests,
  });
  final List<Documento> documents;
  final List<Solicitud> requests;

  @override
  Widget build(BuildContext context) {
    final requestsById = {for (final request in requests) request.id: request};
    final groups = <String, List<Documento>>{};
    final groupRequests = <String, Solicitud?>{};
    for (final document in documents) {
      final request = requestsById[document.solicitudId];
      final key = request == null
          ? 'GENERAL'
          : request.cumplimientoObligacionId == null
          ? 'SOLICITUD_${request.id}'
          : 'OBLIGACION_${request.id}';
      groups.putIfAbsent(key, () => []).add(document);
      groupRequests[key] = request;
    }
    return Column(
      children: groups.entries.map((entry) {
        final request = groupRequests[entry.key];
        final obligation = request?.cumplimientoObligacionId != null;
        final title = request == null
            ? 'Documentos generales'
            : obligation
            ? 'Obligación · ${request.titulo}'
            : 'Solicitud · ${request.titulo}';
        return Container(
          margin: const EdgeInsets.only(top: 10),
          padding: const EdgeInsets.fromLTRB(12, 11, 12, 12),
          decoration: BoxDecoration(
            color: AppColors.canvas,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    obligation
                        ? Icons.fact_check_outlined
                        : request == null
                        ? Icons.folder_outlined
                        : Icons.task_alt_outlined,
                    size: 19,
                    color: AppColors.teal,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    '${entry.value.length}',
                    style: const TextStyle(
                      color: AppColors.inkSoft,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              ...entry.value.map(
                (document) => _DocumentItem(document: document),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _DocumentFilters extends StatelessWidget {
  const _DocumentFilters({
    required this.status,
    required this.onQueryChanged,
    required this.onStatusChanged,
  });
  final String status;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final compact = constraints.maxWidth < 680;
      final search = SearchField(
        onChanged: onQueryChanged,
        hint: 'Buscar por archivo, cliente o tipo',
      );
      final state = DropdownButtonFormField<String>(
        initialValue: status,
        decoration: const InputDecoration(
          labelText: 'Estado',
          prefixIcon: Icon(Icons.filter_list_rounded),
        ),
        items:
            const [
                  'TODOS',
                  'RECIBIDO',
                  'REVISADO',
                  'RECHAZADO',
                  'PUBLICADO',
                  'RETIRADO',
                ]
                .map(
                  (value) => DropdownMenuItem(
                    value: value,
                    child: Text(
                      value == 'TODOS' ? 'Todos los estados' : etiqueta(value),
                    ),
                  ),
                )
                .toList(),
        onChanged: (value) => onStatusChanged(value ?? 'TODOS'),
      );
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(14),
        ),
        child: compact
            ? Column(children: [search, const SizedBox(height: 10), state])
            : Row(
                children: [
                  Expanded(child: search),
                  const SizedBox(width: 12),
                  SizedBox(width: 230, child: state),
                ],
              ),
      );
    },
  );
}

class _DocumentItem extends StatelessWidget {
  const _DocumentItem({required this.document});
  final Documento document;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 9),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            width: 43,
            height: 43,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.description_outlined,
              color: AppColors.teal,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.titulo?.isNotEmpty == true
                      ? document.titulo!
                      : document.nombreArchivo,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  etiqueta(document.tipo),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          StatusChip(document.estado),
          PopupMenuButton<String>(
            tooltip: 'Acciones',
            onSelected: (value) async {
              final app = context.read<AppController>();
              if (value == 'DESCARGAR') {
                await app.downloadDocument(document);
              } else if (value == 'REVISADO') {
                await app.reviewDocument(document, value);
              } else if (value == 'RECHAZADO') {
                final reason = await _documentReason(
                  context,
                  title: 'Rechazar documento',
                  label: 'Explica qué debe corregirse',
                  action: 'Rechazar',
                );
                if (reason != null) {
                  await app.reviewDocument(document, value, comment: reason);
                }
              } else if (value == 'ASOCIAR') {
                final selection = await _selectRequest(
                  context,
                  app.requestsForClient(document.clienteId),
                  document.solicitudId,
                );
                if (selection != null) {
                  await app.associateDocument(
                    document,
                    selection == -1 ? null : selection,
                  );
                }
              } else if (value == 'PUBLICAR' ||
                  value == 'RETIRAR-PUBLICACION') {
                await app.documentAction(document, value.toLowerCase());
              } else if (value == 'RETIRAR') {
                final reason = await _documentReason(
                  context,
                  title: 'Retirar documento',
                  label: 'Motivo de retirada',
                  action: 'Retirar',
                );
                if (reason != null) {
                  await app.documentAction(document, 'retirar', reason: reason);
                }
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'DESCARGAR', child: Text('Descargar')),
              if (context.read<AppController>().usuario?.esCliente != true) ...[
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'ASOCIAR',
                  child: Text('Asociar a una solicitud'),
                ),
                const PopupMenuItem(
                  value: 'REVISADO',
                  child: Text('Marcar revisado'),
                ),
                const PopupMenuItem(
                  value: 'RECHAZADO',
                  child: Text('Rechazar con revisión'),
                ),
                if (document.estado != 'PUBLICADO')
                  const PopupMenuItem(
                    value: 'PUBLICAR',
                    child: Text('Publicar al cliente'),
                  ),
                if (document.estado == 'PUBLICADO')
                  const PopupMenuItem(
                    value: 'RETIRAR-PUBLICACION',
                    child: Text('Retirar publicación'),
                  ),
              ],
              if (document.estado != 'RETIRADO')
                const PopupMenuItem(
                  value: 'RETIRAR',
                  child: Text('Retirar documento'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

Future<String?> _documentReason(
  BuildContext context, {
  required String title,
  required String label,
  required String action,
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
        decoration: InputDecoration(labelText: label),
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
          child: Text(action),
        ),
      ],
    ),
  );
  controller.dispose();
  return result;
}

Future<int?> _selectRequest(
  BuildContext context,
  List<Solicitud> requests,
  int? selectedId,
) => showDialog<int>(
  context: context,
  builder: (dialogContext) => SimpleDialog(
    title: const Text('Asociar documento'),
    children: [
      if (selectedId != null)
        SimpleDialogOption(
          onPressed: () => Navigator.pop(dialogContext, -1),
          child: const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.link_off_rounded),
            title: Text('Quitar asociación actual'),
          ),
        ),
      ...requests.map(
        (request) => SimpleDialogOption(
          onPressed: () => Navigator.pop(dialogContext, request.id),
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(
              request.id == selectedId
                  ? Icons.check_circle_rounded
                  : Icons.task_alt_outlined,
              color: request.id == selectedId ? AppColors.teal : null,
            ),
            title: Text(request.titulo),
            subtitle: Text(etiqueta(request.estado)),
          ),
        ),
      ),
      if (requests.isEmpty)
        const Padding(
          padding: EdgeInsets.all(20),
          child: Text('Este cliente no tiene solicitudes disponibles.'),
        ),
    ],
  ),
);
