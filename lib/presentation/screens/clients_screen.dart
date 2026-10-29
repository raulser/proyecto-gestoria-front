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
        const PageHeader(
          eyebrow: 'Cartera',
          title: 'Clientes',
          subtitle: 'Busca una ficha y entra en todo su contexto sin saltar entre pantallas.',
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
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  color: AppColors.teal,
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
  late final TabController tabs = TabController(length: 3, vsync: this);
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
    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.fact_check_outlined,
        title: 'Sin obligaciones',
        message: 'Todavía no se han asignado obligaciones a este expediente.',
      );
    }
    return ListView.separated(
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
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: () => showModalBottomSheet<void>(
            context: context,
            showDragHandle: true,
            isScrollControlled: true,
            builder: (_) =>
                _ObligationDocuments(obligation: item, documents: docs),
          ),
        );
      },
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
  );
}
