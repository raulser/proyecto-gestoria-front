import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final client = app.usuario?.esCliente == true;
    final upcoming = [...app.vencimientos]
      ..sort(
        (a, b) => (a.fechaLimite ?? DateTime(2100)).compareTo(
          b.fechaLimite ?? DateTime(2100),
        ),
      );
    final pendingDocs = app.documentos
        .where((d) => d.estado == 'RECIBIDO' || d.estado == 'PENDIENTE')
        .length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PageHeader(
          eyebrow: 'Resumen',
          title: 'Hola, ${app.usuario?.nombre.split(' ').first ?? ''}',
          subtitle: client
              ? 'Aquí tienes lo importante de tu expediente.'
              : 'Todo lo que necesita atención, de un vistazo.',
          action: IconButton.filledTonal(
            onPressed: app.refresh,
            tooltip: 'Actualizar',
            icon: const Icon(Icons.refresh_rounded),
          ),
        ),
        AdaptiveGrid(
          children: client
              ? [
                  MetricCard(
                    label: 'Próximos vencimientos',
                    value:
                        '${upcoming.where((v) => !v.vencida).take(30).length}',
                    icon: Icons.event_available_rounded,
                  ),
                  MetricCard(
                    label: 'Solicitudes abiertas',
                    value:
                        '${app.solicitudes.where((s) => s.estado == 'ABIERTA' || s.estado == 'PARCIAL').length}',
                    icon: Icons.task_alt_rounded,
                    tone: AppColors.warning,
                  ),
                  MetricCard(
                    label: 'Documentos compartidos',
                    value: '${app.documentos.length}',
                    icon: Icons.folder_copy_outlined,
                    tone: AppColors.ink,
                  ),
                ]
              : [
                  MetricCard(
                    label: 'Clientes activos',
                    value: '${app.resumen.totalClientes}',
                    icon: Icons.people_alt_outlined,
                  ),
                  MetricCard(
                    label: 'Trimestres pendientes',
                    value: '${app.resumen.trimestresFaltantes}',
                    icon: Icons.calendar_month_rounded,
                    tone: AppColors.warning,
                  ),
                  MetricCard(
                    label: 'Documentos por revisar',
                    value: '$pendingDocs',
                    icon: Icons.rate_review_outlined,
                    tone: AppColors.coral,
                  ),
                  MetricCard(
                    label: 'Documentos revisados',
                    value: '${app.resumen.documentosRevisados}',
                    icon: Icons.verified_outlined,
                    tone: AppColors.success,
                  ),
                ],
        ),
        const SizedBox(height: 22),
        LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth > 850;
            final agenda = SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Próximos vencimientos',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      Text(
                        '${app.year}',
                        style: const TextStyle(
                          color: AppColors.teal,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  if (upcoming.isEmpty)
                    const EmptyState(
                      icon: Icons.event_busy_outlined,
                      title: 'Agenda al día',
                      message: 'No hay vencimientos generados para este año.',
                    )
                  else
                    ...upcoming
                        .take(6)
                        .map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            child: Row(
                              children: [
                                Container(
                                  width: 46,
                                  height: 46,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: item.vencida
                                        ? AppColors.danger.withValues(
                                            alpha: .08,
                                          )
                                        : AppColors.tealSoft,
                                    borderRadius: BorderRadius.circular(13),
                                  ),
                                  child: Text(
                                    item.fechaLimite == null
                                        ? '—'
                                        : '${item.fechaLimite!.day}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      color: item.vencida
                                          ? AppColors.danger
                                          : AppColors.teal,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 13),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${item.codigo} · ${item.nombre}',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.ink,
                                        ),
                                      ),
                                      if (!client)
                                        Text(
                                          item.nombreCliente,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                StatusChip(
                                  item.vencida ? 'VENCIDA' : item.estado,
                                ),
                              ],
                            ),
                          ),
                        ),
                ],
              ),
            );
            final activity = SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Actividad reciente',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 18),
                  if (app.notificaciones.isEmpty)
                    const EmptyState(
                      icon: Icons.notifications_none_rounded,
                      title: 'Sin avisos',
                      message: 'Las novedades importantes aparecerán aquí.',
                    )
                  else
                    ...app.notificaciones
                        .take(5)
                        .map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  margin: const EdgeInsets.only(top: 5),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: item.leida
                                        ? AppColors.line
                                        : AppColors.coral,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.titulo,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.ink,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        item.cuerpo,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                ],
              ),
            );
            if (!wide) {
              return Column(
                children: [agenda, const SizedBox(height: 16), activity],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 6, child: agenda),
                const SizedBox(width: 16),
                Expanded(flex: 4, child: activity),
              ],
            );
          },
        ),
      ],
    );
  }
}
