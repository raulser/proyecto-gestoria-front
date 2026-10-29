import { describe, expect, it } from 'vitest';
import { analizarCsvClientes } from './utilidades-importacion-clientes';

describe('analizarCsvClientes', () => {
  it('admite CSV con punto y coma, comillas y tipos opcionales', () => {
    const resultado = analizarCsvClientes(
      'nombre;nif;email;telefono;tipo\n"Taller, Norte";B12345678;INFO@TEST.ES;600123123;AUTONOMO',
    );
    expect(resultado.errores).toEqual([]);
    expect(resultado.clientes[0]).toMatchObject({
      nombre: 'Taller, Norte',
      nif: 'B12345678',
      email: 'info@test.es',
      tipo: 'AUTONOMO',
    });
  });

  it('informa de filas inválidas sin impedir revisar las válidas', () => {
    const resultado = analizarCsvClientes(
      'nombre,nif,email\nCliente,B12345678,cliente@test.es\nOtro,B12345678,no-es-correo',
    );
    expect(resultado.clientes).toHaveLength(1);
    expect(resultado.errores[0]).toContain('Fila 3');
    expect(resultado.errores[0]).toContain('correo no válido');
    expect(resultado.errores[0]).toContain('NIF duplicado');
  });

  it('exige las cabeceras mínimas', () => {
    expect(analizarCsvClientes('nombre;email\nCliente;cliente@test.es').errores[0]).toContain(
      'nif',
    );
  });
});
