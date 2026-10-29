import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideFilter, LucideSearch, LucideX } from '@lucide/angular';
import {
  EstadoDocumento,
  OrigenDocumento,
  PeriodoDocumento,
  RespuestaCliente,
  TipoDocumento,
  VisibilidadDocumento,
} from '../modelos-aplicacion';

@Component({
  selector: 'app-filtros-documentos',
  standalone: true,
  imports: [FormsModule, LucideFilter, LucideSearch, LucideX],
  template: `
    <form class="filtros" (ngSubmit)="aplicar.emit()">
      <div class="barra-principal">
        <label class="busqueda">
          <span class="sr-only">Buscar documentos</span>
          <svg lucideSearch size="18"></svg>
          <input
            name="documentSearch"
            [ngModel]="texto"
            (ngModelChange)="textoChange.emit($event)"
            [placeholder]="esCliente ? 'Buscar por archivo' : 'Buscar por cliente o archivo'"
          />
        </label>
        <button type="button" class="filtro-boton" [class.activo]="panelAbierto" (click)="panelAbierto = !panelAbierto">
          <svg lucideFilter size="17"></svg>
          Filtros
          @if (cantidadActivos > 0) { <span>{{ cantidadActivos }}</span> }
        </button>
        <button type="submit" class="buscar-boton">Buscar</button>
      </div>

      @if (panelAbierto) {
        <section class="panel-filtros" aria-label="Filtros avanzados">
          @if (!esCliente) {
            <label>Cliente
              <select name="documentClient" [ngModel]="clienteId" (ngModelChange)="clienteIdChange.emit($event)">
                <option [ngValue]="null">Todos los clientes</option>
                @for (cliente of clientes; track cliente.id) { <option [ngValue]="cliente.id">{{ cliente.nombre }}</option> }
              </select>
            </label>
          }
          <label>Ejercicio
            <select name="documentYear" [ngModel]="anio" (ngModelChange)="anioChange.emit($event)">
              <option [ngValue]="null">Todos los años</option>
              @for (opcion of anios; track opcion) { <option [ngValue]="opcion">{{ opcion }}</option> }
            </select>
          </label>
          <label>Estado
            <select name="documentStatus" [ngModel]="estado" (ngModelChange)="estadoChange.emit($event)">
              <option value="">Cualquier estado</option>
              <option value="RECIBIDO">Pendiente de revisión</option>
              <option value="REVISADO">Revisado</option>
              <option value="RECHAZADO">Necesita corrección</option>
              <option value="BORRADOR">Borrador interno</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="RETIRADO">Retirado</option>
              <option value="SUSTITUIDO">Sustituido</option>
            </select>
          </label>
          <label>Origen
            <select name="documentOrigin" [ngModel]="origen" (ngModelChange)="origenChange.emit($event)">
              <option value="">Todo el expediente</option>
              <option value="APORTADO_CLIENTE">Aportado por el cliente</option>
              <option value="GENERADO_GESTORIA">Entregado por la gestoría</option>
            </select>
          </label>
          <label>Periodo
            <select name="documentPeriod" [ngModel]="periodo" (ngModelChange)="periodoChange.emit($event)">
              <option value="">Cualquier periodo</option>
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="ANUAL">Anual</option>
              <option value="PUNTUAL">Puntual</option>
            </select>
          </label>
          <label>Categoría
            <select name="documentType" [ngModel]="tipo" (ngModelChange)="tipoChange.emit($event)">
              <option value="">Cualquier categoría</option>
              @for (opcion of opcionesTipo; track opcion.valor) { <option [value]="opcion.valor">{{ opcion.etiqueta }}</option> }
            </select>
          </label>
          @if (!esCliente) {
            <label>Visibilidad
              <select name="documentVisibility" [ngModel]="visibilidad" (ngModelChange)="visibilidadChange.emit($event)">
                <option value="">Internos y compartidos</option>
                <option value="INTERNO_GESTORIA">Borradores internos</option>
                <option value="COMPARTIDO_CLIENTE">Visibles para el cliente</option>
              </select>
            </label>
          }
          <button type="button" class="limpiar" [disabled]="cantidadActivos === 0" (click)="limpiar.emit()">
            <svg lucideX size="16"></svg> Limpiar filtros
          </button>
        </section>
      }
    </form>
  `,
  styles: [
    `
      .filtros { display: grid; gap: 12px; width: 100%; }
      .barra-principal { display: grid; grid-template-columns: minmax(220px, 1fr) auto auto; gap: 10px; }
      .busqueda { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 13px; border: 1px solid #cbd6d0; border-radius: 10px; background: #fff; color: #627068; }
      .busqueda:focus-within { border-color: var(--brand-primary); box-shadow: 0 0 0 3px rgb(34 107 59 / 12%); }
      .busqueda input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; }
      button { min-height: 44px; padding: 0 15px; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
      .filtro-boton { display: flex; align-items: center; gap: 8px; border: 1px solid #cbd6d0; background: #fff; color: #26342c; }
      .filtro-boton.activo { border-color: var(--brand-primary); color: var(--brand-primary); }
      .filtro-boton span { display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: #e1efe6; font-size: 12px; }
      .buscar-boton { border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; }
      .panel-filtros { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; padding: 14px; border: 1px solid #dbe4df; border-radius: 12px; background: #f8faf9; }
      .panel-filtros label { display: grid; gap: 6px; color: #44524a; font-size: 13px; font-weight: 700; }
      select { width: 100%; min-height: 42px; padding: 0 10px; border: 1px solid #cbd6d0; border-radius: 9px; background: #fff; font: inherit; }
      .limpiar { align-self: end; display: flex; align-items: center; justify-content: center; gap: 7px; border: 0; background: transparent; color: #536159; }
      .limpiar:disabled { opacity: .45; cursor: not-allowed; }
      .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
      @media (max-width: 680px) {
        .barra-principal { grid-template-columns: 1fr 1fr; }
        .busqueda { grid-column: 1 / -1; }
      }
    `,
  ],
})
export class FiltrosDocumentosComponent {
  @Input() esCliente = false;
  @Input() texto = '';
  @Input() clienteId: number | null = null;
  @Input() anio: number | null = null;
  @Input() anios: number[] = [];
  @Input() estado: EstadoDocumento | '' = '';
  @Input() origen: OrigenDocumento | '' = '';
  @Input() periodo: PeriodoDocumento | '' = '';
  @Input() tipo: TipoDocumento | '' = '';
  @Input() visibilidad: VisibilidadDocumento | '' = '';
  @Input() clientes: RespuestaCliente[] = [];
  @Input() opcionesTipo: Array<{ valor: TipoDocumento; etiqueta: string }> = [];
  @Output() textoChange = new EventEmitter<string>();
  @Output() clienteIdChange = new EventEmitter<number | null>();
  @Output() anioChange = new EventEmitter<number | null>();
  @Output() estadoChange = new EventEmitter<EstadoDocumento | ''>();
  @Output() origenChange = new EventEmitter<OrigenDocumento | ''>();
  @Output() periodoChange = new EventEmitter<PeriodoDocumento | ''>();
  @Output() tipoChange = new EventEmitter<TipoDocumento | ''>();
  @Output() visibilidadChange = new EventEmitter<VisibilidadDocumento | ''>();
  @Output() aplicar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();
  panelAbierto = false;

  get cantidadActivos(): number {
    return [this.clienteId, this.anio, this.estado, this.origen, this.periodo, this.tipo, this.visibilidad].filter(Boolean).length;
  }
}
