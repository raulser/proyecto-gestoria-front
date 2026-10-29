import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Aplicacion } from './aplicacion';
import {
  RespuestaCliente,
  RespuestaCumplimientoObligacion,
  RespuestaDocumento,
  RespuestaSolicitudDocumento,
  RespuestaUsuario,
} from './modelos-aplicacion';

describe('Aplicacion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aplicacion],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(Aplicacion);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('marca como falta un tipo del checklist sin documentos activos', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.documentos = [];

    expect(app.estadoTipoSolicitud(solicitud(), 'FACTURA_EMITIDA')).toBe('FALTA');
  });

  it('ignora documentos retirados al calcular el checklist', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.documentos = [documento('RETIRADO')];

    expect(app.estadoTipoSolicitud(solicitud(), 'FACTURA_RECIBIDA')).toBe('FALTA');
  });

  it('muestra revisado cuando todos los documentos activos estan revisados', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.documentos = [documento('REVISADO')];
    const solicitudRevisada = solicitud();
    solicitudRevisada.estadoChecklist.FACTURA_RECIBIDA = 'REVISADO';

    expect(app.estadoTipoSolicitud(solicitudRevisada, 'FACTURA_RECIBIDA')).toBe('REVISADO');
  });

  it('abre el repositorio filtrado por la peticion seleccionada', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const peticion = solicitud();
    vi.spyOn(app, 'cargarPaginaDocumentos');
    vi.stubGlobal('scrollTo', vi.fn());

    app.abrirDocumentosSolicitud(peticion);

    expect(app.vistaActiva).toBe('documentos');
    expect(app.filtroClienteDocumento).toBe(peticion.clienteId);
    expect(app.filtroSolicitudDocumento).toBe(peticion.id);
    expect(app.cargarPaginaDocumentos).toHaveBeenCalledWith(0);
    vi.unstubAllGlobals();
  });

  it('relaciona una peticion con el vencimiento fiscal exacto', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const peticion = { ...solicitud(), cumplimientoObligacionId: cumplimiento().id };
    app.solicitudes = [peticion, { ...solicitud(), id: 32, cumplimientoObligacionId: null }];

    expect(app.solicitudesDeCumplimiento(cumplimiento())).toEqual([peticion]);
  });

  it('mantiene accesibles las peticiones historicas del mismo cliente y periodo', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const historica = { ...solicitud(), cumplimientoObligacionId: null };
    app.solicitudes = [historica, { ...historica, id: 32, trimestre: 4 }];

    expect(app.solicitudesRelacionadasCumplimiento(cumplimiento())).toEqual([historica]);
  });

  it('filtra clientes por nombre, NIF, email, telefono y tipo', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.clientes = [cliente(1, 'Alfa', true, 'AUTONOMO'), cliente(2, 'Beta', false, 'EMPRESA')];

    app.terminoBusqueda = 'autonomo';
    expect(app.clientesFiltrados().map((item) => item.id)).toEqual([1]);
    app.terminoBusqueda = 'b00000002';
    expect(app.clientesFiltrados().map((item) => item.id)).toEqual([2]);
    app.terminoBusqueda = '  ';
    expect(app.clientesFiltrados()).toBe(app.clientes);
  });

  it('calcula documentos y porcentaje del trimestre activo', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.anioSeleccionado = 2026;
    app.trimestreActivo = 3;
    app.documentos = [documento('RECIBIDO'), { ...documento('REVISADO'), id: 2, trimestre: 2 }];
    app.panel = {
      anio: 2026,
      clientes: [
        {
          clienteId: 21,
          nombreCliente: 'Cliente',
          tipo: 'EMPRESA',
          activo: true,
          trimestres: {
            '1': { estado: 'REVISADO', cantidadDocumentos: 1 },
            '2': { estado: 'FALTA', cantidadDocumentos: 0 },
            '3': { estado: 'REVISADO', cantidadDocumentos: 1 },
            '4': { estado: 'RECIBIDO', cantidadDocumentos: 1 },
          },
        },
      ],
      totales: {
        totalClientes: 1,
        trimestresFaltantes: 1,
        documentosRecibidos: 2,
        documentosRevisados: 1,
        documentosRechazados: 1,
      },
    };

    expect(app.documentosDelTrimestre()).toHaveLength(1);
    expect(app.trimestreStatus(21, 1)).toBe('REVISADO');
    expect(app.trimestreStatus(99, 1)).toBe('FALTA');
    expect(app.porcentajeCompletado()).toBe(50);
    expect(app.cantidadPendientes()).toBe(3);
  });

  it('ignora clientes inactivos en el porcentaje y devuelve cero sin clientes', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    expect(app.porcentajeCompletado()).toBe(0);
    app.panel = {
      anio: 2026,
      clientes: [
        {
          clienteId: 21,
          nombreCliente: 'Inactivo',
          tipo: 'EMPRESA',
          activo: false,
          trimestres: {},
        },
      ],
      totales: {
        totalClientes: 1,
        trimestresFaltantes: 4,
        documentosRecibidos: 0,
        documentosRevisados: 0,
        documentosRechazados: 0,
      },
    };
    expect(app.porcentajeCompletado()).toBe(0);
  });

  it('no penaliza clientes sin obligaciones trimestrales configuradas', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.panel = {
      anio: 2026,
      clientes: [
        {
          clienteId: 21,
          nombreCliente: 'Sin ficha',
          tipo: 'OTRO',
          activo: true,
          trimestres: Object.fromEntries(
            [1, 2, 3, 4].map((trimestre) => [
              String(trimestre),
              {
                estado: 'SIN_CONFIGURAR',
                cantidadDocumentos: 0,
              },
            ]),
          ),
        },
      ],
      totales: {
        totalClientes: 1,
        trimestresFaltantes: 0,
        documentosRecibidos: 0,
        documentosRevisados: 0,
        documentosRechazados: 0,
      },
    };

    expect(app.etiquetaEstadoTrimestre('SIN_CONFIGURAR')).toBe('Sin configurar');
    expect(app.porcentajeCompletado()).toBe(0);
  });

  it('aplica permisos y menu segun el perfil', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('CLIENTE');
    expect(app.esCliente()).toBe(true);
    expect(app.puedeAdministrar()).toBe(false);
    expect(app.puedeGestionarClientes()).toBe(false);
    expect(app.puedeRevisarDocumentos()).toBe(false);
    expect(app.elementosMenuVisibles().map((item) => item.view)).not.toContain('equipo');
    expect(app.elementosMenuVisibles().find((item) => item.view === 'clientes')?.label).toBe(
      'Mi expediente',
    );
    expect(app.elementosMenuVisibles().find((item) => item.view === 'solicitudes')?.label).toBe(
      'Lo que debo entregar',
    );
    expect(app.elementosMenuVisibles().find((item) => item.view === 'documentos')?.label).toBe(
      'Mis archivos',
    );
    expect(app.tituloVista()).toBe('Mi espacio documental');

    app.usuarioActual = usuario('ASESOR');
    expect(app.puedeGestionarClientes()).toBe(true);
    expect(app.puedeRevisarDocumentos()).toBe(true);

    app.usuarioActual = usuario('ADMIN');
    expect(app.puedeAdministrar()).toBe(true);
    expect(app.elementosMenuVisibles().map((item) => item.view)).toContain('plan');
    expect(app.elementosMenuVisibles().find((item) => item.view === 'clientes')?.label).toBe(
      'Clientes',
    );
  });

  it('valida claves temporales con la politica de produccion', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;

    expect(app.contrasenaTemporalValida('Temporal-2026!')).toBe(true);
    expect(app.contrasenaTemporalValida('solo-minusculas-2026')).toBe(false);
    expect(app.contrasenaTemporalValida('SinSimbolo2026')).toBe(false);
    expect(app.contrasenaTemporalValida('Corta1!')).toBe(false);
  });

  it('prepara la edicion de un cliente sin perder su estado', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const existente = cliente(21, 'Cliente', false, 'COMUNIDAD_BIENES');

    app.editarCliente(existente);

    expect(app.clienteEditandoId).toBe(21);
    expect(app.nuevoCliente).toMatchObject({
      nombre: 'Cliente',
      tipo: 'COMUNIDAD_BIENES',
      activo: false,
    });
    app.cancelarEdicionCliente();
    expect(app.clienteEditandoId).toBeNull();
    expect(app.nuevoCliente.activo).toBe(true);
  });

  it('convierte una obligacion en una solicitud documental editable', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('ASESOR');
    app.clienteObligacionesSeleccionado = cliente(21, 'Cliente', true, 'AUTONOMO');

    app.prepararSolicitudObligacion({
      id: 5,
      clienteId: 21,
      codigo: '303',
      nombre: 'IVA',
      categoria: 'FISCAL',
      periodicidad: 'TRIMESTRAL',
      mesesPresentacion: 'abril, julio, octubre, enero',
      diaLimite: 20,
      observaciones: null,
      tiposDocumentoEsperados: ['FACTURA_RECIBIDA', 'EXTRACTO_BANCARIO'],
      activa: true,
      creadoEn: '',
    });

    expect(app.vistaActiva).toBe('solicitudes');
    expect(app.nuevaSolicitud.clienteId).toBe(21);
    expect(app.nuevaSolicitud.titulo).toContain('303');
    expect(app.nuevaSolicitud.tiposDocumentoEsperados).toContain('FACTURA_RECIBIDA');
    expect(app.nuevaSolicitud.tiposDocumentoEsperados).toContain('EXTRACTO_BANCARIO');
    expect(app.nuevaSolicitud.recurrencia).toBe('TRIMESTRAL');
    expect(app.clienteObligacionesSeleccionado).toBeNull();
  });

  it('aplica una plantilla como propuesta editable con su checklist', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.plantillasObligacion = [
      {
        clave: 'IVA_TRIMESTRAL',
        codigo: '303',
        nombre: 'IVA trimestral',
        categoria: 'FISCAL',
        periodicidad: 'TRIMESTRAL',
        mesesPresentacion: 'abril, julio, octubre, enero',
        diaLimiteOrientativo: 20,
        observaciones: 'Revisar para el cliente',
        tiposDocumentoEsperados: ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA', 'TICKET'],
      },
    ];
    app.plantillaObligacionSeleccionada = 'IVA_TRIMESTRAL';

    app.aplicarPlantillaObligacion();

    expect(app.formularioObligacion.codigo).toBe('303');
    expect(app.formularioObligacion.tiposDocumentoEsperados).toEqual([
      'FACTURA_EMITIDA',
      'FACTURA_RECIBIDA',
      'TICKET',
    ]);
    app.alternarTipoDocumentoObligacion('TICKET', false);
    expect(app.formularioObligacion.tiposDocumentoEsperados).not.toContain('TICKET');
  });

  it('prepara desde un vencimiento una solicitud unica para el periodo correcto', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('ASESOR');
    app.clienteObligacionesSeleccionado = cliente(21, 'Cliente', true, 'AUTONOMO');
    app.obligacionesCliente = [
      {
        id: 5,
        clienteId: 21,
        codigo: '303',
        nombre: 'IVA',
        categoria: 'FISCAL',
        periodicidad: 'TRIMESTRAL',
        mesesPresentacion: null,
        diaLimite: 20,
        observaciones: null,
        tiposDocumentoEsperados: ['FACTURA_RECIBIDA', 'FACTURA_EMITIDA'],
        activa: true,
        creadoEn: '',
      },
    ];

    app.prepararSolicitudCumplimiento({
      id: 9,
      clienteId: 21,
      nombreCliente: 'Cliente',
      obligacionId: 5,
      codigoObligacion: '303',
      nombreObligacion: 'IVA',
      categoria: 'FISCAL',
      periodicidad: 'TRIMESTRAL',
      anio: 2026,
      periodoClave: 'T4',
      fechaLimite: '2027-01-20',
      estado: 'PENDIENTE_DOCUMENTACION',
      vencida: false,
      responsableId: 1,
      nombreResponsable: 'Asesor',
      resultado: 'SIN_RESULTADO',
      importe: null,
      fechaPresentacion: null,
      referencia: null,
      nrc: null,
      justificanteDocumentoId: null,
      observacionesInternas: null,
      mensajeCliente: null,
      creadoEn: '',
      actualizadoEn: '',
    });

    expect(app.nuevaSolicitud.titulo).toContain('T4');
    expect(app.nuevaSolicitud.trimestre).toBe(4);
    expect(app.nuevaSolicitud.fechaVencimiento).toBe('2027-01-10');
    expect(app.nuevaSolicitud.recurrencia).toBe('NINGUNA');
    expect(app.nuevaSolicitud.tiposDocumentoEsperados).toEqual([
      'FACTURA_RECIBIDA',
      'FACTURA_EMITIDA',
    ]);
  });

  it('resume contadores de clientes, solicitudes, asesores y notificaciones', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.clientes = [
      cliente(1, 'Activo', true, 'EMPRESA'),
      cliente(2, 'Inactivo', false, 'AUTONOMO'),
    ];
    app.solicitudes = [solicitud(), { ...solicitud(), id: 32, estado: 'COMPLETADA' }];
    app.usuarios = [
      usuario('ASESOR'),
      { ...usuario('ASESOR'), id: 2, activo: false },
      usuario('CLIENTE'),
    ];
    app.notificaciones = [
      {
        id: 1,
        tipo: 'VENCIDA',
        titulo: 'A',
        cuerpo: 'A',
        solicitudDocumentoId: 31,
        documentoId: null,
        cumplimientoObligacionId: null,
        leida: false,
        creadoEn: '',
      },
      {
        id: 2,
        tipo: 'VENCIDA',
        titulo: 'B',
        cuerpo: 'B',
        solicitudDocumentoId: 31,
        documentoId: null,
        cumplimientoObligacionId: null,
        leida: true,
        creadoEn: '',
      },
    ];

    expect(app.cantidadClientesActivos()).toBe(1);
    expect(app.solicitudesAbiertas()).toBe(1);
    expect(app.asesores()).toHaveLength(1);
    expect(app.notificacionesNoLeidas()).toBe(1);
  });

  it('cuenta para el cliente solo entregas por completar y correcciones', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('CLIENTE');
    app.solicitudes = [solicitud(), { ...solicitud(), id: 32, estado: 'ENVIADA' }];
    app.panel = {
      anio: 2026,
      clientes: [],
      totales: {
        totalClientes: 1,
        trimestresFaltantes: 4,
        documentosRecibidos: 9,
        documentosRevisados: 0,
        documentosRechazados: 2,
      },
    };

    expect(app.cantidadPendientes()).toBe(3);
    expect(app.etiquetaEstadoTrimestre('FALTA')).toBe('Sin documentos');
    expect(app.etiquetaEstadoTrimestre('REVISADO')).toBe('Al día');
  });

  it('formatea etiquetas, bytes, meses y porcentajes de uso', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    expect(app.etiquetaEstadoSolicitud('ENVIADA')).toBe('Pendiente de revisión');
    app.usuarioActual = usuario('CLIENTE');
    expect(app.etiquetaEstadoSolicitud('ABIERTA')).toBe('Pendiente de documentos');
    expect(app.etiquetaEstadoSolicitud('PARCIAL')).toBe('Entrega en curso');
    expect(app.etiquetaEstadoSolicitud('ENVIADA')).toBe('Enviado a la gestoría');
    expect(app.etiquetaEstadoDocumento('RECHAZADO')).toBe('Necesita corrección');
    expect(app.etiquetaOrigenDocumento(documento('RECIBIDO'))).toBe('Subido por ti');
    expect(app.etiquetaEstadoCumplimiento('PENDIENTE_DOCUMENTACION')).toBe('Falta documentación');
    expect(app.etiquetaResultadoCumplimiento('A_COMPENSAR')).toBe('A compensar');
    expect(app.etiquetaRecurrencia('TRIMESTRAL')).toBe('Trimestral');
    expect(app.etiquetaTipoCliente('AUTONOMO')).toBe('Autónomo');
    expect(app.etiquetaTipoDocumento('FACTURA_RECIBIDA')).toBe('Factura recibida');
    expect(app.etiquetaMes(12)).toBe('Diciembre');
    expect(app.etiquetaMes(null)).toBe('-');
    expect(app.formatearBytes(0)).toBe('0 B');
    expect(app.formatearBytes(1024)).toBe('1 KB');
    expect(app.porcentajeUso(75, 100)).toBe(75);
    expect(app.porcentajeUso(150, 100)).toBe(100);
    expect(app.porcentajeUso(10, 0)).toBe(0);
  });

  it('captura los archivos seleccionados por el usuario', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const fichero = new File(['factura'], 'factura.pdf', { type: 'application/pdf' });
    app.alSeleccionarArchivo({ target: { files: [fichero] } } as unknown as Event);
    expect(app.archivosSeleccionados).toEqual([fichero]);
  });

  it('explica el estado de la entrega según el perfil', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const enCurso = solicitud();

    app.usuarioActual = usuario('CLIENTE');
    expect(app.descripcionEstadoSolicitud(enCurso)).toContain('seguir añadiendo');
    app.usuarioActual = usuario('ASESOR');
    expect(app.descripcionEstadoSolicitud(enCurso)).toContain('puede añadir más');
  });

  it('permite cerrar y volver a abrir la guía inicial', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('CLIENTE');
    localStorage.clear();

    app.abrirGuia();
    expect(app.guiaVisible).toBe(true);
    app.cerrarGuia();
    expect(app.guiaVisible).toBe(false);
    app.abrirGuia();
    app.irDesdeGuia('solicitudes');
    expect(app.vistaActiva).toBe('solicitudes');
    expect(app.guiaVisible).toBe(false);
  });

  it('selecciona documentos visibles y reconoce los formatos con vista previa', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('ADMIN');
    app.documentosRepositorio = [
      documento('RECIBIDO'),
      { ...documento('BORRADOR'), id: 2, tipoContenido: 'text/plain' },
    ];

    app.cambiarSeleccionTodosDocumentos(true);
    expect([...app.seleccionDocumentos]).toEqual([1, 2]);
    expect(app.esPrevisualizable(app.documentosRepositorio[0])).toBe(true);
    expect(app.esPrevisualizable(app.documentosRepositorio[1])).toBe(false);
    app.cambiarSeleccionDocumento(1, false);
    expect(app.documentoSeleccionado(1)).toBe(false);
  });

  it('resume la carga del equipo y detecta clientes sin asesor', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const asesor = { ...usuario('ASESOR'), id: 13, nombre: 'Ana' };
    app.usuarios = [asesor];
    app.clientes = [
      cliente(21, 'Cliente', true, 'EMPRESA'),
      cliente(22, 'Sin asesor', true, 'AUTONOMO'),
    ];
    app.asignaciones = [
      {
        id: 1,
        asesorId: 13,
        nombreAsesor: 'Ana',
        clienteId: 21,
        nombreCliente: 'Cliente',
        asignadoEn: '',
      },
    ];
    app.solicitudes = [{ ...solicitud(), estado: 'ENVIADA', vencida: true }];

    expect(app.cargaEquipo()).toEqual([
      { id: 13, nombre: 'Ana', clientes: 1, abiertas: 0, porRevisar: 1, vencidas: 1 },
    ]);
    expect(app.clientesSinAsesor()).toBe(1);
  });

  it('renderiza la ayuda de entrega para un cliente', () => {
    const fixture = TestBed.createComponent(Aplicacion);
    fixture.componentInstance.usuarioActual = usuario('CLIENTE');
    fixture.componentInstance.vistaActiva = 'solicitudes';
    fixture.componentInstance.solicitudes = [solicitud()];
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Puedes añadir tantas facturas como necesites');
    expect(texto).toContain('He terminado: enviar');
    expect(texto).toContain('Entrega en curso');
    const opcionMenu = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Lo que debo entregar"]',
    );
    expect(opcionMenu?.title).toBe('Lo que debo entregar');
  });

  it('abre directamente el expediente del cliente sin obligarle a elegir su propia ficha', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('CLIENTE');
    app.clientes = [cliente(21, 'Cliente', true, 'AUTONOMO')];
    const abrirObligaciones = vi.spyOn(app, 'abrirObligaciones');
    vi.stubGlobal('scrollTo', vi.fn());

    app.cambiarVista('clientes');

    expect(app.vistaActiva).toBe('clientes');
    expect(abrirObligaciones).toHaveBeenCalledOnce();
    expect(abrirObligaciones).toHaveBeenCalledWith(app.clientes[0]);
    vi.unstubAllGlobals();
  });

  it('no ofrece desplegar un vencimiento del cliente cuando no contiene informacion util', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    const vacio = cumplimiento();

    expect(app.tieneDetallePublicoCumplimiento(vacio)).toBe(false);
    expect(
      app.tieneDetallePublicoCumplimiento({
        ...vacio,
        mensajeCliente: 'Presentado correctamente',
      }),
    ).toBe(true);
  });

  it('calcula el avance del perfil fiscal sin considerar los datos pendientes como resueltos', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;

    expect(app.porcentajePerfilFiscal()).toBe(0);
    app.formularioPerfilFiscal.regimenIrpf = 'NO_APLICA';
    app.formularioPerfilFiscal.regimenIva = 'GENERAL';
    app.formularioPerfilFiscal.tieneTrabajadores = 'NO';

    expect(app.porcentajePerfilFiscal()).toBe(23);
  });

  it('convierte un calendario fiscal especifico en una peticion documental no recurrente', () => {
    const app = TestBed.createComponent(Aplicacion).componentInstance;
    app.usuarioActual = usuario('ASESOR');
    app.clienteObligacionesSeleccionado = cliente(21, 'Cliente', true, 'EMPRESA');

    app.prepararSolicitudObligacion({
      id: 6,
      clienteId: 21,
      codigo: '202',
      nombre: 'Pagos fraccionados de Sociedades',
      categoria: 'FISCAL',
      periodicidad: 'PERSONALIZADA',
      mesesPresentacion: 'abril, octubre, diciembre',
      diaLimite: 20,
      observaciones: null,
      tiposDocumentoEsperados: ['JUSTIFICANTE'],
      activa: true,
      creadoEn: '',
    });

    expect(app.nuevaSolicitud.recurrencia).toBe('NINGUNA');
  });
});

