export type Vista =
  | 'panel'
  | 'clientes'
  | 'solicitudes'
  | 'documentos'
  | 'subir'
  | 'equipo'
  | 'plan'
  | 'configuracion';
export type Rol = 'ADMIN_PLATAFORMA' | 'ADMIN' | 'ASESOR' | 'CLIENTE';
export type EstadoDocumento =
  | 'PENDIENTE'
  | 'RECIBIDO'
  | 'REVISADO'
  | 'RECHAZADO'
  | 'BORRADOR'
  | 'PUBLICADO'
  | 'RETIRADO'
  | 'SUSTITUIDO';
export type TipoCliente =
  | 'AUTONOMO'
  | 'EMPRESA'
  | 'PARTICULAR'
  | 'COMUNIDAD_BIENES'
  | 'SOCIEDAD_CIVIL'
  | 'COMUNIDAD_PROPIETARIOS'
  | 'ASOCIACION_FUNDACION'
  | 'ENTIDAD_SIN_PERSONALIDAD'
  | 'OTRO';
export type TipoDocumento =
  | 'FACTURA_EMITIDA'
  | 'FACTURA_RECIBIDA'
  | 'TICKET'
  | 'NOMINA'
  | 'CONTRATO'
  | 'EXTRACTO_BANCARIO'
  | 'JUSTIFICANTE'
  | 'ESCRITURA'
  | 'LIBRO_FACTURAS_EMITIDAS'
  | 'LIBRO_FACTURAS_RECIBIDAS'
  | 'LIBRO_INGRESOS'
  | 'LIBRO_GASTOS'
  | 'LIBRO_BIENES_INVERSION'
  | 'LIBRO_DIARIO'
  | 'CUENTAS_ANUALES'
  | 'MODELO_TRIBUTARIO'
  | 'JUSTIFICANTE_PRESENTACION'
  | 'LIQUIDACION'
  | 'COMUNICACION_ADMINISTRACION'
  | 'INFORME_ASESORIA'
  | 'OTRO';
export type OrigenDocumento = 'APORTADO_CLIENTE' | 'GENERADO_GESTORIA';
export type VisibilidadDocumento = 'INTERNO_GESTORIA' | 'COMPARTIDO_CLIENTE';
export type PeriodoDocumento = 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL' | 'PUNTUAL';
export type EstadoSolicitud = 'ABIERTA' | 'PARCIAL' | 'ENVIADA' | 'COMPLETADA' | 'CANCELADA';
export type Recurrencia = 'NINGUNA' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
export type CategoriaObligacion = 'FISCAL' | 'CONTABLE' | 'LABORAL' | 'MERCANTIL' | 'OTRA';
export type PeriodicidadObligacion =
  | 'MENSUAL'
  | 'TRIMESTRAL'
  | 'ANUAL'
  | 'PERSONALIZADA'
  | 'PUNTUAL';
export type EstadoDatoFiscal = 'SI' | 'NO' | 'PENDIENTE';
export type TerritorioFiscal = 'COMUN' | 'CANARIAS' | 'PAIS_VASCO' | 'NAVARRA' | 'CEUTA_MELILLA';
export type RegimenIrpf =
  | 'PENDIENTE'
  | 'NO_APLICA'
  | 'ESTIMACION_DIRECTA_NORMAL'
  | 'ESTIMACION_DIRECTA_SIMPLIFICADA'
  | 'ESTIMACION_OBJETIVA';
export type RegimenIva =
  | 'PENDIENTE'
  | 'NO_SUJETO_EXENTO'
  | 'GENERAL'
  | 'SIMPLIFICADO'
  | 'RECARGO_EQUIVALENCIA'
  | 'SII';
export type EstadoRecomendacionFiscal =
  | 'RECOMENDADA'
  | 'PENDIENTE_DATOS'
  | 'CONFIRMADA'
  | 'DESCARTADA'
  | 'NO_APLICA';
export type EstadoCumplimientoObligacion =
  | 'PENDIENTE_DOCUMENTACION'
  | 'DOCUMENTACION_RECIBIDA'
  | 'EN_PREPARACION'
  | 'PENDIENTE_REVISION'
  | 'PRESENTADA'
  | 'APLAZADA'
  | 'NO_APLICA';
