import {
  PeriodicidadDocumental,
  PautaDocumentalCliente,
  TipoCliente,
  TipoDocumento,
} from '../modelos-aplicacion';

export const tiposDeCliente: Array<{
  valor: TipoCliente;
  nombre: string;
  detalle: string;
  icono: string;
}> = [
  {
    valor: 'AUTONOMO',
    nombre: 'Autónomo',
    detalle: 'Profesional o empresario individual',
    icono: 'persona',
  },
  {
    valor: 'EMPRESA',
    nombre: 'Sociedad',
    detalle: 'SL, SA y sociedades mercantiles',
    icono: 'empresa',
  },
  {
    valor: 'PARTICULAR',
    nombre: 'Particular',
    detalle: 'Renta y trámites personales',
    icono: 'persona',
  },
  {
    valor: 'COMUNIDAD_BIENES',
    nombre: 'Comunidad de bienes',
    detalle: 'Actividad compartida entre comuneros',
    icono: 'grupo',
  },
  {
    valor: 'SOCIEDAD_CIVIL',
    nombre: 'Sociedad civil',
    detalle: 'Socios y actividad en común',
    icono: 'grupo',
  },
  {
    valor: 'COMUNIDAD_PROPIETARIOS',
    nombre: 'Comunidad de propietarios',
    detalle: 'Gestión económica de la comunidad',
    icono: 'empresa',
  },
  {
    valor: 'ASOCIACION_FUNDACION',
    nombre: 'Asociación o fundación',
    detalle: 'Entidades y organizaciones',
    icono: 'grupo',
  },
  {
    valor: 'ENTIDAD_SIN_PERSONALIDAD',
    nombre: 'Entidad sin personalidad',
    detalle: 'Otras entidades con gestión propia',
    icono: 'grupo',
  },
  { valor: 'OTRO', nombre: 'Otro tipo', detalle: 'Empieza con un plan a medida', icono: 'otro' },
];

export function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
export function fechasIniciales(
  periodo: PeriodicidadDocumental,
  hoy = new Date(),
): { apertura: string | null; fechaLimite: string | null } {
  if (periodo === 'PERMANENTE') return { apertura: null, fechaLimite: null };
  let apertura = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let limite: Date;
  if (periodo === 'MENSUAL') {
    apertura = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    limite = new Date(apertura.getFullYear(), apertura.getMonth(), 10);
  } else if (periodo === 'TRIMESTRAL') {
    apertura = new Date(hoy.getFullYear(), (Math.floor(hoy.getMonth() / 3) + 1) * 3, 1);
    limite = new Date(apertura.getFullYear(), apertura.getMonth(), 10);
  } else if (periodo === 'ANUAL') {
    apertura = new Date(hoy.getFullYear() + 1, 0, 1);
    limite = new Date(hoy.getFullYear() + 1, 0, 31);
  } else {
    limite = new Date(apertura);
    limite.setDate(limite.getDate() + 14);
  }
  return { apertura: fechaLocal(apertura), fechaLimite: fechaLocal(limite) };
}
export function nuevaPauta(
  nombre: string,
  tipo: TipoDocumento,
  periodicidad: PeriodicidadDocumental,
  activa = true,
  hoy = new Date(),
): PautaDocumentalCliente {
  return {
    id: crypto.randomUUID(),
    nombre,
    tipo,
    periodicidad,
    activa,
    ...fechasIniciales(periodicidad, hoy),
    diasRecordatorio: periodicidad === 'PERMANENTE' ? null : 3,
  };
}
export function propuestaDocumental(tipo: TipoCliente, hoy = new Date()): PautaDocumentalCliente[] {
  const doc = (
    nombre: string,
    categoria: TipoDocumento,
    periodo: PeriodicidadDocumental,
    activa = true,
  ) => nuevaPauta(nombre, categoria, periodo, activa, hoy);
  if (tipo === 'OTRO') return [];
  if (tipo === 'PARTICULAR')
    return [
      doc('Documentación para la Renta', 'JUSTIFICANTE', 'PUNTUAL'),
      doc('Contratos y autorizaciones', 'CONTRATO', 'PERMANENTE', false),
    ];
  const periodo: PeriodicidadDocumental =
    tipo === 'AUTONOMO' || tipo === 'COMUNIDAD_BIENES' ? 'TRIMESTRAL' : 'MENSUAL';
  if (tipo === 'COMUNIDAD_PROPIETARIOS')
    return [
      doc('Facturas de proveedores', 'FACTURA_RECIBIDA', 'MENSUAL'),
      doc('Extractos de la comunidad', 'EXTRACTO_BANCARIO', 'MENSUAL'),
      doc('Contratos y actas', 'CONTRATO', 'PERMANENTE'),
    ];
  const documentos = [
    doc('Facturas emitidas', 'FACTURA_EMITIDA', periodo),
    doc('Facturas recibidas', 'FACTURA_RECIBIDA', periodo),
    doc('Justificantes de gastos', 'JUSTIFICANTE', periodo),
    doc('Extractos bancarios', 'EXTRACTO_BANCARIO', 'MENSUAL', tipo !== 'AUTONOMO'),
    doc('Contratos y autorizaciones', 'CONTRATO', 'PERMANENTE'),
  ];
  if (tipo === 'ASOCIACION_FUNDACION')
    documentos.push(doc('Relación de donativos', 'OTRO', 'ANUAL', false));
  return documentos;
}
