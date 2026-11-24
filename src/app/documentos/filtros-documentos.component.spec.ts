import { TestBed } from '@angular/core/testing';
import { FiltrosDocumentosComponent } from './filtros-documentos.component';

describe('Búsqueda de documentos', () => {
  afterEach(() => vi.useRealTimers());

  it('espera a que termine la escritura y no hace una consulta por pulsación', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(FiltrosDocumentosComponent);
    const componente = fixture.componentInstance;
    const cambiar = vi.spyOn(componente.cambiar, 'emit');
    componente.buscar('f');
    componente.buscar('fac');
    componente.buscar('factura');
    expect(cambiar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(400);
    expect(cambiar).toHaveBeenCalledExactlyOnceWith({ texto: 'factura' });
  });

  it('aplica el cliente con el texto pendiente sin una segunda búsqueda retrasada', async () => {
    vi.useFakeTimers();
    const componente = TestBed.createComponent(FiltrosDocumentosComponent).componentInstance;
    const cambiar = vi.spyOn(componente.cambiar, 'emit');
    componente.buscar('factura');
    componente.aplicar({ clienteId: 4 });
    await vi.advanceTimersByTimeAsync(500);
    expect(cambiar).toHaveBeenCalledExactlyOnceWith({ texto: 'factura', clienteId: 4 });
  });

  it('limpiar cancela la búsqueda pendiente para no restaurar un filtro borrado', async () => {
    vi.useFakeTimers();
    const componente = TestBed.createComponent(FiltrosDocumentosComponent).componentInstance;
    const cambiar = vi.spyOn(componente.cambiar, 'emit');
    componente.buscar('factura');
    componente.restablecer();
    await vi.advanceTimersByTimeAsync(500);
    expect(cambiar).not.toHaveBeenCalled();
    expect(componente.textoLocal).toBe('');
  });
});
