import { TestBed } from '@angular/core/testing';
import { ServicioDialogos } from './servicio-dialogos';

describe('ServicioDialogos', () => {
  let servicio: ServicioDialogos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(ServicioDialogos);
  });

  it('resuelve una confirmacion desde el modal propio', async () => {
    const resultado = servicio.confirmar({
      titulo: 'Reabrir solicitud',
      descripcion: 'La solicitud volvera a estar en seguimiento.',
      peligro: true,
    });

    expect(servicio.peticion()).toMatchObject({
      tipo: 'confirmacion',
      titulo: 'Reabrir solicitud',
      peligro: true,
    });
    servicio.resolverPeticion(true);

    await expect(resultado).resolves.toBe(true);
    expect(servicio.peticion()).toBeNull();
  });

  it('devuelve el texto introducido y cancela el dialogo anterior', async () => {
    const confirmacionAnterior = servicio.confirmar({ titulo: 'Anterior', descripcion: 'Anterior' });
    const resultado = servicio.pedirTexto({
      titulo: 'Motivo',
      descripcion: 'Explica el motivo.',
      etiquetaCampo: 'Motivo de reapertura',
    });

    await expect(confirmacionAnterior).resolves.toBe(false);
    expect(servicio.peticion()?.tipo).toBe('texto');
    servicio.resolverPeticion('Falta una factura');

    await expect(resultado).resolves.toBe('Falta una factura');
  });
});
