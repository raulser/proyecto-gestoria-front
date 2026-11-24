import contenido from './manuales.json';
import { Rol, Vista } from '../modelos-aplicacion';

export type PerfilManual = 'cliente' | 'gestor' | 'administrador';
export interface CapturaManual {
  titulo: string;
  descripcion: string;
  archivo: string;
  ancho: number;
  alto: number;
  perfiles: PerfilManual[];
  marcas: {
    numero: number;
    x: number;
    y: number;
    ancho: number;
    alto: number;
    titulo: string;
    descripcion: string;
  }[];
}
export interface RecorridoManual {
  titulo: string;
  antes?: string[];
  pasos: { haz: string; veras: string }[];
  comprobar?: string[];
  incidencias?: string[];
}
export interface CapituloManual {
  id: string;
  titulo: string;
  resumen: string;
  parrafos: string[];
  pasos?: string[];
  estados?: { estado: string; descripcion: string }[];
  destino?: Vista;
  accion?: string;
  capturas?: CapturaManual[];
  recorridos?: RecorridoManual[];
}
interface DatosManuales {
  version: string;
  perfiles: Record<PerfilManual, { nombre: string; descripcion: string; capitulos: string[] }>;
  secciones: Record<string, Omit<CapituloManual, 'id' | 'capturas'> & { capturas?: string[] }>;
  capturas?: Record<string, CapturaManual>;
}
const datos = contenido as DatosManuales;

export function obtenerManual(rol: Rol) {
  const perfil: PerfilManual =
    rol === 'CLIENTE' ? 'cliente' : rol === 'ASESOR' ? 'gestor' : 'administrador';
  const manual = datos.perfiles[perfil];
  return {
    ...manual,
    perfil,
    version: datos.version,
    capitulos: manual.capitulos.map(
      (id): CapituloManual => ({
        ...datos.secciones[id],
        id,
        capturas: (datos.secciones[id].capturas ?? [])
          .map((clave) => datos.capturas?.[clave])
          .filter(
            (captura): captura is CapturaManual => !!captura && captura.perfiles.includes(perfil),
          ),
      }),
    ),
    archivo: `manuales/manual-savia-${perfil}.pdf`,
  };
}

export function buscarCapitulos(capitulos: CapituloManual[], consulta: string): CapituloManual[] {
  const normalizar = (valor: string) =>
    valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
  const palabras = normalizar(consulta).trim().split(/\s+/).filter(Boolean);
  return capitulos.filter((capitulo) => {
    const texto = normalizar(
      [
        capitulo.titulo,
        capitulo.resumen,
        ...capitulo.parrafos,
        ...(capitulo.pasos ?? []),
        ...(capitulo.estados ?? []).flatMap((estado) => [estado.estado, estado.descripcion]),
        ...(capitulo.recorridos ?? []).flatMap((recorrido) => [
          recorrido.titulo,
          ...(recorrido.antes ?? []),
          ...recorrido.pasos.flatMap((paso) => [paso.haz, paso.veras]),
          ...(recorrido.comprobar ?? []),
          ...(recorrido.incidencias ?? []),
        ]),
        ...(capitulo.capturas ?? []).flatMap((captura) => [
          captura.titulo,
          captura.descripcion,
          ...captura.marcas.flatMap((marca) => [marca.titulo, marca.descripcion]),
        ]),
      ].join(' '),
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });
}
