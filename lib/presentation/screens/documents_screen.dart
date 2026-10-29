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
        const PageHeader(
          eyebrow: 'Archivo',
          title: 'Documentos',
          subtitle: 'Ordenados primero por cliente y después por la solicitud u obligación que les da contexto.',
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
              if (value == 'REVISADO' || value == 'RECHAZADO') {
                await context.read<AppController>().api.cambiarEstadoDocumento(
                  document.id,
                  value,
                );
              }
              if (context.mounted) {
                await context.read<AppController>().refresh();
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'REVISADO', child: Text('Marcar revisado')),
              PopupMenuItem(
                value: 'RECHAZADO',
                child: Text('Rechazar con revisión'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