function cliente(
  id: number,
  nombre: string,
  activo: boolean,
  tipo: RespuestaCliente['tipo'],
): RespuestaCliente {
  return {
    id,
    nombre,
    activo,
    tipo,
    nif: `B${String(id).padStart(8, '0')}`,
    email: `${nombre.toLowerCase()}@test.local`,
    telefono: `60000000${id}`,
    creadoEn: '2026-01-01T10:00:00',
  };
}

function usuario(rol: RespuestaUsuario['rol']): RespuestaUsuario {
  return {
    id: rol === 'CLIENTE' ? 3 : 1,
    nombre: rol,
    email: `${rol.toLowerCase()}@test.local`,
    rol,
    empresaId: 7,
    nombreEmpresa: 'Gestoria',
    clienteId: rol === 'CLIENTE' ? 21 : null,
    activo: true,
  };
}

function solicitud(): RespuestaSolicitudDocumento {
  return {
    id: 31,
    clienteId: 21,
    nombreCliente: 'Cliente',
    asesorAsignadoId: 13,
    nombreAsesorAsignado: 'Asesor',
    cumplimientoObligacionId: null,
    titulo: 'T3',
    descripcion: null,
    tiposDocumentoEsperados: ['FACTURA_RECIBIDA', 'FACTURA_EMITIDA'],
    estadoChecklist: { FACTURA_RECIBIDA: 'FALTA', FACTURA_EMITIDA: 'FALTA' },
    anio: 2026,
    trimestre: 3,
    fechaVencimiento: '2026-10-20',
    estado: 'PARCIAL',
    recurrencia: 'NINGUNA',
    vencida: false,
    completadoEn: null,
    reaperturaSolicitadaEn: null,
    motivoReapertura: null,
    creadoEn: '2026-08-01T10:00:00',
    actualizadoEn: '2026-08-01T10:00:00',
  };
}

