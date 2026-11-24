import { TestBed } from '@angular/core/testing';
import { RespuestaDocumento } from '../modelos-aplicacion';
import { FILTROS_DOCUMENTOS_VACIOS } from './filtros-repositorio';
import { RepositorioDocumentalComponent } from './repositorio-documental.component';

describe('Repositorio documental', () => {
  const archivo = {
    id: 1,
    clienteId: 4,
    nombreCliente: 'Empresa de prueba',
    nombreArchivoOriginal: 'factura.pdf',
    tipo: 'FACTURA_RECIBIDA',
    periodo: 'TRIMESTRAL',
    anio: 2026,
    trimestre: 2,
    tipoContenido: 'application/pdf',
    origen: 'APORTADO_CLIENTE',
    estado: 'RECIBIDO',
    visibilidad: 'COMPARTIDO_CLIENTE',
    creadoEn: '2026-07-01T12:00:00',
    solicitudId: null,
  } as RespuestaDocumento;

  it('el perfil cliente no tiene filtros de otros clientes ni acciones de revisión', async () => {
    const fixture = TestBed.createComponent(RepositorioDocumentalComponent);
    fixture.componentRef.setInput('esCliente', true);
    fixture.componentRef.setInput('documentos', [archivo]);
    fixture.detectChanges();
    await fixture.whenStable();
    const pantalla = fixture.nativeElement as HTMLElement;
    expect(pantalla.querySelector('app-selector-cliente')).toBeNull();
    expect(pantalla.querySelector('input[type=checkbox]')).toBeNull();
    expect(pantalla.textContent).toContain('Subidos por mí');
    expect(pantalla.textContent).not.toContain('Marcar revisado');
  });

  it('al filtrar por cliente deja de repetir el mismo nombre en todas las filas', () => {
    const fixture = TestBed.createComponent(RepositorioDocumentalComponent);
    fixture.componentRef.setInput('documentos', [archivo]);
    fixture.componentRef.setInput('filtros', { ...FILTROS_DOCUMENTOS_VACIOS, clienteId: 4 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.archivo .cliente')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('factura.pdf');
    expect(fixture.nativeElement.textContent).toContain('T2 · 2026');
  });

  it('un expediente vacío conserva su cliente sin ofrecer cambiarlo ni indicar falsos filtros', () => {
    const fixture = TestBed.createComponent(RepositorioDocumentalComponent);
    fixture.componentRef.setInput('clienteFijo', true);
    fixture.componentRef.setInput('filtros', { ...FILTROS_DOCUMENTOS_VACIOS, clienteId: 4 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-selector-cliente')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay documentos');
    expect(fixture.nativeElement.textContent).not.toContain('No hay coincidencias');
    expect(fixture.nativeElement.textContent).not.toContain('Quitar filtros');
  });

  it('una carga pendiente o fallida no aparece como una carpeta vacía', () => {
    const fixture = TestBed.createComponent(RepositorioDocumentalComponent);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Todavía no hay documentos');
    fixture.componentRef.setInput('cargando', false);
    fixture.componentRef.setInput('error', 'Sin conexión');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Sin conexión',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Todavía no hay documentos');
  });

  it('la selección completa refleja los archivos de la página y desaparece al quitarla', () => {
    const fixture = TestBed.createComponent(RepositorioDocumentalComponent);
    fixture.componentRef.setInput('puedeRevisar', true);
    fixture.componentRef.setInput('documentos', [archivo]);
    fixture.componentRef.setInput('seleccionados', new Set([1]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.encabezados input').checked).toBe(true);
    expect(fixture.nativeElement.querySelector('.seleccion').textContent).toContain(
      '1 seleccionados',
    );
    fixture.componentRef.setInput('seleccionados', new Set());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.seleccion')).toBeNull();
    expect(fixture.nativeElement.querySelector('.encabezados input').checked).toBe(false);
  });
});
