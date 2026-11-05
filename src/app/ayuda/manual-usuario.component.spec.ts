import { TestBed } from '@angular/core/testing';
import { ManualUsuarioComponent } from './manual-usuario.component';
import { buscarCapitulos, obtenerManual } from './manual-usuario';

describe('Manual por perfil', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ManualUsuarioComponent] }).compileComponents();
  });
  it('el cliente solo recibe capítulos y acciones de su operativa', () => {
    const manual = obtenerManual('CLIENTE');
    expect(manual.archivo).toContain('manual-savia-cliente.pdf');
    expect(manual.capitulos.some((capitulo) => capitulo.id === 'entregas-cliente')).toBe(true);
    expect(
      manual.capitulos.some((capitulo) => ['equipo', 'plan', 'fiscal'].includes(capitulo.id)),
    ).toBe(false);
    expect(
      manual.capitulos.every(
        (capitulo) => capitulo.destino !== 'equipo' && capitulo.destino !== 'plan',
      ),
    ).toBe(true);
  });
  it('incluye administración solo en los perfiles que la tienen', () => {
    expect(obtenerManual('ASESOR').capitulos.some((capitulo) => capitulo.id === 'equipo')).toBe(
      false,
    );
    for (const rol of ['ADMIN', 'ADMIN_PLATAFORMA'] as const) {
      expect(obtenerManual(rol).capitulos.some((capitulo) => capitulo.id === 'equipo')).toBe(true);
    }
  });
  it('busca sin acentos también en el contenido de los estados', () => {
    const capitulos = obtenerManual('CLIENTE').capitulos;
    expect(
      buscarCapitulos(capitulos, 'REAPERTURA documentacion').some(
        (capitulo) => capitulo.id === 'estados-solicitudes',
      ),
    ).toBe(true);
    expect(buscarCapitulos(capitulos, 'inexistente987')).toEqual([]);
  });
  it('abre el capítulo contextual y permite recuperar el índice tras una búsqueda sin resultados', async () => {
    const fixture = TestBed.createComponent(ManualUsuarioComponent);
    fixture.componentRef.setInput('rol', 'CLIENTE');
    fixture.componentRef.setInput('seccionInicial', 'estados-solicitudes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain(
      'Estados de las peticiones',
    );
    const busqueda: HTMLInputElement = fixture.nativeElement.querySelector('input');
    busqueda.value = 'inexistente987';
    busqueda.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos ese tema');
    fixture.nativeElement.querySelector('.ir-seccion').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('No encontramos ese tema');
  });
  it('al cambiar de perfil reinicia el contenido y el PDF para el nuevo usuario', () => {
    const fixture = TestBed.createComponent(ManualUsuarioComponent);
    fixture.componentRef.setInput('rol', 'ADMIN');
    fixture.componentRef.setInput('seccionInicial', 'equipo');
    fixture.detectChanges();
    fixture.componentRef.setInput('rol', 'CLIENTE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('Tu espacio');
    expect(fixture.nativeElement.querySelector('.descargar-manual').getAttribute('href')).toContain(
      'manual-savia-cliente.pdf',
    );
    const botones = fixture.nativeElement.querySelectorAll('.modos button');
    botones[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.vista).toBe('pdf');
    expect(fixture.componentInstance.urlPdf).toContain('manual-savia-cliente.pdf');
  });
  it('permite volver al flujo de la aplicación desde el capítulo de estados', () => {
    const fixture = TestBed.createComponent(ManualUsuarioComponent);
    fixture.componentRef.setInput('rol', 'ASESOR');
    fixture.componentRef.setInput('seccionInicial', 'estados-solicitudes');
    fixture.detectChanges();
    const navegar = vi.spyOn(fixture.componentInstance.navegar, 'emit');
    fixture.nativeElement.querySelector('.ir-seccion').click();
    expect(navegar).toHaveBeenCalledWith('solicitudes');
  });
});
