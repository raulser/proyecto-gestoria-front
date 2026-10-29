import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBuilding2,
  LucideCalendarDays,
  LucideCircleCheck,
  LucideDownload,
  LucideFileText,
  LucideFileUp,
  LucideLayoutDashboard,
  LucideLogOut,
  LucidePlus,
  LucideSearch,
  LucideSettings,
  LucideUpload,
  LucideUsers,
} from '@lucide/angular';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';
import { configuracionEjecucion } from './configuracion-ejecucion';
import { catchError, concatMap, filter, finalize, from, map, of, tap, toArray } from 'rxjs';
import { VisorDocumentoComponent } from './visor-documento.component';
import { GuiaInicialComponent } from './guia-inicial.component';
import { analizarCsvClientes, ClienteImportado } from './utilidades-importacion-clientes';
import { CentroFeedbackComponent } from './infraestructura/centro-feedback.component';
import { DialogoAccionComponent } from './infraestructura/dialogo-accion.component';
import { ServicioFeedback } from './infraestructura/servicio-feedback';
import { ServicioDialogos } from './infraestructura/servicio-dialogos';
import { ProgresoSubidaComponent } from './documentos/progreso-subida.component';
import { FiltrosDocumentosComponent } from './documentos/filtros-documentos.component';
import { ContextoDocumentoComponent } from './documentos/contexto-documento.component';
import { ResumenRepositorioComponent } from './documentos/resumen-repositorio.component';
import { AsociarDocumentoComponent } from './documentos/asociar-documento.component';
import { ResumenExpedienteClienteComponent } from './clientes/resumen-expediente-cliente.component';
import { EditorSolicitudComponent } from './solicitudes/editor-solicitud.component';
import { PerfilFiscalClienteComponent } from './clientes/perfil-fiscal-cliente.component';
import { RecomendacionesFiscalesComponent } from './clientes/recomendaciones-fiscales.component';
import {
  EstadoDocumento,
  EstadoSolicitud,
  PaginaRespuesta,
  Recurrencia,
  RespuestaApi,
  RespuestaAsignacion,
  RespuestaCliente,
  RespuestaComentarioSolicitud,
  RespuestaConfiguracionEmpresa,
  RespuestaDocumento,
  RespuestaEventoAuditoria,
  RespuestaNotificacion,
  RespuestaObligacionCliente,
  RespuestaCumplimientoObligacion,
  RespuestaPanel,
  RespuestaPlan,
  RespuestaSolicitudDocumento,
  RespuestaUsuario,
  Rol,
  TipoCliente,
  TipoDocumento,
  Vista,
  OrigenDocumento,
  VisibilidadDocumento,
  PeriodoDocumento,
  CategoriaObligacion,
  PeriodicidadObligacion,
  PlantillaObligacion,
  ResultadoCumplimientoObligacion,
  PeticionPerfilFiscalCliente,
  RespuestaPerfilFiscalCliente,
  RespuestaRecomendacionFiscal,
} from './modelos-aplicacion';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    LucideBuilding2,
    LucideCalendarDays,
    LucideCircleCheck,
    LucideDownload,
    LucideFileText,
    LucideFileUp,
    LucideLayoutDashboard,
    LucideLogOut,
    LucidePlus,
    LucideSearch,
    LucideSettings,
    LucideUpload,
    LucideUsers,
    VisorDocumentoComponent,
    GuiaInicialComponent,
    CentroFeedbackComponent,
    DialogoAccionComponent,
    ProgresoSubidaComponent,
    FiltrosDocumentosComponent,
    ContextoDocumentoComponent,
    ResumenRepositorioComponent,
    AsociarDocumentoComponent,
    ResumenExpedienteClienteComponent,
    EditorSolicitudComponent,
    PerfilFiscalClienteComponent,
    RecomendacionesFiscalesComponent,
  ],
  templateUrl: './aplicacion.html',
  styleUrl: './aplicacion.scss',
})
export class Aplicacion implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly autenticacion = inject(ServicioAutenticacionKeycloak);
  private readonly detectorCambios = inject(ChangeDetectorRef);
  private readonly feedback = inject(ServicioFeedback);
  private readonly dialogos = inject(ServicioDialogos);

  readonly urlBaseApi = configuracionEjecucion.urlApi;
  readonly urlBaseApiVisible = configuracionEjecucion.urlApi || 'Mismo origen (/api)';
  readonly urlOpenApiLocal = configuracionEjecucion.urlApi
    ? `${configuracionEjecucion.urlApi}/swagger-ui.html`
    : 'http://localhost:30001/swagger-ui.html';
  readonly configuracionPublica = configuracionEjecucion;
  readonly urlCuentaIdentidad = `${configuracionEjecucion.urlKeycloak}/realms/${configuracionEjecucion.reinoKeycloak}/account/`;
  readonly showLocalDemoCredentials =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  readonly elementosMenu: Array<{ view: Vista; label: string; icon: string }> = [
    { view: 'panel', label: 'Panel', icon: 'panel' },
    { view: 'clientes', label: 'Clientes', icon: 'usuarios' },
    { view: 'solicitudes', label: 'Solicitudes', icon: 'documentos' },
    { view: 'documentos', label: 'Documentos', icon: 'documentos' },
    { view: 'subir', label: 'Subir', icon: 'subir' },
    { view: 'equipo', label: 'Equipo', icon: 'usuarios' },
    { view: 'plan', label: 'Plan y uso', icon: 'configuracion' },
    { view: 'configuracion', label: 'Ayuda y privacidad', icon: 'configuracion' },
  ];
  readonly trimestres = [1, 2, 3, 4];
  readonly meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly tiposDocumentoAportacion: TipoDocumento[] = [
    'FACTURA_EMITIDA',
    'FACTURA_RECIBIDA',
    'TICKET',
    'NOMINA',
    'CONTRATO',
    'EXTRACTO_BANCARIO',
    'JUSTIFICANTE',
    'ESCRITURA',
    'OTRO',
  ];
  readonly tiposDocumentoGestoria: TipoDocumento[] = [
    'LIBRO_FACTURAS_EMITIDAS',
    'LIBRO_FACTURAS_RECIBIDAS',
    'LIBRO_INGRESOS',
    'LIBRO_GASTOS',
    'LIBRO_BIENES_INVERSION',
    'LIBRO_DIARIO',
    'CUENTAS_ANUALES',
    'MODELO_TRIBUTARIO',
    'JUSTIFICANTE_PRESENTACION',
    'LIQUIDACION',
    'COMUNICACION_ADMINISTRACION',
    'INFORME_ASESORIA',
    'CONTRATO',
    'OTRO',
  ];
  readonly tiposDocumento: TipoDocumento[] = [
    ...new Set([...this.tiposDocumentoAportacion, ...this.tiposDocumentoGestoria]),
  ];
  readonly estados: EstadoDocumento[] = [
    'PENDIENTE',
    'RECIBIDO',
    'REVISADO',
    'RECHAZADO',
    'BORRADOR',
    'PUBLICADO',
  ];
  readonly periodosDocumento: PeriodoDocumento[] = ['MENSUAL', 'TRIMESTRAL', 'ANUAL', 'PUNTUAL'];
  readonly opcionesTipoDocumento = this.tiposDocumento.map((valor) => ({
    valor,
    etiqueta: this.etiquetaTipoDocumento(valor),
  }));
  readonly opcionesTipoAportacion = this.tiposDocumentoAportacion.map((valor) => ({
    valor,
    etiqueta: this.etiquetaTipoDocumento(valor),
  }));

  token = this.autenticacion.token;
  usuarioActual: RespuestaUsuario | null = null;
  vistaActiva: Vista = 'panel';
  trimestreActivo = Math.floor(new Date().getMonth() / 3) + 1;
  anioSeleccionado = new Date().getFullYear();
  terminoBusqueda = '';
  terminoBusquedaDocumentos = '';
  filtroClienteDocumento: number | null = null;
  filtroSolicitudDocumento: number | null = null;
  filtroAnioDocumento: number | null = null;
  filtroEstadoDocumento: EstadoDocumento | '' = '';
  filtroOrigenDocumento: OrigenDocumento | '' = '';
  filtroVisibilidadDocumento: VisibilidadDocumento | '' = '';
  filtroTipoDocumento: TipoDocumento | '' = '';
  filtroPeriodoDocumento: PeriodoDocumento | '' = '';
  paginaDocumentos = 0;
  totalPaginasDocumentos = 0;
  totalDocumentos = 0;
  totalDocumentosTrimestre = 0;
  estadoApi = 'Sin comprobar';
  loading = false;
  private _aviso = '';
  private _error = '';
  get aviso(): string {
    return this._aviso;
  }
  set aviso(valor: string) {
    this._aviso = valor;
    if (valor) this.feedback.exito(valor);
  }
  get error(): string {
    return this._error;
  }
  set error(valor: string) {
    this._error = valor;
    if (valor) this.feedback.error(valor);
  }
  guiaVisible = false;
  visorDocumentoVisible = false;
  visorDocumentoCargando = false;
  visorDocumentoUrl = '';
  visorDocumentoNombre = '';
  visorDocumentoTipo = '';
  visorDocumentoError = '';
  seleccionDocumentos = new Set<number>();
  documentoAsociando: RespuestaDocumento | null = null;
  clientesImportados: ClienteImportado[] = [];
  erroresImportacionClientes: string[] = [];
  importacionClientesEnCurso = false;

  clientes: RespuestaCliente[] = [];
  documentos: RespuestaDocumento[] = [];
  documentosRepositorio: RespuestaDocumento[] = [];
  solicitudes: RespuestaSolicitudDocumento[] = [];
  usuarios: RespuestaUsuario[] = [];
  asignaciones: RespuestaAsignacion[] = [];
  notificaciones: RespuestaNotificacion[] = [];
  eventosAuditoria: RespuestaEventoAuditoria[] = [];
  plan: RespuestaPlan | null = null;
  configuracionEmpresa: RespuestaConfiguracionEmpresa | null = null;
  panel: RespuestaPanel | null = null;
  archivosSeleccionados: File[] = [];
  subidaEnCurso = false;
  progresoSubida = 0;
  archivoSubiendo = '';
  indiceArchivoSubiendo = 0;
  totalArchivosSubida = 0;
  solicitudEditandoId: number | null = null;
  cumplimientoOrigenSolicitudId: number | null = null;
  solicitudConversacionId: number | null = null;
  comentariosSolicitud: Record<number, RespuestaComentarioSolicitud[]> = {};
  nuevoComentario = '';
  clienteEditandoId: number | null = null;
  clienteObligacionesSeleccionado: RespuestaCliente | null = null;
  obligacionesCliente: RespuestaObligacionCliente[] = [];
  plantillasObligacion: PlantillaObligacion[] = [];
  plantillaObligacionSeleccionada = '';
  cumplimientosCliente: RespuestaCumplimientoObligacion[] = [];
  agendaFiscal: RespuestaCumplimientoObligacion[] = [];
  documentosJustificantesCliente: RespuestaDocumento[] = [];
  obligacionEditandoId: number | null = null;
  seccionFichaCliente: 'perfil' | 'seguimiento' | 'configuracion' = 'perfil';
  perfilFiscalCliente: RespuestaPerfilFiscalCliente | null = null;
  formularioPerfilFiscal: PeticionPerfilFiscalCliente = this.crearPerfilFiscalVacio();
  recomendacionesFiscales: RespuestaRecomendacionFiscal[] = [];
  cargandoPerfilFiscal = false;
  guardandoPerfilFiscal = false;
  recomendacionFiscalProcesando = '';

  nuevoCliente = {
    nombre: '',
    nif: '',
    email: '',
    telefono: '',
    tipo: 'EMPRESA' as TipoCliente,
    activo: true,
  };

  formularioObligacion = {
    codigo: '',
    nombre: '',
    categoria: 'FISCAL' as CategoriaObligacion,
    periodicidad: 'TRIMESTRAL' as PeriodicidadObligacion,
    mesesPresentacion: '',
    diaLimite: 20 as number | null,
    observaciones: '',
    tiposDocumentoEsperados: ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA'] as TipoDocumento[],
    activa: true,
  };

  formularioSubida = {
    clienteId: null as number | null,
    tipo: 'FACTURA_RECIBIDA' as TipoDocumento,
    anio: new Date().getFullYear(),
    periodo: 'TRIMESTRAL' as PeriodoDocumento,
    trimestre: (Math.floor(new Date().getMonth() / 3) + 1) as number | null,
    mes: null as number | null,
    fechaDocumento: null as string | null,
    origen: 'APORTADO_CLIENTE' as OrigenDocumento,
    visibilidad: 'COMPARTIDO_CLIENTE' as VisibilidadDocumento,
    titulo: '',
    descripcion: '',
    referencia: '',
    solicitudId: null as number | null,
    sustituyeDocumentoId: null as number | null,
  };

  nuevaSolicitud = {
    clienteId: null as number | null,
    asesorAsignadoId: null as number | null,
    titulo: '',
    descripcion: '',
    tiposDocumentoEsperados: ['FACTURA_RECIBIDA'] as TipoDocumento[],
    anio: new Date().getFullYear(),
    trimestre: Math.floor(new Date().getMonth() / 3) + 1,
    fechaVencimiento: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
    recurrencia: 'NINGUNA' as Recurrencia,
  };

  nuevoUsuario = {
    nombre: '',
    email: '',
    contrasena: '',
    rol: 'ASESOR' as Rol,
    clienteId: null as number | null,
    activo: true,
  };

  formularioAsignacion = {
    asesorId: null as number | null,
    clienteId: null as number | null,
  };

  formularioEmpresa = {
    correoFacturacion: '',
    nombreMarca: '',
    colorPrincipalMarca: '#226B3B',
  };

  ngOnInit(): void {
    if (this.autenticacion.autenticado) {
      this.token = this.autenticacion.token;
      this.cargarSesion();
    }
  }

  iniciarSesion(): void {
    this.limpiarMensajes();
    this.loading = true;
    void this.autenticacion.iniciarSesion().catch(() => {
      this.loading = false;
      this.error = 'No se pudo abrir el proveedor de identidad';
    });
  }

  cerrarSesion(): void {
    this.token = '';
    this.usuarioActual = null;
    this.clientes = [];
    this.documentos = [];
    this.solicitudes = [];
    this.usuarios = [];
    this.asignaciones = [];
    this.notificaciones = [];
    this.eventosAuditoria = [];
    this.plan = null;
    this.panel = null;
    void this.autenticacion.cerrarSesion();
  }

  cambiarVista(vista: Vista): void {
    this.vistaActiva = vista;
    if (vista === 'clientes' && this.esCliente() && this.clientes[0]) {
      this.abrirObligaciones(this.clientes[0]);
    }
    if (vista === 'documentos' && this.filtroSolicitudDocumento) {
      this.filtroSolicitudDocumento = null;
      this.filtroClienteDocumento = null;
      this.cargarPaginaDocumentos(0);
    }
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  cargarSesion(): void {
    this.http
      .get<
        RespuestaApi<RespuestaUsuario>
      >(`${this.urlBaseApi}/api/autenticacion/actual`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.usuarioActual = respuesta.datos;
          this.guiaVisible = !this.guiaDescartada();
          this.cargarEspacioTrabajo();
          this.detectorCambios.markForCheck();
        },
        error: () => this.cerrarSesion(),
      });
  }

  cargarEspacioTrabajo(): void {
    this.cargarClientes();
    this.cargarDocumentos();
    this.cargarPanel();
    this.cargarAgendaFiscal();
    this.cargarSolicitudes();
    this.cargarNotificaciones();
    this.cargarPlan();
    if (!this.esCliente()) this.cargarPlantillasObligacion();
    this.cargarConfiguracionEmpresa();
    if (this.puedeAdministrar()) {
      this.cargarUsuarios();
      this.cargarAsignaciones();
      this.cargarAuditoria();
    }
    this.comprobarApi();
  }

  cargarClientes(): void {
    this.http
      .get<
        RespuestaApi<RespuestaCliente[]>
      >(`${this.urlBaseApi}/api/clientes`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.clientes = respuesta.datos;
          if (!this.formularioSubida.clienteId && this.clientes.length > 0) {
            this.formularioSubida.clienteId = this.clientes[0].id;
          }
          if (!this.nuevaSolicitud.clienteId && this.clientes.length > 0) {
            this.nuevaSolicitud.clienteId = this.clientes[0].id;
          }
          if (!this.formularioAsignacion.clienteId && this.clientes.length > 0) {
            this.formularioAsignacion.clienteId = this.clientes[0].id;
          }
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar clientes')),
      });
  }

  cargarDocumentos(): void {
    const url = `${this.urlBaseApi}/api/documentos/pagina?anio=${this.anioSeleccionado}&trimestre=${this.trimestreActivo}&origen=APORTADO_CLIENTE&pagina=0&tamano=10`;
    this.http
      .get<
        RespuestaApi<PaginaRespuesta<RespuestaDocumento>>
      >(url, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.documentos = respuesta.datos.contenido;
          this.totalDocumentosTrimestre = respuesta.datos.totalElementos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar documentos')),
      });
    this.cargarPaginaDocumentos(this.paginaDocumentos);
  }

  cargarPaginaDocumentos(pagina = 0): void {
    const parametros = new URLSearchParams({
      pagina: String(Math.max(0, pagina)),
      tamano: '25',
    });
    if (this.filtroAnioDocumento) parametros.set('anio', String(this.filtroAnioDocumento));
    if (this.filtroEstadoDocumento) parametros.set('estado', this.filtroEstadoDocumento);
    const texto = this.terminoBusquedaDocumentos.trim();
    if (texto) {
      parametros.set('texto', texto);
    }
    if (this.filtroClienteDocumento)
      parametros.set('clienteId', String(this.filtroClienteDocumento));
    if (this.filtroSolicitudDocumento)
      parametros.set('solicitudId', String(this.filtroSolicitudDocumento));
    if (this.filtroOrigenDocumento) parametros.set('origen', this.filtroOrigenDocumento);
    if (this.filtroVisibilidadDocumento && !this.esCliente())
      parametros.set('visibilidad', this.filtroVisibilidadDocumento);
    if (this.filtroTipoDocumento) parametros.set('tipo', this.filtroTipoDocumento);
    if (this.filtroPeriodoDocumento) parametros.set('periodo', this.filtroPeriodoDocumento);
    this.http
      .get<
        RespuestaApi<PaginaRespuesta<RespuestaDocumento>>
      >(`${this.urlBaseApi}/api/documentos/pagina?${parametros.toString()}`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.documentosRepositorio = respuesta.datos.contenido;
          this.seleccionDocumentos.clear();
          this.paginaDocumentos = respuesta.datos.pagina;
          this.totalPaginasDocumentos = respuesta.datos.totalPaginas;
          this.totalDocumentos = respuesta.datos.totalElementos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cargar la página de documentos')),
      });
  }

  limpiarFiltrosDocumentos(): void {
    this.terminoBusquedaDocumentos = '';
    this.filtroClienteDocumento = null;
    this.filtroSolicitudDocumento = null;
    this.filtroAnioDocumento = null;
    this.filtroEstadoDocumento = '';
    this.filtroOrigenDocumento = '';
    this.filtroPeriodoDocumento = '';
    this.filtroTipoDocumento = '';
    this.filtroVisibilidadDocumento = '';
    this.cargarPaginaDocumentos(0);
  }

  cargarPanel(): void {
    this.http
      .get<RespuestaApi<RespuestaPanel>>(
        `${this.urlBaseApi}/api/panel/resumen?anio=${this.anioSeleccionado}`,
        {
          headers: this.cabecerasAutenticacion(),
        },
      )
      .subscribe({
        next: (respuesta) => {
          this.panel = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, 'No se pudo cargar el panel')),
      });
  }

  cargarAgendaFiscal(): void {
    this.http
      .get<
        RespuestaApi<RespuestaCumplimientoObligacion[]>
      >(`${this.urlBaseApi}/api/vencimientos?anio=${this.anioSeleccionado}`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.agendaFiscal = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cargar la agenda fiscal')),
      });
  }

  generarAgendaFiscal(): void {
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaCumplimientoObligacion[]>
      >(`${this.urlBaseApi}/api/vencimientos/generar?anio=${this.anioSeleccionado}`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.agendaFiscal = respuesta.datos;
          this.aviso = `Agenda fiscal de ${this.anioSeleccionado} actualizada`;
          this.cargarPanel();
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo generar la agenda fiscal')),
      });
  }

  abrirVencimientoAgenda(cumplimiento: RespuestaCumplimientoObligacion): void {
    const cliente = this.clientes.find((elemento) => elemento.id === cumplimiento.clienteId);
    if (!cliente) return;
    this.vistaActiva = 'clientes';
    this.abrirObligaciones(cliente);
  }

  cargarSolicitudes(): void {
    this.http
      .get<
        RespuestaApi<RespuestaSolicitudDocumento[]>
      >(`${this.urlBaseApi}/api/solicitudes`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.solicitudes = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar las solicitudes')),
      });
  }

  cargarUsuarios(): void {
    this.http
      .get<
        RespuestaApi<RespuestaUsuario[]>
      >(`${this.urlBaseApi}/api/usuarios`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.usuarios = respuesta.datos;
          const firstAdvisor = this.asesores()[0];
          if (!this.formularioAsignacion.asesorId && firstAdvisor) {
            this.formularioAsignacion.asesorId = firstAdvisor.id;
          }
          this.detectorCambios.markForCheck();
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, 'No se pudo cargar el equipo')),
      });
  }

  cargarAsignaciones(): void {
    this.http
      .get<
        RespuestaApi<RespuestaAsignacion[]>
      >(`${this.urlBaseApi}/api/asignaciones`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.asignaciones = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar las asignaciones')),
      });
  }

  cargarPlan(): void {
    this.http
      .get<
        RespuestaApi<RespuestaPlan>
      >(`${this.urlBaseApi}/api/plan`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.plan = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, 'No se pudo cargar el plan')),
      });
  }

  cargarNotificaciones(): void {
    this.http
      .get<
        RespuestaApi<RespuestaNotificacion[]>
      >(`${this.urlBaseApi}/api/notificaciones`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.notificaciones = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar las notificaciones')),
      });
  }

  cargarConfiguracionEmpresa(): void {
    this.http
      .get<
        RespuestaApi<RespuestaConfiguracionEmpresa>
      >(`${this.urlBaseApi}/api/empresa`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.configuracionEmpresa = respuesta.datos;
          this.formularioEmpresa = {
            correoFacturacion: respuesta.datos.correoFacturacion ?? '',
            nombreMarca: respuesta.datos.nombreMarca ?? '',
            colorPrincipalMarca: respuesta.datos.colorPrincipalMarca ?? '#226B3B',
          };
          this.aplicarMarca(respuesta.datos.colorPrincipalMarca);
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'No se pudo cargar la configuración de la gestoría',
          )),
      });
  }

  cargarAuditoria(): void {
    if (!this.puedeAdministrar()) return;
    this.http
      .get<
        RespuestaApi<RespuestaEventoAuditoria[]>
      >(`${this.urlBaseApi}/api/auditoria?limit=50`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.eventosAuditoria = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cargar la actividad')),
      });
  }

  agregarCliente(): void {
    if (
      !this.puedeGestionarClientes() ||
      !this.nuevoCliente.nombre.trim() ||
      !this.nuevoCliente.nif.trim() ||
      !this.nuevoCliente.email.trim()
    ) {
      return;
    }

    this.limpiarMensajes();
    const peticion =
      this.clienteEditandoId === null
        ? this.http.post<RespuestaApi<RespuestaCliente>>(
            `${this.urlBaseApi}/api/clientes`,
            this.nuevoCliente,
            { headers: this.cabecerasAutenticacion() },
          )
        : this.http.put<RespuestaApi<RespuestaCliente>>(
            `${this.urlBaseApi}/api/clientes/${this.clienteEditandoId}`,
            this.nuevoCliente,
            { headers: this.cabecerasAutenticacion() },
          );
    const editando = this.clienteEditandoId !== null;
    peticion.subscribe({
      next: () => {
        this.aviso = editando ? 'Cliente actualizado' : 'Cliente creado';
        this.cancelarEdicionCliente();
        this.cargarClientes();
        this.cargarPanel();
      },
      error: (error) =>
        (this.error = this.obtenerErrorApi(
          error,
          editando ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente',
        )),
    });
  }

  analizarArchivoClientes(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.clientesImportados = [];
    this.erroresImportacionClientes = [];
    if (!archivo) return;
    if (!/\.(csv|txt)$/i.test(archivo.name) || archivo.size > 2 * 1024 * 1024) {
      this.erroresImportacionClientes = ['Selecciona un CSV o TXT de hasta 2 MB.'];
      input.value = '';
      return;
    }
    void archivo
      .text()
      .then((contenido) => {
        const resultado = analizarCsvClientes(contenido);
        const nifExistentes = new Set(this.clientes.map((cliente) => cliente.nif.toUpperCase()));
        this.clientesImportados = resultado.clientes.filter((cliente) => {
          if (!nifExistentes.has(cliente.nif)) return true;
          resultado.errores.push(
            `Fila ${cliente.fila}: ya existe un cliente con NIF ${cliente.nif}.`,
          );
          return false;
        });
        this.erroresImportacionClientes = resultado.errores;
        this.detectorCambios.markForCheck();
      })
      .catch(() => {
        this.erroresImportacionClientes = ['No se pudo leer el archivo seleccionado.'];
        this.detectorCambios.markForCheck();
      });
  }

  async importarClientesPreparados(): Promise<void> {
    if (
      !this.puedeGestionarClientes() ||
      this.clientesImportados.length === 0 ||
      this.importacionClientesEnCurso
    )
      return;
    const confirmado = await this.dialogos.confirmar({
      titulo: `Importar ${this.clientesImportados.length} clientes`,
      descripcion:
        'Se crearán los clientes validados. Después podrás revisar sus obligaciones y asignaciones.',
      confirmar: 'Importar clientes',
    });
    if (!confirmado) return;
    this.importacionClientesEnCurso = true;
    this.limpiarMensajes();
    from(this.clientesImportados)
      .pipe(
        concatMap((cliente) =>
          this.http
            .post<
              RespuestaApi<RespuestaCliente>
            >(`${this.urlBaseApi}/api/clientes`, { nombre: cliente.nombre, nif: cliente.nif, email: cliente.email, telefono: cliente.telefono, tipo: cliente.tipo, activo: true }, { headers: this.cabecerasAutenticacion() })
            .pipe(
              map(() => ({ cliente, correcto: true, error: '' })),
              catchError((error) =>
                of({
                  cliente,
                  correcto: false,
                  error: this.obtenerErrorApi(error, 'no se pudo crear'),
                }),
              ),
            ),
        ),
        toArray(),
      )
      .subscribe((resultados) => {
        const correctos = resultados.filter((resultado) => resultado.correcto).length;
        this.erroresImportacionClientes = resultados
          .filter((resultado) => !resultado.correcto)
          .map((resultado) => `Fila ${resultado.cliente.fila}: ${resultado.error}.`);
        this.clientesImportados = resultados
          .filter((resultado) => !resultado.correcto)
          .map((resultado) => resultado.cliente);
        this.importacionClientesEnCurso = false;
        this.aviso = `${correctos} clientes importados correctamente`;
        this.cargarClientes();
        this.cargarPanel();
        this.detectorCambios.markForCheck();
      });
  }

  descargarPlantillaClientes(): void {
    const contenido =
      'nombre;nif;email;telefono;tipo\nEjemplo SL;B12345678;administracion@ejemplo.es;600000000;EMPRESA\n';
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = globalThis.document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla-importacion-clientes.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  editarCliente(cliente: RespuestaCliente): void {
    this.clienteEditandoId = cliente.id;
    this.nuevoCliente = {
      nombre: cliente.nombre,
      nif: cliente.nif,
      email: cliente.email,
      telefono: cliente.telefono ?? '',
      tipo: cliente.tipo,
      activo: cliente.activo,
    };
  }

  cancelarEdicionCliente(): void {
    this.clienteEditandoId = null;
    this.nuevoCliente = {
      nombre: '',
      nif: '',
      email: '',
      telefono: '',
      tipo: 'EMPRESA',
      activo: true,
    };
  }

  alternarCliente(cliente: RespuestaCliente): void {
    if (!this.puedeGestionarClientes()) return;
    this.http
      .put<RespuestaApi<RespuestaCliente>>(
        `${this.urlBaseApi}/api/clientes/${cliente.id}`,
        {
          nombre: cliente.nombre,
          nif: cliente.nif,
          email: cliente.email,
          telefono: cliente.telefono,
          tipo: cliente.tipo,
          activo: !cliente.activo,
        },
        { headers: this.cabecerasAutenticacion() },
      )
      .subscribe({
        next: () => {
          this.aviso = cliente.activo ? 'Cliente archivado' : 'Cliente reactivado';
          if (this.clienteObligacionesSeleccionado?.id === cliente.id) this.cerrarObligaciones();
          this.cargarClientes();
          this.cargarPanel();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cambiar el estado del cliente')),
      });
  }

  abrirObligaciones(cliente: RespuestaCliente): void {
    this.clienteObligacionesSeleccionado = cliente;
    this.seccionFichaCliente = this.esCliente() ? 'seguimiento' : 'perfil';
    this.obligacionesCliente = [];
    this.cumplimientosCliente = [];
    this.documentosJustificantesCliente = [];
    this.perfilFiscalCliente = null;
    this.recomendacionesFiscales = [];
    this.cancelarEdicionObligacion();
    this.cargarObligacionesCliente();
    this.cargarCumplimientosCliente();
    if (!this.esCliente()) {
      this.cargarDocumentosJustificantesCliente();
      this.cargarPerfilFiscalCliente();
      this.cargarRecomendacionesFiscales();
    }
  }

  tieneDetallePublicoCumplimiento(cumplimiento: RespuestaCumplimientoObligacion): boolean {
    return Boolean(
      cumplimiento.fechaPresentacion ||
      cumplimiento.resultado !== 'SIN_RESULTADO' ||
      cumplimiento.mensajeCliente,
    );
  }

  cerrarObligaciones(): void {
    this.clienteObligacionesSeleccionado = null;
    this.obligacionesCliente = [];
    this.cumplimientosCliente = [];
    this.documentosJustificantesCliente = [];
    this.perfilFiscalCliente = null;
    this.formularioPerfilFiscal = this.crearPerfilFiscalVacio();
    this.recomendacionesFiscales = [];
    this.cancelarEdicionObligacion();
  }

  cargarPerfilFiscalCliente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.cargandoPerfilFiscal = true;
    this.http
      .get<RespuestaApi<RespuestaPerfilFiscalCliente>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/perfil-fiscal`,
        { headers: this.cabecerasAutenticacion() },
      )
      .pipe(finalize(() => (this.cargandoPerfilFiscal = false)))
      .subscribe({
        next: (respuesta) => {
          this.perfilFiscalCliente = respuesta.datos;
          this.formularioPerfilFiscal = this.perfilFiscalAFormulario(respuesta.datos);
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cargar el perfil fiscal')),
      });
  }

  guardarPerfilFiscalCliente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.limpiarMensajes();
    this.guardandoPerfilFiscal = true;
    this.http
      .put<RespuestaApi<RespuestaPerfilFiscalCliente>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/perfil-fiscal`,
        this.formularioPerfilFiscal,
        { headers: this.cabecerasAutenticacion() },
      )
      .pipe(finalize(() => (this.guardandoPerfilFiscal = false)))
      .subscribe({
        next: (respuesta) => {
          this.perfilFiscalCliente = respuesta.datos;
          this.formularioPerfilFiscal = this.perfilFiscalAFormulario(respuesta.datos);
          this.aviso = 'Perfil fiscal guardado y propuestas recalculadas';
          this.cargarRecomendacionesFiscales();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo guardar el perfil fiscal')),
      });
  }

  cargarRecomendacionesFiscales(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.http
      .get<
        RespuestaApi<RespuestaRecomendacionFiscal[]>
      >(`${this.urlBaseApi}/api/clientes/${clienteId}/recomendaciones-fiscales`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.recomendacionesFiscales = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'No se pudieron calcular las propuestas fiscales',
          )),
      });
  }

  confirmarRecomendacionFiscal(recomendacion: RespuestaRecomendacionFiscal): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.recomendacionFiscalProcesando = recomendacion.clave;
    this.http
      .post<RespuestaApi<RespuestaRecomendacionFiscal[]>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/recomendaciones-fiscales/${recomendacion.clave}/confirmar`,
        {},
        { headers: this.cabecerasAutenticacion() },
      )
      .pipe(finalize(() => (this.recomendacionFiscalProcesando = '')))
      .subscribe({
        next: (respuesta) => {
          this.recomendacionesFiscales = respuesta.datos;
          this.aviso = `${recomendacion.codigo} confirmada como obligación del cliente`;
          this.cargarObligacionesCliente();
          this.generarCumplimientosSilenciosamente();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo confirmar la obligación')),
      });
  }

  async descartarRecomendacionFiscal(recomendacion: RespuestaRecomendacionFiscal): Promise<void> {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    const motivo = await this.dialogos.pedirTexto({
      titulo: `Descartar ${recomendacion.codigo}`,
      descripcion: 'Deja constancia del motivo para que la decisión pueda revisarse más adelante.',
      etiquetaCampo: 'Motivo',
      confirmar: 'Guardar decisión',
    });
    if (!motivo?.trim()) return;
    this.recomendacionFiscalProcesando = recomendacion.clave;
    this.http
      .post<RespuestaApi<RespuestaRecomendacionFiscal[]>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/recomendaciones-fiscales/${recomendacion.clave}/descartar`,
        { motivo: motivo.trim() },
        { headers: this.cabecerasAutenticacion() },
      )
      .pipe(finalize(() => (this.recomendacionFiscalProcesando = '')))
      .subscribe({
        next: (respuesta) => {
          this.recomendacionesFiscales = respuesta.datos;
          this.aviso = `${recomendacion.codigo} descartada con el motivo registrado`;
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo guardar la decisión')),
      });
  }

  reabrirRecomendacionFiscal(recomendacion: RespuestaRecomendacionFiscal): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.recomendacionFiscalProcesando = recomendacion.clave;
    this.http
      .post<RespuestaApi<RespuestaRecomendacionFiscal[]>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/recomendaciones-fiscales/${recomendacion.clave}/reabrir`,
        {},
        { headers: this.cabecerasAutenticacion() },
      )
      .pipe(finalize(() => (this.recomendacionFiscalProcesando = '')))
      .subscribe({
        next: (respuesta) => {
          this.recomendacionesFiscales = respuesta.datos;
          this.aviso = `${recomendacion.codigo} vuelve a estar pendiente de decisión`;
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo reabrir la propuesta')),
      });
  }

  porcentajePerfilFiscal(): number {
    const datos = this.formularioPerfilFiscal;
    const valores = [
      datos.tributaSociedades,
      datos.pagosFraccionadosSociedades,
      datos.tieneTrabajadores,
      datos.pagaProfesionalesRetencion,
      datos.alquilerSujetoRetencion,
      datos.rendimientosCapital,
      datos.operacionesIntracomunitarias,
      datos.operacionesTerceros,
      datos.recibeDonativosDeducibles,
      datos.entidadAtribucionRentas,
      datos.exoneradoModelo390,
    ];
    const resueltos =
      valores.filter((valor) => valor !== 'PENDIENTE').length +
      (datos.regimenIrpf !== 'PENDIENTE' ? 1 : 0) +
      (datos.regimenIva !== 'PENDIENTE' ? 1 : 0);
    return Math.round((resueltos / 13) * 100);
  }

  cargarObligacionesCliente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId) return;
    this.http
      .get<
        RespuestaApi<RespuestaObligacionCliente[]>
      >(`${this.urlBaseApi}/api/clientes/${clienteId}/obligaciones`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.obligacionesCliente = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'No se pudieron cargar las obligaciones del cliente',
          )),
      });
  }

  cargarPlantillasObligacion(): void {
    if (this.plantillasObligacion.length > 0) return;
    this.http
      .get<
        RespuestaApi<PlantillaObligacion[]>
      >(`${this.urlBaseApi}/api/obligaciones/plantillas`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.plantillasObligacion = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'No se pudieron cargar las plantillas de obligaciones',
          )),
      });
  }

  aplicarPlantillaObligacion(): void {
    const plantilla = this.plantillasObligacion.find(
      (elemento) => elemento.clave === this.plantillaObligacionSeleccionada,
    );
    if (!plantilla) return;
    this.obligacionEditandoId = null;
    this.formularioObligacion = {
      codigo: plantilla.codigo,
      nombre: plantilla.nombre,
      categoria: plantilla.categoria,
      periodicidad: plantilla.periodicidad,
      mesesPresentacion: plantilla.mesesPresentacion ?? '',
      diaLimite: plantilla.diaLimiteOrientativo,
      observaciones: plantilla.observaciones,
      tiposDocumentoEsperados: [...plantilla.tiposDocumentoEsperados],
      activa: true,
    };
  }

  alternarTipoDocumentoObligacion(tipo: TipoDocumento, seleccionado: boolean): void {
    const actuales = this.formularioObligacion.tiposDocumentoEsperados;
    this.formularioObligacion.tiposDocumentoEsperados = seleccionado
      ? [...new Set([...actuales, tipo])]
      : actuales.filter((elemento) => elemento !== tipo);
  }

  cargarCumplimientosCliente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId) return;
    this.http
      .get<
        RespuestaApi<RespuestaCumplimientoObligacion[]>
      >(`${this.urlBaseApi}/api/clientes/${clienteId}/vencimientos?anio=${this.anioSeleccionado}`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.cumplimientosCliente = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron cargar los vencimientos')),
      });
  }

  cargarDocumentosJustificantesCliente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId) return;
    this.http
      .get<
        RespuestaApi<PaginaRespuesta<RespuestaDocumento>>
      >(`${this.urlBaseApi}/api/documentos/pagina?clienteId=${clienteId}&pagina=0&tamano=100`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.documentosJustificantesCliente = respuesta.datos.contenido.filter(
            (documento) => documento.estado !== 'RETIRADO' && documento.estado !== 'SUSTITUIDO',
          );
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'No se pudieron cargar los justificantes del cliente',
          )),
      });
  }

  generarCumplimientos(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaCumplimientoObligacion[]>
      >(`${this.urlBaseApi}/api/clientes/${clienteId}/vencimientos/generar?anio=${this.anioSeleccionado}`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.cumplimientosCliente = respuesta.datos;
          this.aviso = 'Vencimientos del ejercicio preparados';
          this.cargarPanel();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron generar los vencimientos')),
      });
  }

  guardarCumplimiento(cumplimiento: RespuestaCumplimientoObligacion): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    if (cumplimiento.estado === 'PRESENTADA' && !cumplimiento.fechaPresentacion) {
      this.error = 'Indica la fecha de presentación';
      return;
    }
    this.limpiarMensajes();
    this.http
      .put<RespuestaApi<RespuestaCumplimientoObligacion>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/vencimientos/${cumplimiento.id}`,
        {
          fechaLimite: cumplimiento.fechaLimite,
          estado: cumplimiento.estado,
          responsableId: cumplimiento.responsableId,
          resultado: cumplimiento.resultado,
          importe: cumplimiento.importe,
          fechaPresentacion: cumplimiento.fechaPresentacion,
          referencia: cumplimiento.referencia,
          nrc: cumplimiento.nrc,
          justificanteDocumentoId: cumplimiento.justificanteDocumentoId,
          observacionesInternas: cumplimiento.observacionesInternas,
          mensajeCliente: cumplimiento.mensajeCliente,
        },
        { headers: this.cabecerasAutenticacion() },
      )
      .subscribe({
        next: () => {
          this.aviso = `${cumplimiento.codigoObligacion} ${cumplimiento.periodoClave} actualizado`;
          this.cargarCumplimientosCliente();
          this.cargarPanel();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo actualizar el vencimiento')),
      });
  }

  guardarObligacion(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (
      !clienteId ||
      !this.puedeGestionarClientes() ||
      !this.formularioObligacion.codigo.trim() ||
      !this.formularioObligacion.nombre.trim()
    ) {
      this.error = 'Indica el codigo y el nombre de la obligacion';
      return;
    }
    this.limpiarMensajes();
    const cuerpo = {
      ...this.formularioObligacion,
      mesesPresentacion: this.formularioObligacion.mesesPresentacion.trim() || null,
      observaciones: this.formularioObligacion.observaciones.trim() || null,
    };
    const peticion =
      this.obligacionEditandoId === null
        ? this.http.post<RespuestaApi<RespuestaObligacionCliente>>(
            `${this.urlBaseApi}/api/clientes/${clienteId}/obligaciones`,
            cuerpo,
            { headers: this.cabecerasAutenticacion() },
          )
        : this.http.put<RespuestaApi<RespuestaObligacionCliente>>(
            `${this.urlBaseApi}/api/clientes/${clienteId}/obligaciones/${this.obligacionEditandoId}`,
            cuerpo,
            { headers: this.cabecerasAutenticacion() },
          );
    peticion.subscribe({
      next: () => {
        this.aviso =
          this.obligacionEditandoId === null ? 'Obligacion creada' : 'Obligacion actualizada';
        this.cancelarEdicionObligacion();
        this.cargarObligacionesCliente();
        this.cargarPanel();
        this.cargarAuditoria();
      },
      error: (error) =>
        (this.error = this.obtenerErrorApi(error, 'No se pudo guardar la obligacion')),
    });
  }

  editarObligacion(obligacion: RespuestaObligacionCliente): void {
    this.obligacionEditandoId = obligacion.id;
    this.formularioObligacion = {
      codigo: obligacion.codigo,
      nombre: obligacion.nombre,
      categoria: obligacion.categoria,
      periodicidad: obligacion.periodicidad,
      mesesPresentacion: obligacion.mesesPresentacion ?? '',
      diaLimite: obligacion.diaLimite,
      observaciones: obligacion.observaciones ?? '',
      tiposDocumentoEsperados: [...obligacion.tiposDocumentoEsperados],
      activa: obligacion.activa,
    };
  }

  alternarObligacion(obligacion: RespuestaObligacionCliente): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    this.http
      .put<RespuestaApi<RespuestaObligacionCliente>>(
        `${this.urlBaseApi}/api/clientes/${clienteId}/obligaciones/${obligacion.id}`,
        {
          codigo: obligacion.codigo,
          nombre: obligacion.nombre,
          categoria: obligacion.categoria,
          periodicidad: obligacion.periodicidad,
          mesesPresentacion: obligacion.mesesPresentacion,
          diaLimite: obligacion.diaLimite,
          observaciones: obligacion.observaciones,
          tiposDocumentoEsperados: obligacion.tiposDocumentoEsperados,
          activa: !obligacion.activa,
        },
        { headers: this.cabecerasAutenticacion() },
      )
      .subscribe({
        next: () => {
          this.aviso = obligacion.activa ? 'Obligacion desactivada' : 'Obligacion activada';
          this.cargarObligacionesCliente();
          this.cargarPanel();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cambiar la obligacion')),
      });
  }

  prepararSolicitudObligacion(obligacion: RespuestaObligacionCliente): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId || !this.puedeGestionarClientes()) return;
    const tipos: TipoDocumento[] =
      obligacion.tiposDocumentoEsperados.length > 0
        ? [...obligacion.tiposDocumentoEsperados]
        : obligacion.categoria === 'LABORAL'
          ? ['NOMINA', 'CONTRATO', 'JUSTIFICANTE']
          : obligacion.categoria === 'MERCANTIL'
            ? ['ESCRITURA', 'CONTRATO', 'JUSTIFICANTE']
            : ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA', 'EXTRACTO_BANCARIO', 'JUSTIFICANTE'];
    this.solicitudEditandoId = null;
    this.cumplimientoOrigenSolicitudId = null;
    this.nuevaSolicitud = {
      clienteId,
      asesorAsignadoId: null,
      titulo: `Documentación para ${obligacion.codigo} - ${obligacion.nombre}`,
      descripcion:
        obligacion.observaciones ??
        `Aporta la documentación necesaria para preparar ${obligacion.nombre}.`,
      tiposDocumentoEsperados: tipos,
      anio: this.anioSeleccionado,
      trimestre: this.trimestreActivo,
      fechaVencimiento: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
      recurrencia: ['MENSUAL', 'TRIMESTRAL', 'ANUAL'].includes(obligacion.periodicidad)
        ? (obligacion.periodicidad as Recurrencia)
        : 'NINGUNA',
    };
    this.vistaActiva = 'solicitudes';
    this.cerrarObligaciones();
  }

  prepararSolicitudCumplimiento(cumplimiento: RespuestaCumplimientoObligacion): void {
    const obligacion = this.obligacionesCliente.find(
      (elemento) => elemento.id === cumplimiento.obligacionId,
    );
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!obligacion || !clienteId || !this.puedeGestionarClientes()) return;
    const fechaMinima = new Date();
    fechaMinima.setHours(12, 0, 0, 0);
    fechaMinima.setDate(fechaMinima.getDate() + 1);
    const fechaObjetivo = new Date(`${cumplimiento.fechaLimite}T12:00:00`);
    fechaObjetivo.setDate(fechaObjetivo.getDate() - 10);
    const fechaVencimiento = fechaObjetivo < fechaMinima ? fechaMinima : fechaObjetivo;
    const trimestre = cumplimiento.periodoClave.startsWith('T')
      ? Number(cumplimiento.periodoClave.slice(1))
      : cumplimiento.periodoClave.startsWith('M')
        ? Math.ceil(Number(cumplimiento.periodoClave.slice(1)) / 3)
        : this.trimestreActivo;
    this.solicitudEditandoId = null;
    this.cumplimientoOrigenSolicitudId = cumplimiento.id;
    this.nuevaSolicitud = {
      clienteId,
      asesorAsignadoId: cumplimiento.responsableId,
      titulo: `Documentación ${cumplimiento.codigoObligacion} · ${cumplimiento.periodoClave}`,
      descripcion: `Aporta la documentación necesaria para ${cumplimiento.nombreObligacion} del periodo ${cumplimiento.periodoClave}.`,
      tiposDocumentoEsperados:
        obligacion.tiposDocumentoEsperados.length > 0
          ? [...obligacion.tiposDocumentoEsperados]
          : ['JUSTIFICANTE'],
      anio: cumplimiento.anio,
      trimestre,
      fechaVencimiento: fechaVencimiento.toISOString().slice(0, 10),
      recurrencia: 'NINGUNA',
    };
    this.vistaActiva = 'solicitudes';
    this.cerrarObligaciones();
  }

  cancelarEdicionObligacion(): void {
    this.obligacionEditandoId = null;
    this.formularioObligacion = {
      codigo: '',
      nombre: '',
      categoria: 'FISCAL',
      periodicidad: 'TRIMESTRAL',
      mesesPresentacion: '',
      diaLimite: 20,
      observaciones: '',
      tiposDocumentoEsperados: ['FACTURA_EMITIDA', 'FACTURA_RECIBIDA'],
      activa: true,
    };
    this.plantillaObligacionSeleccionada = '';
  }

  agregarSolicitud(): void {
    if (
      !this.nuevaSolicitud.clienteId ||
      !this.nuevaSolicitud.titulo.trim() ||
      this.nuevaSolicitud.tiposDocumentoEsperados.length === 0
    ) {
      this.error = 'Selecciona un cliente e indica qué documentación necesitas';
      return;
    }
    this.limpiarMensajes();
    const peticion =
      this.solicitudEditandoId === null
        ? this.http.post<RespuestaApi<RespuestaSolicitudDocumento>>(
            `${this.urlBaseApi}/api/solicitudes`,
            {
              ...this.nuevaSolicitud,
              cumplimientoObligacionId: this.cumplimientoOrigenSolicitudId,
            },
            { headers: this.cabecerasAutenticacion() },
          )
        : this.http.put<RespuestaApi<RespuestaSolicitudDocumento>>(
            `${this.urlBaseApi}/api/solicitudes/${this.solicitudEditandoId}/detalles`,
            {
              asesorAsignadoId: this.nuevaSolicitud.asesorAsignadoId,
              titulo: this.nuevaSolicitud.titulo,
              descripcion: this.nuevaSolicitud.descripcion,
              tiposDocumentoEsperados: this.nuevaSolicitud.tiposDocumentoEsperados,
              anio: this.nuevaSolicitud.anio,
              trimestre: this.nuevaSolicitud.trimestre,
              fechaVencimiento: this.nuevaSolicitud.fechaVencimiento,
            },
            { headers: this.cabecerasAutenticacion() },
          );
    const editando = this.solicitudEditandoId !== null;
    peticion.subscribe({
      next: () => {
        this.aviso = editando ? 'Solicitud editada' : 'Solicitud creada';
        this.cancelarEdicionSolicitud();
        this.cargarSolicitudes();
        this.cargarAuditoria();
      },
      error: (error) =>
        (this.error = this.obtenerErrorApi(
          error,
          editando ? 'No se pudo editar la solicitud' : 'No se pudo crear la solicitud',
        )),
    });
  }

  editarSolicitud(solicitud: RespuestaSolicitudDocumento): void {
    this.solicitudEditandoId = solicitud.id;
    this.cumplimientoOrigenSolicitudId = solicitud.cumplimientoObligacionId;
    this.nuevaSolicitud = {
      clienteId: solicitud.clienteId,
      asesorAsignadoId: solicitud.asesorAsignadoId,
      titulo: solicitud.titulo,
      descripcion: solicitud.descripcion ?? '',
      tiposDocumentoEsperados: [...solicitud.tiposDocumentoEsperados],
      anio: solicitud.anio ?? new Date().getFullYear(),
      trimestre: solicitud.trimestre ?? Math.floor(new Date().getMonth() / 3) + 1,
      fechaVencimiento: solicitud.fechaVencimiento,
      recurrencia: solicitud.recurrencia,
    };
  }

  cancelarEdicionSolicitud(): void {
    const clienteId = this.nuevaSolicitud.clienteId ?? this.clientes[0]?.id ?? null;
    this.solicitudEditandoId = null;
    this.cumplimientoOrigenSolicitudId = null;
    this.nuevaSolicitud = {
      clienteId,
      asesorAsignadoId: null,
      titulo: '',
      descripcion: '',
      tiposDocumentoEsperados: ['FACTURA_RECIBIDA'],
      anio: new Date().getFullYear(),
      trimestre: Math.floor(new Date().getMonth() / 3) + 1,
      fechaVencimiento: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
      recurrencia: 'NINGUNA',
    };
  }

  async actualizarEstadoSolicitud(
    solicitud: RespuestaSolicitudDocumento,
    estado: EstadoSolicitud,
  ): Promise<void> {
    if (estado === 'COMPLETADA') {
      const confirmado = await this.dialogos.confirmar({
        titulo: 'Cerrar petición documental',
        descripcion:
          'Confirma que la documentación está revisada y gestionada. La obligación fiscal no se marcará como presentada.',
        confirmar: 'Marcar revisada y cerrar',
      });
      if (!confirmado) return;
    }
    if (estado === 'CANCELADA') {
      const confirmado = await this.dialogos.confirmar({
        titulo: 'Cancelar petición',
        descripcion:
          'El cliente dejará de poder añadir documentación. Los archivos existentes conservarán su trazabilidad.',
        confirmar: 'Cancelar petición',
        peligro: true,
      });
      if (!confirmado) return;
    }
    this.limpiarMensajes();
    this.http
      .patch<
        RespuestaApi<RespuestaSolicitudDocumento>
      >(`${this.urlBaseApi}/api/solicitudes/${solicitud.id}`, { estado, descripcion: solicitud.descripcion }, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Solicitud actualizada';
          this.cargarSolicitudes();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo actualizar la solicitud')),
      });
  }

  alternarConversacion(solicitud: RespuestaSolicitudDocumento): void {
    if (this.solicitudConversacionId === solicitud.id) {
      this.solicitudConversacionId = null;
      this.nuevoComentario = '';
      return;
    }
    this.solicitudConversacionId = solicitud.id;
    this.nuevoComentario = '';
    this.http
      .get<
        RespuestaApi<RespuestaComentarioSolicitud[]>
      >(`${this.urlBaseApi}/api/solicitudes/${solicitud.id}/comentarios`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.comentariosSolicitud[solicitud.id] = respuesta.datos;
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cargar la conversación')),
      });
  }

  enviarComentario(solicitud: RespuestaSolicitudDocumento): void {
    const texto = this.nuevoComentario.trim();
    if (!texto) {
      return;
    }
    this.http
      .post<
        RespuestaApi<RespuestaComentarioSolicitud>
      >(`${this.urlBaseApi}/api/solicitudes/${solicitud.id}/comentarios`, { texto }, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.comentariosSolicitud[solicitud.id] = [
            ...(this.comentariosSolicitud[solicitud.id] ?? []),
            respuesta.datos,
          ];
          this.nuevoComentario = '';
          this.aviso = 'Comentario añadido';
          this.cargarNotificaciones();
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo añadir el comentario')),
      });
  }

  async finalizarEnvioSolicitud(solicitud: RespuestaSolicitudDocumento): Promise<void> {
    if (solicitud.estado !== 'PARCIAL') {
      return;
    }
    const confirmado = await this.dialogos.confirmar({
      titulo: 'Enviar documentación a la gestoría',
      descripcion:
        'La entrega quedará cerrada mientras la gestoría la revisa. Esto no significa que el modelo fiscal esté presentado.',
      confirmar: 'Sí, he terminado',
    });
    if (!confirmado) return;
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaSolicitudDocumento>
      >(`${this.urlBaseApi}/api/solicitudes/${solicitud.id}/enviar`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso =
            'Entrega enviada a la gestoría. Te avisaremos si hace falta alguna corrección';
          this.cargarSolicitudes();
          this.cargarNotificaciones();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo finalizar el envío')),
      });
  }

  async solicitarReaperturaSolicitud(solicitud: RespuestaSolicitudDocumento): Promise<void> {
    const motivo = await this.dialogos.pedirTexto({
      titulo: 'Solicitar reapertura',
      descripcion: 'Explica a tu gestoría por qué necesitas volver a añadir documentación.',
      etiquetaCampo: 'Documentación pendiente o motivo',
      confirmar: 'Enviar solicitud',
    });
    if (!motivo) return;
    this.ejecutarReapertura(
      solicitud,
      '/reapertura',
      { motivo },
      'Petición enviada. La gestoría debe reabrir la entrega antes de que puedas añadir archivos',
      'No se pudo solicitar la reapertura',
    );
  }

  async aprobarReaperturaSolicitud(solicitud: RespuestaSolicitudDocumento): Promise<void> {
    const confirmado = await this.dialogos.confirmar({
      titulo: 'Aprobar reapertura',
      descripcion:
        'El cliente podrá volver a añadir documentos y deberá enviar la entrega de nuevo al terminar.',
      confirmar: 'Reabrir entrega',
    });
    if (!confirmado) return;
    this.ejecutarReapertura(
      solicitud,
      '/reapertura/aprobar',
      {},
      'Solicitud reabierta; el cliente ya puede anadir documentos',
      'No se pudo aprobar la reapertura',
    );
  }

  async rechazarReaperturaSolicitud(solicitud: RespuestaSolicitudDocumento): Promise<void> {
    const motivo = await this.dialogos.pedirTexto({
      titulo: 'Rechazar reapertura',
      descripcion: 'El cliente verá este motivo. Explica de forma concreta por qué no procede.',
      etiquetaCampo: 'Motivo para el cliente',
      confirmar: 'Rechazar solicitud',
      peligro: true,
    });
    if (!motivo) return;
    this.ejecutarReapertura(
      solicitud,
      '/reapertura/rechazar',
      { motivo },
      'Solicitud de reapertura rechazada',
      'No se pudo rechazar la reapertura',
    );
  }

  async reabrirSolicitud(solicitud: RespuestaSolicitudDocumento): Promise<void> {
    const motivo = await this.dialogos.pedirTexto({
      titulo: 'Reabrir entrega',
      descripcion: 'El cliente podrá volver a añadir documentación y tendrá que enviarla otra vez.',
      etiquetaCampo: 'Motivo de la reapertura',
      valorInicial: 'El cliente ha comunicado que necesita añadir documentación.',
      confirmar: 'Reabrir entrega',
    });
    if (!motivo) return;
    this.ejecutarReapertura(
      solicitud,
      '/reabrir',
      { motivo },
      'Solicitud reabierta; el cliente ya puede anadir documentos',
      'No se pudo reabrir la solicitud',
    );
  }

  usarSolicitudParaSubida(solicitud: RespuestaSolicitudDocumento): void {
    this.formularioSubida.clienteId = solicitud.clienteId;
    this.formularioSubida.solicitudId = solicitud.id;
    this.formularioSubida.tipo = solicitud.tiposDocumentoEsperados[0] ?? 'OTRO';
    this.formularioSubida.anio = solicitud.anio ?? this.anioSeleccionado;
    this.formularioSubida.periodo = 'TRIMESTRAL';
    this.formularioSubida.trimestre = solicitud.trimestre ?? this.trimestreActivo;
    this.formularioSubida.mes = null;
    this.formularioSubida.origen = 'APORTADO_CLIENTE';
    this.formularioSubida.visibilidad = 'COMPARTIDO_CLIENTE';
    this.formularioSubida.sustituyeDocumentoId = null;
    this.vistaActiva = 'subir';
  }

  usarDocumentoComoSustitucion(documento: RespuestaDocumento): void {
    this.formularioSubida.clienteId = documento.clienteId;
    this.formularioSubida.solicitudId = documento.solicitudId;
    this.formularioSubida.sustituyeDocumentoId = documento.id;
    this.formularioSubida.tipo = documento.tipo;
    this.formularioSubida.anio = documento.anio;
    this.formularioSubida.periodo = documento.periodo;
    this.formularioSubida.trimestre = documento.trimestre;
    this.formularioSubida.mes = documento.mes;
    this.formularioSubida.fechaDocumento = documento.fechaDocumento;
    this.formularioSubida.origen = documento.origen;
    this.formularioSubida.visibilidad = documento.visibilidad;
    this.formularioSubida.titulo = documento.titulo ?? '';
    this.formularioSubida.descripcion = documento.descripcion ?? '';
    this.formularioSubida.referencia = documento.referencia ?? '';
    this.archivosSeleccionados = [];
    this.vistaActiva = 'subir';
  }

  async retirarDocumento(documento: RespuestaDocumento): Promise<void> {
    const motivo = await this.dialogos.pedirTexto({
      titulo: 'Retirar documento',
      descripcion:
        'El archivo conservará su trazabilidad, pero dejará de estar activo en el expediente.',
      etiquetaCampo: 'Motivo de la retirada',
      confirmar: 'Retirar documento',
      peligro: true,
    });
    if (!motivo) return;
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaDocumento>
      >(`${this.urlBaseApi}/api/documentos/${documento.id}/retirar`, { motivo }, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Documento retirado sin eliminar su trazabilidad';
          this.cargarDocumentos();
          this.cargarPanel();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo retirar el documento')),
      });
  }

  agregarUsuario(): void {
    if (
      !this.puedeAdministrar() ||
      !this.nuevoUsuario.nombre.trim() ||
      !this.nuevoUsuario.email.trim() ||
      !this.contrasenaTemporalValida(this.nuevoUsuario.contrasena)
    ) {
      this.error =
        'La clave temporal debe tener al menos 12 caracteres e incluir mayúscula, minúscula, número y símbolo';
      return;
    }
    const payload = {
      ...this.nuevoUsuario,
      clienteId: this.nuevoUsuario.rol === 'CLIENTE' ? this.nuevoUsuario.clienteId : null,
    };
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaUsuario>
      >(`${this.urlBaseApi}/api/usuarios`, payload, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Usuario creado. Deberá cambiar la clave al entrar';
          this.nuevoUsuario = {
            nombre: '',
            email: '',
            contrasena: '',
            rol: 'ASESOR',
            clienteId: null,
            activo: true,
          };
          this.cargarUsuarios();
          this.cargarPlan();
          this.cargarAuditoria();
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, 'No se pudo crear el usuario')),
      });
  }

  async alternarUsuario(usuario: RespuestaUsuario): Promise<void> {
    if (usuario.id === this.usuarioActual?.id) {
      this.error = 'No puedes desactivar tu propia cuenta';
      return;
    }
    if (usuario.activo) {
      const confirmado = await this.dialogos.confirmar({
        titulo: `Desactivar a ${usuario.nombre}`,
        descripcion: 'No podrá entrar hasta que vuelvas a activar su cuenta.',
        confirmar: 'Desactivar acceso',
        peligro: true,
      });
      if (!confirmado) return;
    }
    const payload = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
      activo: !usuario.activo,
    };
    this.http
      .put<
        RespuestaApi<RespuestaUsuario>
      >(`${this.urlBaseApi}/api/usuarios/${usuario.id}`, payload, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = payload.activo ? 'Usuario activado' : 'Usuario desactivado';
          this.cargarUsuarios();
          this.cargarPlan();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo actualizar el usuario')),
      });
  }

  assignClient(): void {
    if (!this.formularioAsignacion.asesorId || !this.formularioAsignacion.clienteId) {
      this.error = 'Selecciona asesor y cliente';
      return;
    }
    this.http
      .post<
        RespuestaApi<RespuestaAsignacion>
      >(`${this.urlBaseApi}/api/asignaciones`, this.formularioAsignacion, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Cliente asignado';
          this.cargarAsignaciones();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo asignar el cliente')),
      });
  }

  async desasignarCliente(asignacion: RespuestaAsignacion): Promise<void> {
    const confirmado = await this.dialogos.confirmar({
      titulo: 'Quitar asignación',
      descripcion: `${asignacion.nombreAsesor} dejará de ver el expediente de ${asignacion.nombreCliente}.`,
      confirmar: 'Quitar asignación',
      peligro: true,
    });
    if (!confirmado) return;
    this.http
      .delete<
        RespuestaApi<void>
      >(`${this.urlBaseApi}/api/asignaciones?asesorId=${asignacion.asesorId}&clienteId=${asignacion.clienteId}`, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Asignación eliminada';
          this.cargarAsignaciones();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo eliminar la asignación')),
      });
  }

  marcarNotificacionLeida(notificacion: RespuestaNotificacion): void {
    if (notificacion.leida) {
      return;
    }
    this.http
      .patch<
        RespuestaApi<RespuestaNotificacion>
      >(`${this.urlBaseApi}/api/notificaciones/${notificacion.id}/leida`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({ next: () => this.cargarNotificaciones() });
  }

  ejecutarRecordatorios(): void {
    this.http
      .post<
        RespuestaApi<void>
      >(`${this.urlBaseApi}/api/notificaciones/generar-recordatorios`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Recordatorios generados y enviados';
          this.cargarNotificaciones();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudieron generar los recordatorios')),
      });
  }

  guardarConfiguracionEmpresa(): void {
    if (!this.puedeAdministrar()) {
      return;
    }
    this.http
      .put<
        RespuestaApi<RespuestaConfiguracionEmpresa>
      >(`${this.urlBaseApi}/api/empresa`, this.formularioEmpresa, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.configuracionEmpresa = respuesta.datos;
          this.aviso = 'Configuración de la gestoría actualizada';
          this.aplicarMarca(respuesta.datos.colorPrincipalMarca);
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo actualizar la configuración')),
      });
  }

  registerUpload(): void {
    if (this.subidaEnCurso) return;
    if (!this.formularioSubida.clienteId || this.archivosSeleccionados.length === 0) {
      this.error = 'Selecciona cliente y al menos un archivo';
      return;
    }

    if (
      this.formularioSubida.origen === 'GENERADO_GESTORIA' &&
      !this.formularioSubida.titulo.trim()
    ) {
      this.error = 'Indica un título claro para el documento que verá el cliente';
      return;
    }

    if (this.formularioSubida.sustituyeDocumentoId && this.archivosSeleccionados.length !== 1) {
      this.error = 'Selecciona un unico archivo para realizar la sustitucion';
      return;
    }

    this.limpiarMensajes();
    const archivos = [...this.archivosSeleccionados];
    this.subidaEnCurso = true;
    this.progresoSubida = 0;
    this.indiceArchivoSubiendo = 1;
    this.totalArchivosSubida = archivos.length;
    this.archivoSubiendo = archivos[0]?.name ?? '';
    from(archivos.map((archivo, indice) => ({ archivo, indice })))
      .pipe(
        concatMap(({ archivo, indice }) => this.subirArchivo(archivo, indice, archivos.length)),
        toArray(),
        finalize(() => {
          this.subidaEnCurso = false;
          this.detectorCambios.markForCheck();
        }),
      )
      .subscribe({
        next: (documentos) => {
          this.progresoSubida = 100;
          this.aviso =
            documentos.length === 1
              ? 'Documento subido correctamente'
              : `${documentos.length} documentos subidos correctamente`;
          this.archivosSeleccionados = [];
          this.formularioSubida.solicitudId = null;
          this.formularioSubida.sustituyeDocumentoId = null;
          this.formularioSubida.titulo = '';
          this.formularioSubida.descripcion = '';
          this.formularioSubida.referencia = '';
          this.vistaActiva = 'documentos';
          this.cargarDocumentos();
          this.cargarPanel();
          this.cargarSolicitudes();
          this.cargarNotificaciones();
          this.cargarPlan();
        },
        error: (error) => {
          const detalle = this.obtenerErrorApi(error, 'No se pudieron subir todos los documentos');
          this.error = this.archivoSubiendo
            ? `No se pudo subir “${this.archivoSubiendo}”. ${detalle}`
            : detalle;
          this.cargarDocumentos();
          this.cargarPanel();
          this.cargarSolicitudes();
        },
      });
  }

  private subirArchivo(archivo: File, indice: number, totalArchivos: number) {
    const formData = new FormData();
    formData.append('clienteId', String(this.formularioSubida.clienteId));
    formData.append('tipo', this.formularioSubida.tipo);
    formData.append('anio', String(this.formularioSubida.anio));
    formData.append('periodo', this.formularioSubida.periodo);
    if (this.formularioSubida.trimestre)
      formData.append('trimestre', String(this.formularioSubida.trimestre));
    if (this.formularioSubida.mes) formData.append('mes', String(this.formularioSubida.mes));
    if (this.formularioSubida.fechaDocumento)
      formData.append('fechaDocumento', this.formularioSubida.fechaDocumento);
    formData.append('origen', this.formularioSubida.origen);
    formData.append('visibilidad', this.formularioSubida.visibilidad);
    if (this.formularioSubida.titulo.trim())
      formData.append('titulo', this.formularioSubida.titulo.trim());
    if (this.formularioSubida.descripcion.trim())
      formData.append('descripcion', this.formularioSubida.descripcion.trim());
    if (this.formularioSubida.referencia.trim())
      formData.append('referencia', this.formularioSubida.referencia.trim());
    if (this.formularioSubida.solicitudId) {
      formData.append('solicitudId', String(this.formularioSubida.solicitudId));
    }
    if (this.formularioSubida.sustituyeDocumentoId) {
      formData.append('sustituyeDocumentoId', String(this.formularioSubida.sustituyeDocumentoId));
    }
    formData.append('archivo', archivo);
    this.archivoSubiendo = archivo.name;
    this.indiceArchivoSubiendo = indice + 1;
    this.detectorCambios.markForCheck();
    return this.http
      .post<RespuestaApi<RespuestaDocumento>>(`${this.urlBaseApi}/api/documentos`, formData, {
        headers: this.cabecerasAutenticacion(),
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        tap((evento) => {
          if (evento.type !== HttpEventType.UploadProgress) return;
          const proporcionArchivo = evento.total ? evento.loaded / evento.total : 0;
          this.progresoSubida = Math.min(
            99,
            Math.round(((indice + proporcionArchivo) / totalArchivos) * 100),
          );
          this.detectorCambios.markForCheck();
        }),
        filter(
          (evento): evento is HttpResponse<RespuestaApi<RespuestaDocumento>> =>
            evento.type === HttpEventType.Response,
        ),
        map((evento) => evento.body?.datos as RespuestaDocumento),
      );
  }

  async establecerEstado(documento: RespuestaDocumento, estado: EstadoDocumento): Promise<void> {
    if (!this.puedeRevisarDocumentos()) {
      return;
    }

    let comentarioAsesor: string | null = null;
    if (estado === 'RECHAZADO') {
      comentarioAsesor = await this.dialogos.pedirTexto({
        titulo: 'Solicitar corrección',
        descripcion: 'El cliente verá este comentario junto al documento rechazado.',
        etiquetaCampo: 'Qué debe corregir o sustituir',
        confirmar: 'Rechazar y avisar',
        peligro: true,
      });
      if (!comentarioAsesor) return;
    }

    this.http
      .patch<
        RespuestaApi<RespuestaDocumento>
      >(`${this.urlBaseApi}/api/documentos/${documento.id}/estado`, { estado, comentarioAsesor }, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = 'Estado actualizado';
          this.cargarDocumentos();
          this.cargarPanel();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cambiar el estado')),
      });
  }

  descargarDocumento(documento: RespuestaDocumento): void {
    this.descargarBlob(
      `/api/documentos/${documento.id}/descargar`,
      documento.nombreArchivoOriginal,
    );
  }

  esPrevisualizable(documento: RespuestaDocumento): boolean {
    return (
      documento.tipoContenido === 'application/pdf' ||
      !!documento.tipoContenido?.startsWith('image/')
    );
  }

  previsualizarDocumento(documento: RespuestaDocumento): void {
    this.cerrarVisorDocumento();
    this.visorDocumentoVisible = true;
    this.visorDocumentoCargando = true;
    this.visorDocumentoNombre = documento.titulo || documento.nombreArchivoOriginal;
    this.visorDocumentoTipo = documento.tipoContenido ?? '';
    this.http
      .get(`${this.urlBaseApi}/api/documentos/${documento.id}/descargar`, {
        headers: this.cabecerasAutenticacion(),
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          this.visorDocumentoTipo = blob.type || this.visorDocumentoTipo;
          this.visorDocumentoUrl = URL.createObjectURL(blob);
          this.visorDocumentoCargando = false;
          this.detectorCambios.markForCheck();
        },
        error: (error) => {
          this.visorDocumentoCargando = false;
          this.visorDocumentoError = this.obtenerErrorApi(
            error,
            'No se pudo preparar la vista previa',
          );
          this.detectorCambios.markForCheck();
        },
      });
  }

  cerrarVisorDocumento(): void {
    if (this.visorDocumentoUrl) URL.revokeObjectURL(this.visorDocumentoUrl);
    this.visorDocumentoVisible = false;
    this.visorDocumentoCargando = false;
    this.visorDocumentoUrl = '';
    this.visorDocumentoError = '';
  }

  documentoSeleccionado(documentoId: number): boolean {
    return this.seleccionDocumentos.has(documentoId);
  }

  cambiarSeleccionDocumento(documentoId: number, seleccionado: boolean): void {
    seleccionado
      ? this.seleccionDocumentos.add(documentoId)
      : this.seleccionDocumentos.delete(documentoId);
  }

  cambiarSeleccionTodosDocumentos(seleccionado: boolean): void {
    this.seleccionDocumentos.clear();
    if (seleccionado)
      this.documentosFiltrados().forEach((documento) => this.seleccionDocumentos.add(documento.id));
  }

  async aplicarAccionMasivaDocumentos(accion: 'REVISAR' | 'PUBLICAR'): Promise<void> {
    const seleccionados = this.documentosFiltrados().filter((documento) =>
      this.seleccionDocumentos.has(documento.id),
    );
    const aplicables = seleccionados.filter((documento) =>
      accion === 'REVISAR'
        ? documento.origen === 'APORTADO_CLIENTE' &&
          !['RETIRADO', 'SUSTITUIDO', 'REVISADO'].includes(documento.estado)
        : documento.origen === 'GENERADO_GESTORIA' && documento.visibilidad === 'INTERNO_GESTORIA',
    );
    if (aplicables.length === 0) {
      this.error =
        accion === 'REVISAR'
          ? 'Selecciona documentos aportados pendientes de revisar.'
          : 'Selecciona borradores internos para publicar.';
      return;
    }
    const confirmado = await this.dialogos.confirmar({
      titulo: accion === 'REVISAR' ? 'Revisar documentos' : 'Publicar documentos',
      descripcion:
        accion === 'REVISAR'
          ? `Se marcarán ${aplicables.length} documentos como revisados.`
          : `${aplicables.length} documentos serán visibles inmediatamente para sus clientes.`,
      confirmar: accion === 'REVISAR' ? 'Marcar revisados' : 'Publicar al cliente',
    });
    if (!confirmado) return;

    this.limpiarMensajes();
    from(aplicables)
      .pipe(
        concatMap((documento) =>
          (accion === 'REVISAR'
            ? this.http.patch(
                `${this.urlBaseApi}/api/documentos/${documento.id}/estado`,
                { estado: 'REVISADO', comentarioAsesor: null },
                { headers: this.cabecerasAutenticacion() },
              )
            : this.http.post(
                `${this.urlBaseApi}/api/documentos/${documento.id}/publicar`,
                {},
                { headers: this.cabecerasAutenticacion() },
              )
          ).pipe(
            map(() => true),
            catchError(() => of(false)),
          ),
        ),
        toArray(),
      )
      .subscribe((resultados) => {
        const correctos = resultados.filter(Boolean).length;
        const fallidos = resultados.length - correctos;
        this.aviso = `${correctos} documentos actualizados${fallidos ? `; ${fallidos} no pudieron procesarse` : ''}`;
        this.seleccionDocumentos.clear();
        this.cargarDocumentos();
        this.cargarPanel();
        this.cargarNotificaciones();
        this.cargarAuditoria();
      });
  }

  async publicarDocumento(documento: RespuestaDocumento): Promise<void> {
    const confirmado = await this.dialogos.confirmar({
      titulo: 'Publicar documento',
      descripcion: `“${documento.titulo || documento.nombreArchivoOriginal}” será visible y descargable inmediatamente por el cliente.`,
      confirmar: 'Publicar al cliente',
    });
    if (!confirmado) return;
    this.cambiarPublicacion(documento, 'publicar', 'Documento publicado al cliente');
  }

  async retirarPublicacionDocumento(documento: RespuestaDocumento): Promise<void> {
    const confirmado = await this.dialogos.confirmar({
      titulo: 'Ocultar documento al cliente',
      descripcion: `“${documento.titulo || documento.nombreArchivoOriginal}” dejará de ser visible, pero seguirá guardado para la gestoría.`,
      confirmar: 'Ocultar documento',
      peligro: true,
    });
    if (!confirmado) return;
    this.cambiarPublicacion(
      documento,
      'retirar-publicacion',
      'Documento devuelto al espacio interno',
    );
  }

  private cambiarPublicacion(documento: RespuestaDocumento, accion: string, mensaje: string): void {
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaDocumento>
      >(`${this.urlBaseApi}/api/documentos/${documento.id}/${accion}`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = mensaje;
          this.cargarDocumentos();
          this.cargarNotificaciones();
          this.cargarAuditoria();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo cambiar la publicación')),
      });
  }

  descargarZip(): void {
    this.descargarBlob(
      `/api/documentos/zip?anio=${this.anioSeleccionado}&trimestre=${this.trimestreActivo}`,
      `documentos-${this.anioSeleccionado}-T${this.trimestreActivo}.zip`,
    );
  }

  exportarRgpd(cliente: RespuestaCliente): void {
    this.descargarBlob(
      `/api/clientes/${cliente.id}/exportacion-rgpd`,
      `exportacion-rgpd-cliente-${cliente.id}.zip`,
    );
  }

  comprobarApi(): void {
    this.estadoApi = 'Comprobando';
    this.http.get<RespuestaApi<string>>(`${this.urlBaseApi}/api/salud`).subscribe({
      next: (respuesta) => {
        this.estadoApi = respuesta.exito ? `Conectado: ${respuesta.datos}` : 'Respuesta no válida';
        this.detectorCambios.markForCheck();
      },
      error: () => {
        this.estadoApi = 'No disponible';
        this.detectorCambios.markForCheck();
      },
    });
  }

  alSeleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivosSeleccionados = Array.from(input.files ?? []);
  }

  cambiarOrigenSubida(): void {
    if (this.formularioSubida.origen === 'GENERADO_GESTORIA') {
      this.formularioSubida.tipo = 'MODELO_TRIBUTARIO';
      this.formularioSubida.visibilidad = 'INTERNO_GESTORIA';
      this.formularioSubida.solicitudId = null;
      return;
    }
    this.formularioSubida.tipo = 'FACTURA_RECIBIDA';
    this.formularioSubida.visibilidad = 'COMPARTIDO_CLIENTE';
  }

  cambiarPeriodoSubida(): void {
    const periodo = this.formularioSubida.periodo;
    if (periodo === 'MENSUAL') {
      this.formularioSubida.mes ??= new Date().getMonth() + 1;
      this.formularioSubida.trimestre = Math.floor((this.formularioSubida.mes - 1) / 3) + 1;
    } else if (periodo === 'TRIMESTRAL') {
      this.formularioSubida.trimestre ??= this.trimestreActivo;
      this.formularioSubida.mes = null;
    } else {
      this.formularioSubida.trimestre = null;
      this.formularioSubida.mes = null;
    }
  }

  tiposDisponiblesSubida(): TipoDocumento[] {
    return this.formularioSubida.origen === 'GENERADO_GESTORIA'
      ? this.tiposDocumentoGestoria
      : this.tiposDocumentoAportacion;
  }

  clientesFiltrados(): RespuestaCliente[] {
    const normalizar = (valor: string) =>
      valor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const term = normalizar(this.terminoBusqueda.trim());
    if (!term) {
      return this.clientes;
    }
    return this.clientes.filter((cliente) =>
      [
        cliente.nombre,
        cliente.nif,
        cliente.email,
        cliente.telefono ?? '',
        this.etiquetaTipoCliente(cliente.tipo),
      ].some((value) => normalizar(value).includes(term)),
    );
  }

  documentosFiltrados(): RespuestaDocumento[] {
    return this.documentosRepositorio;
  }

  aniosDisponiblesDocumentos(): number[] {
    const actual = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, indice) => actual + 1 - indice);
  }

  solicitudDeDocumento(documento: RespuestaDocumento): RespuestaSolicitudDocumento | null {
    if (!documento.solicitudId) return null;
    return this.solicitudes.find((solicitud) => solicitud.id === documento.solicitudId) ?? null;
  }

  solicitudFiltradaDocumentos(): RespuestaSolicitudDocumento | null {
    if (!this.filtroSolicitudDocumento) return null;
    return (
      this.solicitudes.find((solicitud) => solicitud.id === this.filtroSolicitudDocumento) ?? null
    );
  }

  solicitudesDeCumplimiento(
    cumplimiento: RespuestaCumplimientoObligacion,
  ): RespuestaSolicitudDocumento[] {
    return this.solicitudes.filter(
      (solicitud) => solicitud.cumplimientoObligacionId === cumplimiento.id,
    );
  }

  solicitudesRelacionadasCumplimiento(
    cumplimiento: RespuestaCumplimientoObligacion,
  ): RespuestaSolicitudDocumento[] {
    const vinculadas = this.solicitudesDeCumplimiento(cumplimiento);
    if (vinculadas.length > 0) return vinculadas;
    const trimestre = cumplimiento.periodoClave.startsWith('T')
      ? Number(cumplimiento.periodoClave.slice(1))
      : cumplimiento.periodoClave.startsWith('M')
        ? Math.ceil(Number(cumplimiento.periodoClave.slice(1)) / 3)
        : null;
    return this.solicitudes.filter(
      (solicitud) =>
        !solicitud.cumplimientoObligacionId &&
        solicitud.clienteId === cumplimiento.clienteId &&
        solicitud.anio === cumplimiento.anio &&
        (trimestre === null || solicitud.trimestre === trimestre),
    );
  }

  documentoJustificante(cumplimiento: RespuestaCumplimientoObligacion): RespuestaDocumento | null {
    if (!cumplimiento.justificanteDocumentoId) return null;
    return (
      this.documentosJustificantesCliente.find(
        (documento) => documento.id === cumplimiento.justificanteDocumentoId,
      ) ?? null
    );
  }

  abrirDocumentosSolicitud(solicitud: RespuestaSolicitudDocumento): void {
    this.terminoBusquedaDocumentos = '';
    this.filtroClienteDocumento = solicitud.clienteId;
    this.filtroSolicitudDocumento = solicitud.id;
    this.filtroAnioDocumento = null;
    this.filtroEstadoDocumento = '';
    this.filtroOrigenDocumento = '';
    this.filtroVisibilidadDocumento = '';
    this.filtroTipoDocumento = '';
    this.filtroPeriodoDocumento = '';
    this.vistaActiva = 'documentos';
    this.cargarPaginaDocumentos(0);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  cumplimientoDeDocumento(documento: RespuestaDocumento): RespuestaCumplimientoObligacion | null {
    return (
      [...this.agendaFiscal, ...this.cumplimientosCliente].find(
        (cumplimiento) => cumplimiento.justificanteDocumentoId === documento.id,
      ) ?? null
    );
  }

  documentosPorRevisarPagina(): number {
    return this.documentosRepositorio.filter(
      (documento) => documento.estado === 'RECIBIDO' || documento.estado === 'RECHAZADO',
    ).length;
  }

  documentosSinAsociarPagina(): number {
    return this.documentosRepositorio.filter(
      (documento) =>
        documento.origen === 'APORTADO_CLIENTE' &&
        !documento.solicitudId &&
        !this.cumplimientoDeDocumento(documento),
    ).length;
  }

  borradoresInternosPagina(): number {
    return this.documentosRepositorio.filter(
      (documento) =>
        documento.origen === 'GENERADO_GESTORIA' &&
        documento.visibilidad === 'INTERNO_GESTORIA' &&
        documento.estado !== 'RETIRADO',
    ).length;
  }

  solicitudesCompatiblesDocumento(
    documento: RespuestaDocumento | null,
  ): RespuestaSolicitudDocumento[] {
    if (!documento) return [];
    return this.solicitudes.filter(
      (solicitud) =>
        solicitud.clienteId === documento.clienteId &&
        (solicitud.estado === 'ABIERTA' || solicitud.estado === 'PARCIAL') &&
        solicitud.tiposDocumentoEsperados.includes(documento.tipo) &&
        (!solicitud.anio || solicitud.anio === documento.anio) &&
        (!solicitud.trimestre || solicitud.trimestre === documento.trimestre),
    );
  }

  asociarDocumentoSolicitud(solicitudId: number): void {
    const documento = this.documentoAsociando;
    if (!documento) return;
    this.http
      .patch<
        RespuestaApi<RespuestaDocumento>
      >(`${this.urlBaseApi}/api/documentos/${documento.id}/solicitud`, { solicitudId }, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.documentoAsociando = null;
          this.aviso = 'Documento asociado a la petición';
          this.cargarPaginaDocumentos(this.paginaDocumentos);
          this.cargarSolicitudes();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(error, 'No se pudo asociar el documento')),
      });
  }

  documentosDelTrimestre(): RespuestaDocumento[] {
    return this.documentos.filter(
      (documento) =>
        documento.anio === this.anioSeleccionado && documento.trimestre === this.trimestreActivo,
    );
  }

  trimestreStatus(clienteId: number, trimestre: number): string {
    return (
      this.panel?.clientes.find((cliente) => cliente.clienteId === clienteId)?.trimestres[
        String(trimestre)
      ]?.estado ?? 'FALTA'
    );
  }

  etiquetaEstadoTrimestre(estado: string): string {
    if (this.esCliente()) {
      const cliente: Record<string, string> = {
        FALTA: 'Sin documentos',
        RECIBIDO: 'Documentos recibidos',
        REVISADO: 'Al día',
        RECHAZADO: 'Necesita corrección',
        NO_APLICA: 'No te corresponde',
        SIN_CONFIGURAR: 'Pendiente de planificación',
        SIN_PLANIFICAR: 'Pendiente de planificación',
      };
      if (cliente[estado]) return cliente[estado];
    }
    if (estado === 'NO_APLICA') return 'No aplica';
    if (estado === 'SIN_CONFIGURAR') return 'Sin configurar';
    if (estado === 'SIN_PLANIFICAR') return 'Sin planificar';
    return estado.charAt(0) + estado.slice(1).toLowerCase();
  }

  estadoTipoSolicitud(solicitud: RespuestaSolicitudDocumento, tipo: TipoDocumento): string {
    return solicitud.estadoChecklist[tipo] ?? 'FALTA';
  }

  porcentajeCompletado(): number {
    const clientesActivos = this.panel?.clientes.filter((cliente) => cliente.activo) ?? [];
    const estados = clientesActivos
      .flatMap((cliente) =>
        this.trimestres.map((trimestre) => cliente.trimestres[String(trimestre)]?.estado),
      )
      .filter(
        (estado) =>
          estado !== 'NO_APLICA' && estado !== 'SIN_CONFIGURAR' && estado !== 'SIN_PLANIFICAR',
      );
    const possible = estados.length;
    if (possible === 0) {
      return 0;
    }
    const reviewed = estados.filter((estado) => estado === 'REVISADO').length;
    return Math.round((reviewed / possible) * 100);
  }

  cantidadPendientes(): number {
    if (this.esCliente()) {
      const entregasPorCompletar = this.solicitudes.filter(
        (solicitud) => solicitud.estado === 'ABIERTA' || solicitud.estado === 'PARCIAL',
      ).length;
      return entregasPorCompletar + Number(this.panel?.totales.documentosRechazados ?? 0);
    }
    return (
      Number(this.panel?.totales.documentosRecibidos ?? 0) +
      Number(this.panel?.totales.documentosRechazados ?? 0) +
      this.agendaFiscalPendiente().length
    );
  }

  agendaFiscalPendiente(): RespuestaCumplimientoObligacion[] {
    return this.agendaFiscal.filter(
      (cumplimiento) => cumplimiento.estado !== 'PRESENTADA' && cumplimiento.estado !== 'NO_APLICA',
    );
  }

  seleccionarTrimestre(trimestre: number): void {
    this.trimestreActivo = trimestre;
    this.cargarDocumentos();
  }

  abrirExpediente(cliente: RespuestaCliente): void {
    this.filtroClienteDocumento = cliente.id;
    this.filtroSolicitudDocumento = null;
    this.filtroAnioDocumento = null;
    this.filtroEstadoDocumento = '';
    this.filtroOrigenDocumento = '';
    this.filtroVisibilidadDocumento = '';
    this.filtroTipoDocumento = '';
    this.filtroPeriodoDocumento = '';
    this.terminoBusquedaDocumentos = '';
    this.vistaActiva = 'documentos';
    this.cargarPaginaDocumentos(0);
  }

  cantidadClientesActivos(): number {
    return this.clientes.filter((cliente) => cliente.activo).length;
  }

  elementosMenuVisibles(): Array<{ view: Vista; label: string; icon: string }> {
    return this.elementosMenu
      .filter((item) => {
        if ((item.view === 'equipo' || item.view === 'plan') && !this.puedeAdministrar()) {
          return false;
        }
        return true;
      })
      .map((item) => {
        if (!this.esCliente()) return item;
        const etiquetasCliente: Partial<Record<Vista, string>> = {
          panel: 'Mi panel',
          clientes: 'Mi expediente',
          solicitudes: 'Lo que debo entregar',
          documentos: 'Mis archivos',
          subir: 'Añadir documentos',
        };
        return { ...item, label: etiquetasCliente[item.view] ?? item.label };
      });
  }

  tituloVista(): string {
    const titulos: Record<Vista, string> = {
      panel: this.esCliente() ? 'Mi espacio documental' : 'Panel de asesoría',
      clientes: this.esCliente() ? 'Mis datos y fechas fiscales' : 'Clientes',
      documentos: this.esCliente() ? 'Mis archivos' : 'Repositorio documental',
      solicitudes: this.esCliente() ? 'Lo que debo entregar' : 'Peticiones de documentación',
      subir: this.esCliente() ? 'Añadir documentos' : 'Subida de documentos',
      equipo: 'Equipo y asignaciones',
      plan: 'Plan y consumo',
      configuracion: 'Ayuda, seguridad y privacidad',
    };
    return titulos[this.vistaActiva];
  }

  etiquetaRol(rol: Rol): string {
    const etiquetas: Record<Rol, string> = {
      ADMIN_PLATAFORMA: 'Administración de plataforma',
      ADMIN: 'Administración de la gestoría',
      ASESOR: 'Asesoría',
      CLIENTE: 'Cliente',
    };
    return etiquetas[rol];
  }

  contrasenaTemporalValida(contrasena: string): boolean {
    return (
      contrasena.length >= 12 &&
      /[a-z]/.test(contrasena) &&
      /[A-Z]/.test(contrasena) &&
      /\d/.test(contrasena) &&
      /[^A-Za-z0-9]/.test(contrasena)
    );
  }

  asesores(): RespuestaUsuario[] {
    return this.usuarios.filter((usuario) => usuario.rol === 'ASESOR' && usuario.activo);
  }

  cargaEquipo(): Array<{
    id: number;
    nombre: string;
    clientes: number;
    abiertas: number;
    porRevisar: number;
    vencidas: number;
  }> {
    return this.asesores()
      .map((asesor) => {
        const clientes = new Set(
          this.asignaciones
            .filter((asignacion) => asignacion.asesorId === asesor.id)
            .map((asignacion) => asignacion.clienteId),
        );
        const solicitudes = this.solicitudes.filter(
          (solicitud) =>
            solicitud.asesorAsignadoId === asesor.id ||
            (!solicitud.asesorAsignadoId && clientes.has(solicitud.clienteId)),
        );
        return {
          id: asesor.id,
          nombre: asesor.nombre,
          clientes: clientes.size,
          abiertas: solicitudes.filter(
            (solicitud) => solicitud.estado === 'ABIERTA' || solicitud.estado === 'PARCIAL',
          ).length,
          porRevisar: solicitudes.filter((solicitud) => solicitud.estado === 'ENVIADA').length,
          vencidas: solicitudes.filter(
            (solicitud) =>
              solicitud.vencida && !['COMPLETADA', 'CANCELADA'].includes(solicitud.estado),
          ).length,
        };
      })
      .sort(
        (a, b) =>
          b.vencidas - a.vencidas ||
          b.porRevisar - a.porRevisar ||
          a.nombre.localeCompare(b.nombre),
      );
  }

  clientesSinAsesor(): number {
    const asignados = new Set(this.asignaciones.map((asignacion) => asignacion.clienteId));
    return this.clientes.filter((cliente) => cliente.activo && !asignados.has(cliente.id)).length;
  }

  responsablesDisponibles(): RespuestaUsuario[] {
    const equipo = this.usuarios.filter((usuario) => usuario.activo && usuario.rol !== 'CLIENTE');
    if (
      this.usuarioActual &&
      this.usuarioActual.rol !== 'CLIENTE' &&
      !equipo.some((usuario) => usuario.id === this.usuarioActual?.id)
    ) {
      return [this.usuarioActual, ...equipo];
    }
    return equipo;
  }

  solicitudesAbiertas(): number {
    return this.solicitudes.filter(
      (solicitud) => solicitud.estado !== 'COMPLETADA' && solicitud.estado !== 'CANCELADA',
    ).length;
  }

  notificacionesNoLeidas(): number {
    return this.notificaciones.filter((notificacion) => !notificacion.leida).length;
  }

  puedeAdministrar(): boolean {
    return this.usuarioActual?.rol === 'ADMIN' || this.usuarioActual?.rol === 'ADMIN_PLATAFORMA';
  }

  puedeGestionarClientes(): boolean {
    return this.puedeAdministrar() || this.usuarioActual?.rol === 'ASESOR';
  }

  puedeRevisarDocumentos(): boolean {
    return this.puedeAdministrar() || this.usuarioActual?.rol === 'ASESOR';
  }

  esCliente(): boolean {
    return this.usuarioActual?.rol === 'CLIENTE';
  }

  etiquetaEstadoSolicitud(estado: EstadoSolicitud): string {
    const labelsCliente: Record<EstadoSolicitud, string> = {
      ABIERTA: 'Pendiente de documentos',
      PARCIAL: 'Entrega en curso',
      ENVIADA: 'Enviado a la gestoría',
      COMPLETADA: 'Revisado por la gestoría',
      CANCELADA: 'Cancelada',
    };
    const labelsEquipo: Record<EstadoSolicitud, string> = {
      ABIERTA: 'Abierta',
      PARCIAL: 'Entrega en curso',
      ENVIADA: 'Pendiente de revisión',
      COMPLETADA: 'Revisada y cerrada',
      CANCELADA: 'Cancelada',
    };
    return (this.esCliente() ? labelsCliente : labelsEquipo)[estado];
  }

  descripcionEstadoSolicitud(solicitud: RespuestaSolicitudDocumento): string {
    if (solicitud.reaperturaSolicitadaEn) {
      return this.esCliente()
        ? 'La gestoría ha recibido tu petición de reapertura.'
        : 'El cliente necesita añadir más documentación.';
    }
    const cliente: Record<EstadoSolicitud, string> = {
      ABIERTA: 'Todavía no has añadido documentos a esta entrega.',
      PARCIAL: 'Puedes seguir añadiendo archivos. Envíala solo cuando hayas terminado.',
      ENVIADA: 'La gestoría ya está revisando la entrega. Si olvidaste algo, pide que la reabran.',
      COMPLETADA: 'La gestoría ha terminado de revisar esta entrega.',
      CANCELADA: 'Esta entrega está cancelada y ya no admite archivos.',
    };
    const equipo: Record<EstadoSolicitud, string> = {
      ABIERTA: 'El cliente todavía no ha aportado documentación.',
      PARCIAL: 'El cliente está preparando la entrega y puede añadir más archivos.',
      ENVIADA: 'El cliente ha finalizado la entrega y espera revisión.',
      COMPLETADA: 'Documentación revisada y petición cerrada.',
      CANCELADA: 'Petición cancelada; no admite nuevas aportaciones.',
    };
    return (this.esCliente() ? cliente : equipo)[solicitud.estado];
  }

  etiquetaEstadoDocumento(estado: EstadoDocumento): string {
    const labels: Record<EstadoDocumento, string> = {
      PENDIENTE: 'Pendiente',
      RECIBIDO: this.esCliente() ? 'Recibido por la gestoría' : 'Pendiente de revisión',
      REVISADO: 'Revisado',
      RECHAZADO: this.esCliente() ? 'Necesita corrección' : 'Rechazado',
      BORRADOR: 'Borrador interno',
      PUBLICADO: 'Publicado al cliente',
      RETIRADO: 'Retirado',
      SUSTITUIDO: 'Sustituido',
    };
    return labels[estado];
  }

  etiquetaEstadoChecklist(estado: string): string {
    const labels: Record<string, string> = {
      FALTA: 'Falta',
      RECIBIDO: 'Recibido',
      REVISADO: 'Revisado',
      RECHAZADO: 'Necesita corrección',
    };
    return labels[estado] ?? estado.replaceAll('_', ' ').toLowerCase();
  }

  etiquetaEstadoCumplimiento(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE_DOCUMENTACION: 'Falta documentación',
      DOCUMENTACION_RECIBIDA: 'Documentación recibida',
      EN_PREPARACION: 'En preparación',
      PENDIENTE_REVISION: 'Pendiente de revisión',
      PRESENTADA: 'Presentada',
      APLAZADA: 'Aplazada',
      NO_APLICA: 'No aplica',
      SIN_PLANIFICAR: 'Sin planificar',
    };
    return labels[estado] ?? estado.replaceAll('_', ' ').toLowerCase();
  }

  etiquetaResultadoCumplimiento(resultado: ResultadoCumplimientoObligacion): string {
    const labels: Record<ResultadoCumplimientoObligacion, string> = {
      SIN_RESULTADO: 'Sin resultado',
      A_INGRESAR: 'A ingresar',
      A_DEVOLVER: 'A devolver',
      A_COMPENSAR: 'A compensar',
      CUOTA_CERO: 'Cuota cero',
    };
    return labels[resultado];
  }

  etiquetaOrigenDocumento(documento: RespuestaDocumento): string {
    if (documento.origen === 'GENERADO_GESTORIA') {
      return this.esCliente() ? 'Publicado por tu gestoría' : 'Preparado por la gestoría';
    }
    return this.esCliente() ? 'Subido por ti' : 'Aportado por el cliente';
  }

  etiquetaVisibilidadDocumento(documento: RespuestaDocumento): string {
    return documento.visibilidad === 'COMPARTIDO_CLIENTE'
      ? 'Visible para el cliente'
      : 'Solo gestoría';
  }

  abrirGuia(): void {
    this.guiaVisible = true;
  }

  cerrarGuia(): void {
    this.guiaVisible = false;
    if (typeof localStorage !== 'undefined' && this.usuarioActual) {
      localStorage.setItem(this.claveGuia(), '1');
    }
  }

  irDesdeGuia(vista: Vista): void {
    this.vistaActiva = vista;
    this.cerrarGuia();
  }

  private guiaDescartada(): boolean {
    return (
      typeof localStorage !== 'undefined' &&
      !!this.usuarioActual &&
      localStorage.getItem(this.claveGuia()) === '1'
    );
  }

  private claveGuia(): string {
    return `gestoria-guia-${this.usuarioActual?.id ?? 'anonimo'}-${this.usuarioActual?.rol ?? 'sin-rol'}`;
  }

  etiquetaRecurrencia(recurrencia: Recurrencia): string {
    const labels: Record<Recurrencia, string> = {
      NINGUNA: 'Una vez',
      MENSUAL: 'Mensual',
      TRIMESTRAL: 'Trimestral',
      ANUAL: 'Anual',
    };
    return labels[recurrencia];
  }

  formatearBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** unit).toFixed(unit > 2 ? 1 : 0)} ${units[unit]}`;
  }

  porcentajeUso(value: number, maximum: number): number {
    if (!maximum) {
      return 0;
    }
    return Math.min(100, Math.round((value / maximum) * 100));
  }

  etiquetaTipoCliente(tipo: TipoCliente): string {
    const labels: Record<TipoCliente, string> = {
      AUTONOMO: 'Autónomo',
      EMPRESA: 'Sociedad / empresa',
      PARTICULAR: 'Particular',
      COMUNIDAD_BIENES: 'Comunidad de bienes',
      SOCIEDAD_CIVIL: 'Sociedad civil',
      COMUNIDAD_PROPIETARIOS: 'Comunidad de propietarios',
      ASOCIACION_FUNDACION: 'Asociación o fundación',
      ENTIDAD_SIN_PERSONALIDAD: 'Entidad sin personalidad jurídica',
      OTRO: 'Otra entidad',
    };
    return labels[tipo];
  }

  etiquetaTipoDocumento(tipo: TipoDocumento): string {
    const labels: Record<TipoDocumento, string> = {
      FACTURA_EMITIDA: 'Factura emitida',
      FACTURA_RECIBIDA: 'Factura recibida',
      TICKET: 'Ticket',
      NOMINA: 'Nómina',
      CONTRATO: 'Contrato',
      EXTRACTO_BANCARIO: 'Extracto bancario',
      JUSTIFICANTE: 'Justificante',
      ESCRITURA: 'Escritura',
      LIBRO_FACTURAS_EMITIDAS: 'Libro de facturas emitidas',
      LIBRO_FACTURAS_RECIBIDAS: 'Libro de facturas recibidas',
      LIBRO_INGRESOS: 'Libro de ingresos',
      LIBRO_GASTOS: 'Libro de gastos',
      LIBRO_BIENES_INVERSION: 'Libro de bienes de inversión',
      LIBRO_DIARIO: 'Libro Diario',
      CUENTAS_ANUALES: 'Cuentas anuales',
      MODELO_TRIBUTARIO: 'Modelo tributario',
      JUSTIFICANTE_PRESENTACION: 'Justificante de presentación',
      LIQUIDACION: 'Liquidación',
      COMUNICACION_ADMINISTRACION: 'Comunicación de la Administración',
      INFORME_ASESORIA: 'Informe de la asesoría',
      OTRO: 'Otro',
    };
    return labels[tipo];
  }

  etiquetaPeriodoDocumento(documento: RespuestaDocumento): string {
    if (documento.periodo === 'MENSUAL')
      return `${documento.anio} · ${this.etiquetaMes(documento.mes)}`;
    if (documento.periodo === 'TRIMESTRAL') return `${documento.anio} · T${documento.trimestre}`;
    if (documento.periodo === 'ANUAL') return `${documento.anio} · Anual`;
    return documento.fechaDocumento
      ? `Puntual · ${documento.fechaDocumento}`
      : `${documento.anio} · Puntual`;
  }

  etiquetaMes(mes: number | null): string {
    const labels = [
      '-',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return mes ? labels[mes] : '-';
  }

  private ejecutarReapertura(
    solicitud: RespuestaSolicitudDocumento,
    ruta: string,
    cuerpo: Record<string, string>,
    mensajeExito: string,
    mensajeError: string,
  ): void {
    this.limpiarMensajes();
    this.http
      .post<
        RespuestaApi<RespuestaSolicitudDocumento>
      >(`${this.urlBaseApi}/api/solicitudes/${solicitud.id}${ruta}`, cuerpo, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: () => {
          this.aviso = mensajeExito;
          this.cargarSolicitudes();
          this.cargarNotificaciones();
          this.cargarAuditoria();
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, mensajeError)),
      });
  }

  private cabecerasAutenticacion(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token}` });
  }

  private descargarBlob(path: string, nombreArchivoAlternativo: string): void {
    this.http
      .get(`${this.urlBaseApi}${path}`, {
        headers: this.cabecerasAutenticacion(),
        observe: 'response',
        responseType: 'blob',
      })
      .subscribe({
        next: (respuesta: HttpResponse<Blob>) => {
          const nombreArchivo =
            this.nombreArchivoDeRespuesta(respuesta) ?? nombreArchivoAlternativo;
          const url = URL.createObjectURL(respuesta.body ?? new Blob());
          const link = globalThis.document.createElement('a');
          link.href = url;
          link.download = nombreArchivo;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => (this.error = this.obtenerErrorApi(error, 'No se pudo descargar')),
      });
  }

  private nombreArchivoDeRespuesta(respuesta: HttpResponse<Blob>): string | null {
    const disposition = respuesta.headers.get('content-disposition');
    const match = disposition?.match(/nombreArchivo\*=UTF-8''([^;]+)|nombreArchivo="?([^"]+)"?/);
    const nombreArchivo = match?.[1] ?? match?.[2];
    return nombreArchivo ? decodeURIComponent(nombreArchivo) : null;
  }

  private generarCumplimientosSilenciosamente(): void {
    const clienteId = this.clienteObligacionesSeleccionado?.id;
    if (!clienteId) return;
    this.http
      .post<
        RespuestaApi<RespuestaCumplimientoObligacion[]>
      >(`${this.urlBaseApi}/api/clientes/${clienteId}/vencimientos/generar?anio=${this.anioSeleccionado}`, {}, { headers: this.cabecerasAutenticacion() })
      .subscribe({
        next: (respuesta) => {
          this.cumplimientosCliente = respuesta.datos;
          this.cargarPanel();
          this.detectorCambios.markForCheck();
        },
        error: (error) =>
          (this.error = this.obtenerErrorApi(
            error,
            'La obligación se confirmó, pero no se pudieron preparar sus vencimientos',
          )),
      });
  }

  private perfilFiscalAFormulario(
    perfil: RespuestaPerfilFiscalCliente,
  ): PeticionPerfilFiscalCliente {
    return {
      territorioFiscal: perfil.territorioFiscal,
      regimenIrpf: perfil.regimenIrpf,
      regimenIva: perfil.regimenIva,
      tributaSociedades: perfil.tributaSociedades,
      pagosFraccionadosSociedades: perfil.pagosFraccionadosSociedades,
      tieneTrabajadores: perfil.tieneTrabajadores,
      pagaProfesionalesRetencion: perfil.pagaProfesionalesRetencion,
      alquilerSujetoRetencion: perfil.alquilerSujetoRetencion,
      rendimientosCapital: perfil.rendimientosCapital,
      operacionesIntracomunitarias: perfil.operacionesIntracomunitarias,
      operacionesTerceros: perfil.operacionesTerceros,
      recibeDonativosDeducibles: perfil.recibeDonativosDeducibles,
      entidadAtribucionRentas: perfil.entidadAtribucionRentas,
      exoneradoModelo390: perfil.exoneradoModelo390,
      marcarRevisado: perfil.estadoRevision === 'REVISADO',
    };
  }

  private crearPerfilFiscalVacio(): PeticionPerfilFiscalCliente {
    return {
      territorioFiscal: 'COMUN',
      regimenIrpf: 'PENDIENTE',
      regimenIva: 'PENDIENTE',
      tributaSociedades: 'PENDIENTE',
      pagosFraccionadosSociedades: 'PENDIENTE',
      tieneTrabajadores: 'PENDIENTE',
      pagaProfesionalesRetencion: 'PENDIENTE',
      alquilerSujetoRetencion: 'PENDIENTE',
      rendimientosCapital: 'PENDIENTE',
      operacionesIntracomunitarias: 'PENDIENTE',
      operacionesTerceros: 'PENDIENTE',
      recibeDonativosDeducibles: 'PENDIENTE',
      entidadAtribucionRentas: 'PENDIENTE',
      exoneradoModelo390: 'PENDIENTE',
      marcarRevisado: false,
    };
  }

  private limpiarMensajes(): void {
    this.aviso = '';
    this.error = '';
  }

  private aplicarMarca(color: string | null): void {
    globalThis.document.documentElement.style.setProperty('--brand-primary', color ?? '#226b3b');
  }

  private obtenerErrorApi(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const cuerpo = (error as { error?: RespuestaApi<unknown> }).error;
      return cuerpo?.mensaje ?? fallback;
    }
    return fallback;
  }
}
