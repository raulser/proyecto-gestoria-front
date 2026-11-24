import {
  EstadoDocumento,
  OrigenDocumento,
  PeriodoDocumento,
  TipoDocumento,
  VisibilidadDocumento,
} from '../modelos-aplicacion';
import type { RespuestaDocumento } from '../modelos-aplicacion';

export type AccionDocumento =
  | 'ver'
  | 'descargar'
  | 'clasificar'
  | 'publicar'
  | 'revisar'
  | 'rechazar'
  | 'ocultar'
  | 'retirar'
  | 'sustituir';
export interface AccionArchivo {
  accion: AccionDocumento;
  documento: RespuestaDocumento;
}

export interface FiltrosRepositorio {
  texto: string;
  clienteId: number | null;
  solicitudId: number | null;
  anio: number | null;
  estado: EstadoDocumento | '';
  origen: OrigenDocumento | '';
  periodo: PeriodoDocumento | '';
  tipo: TipoDocumento | '';
  visibilidad: VisibilidadDocumento | '';
}

export const FILTROS_DOCUMENTOS_VACIOS: FiltrosRepositorio = {
  texto: '',
  clienteId: null,
  solicitudId: null,
  anio: null,
  estado: '',
  origen: '',
  periodo: '',
  tipo: '',
  visibilidad: '',
};
export const ESTADOS_DOCUMENTO: Record<EstadoDocumento, string> = {
  PENDIENTE: 'Pendiente',
  RECIBIDO: 'Por revisar',
  REVISADO: 'Revisado',
  RECHAZADO: 'Necesita corrección',
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  RETIRADO: 'Retirado',
  SUSTITUIDO: 'Sustituido',
};
