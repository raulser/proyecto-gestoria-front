import { fechasIniciales, propuestaDocumental } from './plantillas-documentales';
import { EditorClienteComponent } from './editor-cliente.component';
import { TestBed } from '@angular/core/testing';

describe('Plan documental del alta', () => {
  it('cada cliente recibe su propia copia de la propuesta', () => {
    const uno = propuestaDocumental('AUTONOMO'),
      dos = propuestaDocumental('AUTONOMO');
    uno[0].nombre = 'Mi documento';
    uno.splice(1, 1);
    expect(dos[0].nombre).toBe('Facturas emitidas');
    expect(dos.length).toBe(5);
    expect(uno[0].id).not.toBe(dos[0].id);
  });
  it('otro tipo empieza vacío y los documentos permanentes no fuerzan fechas', () => {
    expect(propuestaDocumental('OTRO')).toEqual([]);
    const contrato = propuestaDocumental('EMPRESA').find((d) => d.periodicidad === 'PERMANENTE')!;
    expect(contrato.apertura).toBeNull();
    expect(contrato.fechaLimite).toBeNull();
    expect(contrato.diasRecordatorio).toBeNull();
  });
  it('calcula el siguiente trimestre al pasar de año sin horas UTC', () => {
    expect(fechasIniciales('TRIMESTRAL', new Date(2026, 10, 3))).toEqual({
      apertura: '2027-01-01',
      fechaLimite: '2027-01-10',
    });
  });
  it('conserva las personalizaciones al cambiar el tipo y al volver a editar', () => {
    const fixture = TestBed.createComponent(EditorClienteComponent);
    const editor = fixture.componentInstance;
    fixture.componentRef.setInput('abierto', true);
    fixture.detectChanges();
    editor.nuevoDocumento = 'Resumen del TPV';
    editor.agregar();
    editor.seleccionar('EMPRESA');
    expect(editor.formulario.planDocumental.documentos.at(-1)?.nombre).toBe('Resumen del TPV');
    editor.quitar(editor.formulario.planDocumental.documentos[0].id);
    expect(
      editor.formulario.planDocumental.documentos.some((d) => d.nombre === 'Facturas emitidas'),
    ).toBe(false);
    fixture.destroy();
  });
});
