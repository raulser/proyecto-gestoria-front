import { TestBed } from '@angular/core/testing';
import { PanelTrabajoComponent } from './panel-trabajo.component';
import {
  RespuestaCliente,
  RespuestaCumplimientoObligacion,
  RespuestaPanel,
  RespuestaSolicitudDocumento,
} from '../modelos-aplicacion';

describe('Panel de trabajo', () => {
  it('muestra al cliente sus archivos sin un listado de sí mismo', async () => {
    const fixture = TestBed.createComponent(PanelTrabajoComponent);
    fixture.componentRef.setInput('esCliente', true);
    fixture.componentRef.setInput('clientes', [
      { id: 1, nombre: 'Cliente propio', nif: 'NIF-PRUEBA', activo: true },
    ]);
    fixture.componentRef.setInput('panel', {
      anio: 2026,
      clientes: [],
      consumo: [],
      totales: {
        totalClientes: 1,
        trimestresFaltantes: 0,
        documentosRecibidos: 0,
        documentosRevisados: 0,
        documentosRechazados: 0,
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Todos mis archivos');
    expect(texto).toContain('Mis entregas');
    expect(texto).not.toContain('NIF-PRUEBA');
    expect(texto).not.toContain('Cliente propio');
  });
  it('selecciona el ejercicio de los datos y emite el año elegido', async () => {
    const fixture = TestBed.createComponent(PanelTrabajoComponent);
    const year = new Date().getFullYear();
    fixture.componentRef.setInput('anio', year);
    fixture.componentRef.setInput('panel', {
      anio: year,
      clientes: [],
      consumo: [],
      totales: {
        totalClientes: 0,
        trimestresFaltantes: 0,
        documentosRecibidos: 0,
        documentosRevisados: 0,
        documentosRechazados: 0,
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      'select',
    )!;
    expect(select.selectedOptions[0].textContent?.trim()).toBe(String(year));
    const emitir = vi.spyOn(fixture.componentInstance.anioChange, 'emit');
    select.selectedIndex = Array.from(select.options).findIndex(
      (o) => o.textContent?.trim() === String(year - 1),
    );
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(emitir).toHaveBeenCalledWith(year - 1);
  });
  it('combina y ordena tareas pendientes sin recuperar entregas cerradas', () => {
    const panel = TestBed.createComponent(PanelTrabajoComponent).componentInstance;
    panel.anio = 2026;
    panel.agenda = [
      {
        id: 1,
        nombreCliente: 'Norte',
        codigoObligacion: '303',
        nombreObligacion: 'IVA',
        fechaLimite: '2026-11-10',
        estado: 'EN_PREPARACION',
      },
      { id: 2, fechaLimite: '2026-11-01', estado: 'PRESENTADA' },
    ] as RespuestaCumplimientoObligacion[];
    panel.solicitudes = [
      {
        id: 3,
        nombreCliente: 'Sur',
        titulo: 'Facturas',
        fechaVencimiento: '2026-11-05',
        estado: 'ABIERTA',
      },
      { id: 4, fechaVencimiento: '2026-11-03', estado: 'COMPLETADA' },
    ] as RespuestaSolicitudDocumento[];
    expect(panel.tareas.map((t) => t.clave)).toEqual(['s-3', 'f-1']);
    const abrir = vi.spyOn(panel.solicitud, 'emit');
    panel.abrir(panel.tareas[0]);
    expect(abrir).toHaveBeenCalledWith(panel.solicitudes[0]);
  });
  it('usa los agregados completos y no ofrece configuración de planes al perfil cliente', () => {
    const panel = TestBed.createComponent(PanelTrabajoComponent).componentInstance;
    panel.anio = 2026;
    panel.panel = {
      consumo: [
        {
          clienteId: 1,
          nombreCliente: 'Norte',
          bytesAlmacenados: 1024,
          documentos: 7,
          facturasEmitidas: 2,
          facturasRecibidas: 3,
        },
        {
          clienteId: 2,
          nombreCliente: 'Sur',
          bytesAlmacenados: 2048,
          documentos: 5,
          facturasEmitidas: 1,
          facturasRecibidas: 4,
        },
      ],
    } as RespuestaPanel;
    expect(panel.emitidas).toBe(3);
    expect(panel.recibidas).toBe(7);
    expect(panel.bytes).toBe(3072);
    expect(panel.documentosAnio).toBe(12);
    panel.clientes = [
      {
        id: 1,
        nombre: 'Norte',
        activo: true,
        planDocumental: {
          automatico: false,
          tipoPersonalizado: '',
          documentos: [
            {
              id: 'tpv',
              nombre: 'TPV',
              tipo: 'OTRO',
              activa: true,
              periodicidad: 'MENSUAL',
              fechaLimite: '2026-12-10',
              apertura: '2026-12-01',
              diasRecordatorio: 3,
            },
          ],
        },
      },
    ] as RespuestaCliente[];
    expect(panel.tareas).toHaveLength(1);
    panel.esCliente = true;
    expect(panel.tareas).toHaveLength(0);
  });
});
