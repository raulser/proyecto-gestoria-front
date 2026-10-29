import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../core/app_config.dart';
import '../domain/models.dart';

class ApiFailure implements Exception {
  const ApiFailure(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

class DownloadedFile {
  const DownloadedFile(this.bytes, this.contentType);
  final Uint8List bytes;
  final String contentType;
}

class ApiClient {
  ApiClient(AppConfig config, this._tokenProvider)
    : _dio = Dio(
        BaseOptions(
          baseUrl: config.apiUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          final body = error.response?.data;
          final message = body is Map
              ? stringValue(
                  body['mensaje'] ?? body['message'],
                  'No se pudo completar la operacion',
                )
              : error.type == DioExceptionType.connectionError
              ? 'No se puede conectar con el servidor'
              : 'No se pudo completar la operacion';
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: ApiFailure(
                message,
                statusCode: error.response?.statusCode,
              ),
            ),
          );
        },
      ),
    );
  }

  final Dio _dio;
  final Future<String?> Function() _tokenProvider;

  dynamic _unwrap(dynamic raw) =>
      raw is Map && raw.containsKey('datos') ? raw['datos'] : raw;
  List<T> _list<T>(dynamic raw, T Function(Json) parse) {
    final data = _unwrap(raw);
    final values = data is Map && data.containsKey('contenido')
        ? data['contenido']
        : data;
    return (values as List? ?? const [])
        .whereType<Map>()
        .map((e) => parse(e.cast<String, dynamic>()))
        .toList();
  }

  Json _json(dynamic raw) => (_unwrap(raw) as Map).cast<String, dynamic>();

  Future<Usuario> usuarioActual() async => Usuario.fromJson(
    _json((await _dio.get('/api/autenticacion/actual')).data),
  );
  Future<List<Cliente>> clientes() async =>
      _list((await _dio.get('/api/clientes')).data, Cliente.fromJson);
  Future<List<Solicitud>> solicitudes() async =>
      _list((await _dio.get('/api/solicitudes')).data, Solicitud.fromJson);
  Future<List<Documento>> documentos({
    int? clienteId,
    int pagina = 0,
    int tamano = 200,
  }) async => _list(
    (await _dio.get(
      '/api/documentos/pagina',
      queryParameters: {
        'pagina': pagina,
        'tamano': tamano,
        'clienteId': ?clienteId,
      },
    )).data,
    Documento.fromJson,
  );
  Future<List<Obligacion>> obligaciones(int clienteId) async => _list(
    (await _dio.get('/api/clientes/$clienteId/obligaciones')).data,
    Obligacion.fromJson,
  );
  Future<List<Vencimiento>> vencimientos({
    int? clienteId,
    required int anio,
  }) async => _list(
    (await _dio.get(
      clienteId == null
          ? '/api/vencimientos'
          : '/api/clientes/$clienteId/vencimientos',
      queryParameters: {'anio': anio},
    )).data,
    Vencimiento.fromJson,
  );
  Future<List<Vencimiento>> generarVencimientos(int anio) async => _list(
    (await _dio.post(
      '/api/vencimientos/generar',
      queryParameters: {'anio': anio},
    )).data,
    Vencimiento.fromJson,
  );
  Future<ResumenPanel> resumen(int anio) async => ResumenPanel.fromJson(
    _json(
      (await _dio.get(
        '/api/panel/resumen',
        queryParameters: {'anio': anio},
      )).data,
    ),
  );
  Future<List<Notificacion>> notificaciones() async => _list(
    (await _dio.get('/api/notificaciones')).data,
    Notificacion.fromJson,
  );
  Future<List<Json>> usuarios() async =>
      _list((await _dio.get('/api/usuarios')).data, (value) => value);
  Future<List<Json>> asignaciones() async =>
      _list((await _dio.get('/api/asignaciones')).data, (value) => value);
  Future<Json> plan() async => _json((await _dio.get('/api/plan')).data);
  Future<Json> empresa() async => _json((await _dio.get('/api/empresa')).data);
  Future<List<Json>> auditoria() async => _list(
    (await _dio.get('/api/auditoria', queryParameters: {'limit': 30})).data,
    (value) => value,
  );

  Future<Cliente> guardarCliente(Json data, {int? id}) async =>
      Cliente.fromJson(
        _json(
          (id == null
                  ? await _dio.post('/api/clientes', data: data)
                  : await _dio.put('/api/clientes/$id', data: data))
              .data,
        ),
      );

  Future<PerfilFiscal> perfilFiscal(int clienteId) async =>
      PerfilFiscal.fromJson(
        _json((await _dio.get('/api/clientes/$clienteId/perfil-fiscal')).data),
      );
  Future<PerfilFiscal> guardarPerfilFiscal(
    int clienteId,
    PerfilFiscal profile, {
    bool reviewed = false,
  }) async => PerfilFiscal.fromJson(
    _json(
      (await _dio.put(
        '/api/clientes/$clienteId/perfil-fiscal',
        data: profile.toJson(reviewed: reviewed),
      )).data,
    ),
  );
  Future<List<RecomendacionFiscal>> recomendaciones(int clienteId) async =>
      _list(
        (await _dio.get('/api/clientes/$clienteId/recomendaciones-fiscales'))
            .data,
        RecomendacionFiscal.fromJson,
      );
  Future<List<RecomendacionFiscal>> accionRecomendacion(
    int clienteId,
    String clave,
    String action, {
    String? reason,
  }) async => _list(
    (await _dio.post(
      '/api/clientes/$clienteId/recomendaciones-fiscales/$clave/$action',
      data: reason == null ? null : {'motivo': reason},
    )).data,
    RecomendacionFiscal.fromJson,
  );

  Future<Obligacion> guardarObligacion(
    int clienteId,
    Json data, {
    int? id,
  }) async => Obligacion.fromJson(
    _json(
      (id == null
              ? await _dio.post(
                  '/api/clientes/$clienteId/obligaciones',
                  data: data,
                )
              : await _dio.put(
                  '/api/clientes/$clienteId/obligaciones/$id',
                  data: data,
                ))
          .data,
    ),
  );

  Future<Solicitud> crearSolicitud(Json data) async => Solicitud.fromJson(
    _json((await _dio.post('/api/solicitudes', data: data)).data),
  );
  Future<List<ComentarioSolicitud>> comentarios(int requestId) async => _list(
    (await _dio.get('/api/solicitudes/$requestId/comentarios')).data,
    ComentarioSolicitud.fromJson,
  );
  Future<ComentarioSolicitud> comentar(int requestId, String text) async =>
      ComentarioSolicitud.fromJson(
        _json(
          (await _dio.post(
            '/api/solicitudes/$requestId/comentarios',
            data: {'texto': text},
          )).data,
        ),
      );
  Future<void> accionSolicitud(
    int requestId,
    String action, {
    String? reason,
  }) async {
    final route = switch (action) {
      'enviar' => '/enviar',
      'solicitar-reapertura' => '/reapertura',
      'aprobar-reapertura' => '/reapertura/aprobar',
      'rechazar-reapertura' => '/reapertura/rechazar',
      'reabrir' => '/reabrir',
      _ => '',
    };
    await _dio.post(
      '/api/solicitudes/$requestId$route',
      data: reason == null ? null : {'motivo': reason},
    );
  }

  Future<void> actualizarEstadoSolicitud(
    int requestId,
    String state, {
    String? description,
  }) async => _dio.patch(
    '/api/solicitudes/$requestId',
    data: {'estado': state, 'descripcion': description},
  );

  Future<void> editarSolicitud(
    Solicitud solicitud, {
    required String titulo,
    required String descripcion,
    required DateTime fechaVencimiento,
  }) async {
    await _dio.put(
      '/api/solicitudes/${solicitud.id}/detalles',
      data: {
        'titulo': titulo,
        'descripcion': descripcion,
        'tiposDocumentoEsperados': solicitud.tiposEsperados,
        'fechaVencimiento': fechaVencimiento.toIso8601String().split('T').first,
      },
    );
  }

  Future<Documento> subirDocumento({
    required int clienteId,
    required String nombreArchivo,
    required Uint8List bytes,
    required String tipo,
    int? solicitudId,
    required void Function(int, int) onProgress,
  }) async {
    final now = DateTime.now();
    final data = FormData.fromMap({
      'archivo': MultipartFile.fromBytes(bytes, filename: nombreArchivo),
      'clienteId': clienteId,
      'tipo': tipo,
      'anio': now.year,
      'periodo': 'PUNTUAL',
      'origen': 'APORTADO_CLIENTE',
      'visibilidad': 'COMPARTIDO_CLIENTE',
      'solicitudId': ?solicitudId,
    });
    return Documento.fromJson(
      _json(
        (await _dio.post(
          '/api/documentos',
          data: data,
          onSendProgress: onProgress,
        )).data,
      ),
    );
  }

  Future<void> cambiarEstadoDocumento(
    int id,
    String estado, {
    String? comentario,
  }) async {
    await _dio.patch(
      '/api/documentos/$id/estado',
      data: {'estado': estado, 'comentarioAsesor': comentario},
    );
  }

  Future<void> accionDocumento(int id, String action, {String? reason}) async {
    await _dio.post(
      '/api/documentos/$id/$action',
      data: reason == null ? null : {'motivo': reason},
    );
  }

  Future<void> asociarDocumento(int id, int? requestId) async {
    await _dio.patch(
      '/api/documentos/$id/solicitud',
      data: {'solicitudId': requestId},
    );
  }

  Future<DownloadedFile> descargarDocumento(int id) async {
    final response = await _dio.get<List<int>>(
      '/api/documentos/$id/descargar',
      options: Options(responseType: ResponseType.bytes),
    );
    return DownloadedFile(
      Uint8List.fromList(response.data ?? const []),
      response.headers.value('content-type') ?? 'application/octet-stream',
    );
  }

  Future<DownloadedFile> exportarDocumentos({
    int? clientId,
    required int year,
  }) async {
    final response = await _dio.get<List<int>>(
      '/api/documentos/zip',
      queryParameters: {'anio': year, 'clienteId': ?clientId},
      options: Options(responseType: ResponseType.bytes),
    );
    return DownloadedFile(
      Uint8List.fromList(response.data ?? const []),
      'application/zip',
    );
  }

  Future<void> marcarNotificacion(int id) async =>
      _dio.patch('/api/notificaciones/$id/leida');
  Future<void> generarRecordatorios() async =>
      _dio.post('/api/notificaciones/generar-recordatorios');
  Future<Json> guardarEmpresa(Json data) async =>
      _json((await _dio.put('/api/empresa', data: data)).data);
  Future<Json> guardarUsuario(Json data, {int? id}) async => _json(
    (id == null
            ? await _dio.post('/api/usuarios', data: data)
            : await _dio.put('/api/usuarios/$id', data: data))
        .data,
  );
  Future<void> asignar(int advisorId, int clientId) async => _dio.post(
    '/api/asignaciones',
    data: {'asesorId': advisorId, 'clienteId': clientId},
  );
  Future<void> quitarAsignacion(int advisorId, int clientId) async =>
      _dio.delete(
        '/api/asignaciones',
        queryParameters: {'asesorId': advisorId, 'clienteId': clientId},
      );
}
