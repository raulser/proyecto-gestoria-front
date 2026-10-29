import { TestBed } from '@angular/core/testing';
import { ServicioFeedback } from './servicio-feedback';

describe('ServicioFeedback', () => {
  let servicio: ServicioFeedback;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(ServicioFeedback);
  });

  afterEach(() => vi.useRealTimers());

  it('mantiene visibles los errores hasta que el usuario los cierre', () => {
    servicio.error('No se pudo subir el documento', 'factura.pdf');
    vi.advanceTimersByTime(20_000);

    expect(servicio.mensajes()).toHaveLength(1);
    expect(servicio.mensajes()[0]).toMatchObject({
      tipo: 'error',
      titulo: 'No se pudo subir el documento',
      detalle: 'factura.pdf',
    });

    servicio.cerrar(servicio.mensajes()[0].id);
    expect(servicio.mensajes()).toEqual([]);
  });

  it('retira automaticamente los mensajes de exito', () => {
    servicio.exito('Documento subido');
    expect(servicio.mensajes()).toHaveLength(1);

    vi.advanceTimersByTime(6_000);
    expect(servicio.mensajes()).toEqual([]);
  });
});
