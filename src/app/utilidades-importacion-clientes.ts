import { TipoCliente } from './modelos-aplicacion';

export interface ClienteImportado {
  fila: number;
  nombre: string;
  nif: string;
  email: string;
  telefono: string;
  tipo: TipoCliente;
}

export interface ResultadoImportacionClientes {
  clientes: ClienteImportado[];
  errores: string[];
}

const TIPOS_CLIENTE = new Set<TipoCliente>([
  'AUTONOMO',
  'EMPRESA',
  'PARTICULAR',
  'COMUNIDAD_BIENES',
  'SOCIEDAD_CIVIL',
  'COMUNIDAD_PROPIETARIOS',
  'ASOCIACION_FUNDACION',
  'ENTIDAD_SIN_PERSONALIDAD',
  'OTRO',
]);

export function analizarCsvClientes(contenido: string): ResultadoImportacionClientes {
  const lineas = contenido
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((linea) => linea.trim());
  if (lineas.length === 0) return { clientes: [], errores: ['El archivo está vacío.'] };

  const separador = detectarSeparador(lineas[0]);
  const cabeceras = dividirLineaCsv(lineas[0], separador).map(normalizarCabecera);
  const obligatorias = ['nombre', 'nif', 'email'];
  const ausentes = obligatorias.filter((campo) => !cabeceras.includes(campo));
  if (ausentes.length > 0) {
    return { clientes: [], errores: [`Faltan las columnas obligatorias: ${ausentes.join(', ')}.`] };
  }

  const clientes: ClienteImportado[] = [];
  const errores: string[] = [];
  const nifVistos = new Set<string>();
  for (let indice = 1; indice < lineas.length; indice++) {
    const fila = indice + 1;
    const valores = dividirLineaCsv(lineas[indice], separador);
    const valor = (campo: string) => (valores[cabeceras.indexOf(campo)] ?? '').trim();
    const nombre = valor('nombre');
    const nif = valor('nif').toUpperCase();
    const email = valor('email').toLowerCase();
    const telefono = valor('telefono');
    const tipoLeido = (valor('tipo') || 'EMPRESA')
      .toUpperCase()
      .replaceAll(' ', '_') as TipoCliente;

    const fallos: string[] = [];
    if (!nombre) fallos.push('nombre vacío');
    if (!nif) fallos.push('NIF vacío');
    if (!/^\S+@\S+\.\S+$/.test(email)) fallos.push('correo no válido');
    if (!TIPOS_CLIENTE.has(tipoLeido)) fallos.push(`tipo desconocido “${tipoLeido}”`);
    if (nifVistos.has(nif)) fallos.push('NIF duplicado dentro del archivo');
    if (fallos.length > 0) {
      errores.push(`Fila ${fila}: ${fallos.join(', ')}.`);
      continue;
    }

    nifVistos.add(nif);
    clientes.push({ fila, nombre, nif, email, telefono, tipo: tipoLeido });
  }
  return { clientes, errores };
}

function normalizarCabecera(cabecera: string): string {
  return cabecera
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectarSeparador(cabecera: string): ',' | ';' {
  return (cabecera.match(/;/g)?.length ?? 0) > (cabecera.match(/,/g)?.length ?? 0) ? ';' : ',';
}

function dividirLineaCsv(linea: string, separador: ',' | ';'): string[] {
  const campos: string[] = [];
  let actual = '';
  let entreComillas = false;
  for (let indice = 0; indice < linea.length; indice++) {
    const caracter = linea[indice];
    if (caracter === '"') {
      if (entreComillas && linea[indice + 1] === '"') {
        actual += '"';
        indice++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (caracter === separador && !entreComillas) {
      campos.push(actual);
      actual = '';
    } else {
      actual += caracter;
    }
  }
  campos.push(actual);
  return campos;
}
