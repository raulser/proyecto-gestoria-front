import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  LucideDownload,
  LucideEllipsis,
  LucideFileText,
  LucideFolderOpen,
  LucideX,
} from '@lucide/angular';
import {
  RespuestaCliente,
  RespuestaCumplimientoObligacion,
  RespuestaDocumento,
  RespuestaSolicitudDocumento,
  TipoDocumento,
} from '../modelos-aplicacion';
import { FiltrosDocumentosComponent } from './filtros-documentos.component';
import {
  ESTADOS_DOCUMENTO,
  FILTROS_DOCUMENTOS_VACIOS,
  FiltrosRepositorio,
} from './filtros-repositorio';

import type { AccionArchivo, AccionDocumento } from './filtros-repositorio';

@Component({
  selector: 'app-repositorio-documental',
  imports: [
    DatePipe,
    FiltrosDocumentosComponent,
    LucideDownload,
    LucideEllipsis,
    LucideFileText,
    LucideFolderOpen,
    LucideX,
  ],
  templateUrl: './repositorio-documental.component.html',
  styleUrl: './repositorio-documental.component.scss',
})
export class RepositorioDocumentalComponent {
  @Input() esCliente = false;
  @Input() clienteFijo = false;
  @Input() puedeRevisar = false;
  @Input() documentos: RespuestaDocumento[] = [];
  @Input() clientes: RespuestaCliente[] = [];
  @Input() solicitudes: RespuestaSolicitudDocumento[] = [];
  @Input() cumplimientos: RespuestaCumplimientoObligacion[] = [];
  @Input() filtros: FiltrosRepositorio = { ...FILTROS_DOCUMENTOS_VACIOS };
  @Input() opcionesTipo: Array<{ valor: TipoDocumento; etiqueta: string }> = [];
  @Input() anios: number[] = [];
  @Input() seleccionados = new Set<number>();
  @Input() total = 0;
  @Input() pagina = 0;
  @Input() paginas = 0;
  @Input() cargando = false;
  @Input() error = '';
  @Output() filtrar = new EventEmitter<Partial<FiltrosRepositorio>>();
  @Output() limpiar = new EventEmitter<void>();
  @Output() cambiarPagina = new EventEmitter<number>();
  @Output() seleccionar = new EventEmitter<{ id: number; seleccionado: boolean }>();
  @Output() seleccionarTodos = new EventEmitter<boolean>();
  @Output() accion = new EventEmitter<AccionArchivo>();
  @Output() masiva = new EventEmitter<'REVISAR' | 'PUBLICAR'>();
  @Output() limpiarSeleccion = new EventEmitter<void>();
  @Output() subir = new EventEmitter<void>();
  @Output() ayuda = new EventEmitter<void>();
  @Output() abrirSolicitud = new EventEmitter<RespuestaSolicitudDocumento>();
  readonly estados = ESTADOS_DOCUMENTO;

  get clienteVisible(): boolean {
    return !this.esCliente && !this.filtros.clienteId;
  }
  get hayFiltros(): boolean {
    return Object.entries(this.filtros).some(
      ([clave, valor]) => !!valor && !(clave === 'clienteId' && this.clienteFijo),
    );
  }
  get peticion(): RespuestaSolicitudDocumento | undefined {
    return this.solicitudes.find((s) => s.id === this.filtros.solicitudId);
  }
  get todosSeleccionados(): boolean {
    return this.documentos.length > 0 && this.documentos.every((d) => this.seleccionados.has(d.id));
  }
  get seleccionParcial(): boolean {
    return !this.todosSeleccionados && this.documentos.some((d) => this.seleccionados.has(d.id));
  }
  get filtrosOcultos(): Array<{ texto: string; quitar: Partial<FiltrosRepositorio> }> {
    const chips: Array<{ texto: string; quitar: Partial<FiltrosRepositorio> }> = [];
    if (this.filtros.estado)
      chips.push({ texto: this.estados[this.filtros.estado], quitar: { estado: '' } });
    if (this.filtros.periodo)
      chips.push({
        texto: {
          MENSUAL: 'Mensual',
          TRIMESTRAL: 'Trimestral',
          ANUAL: 'Anual',
          PUNTUAL: 'Sin periodo',
        }[this.filtros.periodo],
        quitar: { periodo: '' },
      });
    if (this.filtros.visibilidad)
      chips.push({
        texto:
          this.filtros.visibilidad === 'INTERNO_GESTORIA'
            ? 'Solo gestoría'
            : 'Visible para el cliente',
        quitar: { visibilidad: '' },
      });
    return chips;
  }
  tipo(documento: RespuestaDocumento): string {
    return (
      this.opcionesTipo.find((t) => t.valor === documento.tipo)?.etiqueta ??
      documento.tipo.replaceAll('_', ' ')
    );
  }
  periodo(documento: RespuestaDocumento): string {
    if (documento.periodo === 'PUNTUAL') return 'Sin periodo';
    if (documento.periodo === 'MENSUAL' && documento.mes)
      return (
        new Intl.DateTimeFormat('es', { month: 'short' }).format(
          new Date(2000, documento.mes - 1),
        ) +
        ' ' +
        documento.anio
      );
    if (documento.trimestre) return 'T' + documento.trimestre + ' · ' + documento.anio;
    return String(documento.anio);
  }
  solicitud(documento: RespuestaDocumento): RespuestaSolicitudDocumento | undefined {
    return this.solicitudes.find((s) => s.id === documento.solicitudId);
  }
  obligacion(documento: RespuestaDocumento): RespuestaCumplimientoObligacion | undefined {
    return this.cumplimientos.find((c) => c.justificanteDocumentoId === documento.id);
  }
  vistaPrevia(documento: RespuestaDocumento): boolean {
    return /^(application\/pdf|image\/)/i.test(documento.tipoContenido ?? '');
  }
  puedeRetirar(documento: RespuestaDocumento): boolean {
    return (
      ['RECIBIDO', 'RECHAZADO'].includes(documento.estado) ||
      (this.puedeRevisar &&
        documento.origen === 'GENERADO_GESTORIA' &&
        ['BORRADOR', 'PUBLICADO'].includes(documento.estado))
    );
  }
  ejecutar(
    accion: AccionDocumento,
    documento: RespuestaDocumento,
    menu?: HTMLDetailsElement,
  ): void {
    if (menu) menu.open = false;
    this.accion.emit({ accion, documento });
  }
}
