import { TestBed } from '@angular/core/testing';
import { EditorSolicitudComponent, FormularioSolicitud } from './editor-solicitud.component';

describe('Editor de peticiones documentales', () => {
  async function crear() {
    const fixture = TestBed.createComponent(EditorSolicitudComponent);
    const formulario: FormularioSolicitud = {
      clienteId: 1,
      asesorAsignadoId: null,
      titulo: 'Facturas del periodo',
      descripcion: '',
      tiposDocumentoEsperados: ['FACTURA_RECIBIDA'],
      anio: 2026,
      trimestre: 4,
      fechaVencimiento: '2026-12-10',
      recurrencia: 'NINGUNA',
    };
    fixture.componentRef.setInput('formulario', formulario);
    fixture.componentRef.setInput('clientes', [{ id: 1, nombre: 'Cliente de ejemplo' }]);
    fixture.componentRef.setInput('opcionesTipo', [
      { valor: 'FACTURA_EMITIDA', etiqueta: 'Factura emitida' },
      { valor: 'FACTURA_RECIBIDA', etiqueta: 'Factura recibida' },
      { valor: 'NOMINA', etiqueta: 'Nómina' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, formulario };
  }
  it('selecciona varios tipos con casillas sin sustituir los anteriores', async () => {
    const { fixture, formulario } = await crear();
    const casillas = fixture.nativeElement.querySelectorAll(
      'input[type=checkbox]',
    ) as NodeListOf<HTMLInputElement>;
    expect(casillas[1].checked).toBe(true);
    casillas[0].click();
    casillas[2].click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(formulario.tiposDocumentoEsperados).toEqual([
      'FACTURA_RECIBIDA',
      'FACTURA_EMITIDA',
      'NOMINA',
    ]);
    casillas[1].click();
    await fixture.whenStable();
    expect(formulario.tiposDocumentoEsperados).toEqual(['FACTURA_EMITIDA', 'NOMINA']);
    expect(fixture.nativeElement.querySelector('select[multiple]')).toBeNull();
    fixture.destroy();
  });
  it('no envía una petición sin documentación seleccionada y explica el problema', async () => {
    const { fixture, formulario } = await crear();
    const guardar = vi.spyOn(fixture.componentInstance.guardar, 'emit');
    formulario.tiposDocumentoEsperados = [];
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(guardar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'al menos un tipo',
    );
    fixture.destroy();
  });
  it('conserva el foco en el panel y no permite cerrar mientras se guarda', async () => {
    const anterior = document.body.style.overflow;
    const { fixture } = await crear();
    const cancelar = vi.spyOn(fixture.componentInstance.cancelar, 'emit');
    const botones = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    botones[botones.length - 1].focus();
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(botones[0]);
    fixture.componentRef.setInput('guardando', true);
    fixture.detectChanges();
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(cancelar).not.toHaveBeenCalled();
    fixture.componentRef.setInput('guardando', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(botones[botones.length - 1]);
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(cancelar).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(document.body.style.overflow).toBe(anterior);
  });
});
