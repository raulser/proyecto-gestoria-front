import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../auth/auth_gateway.dart';
import '../core/app_config.dart';
import '../data/api_client.dart';
import '../domain/models.dart';

enum SessionStatus { booting, signedOut, signedIn }

class AppNotice {
  const AppNotice(this.id, this.message, {this.error = false});
  final int id;
  final String message;
  final bool error;
}

class AppController extends ChangeNotifier {
  AppController._(this.config, this.auth, this.api);

  final AppConfig config;
  final AuthGateway auth;
  final ApiClient api;

  SessionStatus status = SessionStatus.booting;
  Usuario? usuario;
  bool loading = false;
  int section = 0;
  int year = DateTime.now().year;
  List<Cliente> clientes = const [];
  List<Solicitud> solicitudes = const [];
  List<Documento> documentos = const [];
  List<Obligacion> obligaciones = const [];
  List<Vencimiento> vencimientos = const [];
  List<Notificacion> notificaciones = const [];
  ResumenPanel resumen = const ResumenPanel();
  Cliente? clienteSeleccionado;
  AppNotice? notice;
  double? uploadProgress;
  String? uploadFileName;
  int _noticeId = 0;

  static Future<AppController> bootstrap() async {
    final config = await AppConfig.load();
    final auth = createAuthGateway(config);
    late ApiClient api;
    api = ApiClient(config, auth.accessToken);
    final controller = AppController._(config, auth, api);
    try {
      final tokens = await auth.initialize();
      if (tokens == null) {
        controller.status = SessionStatus.signedOut;
      } else {
        await controller._openSession();
      }
    } catch (error) {
      controller.status = SessionStatus.signedOut;
      controller._notifyError(controller._message(error));
    }
    return controller;
  }

  Future<void> login() async {
    loading = true;
    notifyListeners();
    try {
      await auth.login();
      if (await auth.accessToken() != null) await _openSession();
    } catch (error) {
      _notifyError(_message(error));
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await auth.logout();
    } finally {
      usuario = null;
      status = SessionStatus.signedOut;
      notifyListeners();
    }
  }

  Future<void> _openSession() async {
    status = SessionStatus.booting;
    notifyListeners();
    usuario = await api.usuarioActual();
    status = SessionStatus.signedIn;
    await refresh();
  }

  Future<void> refresh() async {
    loading = true;
    notifyListeners();
    try {
      final result = await Future.wait<dynamic>([
        api.clientes(),
        api.solicitudes(),
        api.documentos(),
        api.vencimientos(anio: year),
        api.notificaciones(),
        if (usuario?.esCliente != true) api.resumen(year),
      ]);
      clientes = result[0] as List<Cliente>;
      solicitudes = result[1] as List<Solicitud>;
      documentos = result[2] as List<Documento>;
      vencimientos = result[3] as List<Vencimiento>;
      notificaciones = result[4] as List<Notificacion>;
      if (usuario?.esCliente != true) resumen = result[5] as ResumenPanel;

      final preferredId = usuario?.esCliente == true
          ? usuario?.clienteId
          : clienteSeleccionado?.id;
      if (preferredId != null) {
        final matches = clientes.where((client) => client.id == preferredId);
        if (matches.isNotEmpty) clienteSeleccionado = matches.first;
      }
      if (usuario?.esCliente == true &&
          clienteSeleccionado == null &&
          clientes.isNotEmpty) {
        clienteSeleccionado = clientes.first;
      }
      if (clienteSeleccionado != null) {
        await _loadClientContext(clienteSeleccionado!.id);
      }
    } catch (error) {
      _notifyError(_message(error));
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> selectClient(Cliente client) async {
    clienteSeleccionado = client;
    loading = true;
    notifyListeners();
    try {
      await _loadClientContext(client.id);
    } catch (error) {
      _notifyError(_message(error));
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _loadClientContext(int clientId) async {
    final values = await Future.wait([
      api.obligaciones(clientId),
      api.documentos(clienteId: clientId),
    ]);
    obligaciones = values[0] as List<Obligacion>;
    final clientDocuments = values[1] as List<Documento>;
    documentos = [
      ...documentos.where((item) => item.clienteId != clientId),
      ...clientDocuments,
    ];
  }

  void selectSection(int value) {
    section = value;
    notifyListeners();
  }

  Future<bool> updateRequest(
    Solicitud request, {
    required String title,
    required String description,
    required DateTime dueDate,
  }) async {
    try {
      await api.editarSolicitud(
        request,
        titulo: title,
        descripcion: description,
        fechaVencimiento: dueDate,
      );
      solicitudes = await api.solicitudes();
      _notifySuccess('Solicitud actualizada');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> upload({
    required int clientId,
    required String fileName,
    required Uint8List bytes,
    required String type,
    int? requestId,
  }) async {
    uploadFileName = fileName;
    uploadProgress = 0;
    notifyListeners();
    try {
      await api.subirDocumento(
        clienteId: clientId,
        nombreArchivo: fileName,
        bytes: bytes,
        tipo: type,
        solicitudId: requestId,
        onProgress: (sent, total) {
          uploadProgress = total <= 0 ? null : sent / total;
          notifyListeners();
        },
      );
      documentos = await api.documentos();
      _notifySuccess('Documento subido correctamente');
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    } finally {
      uploadFileName = null;
      uploadProgress = null;
      notifyListeners();
    }
  }

  List<Documento> documentsForClient(int clientId) =>
      documentos.where((d) => d.clienteId == clientId).toList();
  List<Solicitud> requestsForClient(int clientId) =>
      solicitudes.where((s) => s.clienteId == clientId).toList();
  List<Documento> documentsForRequest(int requestId) =>
      documentos.where((d) => d.solicitudId == requestId).toList();
  List<Documento> documentsForObligation(int obligationId) {
    final ids = solicitudes
        .where((s) => s.cumplimientoObligacionId == obligationId)
        .map((s) => s.id)
        .toSet();
    return documentos
        .where((d) => d.solicitudId != null && ids.contains(d.solicitudId))
        .toList();
  }

  void _notifySuccess(String message) {
    notice = AppNotice(++_noticeId, message);
    notifyListeners();
  }

  void _notifyError(String message) {
    notice = AppNotice(++_noticeId, message, error: true);
    notifyListeners();
  }

  String _message(Object error) {
    if (error is DioException && error.error is ApiFailure) {
      return (error.error! as ApiFailure).message;
    }
    if (error is ApiFailure) return error.message;
    return 'Ha ocurrido un error. Revisa la conexion e intentalo de nuevo.';
  }
}
