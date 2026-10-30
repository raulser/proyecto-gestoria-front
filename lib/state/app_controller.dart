import 'package:dio/dio.dart';
import 'package:file_saver/file_saver.dart';
import 'package:flutter/foundation.dart';

import '../auth/auth_gateway.dart';
import '../auth/sign_in_policy.dart';
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
  bool _openLoginAutomatically = false;

  bool consumeAutomaticLogin() {
    final pending = _openLoginAutomatically;
    _openLoginAutomatically = false;
    return pending;
  }

  static Future<AppController> bootstrap() async {
    final entryUri = Uri.base;
    final config = await AppConfig.load();
    final auth = createAuthGateway(config);
    late ApiClient api;
    api = ApiClient(config, auth.accessToken);
    final controller = AppController._(config, auth, api);
    try {
      final tokens = await auth.initialize();
      if (tokens == null) {
        controller.status = SessionStatus.signedOut;
        controller._openLoginAutomatically = shouldOpenSignInAutomatically(
          isWeb: kIsWeb,
          entryUri: entryUri,
        );
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
    if (loading) return;
    _openLoginAutomatically = false;
    loading = true;
    notifyListeners();
    try {
      await auth.login();
      if (await auth.accessToken() != null) await _openSession();
    } catch (error) {
      status = SessionStatus.signedOut;
      usuario = null;
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

  Future<bool> saveClient(Json data, {int? id}) async {
    try {
      final saved = await api.guardarCliente(data, id: id);
      clientes = await api.clientes();
      clienteSeleccionado = saved;
      _notifySuccess(id == null ? 'Cliente creado' : 'Cliente actualizado');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<PerfilFiscal?> saveFiscalProfile(
    int clientId,
    PerfilFiscal profile, {
    bool reviewed = false,
  }) async {
    try {
      final saved = await api.guardarPerfilFiscal(
        clientId,
        profile,
        reviewed: reviewed,
      );
      _notifySuccess(
        reviewed ? 'Perfil revisado y guardado' : 'Perfil fiscal guardado',
      );
      return saved;
    } catch (error) {
      _notifyError(_message(error));
      return null;
    }
  }

  Future<List<RecomendacionFiscal>?> recommendationAction(
    int clientId,
    RecomendacionFiscal item,
    String action, {
    String? reason,
  }) async {
    try {
      final result = await api.accionRecomendacion(
        clientId,
        item.clave,
        action,
        reason: reason,
      );
      await _loadClientContext(clientId);
      _notifySuccess('Recomendación actualizada');
      notifyListeners();
      return result;
    } catch (error) {
      _notifyError(_message(error));
      return null;
    }
  }

  Future<bool> saveObligation(Cliente client, Json data, {int? id}) async {
    try {
      await api.guardarObligacion(client.id, data, id: id);
      await _loadClientContext(client.id);
      _notifySuccess(
        id == null ? 'Obligación añadida' : 'Obligación actualizada',
      );
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> createRequest(Json data) async {
    try {
      await api.crearSolicitud(data);
      solicitudes = await api.solicitudes();
      _notifySuccess('Solicitud creada');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> addRequestComment(Solicitud request, String text) async {
    try {
      await api.comentar(request.id, text);
      _notifySuccess('Mensaje enviado');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> requestAction(
    Solicitud request,
    String action, {
    String? reason,
  }) async {
    try {
      await api.accionSolicitud(request.id, action, reason: reason);
      solicitudes = await api.solicitudes();
      _notifySuccess('Solicitud actualizada');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> updateRequestState(
    Solicitud request,
    String state, {
    String? description,
  }) async {
    try {
      await api.actualizarEstadoSolicitud(
        request.id,
        state,
        description: description,
      );
      solicitudes = await api.solicitudes();
      _notifySuccess('Estado de la solicitud actualizado');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<void> generateAgenda() async {
    try {
      vencimientos = await api.generarVencimientos(year);
      await api.generarRecordatorios();
      notificaciones = await api.notificaciones();
      _notifySuccess('Agenda fiscal y recordatorios actualizados');
      notifyListeners();
    } catch (error) {
      _notifyError(_message(error));
    }
  }

  Future<void> readNotification(Notificacion notification) async {
    if (notification.leida) return;
    try {
      await api.marcarNotificacion(notification.id);
      notificaciones = await api.notificaciones();
      notifyListeners();
    } catch (error) {
      _notifyError(_message(error));
    }
  }

  Future<bool> saveCompany(Json data) async {
    try {
      await api.guardarEmpresa(data);
      _notifySuccess('Organización actualizada');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> saveUser(Json data, {int? id}) async {
    try {
      await api.guardarUsuario(data, id: id);
      _notifySuccess(id == null ? 'Usuario creado' : 'Usuario actualizado');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> addAssignment(int advisorId, int clientId) async {
    try {
      await api.asignar(advisorId, clientId);
      _notifySuccess('Cliente asignado al asesor');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> removeAssignment(int advisorId, int clientId) async {
    try {
      await api.quitarAsignacion(advisorId, clientId);
      _notifySuccess('Asignación eliminada');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> documentAction(
    Documento document,
    String action, {
    String? reason,
  }) async {
    try {
      await api.accionDocumento(document.id, action, reason: reason);
      documentos = await api.documentos();
      _notifySuccess('Documento actualizado');
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> reviewDocument(
    Documento document,
    String state, {
    String? comment,
  }) async {
    try {
      await api.cambiarEstadoDocumento(document.id, state, comentario: comment);
      documentos = await api.documentos();
      _notifySuccess(
        state == 'REVISADO' ? 'Documento revisado' : 'Documento rechazado',
      );
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<bool> associateDocument(Documento document, int? requestId) async {
    try {
      await api.asociarDocumento(document.id, requestId);
      documentos = await api.documentos();
      _notifySuccess(
        requestId == null ? 'Documento desvinculado' : 'Documento asociado',
      );
      notifyListeners();
      return true;
    } catch (error) {
      _notifyError(_message(error));
      return false;
    }
  }

  Future<void> downloadDocument(Documento document) async {
    try {
      final file = await api.descargarDocumento(document.id);
      final parts = document.nombreArchivo.split('.');
      final extension = parts.length > 1 ? parts.removeLast() : '';
      final name = parts.join('.');
      await FileSaver.instance.saveFile(
        name: name.isEmpty ? 'documento' : name,
        bytes: file.bytes,
        fileExtension: extension,
        mimeType: MimeType.custom,
        customMimeType: file.contentType,
      );
      _notifySuccess('Descarga preparada');
    } catch (error) {
      _notifyError(_message(error));
    }
  }

  Future<void> exportDocuments({int? clientId}) async {
    try {
      final file = await api.exportarDocumentos(clientId: clientId, year: year);
      await FileSaver.instance.saveFile(
        name: clientId == null
            ? 'documentos-$year'
            : 'expediente-$clientId-$year',
        bytes: file.bytes,
        fileExtension: 'zip',
        mimeType: MimeType.zip,
      );
      _notifySuccess('Exportación preparada');
    } catch (error) {
      _notifyError(_message(error));
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