export type ResultadoCumplimientoObligacion =
  | 'SIN_RESULTADO'
  | 'A_INGRESAR'
  | 'A_DEVOLVER'
  | 'A_COMPENSAR'
  | 'CUOTA_CERO';

export interface RespuestaApi<T> {
  datos: T;
  mensaje: string | null;
  exito: boolean;
}
export interface PaginaRespuesta<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
  primera: boolean;
  ultima: boolean;
}
export interface RespuestaUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  empresaId: number;
  nombreEmpresa: string;
  clienteId: number | null;
  activo: boolean;
}
export interface RespuestaCliente {
  id: number;
  nombre: string;
  nif: string;
  email: string;
  telefono: string | null;
  tipo: TipoCliente;
  activo: boolean;
  creadoEn: string;
}
export interface PeticionPerfilFiscalCliente {
  territorioFiscal: TerritorioFiscal;
  regimenIrpf: RegimenIrpf;
  regimenIva: RegimenIva;
  tributaSociedades: EstadoDatoFiscal;
  pagosFraccionadosSociedades: EstadoDatoFiscal;
  tieneTrabajadores: EstadoDatoFiscal;
  pagaProfesionalesRetencion: EstadoDatoFiscal;
  alquilerSujetoRetencion: EstadoDatoFiscal;
  rendimientosCapital: EstadoDatoFiscal;
  operacionesIntracomunitarias: EstadoDatoFiscal;
  operacionesTerceros: EstadoDatoFiscal;
  recibeDonativosDeducibles: EstadoDatoFiscal;
  entidadAtribucionRentas: EstadoDatoFiscal;
  exoneradoModelo390: EstadoDatoFiscal;
  marcarRevisado: boolean;
}
export interface RespuestaPerfilFiscalCliente extends Omit<
  PeticionPerfilFiscalCliente,
  'marcarRevisado'
