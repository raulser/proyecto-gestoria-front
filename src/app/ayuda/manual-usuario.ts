import contenido from './manuales.json';
import { Rol, Vista } from '../modelos-aplicacion';

export type PerfilManual = 'cliente' | 'gestor' | 'administrador';
export interface CapituloManual {
  id: string;
  titulo: string;
  resumen: string;
  parrafos: string[];
  pasos?: string[];
  estados?: { estado: string; descripcion: string }[];
  destino?: Vista;
  accion?: string;
}
interface DatosManuales {
  version: string;
  perfiles: Record<PerfilManual, { nombre: string; descripcion: string; capitulos: string[] }>;
  secciones: Record<string, Omit<CapituloManual, 'id'>>;
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
    capitulos: manual.capitulos.map((id): CapituloManual => ({ ...datos.secciones[id], id })),
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
      ].join(' '),
    );
    return palabras.every((palabra) => texto.includes(palabra));
  });
}
