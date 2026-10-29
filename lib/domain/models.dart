typedef Json = Map<String, dynamic>;

T? castOrNull<T>(Object? value) => value is T ? value : null;
int intValue(Object? value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;
double doubleValue(Object? value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
String stringValue(Object? value, [String fallback = '']) =>
    value?.toString() ?? fallback;
bool boolValue(Object? value) => value == true;

class Usuario {
  const Usuario({
    required this.id,
    required this.nombre,
    required this.email,
    required this.rol,
    this.clienteId,
  });
  final int id;
  final String nombre;
  final String email;
  final String rol;
  final int? clienteId;
  bool get esCliente => rol == 'CLIENTE';
  bool get esAdmin => rol == 'ADMIN' || rol == 'ADMIN_PLATAFORMA';
  bool get esAsesor => rol == 'ASESOR';
  factory Usuario.fromJson(Json j) => Usuario(
    id: intValue(j['id']),
    nombre: stringValue(j['nombre']),
    email: stringValue(j['email']),
    rol: stringValue(j['rol']),
    clienteId: j['clienteId'] == null ? null : intValue(j['clienteId']),
  );
}

class Cliente {
  const Cliente({
    required this.id,
    required this.nombre,
    required this.nif,
    required this.email,
    required this.tipo,
    required this.activo,
    this.telefono,
  });
  final int id;
  final String nombre;
  final String nif;
  final String email;
  final String? telefono;
  final String tipo;
  final bool activo;
  factory Cliente.fromJson(Json j) => Cliente(
    id: intValue(j['id']),
    nombre: stringValue(j['nombre']),
    nif: stringValue(j['nif']),
    email: stringValue(j['email']),
    telefono: castOrNull<String>(j['telefono']),
    tipo: stringValue(j['tipo']),
    activo: boolValue(j['activo']),
  );
}

class Solicitud {
  const Solicitud({
    required this.id,
    required this.clienteId,
    required this.nombreCliente,
    required this.titulo,
    required this.estado,
    required this.fechaVencimiento,
    required this.tiposEsperados,
    this.descripcion,
    this.cumplimientoObligacionId,
    this.nombreAsesor,
  });
  final int id;
  final int clienteId;
  final String nombreCliente;
  final String titulo;
  final String? descripcion;
  final String estado;
  final DateTime? fechaVencimiento;
  final int? cumplimientoObligacionId;
  final String? nombreAsesor;
  final List<String> tiposEsperados;
  bool get editable => estado == 'ABIERTA' || estado == 'PARCIAL';
  factory Solicitud.fromJson(Json j) => Solicitud(
    id: intValue(j['id']),
    clienteId: intValue(j['clienteId']),
    nombreCliente: stringValue(j['nombreCliente']),
    titulo: stringValue(j['titulo']),
    descripcion: castOrNull<String>(j['descripcion']),
    estado: stringValue(j['estado']),
    fechaVencimiento: DateTime.tryParse(stringValue(j['fechaVencimiento'])),
    cumplimientoObligacionId: j['cumplimientoObligacionId'] == null
        ? null
        : intValue(j['cumplimientoObligacionId']),
    nombreAsesor: castOrNull<String>(j['nombreAsesorAsignado']),
    tiposEsperados: (j['tiposDocumentoEsperados'] as List? ?? const [])
        .map((e) => '$e')
        .toList(),
  );
}

class Documento {
  const Documento({
    required this.id,
    required this.clienteId,
    required this.nombreCliente,
    required this.tipo,
    required this.estado,
    required this.nombreArchivo,
    required this.tamano,
    required this.creadoEn,
    this.solicitudId,
    this.titulo,
    this.descripcion,
    this.comentarioAsesor,
  });
  final int id;
  final int clienteId;
  final String nombreCliente;
  final int? solicitudId;
  final String tipo;
  final String estado;
  final String nombreArchivo;
  final String? titulo;
  final String? descripcion;
  final String? comentarioAsesor;
  final int tamano;
  final DateTime? creadoEn;
  factory Documento.fromJson(Json j) => Documento(
    id: intValue(j['id']),
    clienteId: intValue(j['clienteId']),
    nombreCliente: stringValue(j['nombreCliente']),
    solicitudId: j['solicitudId'] == null ? null : intValue(j['solicitudId']),
    tipo: stringValue(j['tipo']),
    estado: stringValue(j['estado']),
    nombreArchivo: stringValue(j['nombreArchivoOriginal']),
    titulo: castOrNull<String>(j['titulo']),
    descripcion: castOrNull<String>(j['descripcion']),
    comentarioAsesor: castOrNull<String>(j['comentarioAsesor']),
    tamano: intValue(j['tamano']),
    creadoEn: DateTime.tryParse(stringValue(j['creadoEn'])),
  );
}

class Obligacion {
  const Obligacion({
    required this.id,
    required this.clienteId,
    required this.codigo,
    required this.nombre,
    required this.categoria,
    required this.periodicidad,
    required this.activa,
  });
  final int id;
  final int clienteId;
  final String codigo;
  final String nombre;
  final String categoria;
  final String periodicidad;
  final bool activa;
  factory Obligacion.fromJson(Json j) => Obligacion(
    id: intValue(j['id']),
    clienteId: intValue(j['clienteId']),
    codigo: stringValue(j['codigo']),
    nombre: stringValue(j['nombre']),
    categoria: stringValue(j['categoria']),
    periodicidad: stringValue(j['periodicidad']),
    activa: boolValue(j['activa']),
  );
}

class Vencimiento {
  const Vencimiento({
    required this.id,
    required this.clienteId,
    required this.nombreCliente,
    required this.obligacionId,
    required this.codigo,
    required this.nombre,
    required this.estado,
    required this.fechaLimite,
    required this.vencida,
  });
  final int id;
  final int clienteId;
  final String nombreCliente;
  final int obligacionId;
  final String codigo;
  final String nombre;
  final String estado;
  final DateTime? fechaLimite;
  final bool vencida;
  factory Vencimiento.fromJson(Json j) => Vencimiento(
    id: intValue(j['id']),
    clienteId: intValue(j['clienteId']),
    nombreCliente: stringValue(j['nombreCliente']),
    obligacionId: intValue(j['obligacionId']),
    codigo: stringValue(j['codigoObligacion']),
    nombre: stringValue(j['nombreObligacion']),
    estado: stringValue(j['estado']),
    fechaLimite: DateTime.tryParse(stringValue(j['fechaLimite'])),
    vencida: boolValue(j['vencida']),
  );
}

class ResumenPanel {
  const ResumenPanel({
    this.totalClientes = 0,
    this.trimestresFaltantes = 0,
    this.documentosRecibidos = 0,
    this.documentosRevisados = 0,
    this.documentosRechazados = 0,
  });
  final int totalClientes;
  final int trimestresFaltantes;
  final int documentosRecibidos;
  final int documentosRevisados;
  final int documentosRechazados;
  factory ResumenPanel.fromJson(Json j) {
    final totals = (j['totales'] as Json?) ?? const <String, dynamic>{};
    return ResumenPanel(
      totalClientes: intValue(totals['totalClientes']),
      trimestresFaltantes: intValue(totals['trimestresFaltantes']),
      documentosRecibidos: intValue(totals['documentosRecibidos']),
      documentosRevisados: intValue(totals['documentosRevisados']),
      documentosRechazados: intValue(totals['documentosRechazados']),
    );
  }
}

class Notificacion {
  const Notificacion({
    required this.id,
    required this.titulo,
    required this.cuerpo,
    required this.leida,
    required this.creadoEn,
  });
  final int id;
  final String titulo;
  final String cuerpo;
  final bool leida;
  final DateTime? creadoEn;
  factory Notificacion.fromJson(Json j) => Notificacion(
    id: intValue(j['id']),
    titulo: stringValue(j['titulo']),
    cuerpo: stringValue(j['cuerpo']),
    leida: boolValue(j['leida']),
    creadoEn: DateTime.tryParse(stringValue(j['creadoEn'])),
  );
}

String etiqueta(String value) => value
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
          part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}',
    )
    .join(' ');
