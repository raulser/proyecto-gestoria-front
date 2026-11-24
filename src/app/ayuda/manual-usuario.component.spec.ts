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
  it('filtra las capturas por perfil también en capítulos compartidos', () => {
    const gestor = obtenerManual('ASESOR');
    const administrador = obtenerManual('ADMIN');
    const capturasGestor = gestor.capitulos.flatMap((c) => c.capturas ?? []);
    const capturasAdmin = administrador.capitulos.flatMap((c) => c.capturas ?? []);
    expect(capturasGestor.some((c) => c.archivo.endsWith('panel-gestor.jpg'))).toBe(true);
    expect(capturasGestor.some((c) => c.archivo.endsWith('panel-administrador.jpg'))).toBe(false);
    expect(capturasAdmin.some((c) => c.archivo.endsWith('panel-administrador.jpg'))).toBe(true);
    expect(capturasAdmin.some((c) => c.archivo.endsWith('movil-gestor.jpg'))).toBe(false);
    for (const rol of ['CLIENTE', 'ASESOR', 'ADMIN'] as const) {
      const manual = obtenerManual(rol);
      expect(
        manual.capitulos
          .flatMap((c) => c.capturas ?? [])
          .every((c) => c.perfiles.includes(manual.perfil)),
      ).toBe(true);
    }
  });
  it('encuentra instrucciones de un recorrido y las leyendas de sus capturas', () => {
    const capitulos = obtenerManual('ASESOR').capitulos;
    expect(buscarCapitulos(capitulos, 'cola aportaciones').some((c) => c.id === 'documentos')).toBe(
      true,
    );
    expect(buscarCapitulos(capitulos, 'límite documental').some((c) => c.id === 'clientes')).toBe(
      true,
    );
  });
  it('muestra acciones, resultados y controles señalados al abrir un capítulo ilustrado', () => {
    const fixture = TestBed.createComponent(ManualUsuarioComponent);
    fixture.componentRef.setInput('rol', 'CLIENTE');
    fixture.componentRef.setInput('seccionInicial', 'archivos-cliente');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pasos-guiados strong').textContent).toContain(
      'Mis archivos',
    );
    expect(fixture.nativeElement.querySelector('.pasos-guiados p').textContent).toContain(
      'publicados',
    );
    const imagen = fixture.nativeElement.querySelector('figure img') as HTMLImageElement;
    expect(imagen.getAttribute('src')).toBe('manuales/capturas/archivos-cliente.jpg');
    expect(imagen.getAttribute('alt')).toContain('Consultar tus documentos');
    expect(fixture.nativeElement.querySelectorAll('.marca-captura').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('figure a').getAttribute('target')).toBe('_blank');
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
