import { TestBed } from '@angular/core/testing';
import { ProgresoSubidaComponent } from './progreso-subida.component';

describe('ProgresoSubidaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgresoSubidaComponent] }).compileComponents();
  });

  it('mantiene visible el archivo y el porcentaje mientras se esta subiendo', () => {
    const fixture = TestBed.createComponent(ProgresoSubidaComponent);
    fixture.componentRef.setInput('activo', true);
    fixture.componentRef.setInput('progreso', 42);
    fixture.componentRef.setInput('archivoActual', 'factura-agosto.pdf');
    fixture.componentRef.setInput('indiceActual', 2);
    fixture.componentRef.setInput('totalArchivos', 3);
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    const barra = elemento.querySelector<HTMLElement>('[role="progressbar"]');
    expect(elemento.textContent).toContain('factura-agosto.pdf');
    expect(elemento.textContent).toContain('42%');
    expect(elemento.textContent).toContain('Archivo 2 de 3');
    expect(barra?.getAttribute('aria-valuenow')).toBe('42');
  });

  it('no ocupa espacio cuando no hay una subida activa', () => {
    const fixture = TestBed.createComponent(ProgresoSubidaComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]')).toBeNull();
  });
});
