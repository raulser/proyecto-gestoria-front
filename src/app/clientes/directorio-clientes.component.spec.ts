import { TestBed } from '@angular/core/testing';
import { DirectorioClientesComponent } from './directorio-clientes.component';
import { RespuestaCliente, RespuestaSolicitudDocumento } from '../modelos-aplicacion';

describe('Directorio de clientes', () => {
  it('busca por NIF y conserva accesible el archivo de clientes inactivos', () => {
    const component = TestBed.createComponent(DirectorioClientesComponent).componentInstance;
    component.clientes = [
      { id: 1, nombre: 'Empresa Norte', nif: 'B12345678', email: 'norte@ejemplo.es', activo: true },
      { id: 2, nombre: 'Empresa Sur', nif: 'B87654321', email: 'sur@ejemplo.es', activo: false },
    ] as RespuestaCliente[];
    component.busqueda = 'b1234';
    expect(component.filtrados.map((c) => c.id)).toEqual([1]);
    component.busqueda = '';
    component.filtro = 'ARCHIVADOS';
    expect(component.filtrados.map((c) => c.id)).toEqual([2]);
    expect(component.seleccionado?.id).toBe(2);
    component.clientes = [];
    expect(component.seleccionado).toBeNull();
  });
  it('separa las entregas abiertas de las enviadas y excluye las cerradas', () => {
    const component = TestBed.createComponent(DirectorioClientesComponent).componentInstance;
    const cliente = { id: 1 } as RespuestaCliente;
    component.solicitudes = [
      { clienteId: 1, estado: 'ABIERTA' },
      { clienteId: 1, estado: 'PARCIAL' },
      { clienteId: 1, estado: 'ENVIADA' },
      { clienteId: 1, estado: 'COMPLETADA' },
      { clienteId: 2, estado: 'ENVIADA' },
    ] as RespuestaSolicitudDocumento[];
    expect(component.entregas(cliente)).toBe(2);
    expect(component.entregas(cliente, true)).toBe(1);
    expect(component.porRevisar).toBe(2);
  });
});
