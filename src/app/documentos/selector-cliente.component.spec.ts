import { TestBed } from '@angular/core/testing';
import { SelectorClienteComponent } from './selector-cliente.component';
import { RespuestaCliente } from '../modelos-aplicacion';

describe('Buscador de clientes de Documentos', () => {
  it('permite exigir un cliente concreto con etiqueta accesible y sin opción global', async () => {
    const fixture = TestBed.createComponent(SelectorClienteComponent);
    fixture.componentRef.setInput('etiqueta', 'Cliente vinculado');
    fixture.componentRef.setInput('permitirTodos', false);
    fixture.componentRef.setInput('clientes', [{ id: 21, nombre: 'Nombre', nif: 'B12345678' }]);
    fixture.componentInstance.abrir(); fixture.detectChanges();
    const entrada = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('label').htmlFor).toBe(entrada.id);
    expect(fixture.nativeElement.querySelectorAll('[role=option]').length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Todos los clientes');
    fixture.componentRef.setInput('deshabilitado', true); fixture.detectChanges();
    await fixture.whenStable();
    expect(entrada.disabled).toBe(true);
  });
  it('no despliega toda una cartera grande y permite localizar un cliente por NIF', async () => {
    const fixture = TestBed.createComponent(SelectorClienteComponent);
    const clientes = Array.from(
      { length: 120 },
      (_, i) =>
        ({
          id: i + 1,
          nombre: 'Cliente ' + (i + 1),
          nif: 'B' + String(10000000 + i),
          email: 'demo' + i + '@example.test',
        }) as RespuestaCliente,
    );
    fixture.componentRef.setInput('clientes', clientes);
    fixture.componentInstance.abrir();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role=option]').length).toBe(9);
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    const entrada = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    entrada.value = 'B10000089';
    entrada.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role=option]').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Cliente 90');
    const elegir = vi.spyOn(fixture.componentInstance.cambiar, 'emit');
    entrada.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(elegir).toHaveBeenCalledExactlyOnceWith(90);
  });
});