> {
  id: number;
  clienteId: number;
  estadoRevision: 'PENDIENTE' | 'REVISADO';
  porcentajeCompletado: number;
  actualizadoEn: string;
}
export interface RespuestaRecomendacionFiscal {
  clave: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaObligacion;
  periodicidad: PeriodicidadObligacion;
  mesesPresentacion: string | null;
  diaLimiteOrientativo: number | null;
  tiposDocumentoEsperados: TipoDocumento[];
  estado: EstadoRecomendacionFiscal;
  razon: string;
  advertencia: string | null;
  motivoDecision: string | null;
}
export interface RespuestaObligacionCliente {
  id: number;
  clienteId: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaObligacion;
  periodicidad: PeriodicidadObligacion;
  mesesPresentacion: string | null;
  diaLimite: number | null;
  observaciones: string | null;
  tiposDocumentoEsperados: TipoDocumento[];
  activa: boolean;
  creadoEn: string;
}
export interface PlantillaObligacion {
  clave: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaObligacion;
  periodicidad: PeriodicidadObligacion;
  mesesPresentacion: string | null;
  diaLimiteOrientativo: number | null;
  observaciones: string;
  tiposDocumentoEsperados: TipoDocumento[];
}
export interface RespuestaCumplimientoObligacion {
  id: number;
  clienteId: number;
  nombreCliente: string;
  obligacionId: number;
  codigoObligacion: string;
  nombreObligacion: string;
  categoria: CategoriaObligacion;
  periodicidad: PeriodicidadObligacion;
  anio: number;
  periodoClave: string;
  fechaLimite: string;
  estado: EstadoCumplimientoObligacion;
  vencida: boolean;
  responsableId: number | null;
  nombreResponsable: string | null;
  resultado: ResultadoCumplimientoObligacion;
  importe: number | null;
  fechaPresentacion: string | null;
  referencia: string | null;
  nrc: string | null;
  justificanteDocumentoId: number | null;
  observacionesInternas: string | null;
  mensajeCliente: string | null;
  creadoEn: string;
  actualizadoEn: string;
}
export interface RespuestaDocumento {
  id: number;
  clienteId: number;
  nombreCliente: string;
  subidoPorId: number;
  nombreSubidoPor: string;
  tipo: TipoDocumento;
  anio: number;
  periodo: PeriodoDocumento;
  trimestre: number | null;
  mes: number | null;
  fechaDocumento: string | null;
  origen: OrigenDocumento;
  visibilidad: VisibilidadDocumento;
  estado: EstadoDocumento;
  nombreArchivoOriginal: string;
  titulo: string | null;
  descripcion: string | null;
  referencia: string | null;
  tamano: number;
  tipoContenido: string | null;
  comentarioAsesor: string | null;
  solicitudId: number | null;
  sustituyeDocumentoId: number | null;
  retiradoEn: string | null;
  motivoRetirada: string | null;
  publicadoPorId: number | null;
  nombrePublicadoPor: string | null;
  publicadoEn: string | null;
  sumaComprobacionSha256: string | null;
  creadoEn: string;
  actualizadoEn: string;
}
export interface RespuestaEstadoTrimestre {
  estado: string;
  cantidadDocumentos: number;
}
export interface RespuestaTrimestreCliente {
  clienteId: number;
  nombreCliente: string;
  tipo: TipoCliente;
  activo: boolean;
  trimestres: Record<string, RespuestaEstadoTrimestre>;
}
export interface RespuestaPanel {
  anio: number;
  clientes: RespuestaTrimestreCliente[];
  totales: {
    totalClientes: number;
    trimestresFaltantes: number;
    documentosRecibidos: number;
    documentosRevisados: number;
    documentosRechazados: number;
  };
}
export interface RespuestaAsignacion {
  id: number;
  asesorId: number;
  nombreAsesor: string;
  clienteId: number;
  nombreCliente: string;
  asignadoEn: string;
}
export interface RespuestaSolicitudDocumento {
  id: number;
  clienteId: number;
  nombreCliente: string;
  asesorAsignadoId: number | null;
  nombreAsesorAsignado: string | null;
  cumplimientoObligacionId: number | null;
  titulo: string;
  descripcion: string | null;
  tiposDocumentoEsperados: TipoDocumento[];
  estadoChecklist: Partial<Record<TipoDocumento, 'FALTA' | 'RECIBIDO' | 'RECHAZADO' | 'REVISADO'>>;
  anio: number | null;
  trimestre: number | null;
  fechaVencimiento: string;
  estado: EstadoSolicitud;
  recurrencia: Recurrencia;
  vencida: boolean;
  completadoEn: string | null;
  reaperturaSolicitadaEn: string | null;
  motivoReapertura: string | null;
  creadoEn: string;
  actualizadoEn: string;
}
export interface RespuestaComentarioSolicitud {
  id: number;
  autorId: number;
  nombreAutor: string;
  rolAutor: Rol;
  texto: string;
  creadoEn: string;
}
export interface RespuestaPlan {
  codigo: string;
  nombre: string;
  estadoSuscripcion: string;
  pruebaFinalizaEn: string | null;
  usuariosInternos: number;
  maxUsuariosInternos: number;
  clientesActivos: number;
  maxClientesActivos: number;
  bytesAlmacenados: number;
  maxBytesAlmacenamiento: number;
  recordatoriosHabilitados: boolean;
  marcaPersonalizadaHabilitada: boolean;
}
export interface RespuestaNotificacion {
  id: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  solicitudDocumentoId: number | null;
  documentoId: number | null;
  cumplimientoObligacionId: number | null;
  leida: boolean;
  creadoEn: string;
}
export interface RespuestaEventoAuditoria {
  id: number;
  nombreActor: string;
  accion: string;
  tipoEntidad: string;
  entidadId: number | null;
  descripcion: string;
  creadoEn: string;
}
export interface RespuestaConfiguracionEmpresa {
  id: number;
  nombre: string;
  nif: string;
  plan: string;
  estadoSuscripcion: string;
  correoFacturacion: string | null;
  nombreMarca: string | null;
  colorPrincipalMarca: string | null;
}