function documento(estado: RespuestaDocumento['estado']): RespuestaDocumento {
  return {
    id: 1,
    clienteId: 21,
    nombreCliente: 'Cliente',
    subidoPorId: 4,
    nombreSubidoPor: 'Cliente',
    tipo: 'FACTURA_RECIBIDA',
    anio: 2026,
    periodo: 'MENSUAL',
    trimestre: 3,
    mes: 7,
    fechaDocumento: null,
    origen: 'APORTADO_CLIENTE',
    visibilidad: 'COMPARTIDO_CLIENTE',
    estado,
    nombreArchivoOriginal: 'factura.pdf',
    tamano: 100,
    tipoContenido: 'application/pdf',
    titulo: null,
    descripcion: null,
    referencia: null,
    comentarioAsesor: null,
    solicitudId: 31,
    sustituyeDocumentoId: null,
    retiradoEn: null,
    motivoRetirada: null,
    publicadoPorId: null,
    nombrePublicadoPor: null,
    publicadoEn: null,
    sumaComprobacionSha256: 'abc',
    creadoEn: '2026-08-01T10:00:00',
    actualizadoEn: '2026-08-01T10:00:00',
  };
}

function cumplimiento(): RespuestaCumplimientoObligacion {
  return {
    id: 9,
    clienteId: 21,
    nombreCliente: 'Cliente',
    obligacionId: 5,
    codigoObligacion: '303',
    nombreObligacion: 'IVA',
    categoria: 'FISCAL',
    periodicidad: 'TRIMESTRAL',
    anio: 2026,
    periodoClave: 'T3',
    fechaLimite: '2026-10-20',
    estado: 'PENDIENTE_DOCUMENTACION',
    vencida: false,
    responsableId: 13,
    nombreResponsable: 'Asesor',
    resultado: 'SIN_RESULTADO',
    importe: null,
    fechaPresentacion: null,
    referencia: null,
    nrc: null,
    justificanteDocumentoId: null,
    observacionesInternas: null,
    mensajeCliente: null,
    creadoEn: '2026-08-01T10:00:00',
    actualizadoEn: '2026-08-01T10:00:00',
  };
}
