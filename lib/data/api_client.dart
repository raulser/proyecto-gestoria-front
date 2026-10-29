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
}
