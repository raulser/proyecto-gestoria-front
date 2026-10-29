import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_theme.dart';
import '../../domain/models.dart';
import '../../state/app_controller.dart';
import '../widgets/common.dart';

const _documentTypes = [
  'FACTURA_EMITIDA',
  'FACTURA_RECIBIDA',
  'TICKET',
  'NOMINA',
  'CONTRATO',
  'EXTRACTO_BANCARIO',
  'JUSTIFICANTE',
  'ESCRITURA',
  'MODELO_TRIBUTARIO',
  'JUSTIFICANTE_PRESENTACION',
  'COMUNICACION_ADMINISTRACION',
  'OTRO',
];

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});
  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  PlatformFile? file;
  Uint8List? fileBytes;
  int fileSize = 0;
  int? clientId;
  int? requestId;
  String type = 'OTRO';
  bool dragging = false;

  Future<void> pick() async {
    final selected = await FilePicker.pickFile();
    if (selected == null) return;
    final bytes = await selected.readAsBytes();
    final size =
        selected.lengthSync() ?? await selected.length() ?? bytes.length;
    if (mounted) {
      setState(() {
        file = selected;
        fileBytes = bytes;
        fileSize = size;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    clientId ??= app.usuario?.esCliente == true
        ? app.clienteSeleccionado?.id
        : null;
    final availableRequests = app.solicitudes
        .where(
          (s) =>
              s.clienteId == clientId &&
              (s.estado == 'ABIERTA' || s.estado == 'PARCIAL'),
        )
        .toList();
    final uploading = app.uploadFileName != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PageHeader(
          eyebrow: 'Nueva aportación',
          title: 'Subir documento',
          subtitle: 'Elige el archivo y su contexto. Verás el progreso hasta que quede guardado.',
        ),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 820),
            child: SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  InkWell(
                    onTap: uploading ? null : pick,
                    onHover: (value) => setState(() => dragging = value),
                    borderRadius: BorderRadius.circular(18),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 38,
                      ),
                      decoration: BoxDecoration(
                        color: dragging ? AppColors.tealSoft : AppColors.canvas,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: file == null ? AppColors.line : AppColors.teal,
                          width: file == null ? 1 : 2,
                        ),
                      ),
                      child: file == null
                          ? const Column(
                              children: [
                                Icon(
                                  Icons.cloud_upload_outlined,
                                  size: 46,
                                  color: AppColors.teal,
                                ),
                                SizedBox(height: 13),
                                Text(
                                  'Selecciona un archivo',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.ink,
                                  ),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'PDF, imagen, hoja de cálculo o documento · máximo según tu plan',
                                ),
                              ],
                            )
                          : Row(
                              children: [
                                Container(
                                  width: 52,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(
                                    Icons.description_outlined,
                                    color: AppColors.teal,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        file!.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.ink,
                                        ),
                                      ),
                                      Text(_size(fileSize)),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: uploading
                                      ? null
                                      : () => setState(() {
                                          file = null;
                                          fileBytes = null;
                                          fileSize = 0;
                                        }),
                                  icon: const Icon(Icons.close_rounded),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  if (app.usuario?.esCliente != true)
                    DropdownButtonFormField<int>(
                      initialValue: clientId,
                      decoration: const InputDecoration(
                        labelText: 'Cliente',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                      items: app.clientes
                          .map(
                            (client) => DropdownMenuItem(
                              value: client.id,
                              child: Text(client.nombre),
                            ),
                          )
                          .toList(),
                      onChanged: uploading
                          ? null
                          : (value) => setState(() {
                              clientId = value;
                              requestId = null;
                            }),
                    ),
                  if (app.usuario?.esCliente != true)
                    const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    initialValue: type,
                    decoration: const InputDecoration(
                      labelText: 'Tipo de documento',
                      prefixIcon: Icon(Icons.category_outlined),
                    ),
                    items: _documentTypes
                        .map(
                          (value) => DropdownMenuItem(
                            value: value,
                            child: Text(etiqueta(value)),
                          ),
                        )
                        .toList(),
                    onChanged: uploading
                        ? null
                        : (value) => setState(() => type = value ?? 'OTRO'),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<int?>(
                    initialValue: requestId,
                    decoration: const InputDecoration(
                      labelText: 'Solicitud relacionada (opcional)',
                      prefixIcon: Icon(Icons.link_rounded),
                    ),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('Sin solicitud'),
                      ),
                      ...availableRequests.map(
                        (request) => DropdownMenuItem<int?>(
                          value: request.id,
                          child: Text(request.titulo),
                        ),
                      ),
                    ],
                    onChanged: uploading
                        ? null
                        : (value) => setState(() => requestId = value),
                  ),
                  if (uploading) ...[
                    const SizedBox(height: 22),
                    Row(
                      children: [
                        const Icon(
                          Icons.cloud_upload_rounded,
                          color: AppColors.teal,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Subiendo ${app.uploadFileName}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                        Text(
                          app.uploadProgress == null
                              ? 'Preparando…'
                              : '${(app.uploadProgress! * 100).round()}%',
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    LinearProgressIndicator(
                      value: app.uploadProgress,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ],
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed:
                        uploading || fileBytes == null || clientId == null
                        ? null
                        : () async {
                            final ok = await app.upload(
                              clientId: clientId!,
                              fileName: file!.name,
                              bytes: fileBytes!,
                              type: type,
                              requestId: requestId,
                            );
                            if (ok && mounted) {
                              setState(() {
                                file = null;
                                fileBytes = null;
                                fileSize = 0;
                                requestId = null;
                                type = 'OTRO';
                              });
                            }
                          },
                    icon: const Icon(Icons.upload_rounded),
                    label: Text(uploading ? 'Subiendo…' : 'Subir y guardar'),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'No cierres esta pantalla hasta que la subida termine. Si ocurre un error se mostrará aquí abajo.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _size(int bytes) => bytes < 1024 * 1024
      ? '${(bytes / 1024).toStringAsFixed(1)} KB'
      : '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
