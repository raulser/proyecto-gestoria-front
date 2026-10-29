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
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: 390,
              child: SearchField(
                onChanged: (v) => setState(() => query = v),
                hint: 'Buscar archivo, cliente o tipo',
              ),
            ),
            DropdownButton<String>(
              value: status,
              borderRadius: BorderRadius.circular(14),
              items:
                  const [
                        'TODOS',
                        'RECIBIDO',
                        'REVISADO',
                        'RECHAZADO',
                        'PUBLICADO',
                      ]
                      .map(
                        (v) => DropdownMenuItem(
                          value: v,
                          child: Text(
                            v == 'TODOS' ? 'Todos los estados' : etiqueta(v),
                          ),
                        ),
                      )
                      .toList(),
              onChanged: (v) => setState(() => status = v ?? 'TODOS'),
            ),
          ],
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
                    ...entry.value.map(
                      (doc) => _DocumentItem(
                        document: doc,
                        request: _request(app.solicitudes, doc.solicitudId),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Solicitud? _request(List<Solicitud> values, int? id) {
    for (final item in values) {
      if (item.id == id) return item;
    }
    return null;
  }
}

class _DocumentItem extends StatelessWidget {
  const _DocumentItem({required this.document, this.request});
  final Documento document;
  final Solicitud? request;
  @override
  Widget build(BuildContext context) {
    final contextText = request == null
        ? 'Sin solicitud asociada'
        : request!.cumplimientoObligacionId == null
        ? 'Solicitud · ${request!.titulo}'
        : 'Obligación / solicitud · ${request!.titulo}';
    return Container(
      margin: const EdgeInsets.only(top: 9),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(15),
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
                  '$contextText · ${etiqueta(document.tipo)}',
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
