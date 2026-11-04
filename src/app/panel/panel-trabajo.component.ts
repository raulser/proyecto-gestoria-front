import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RespuestaCliente,
  RespuestaCumplimientoObligacion,
  RespuestaPanel,
  RespuestaPlan,
  RespuestaSolicitudDocumento,
  TipoDocumento,
  Vista,
} from '../modelos-aplicacion';

export interface TareaPanel {
  clave: string;
  titulo: string;
  cliente: string;
  fecha: string;
  clase: string;
  fiscal?: RespuestaCumplimientoObligacion;
  solicitud?: RespuestaSolicitudDocumento;
  plan?: RespuestaCliente;
}
@Component({
  selector: 'app-panel-trabajo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-trabajo.component.html',
  styleUrl: './panel-trabajo.component.scss',
})
export class PanelTrabajoComponent {
  readonly Math = Math;
  @Input() panel: RespuestaPanel | null = null;
  @Input() plan: RespuestaPlan | null = null;
  @Input() clientes: RespuestaCliente[] = [];
  @Input() agenda: RespuestaCumplimientoObligacion[] = [];
  @Input() solicitudes: RespuestaSolicitudDocumento[] = [];
  @Input() anio = new Date().getFullYear();
  @Input() esCliente = false;
  @Input() esAdmin = false;
  @Output() navegar = new EventEmitter<Vista>();
  @Output() documentos = new EventEmitter<RespuestaCliente>();
  @Output() vencimiento = new EventEmitter<RespuestaCumplimientoObligacion>();
  @Output() solicitud = new EventEmitter<RespuestaSolicitudDocumento>();
  @Output() configurar = new EventEmitter<RespuestaCliente>();
  @Output() facturas = new EventEmitter<TipoDocumento>();
  @Output() anioChange = new EventEmitter<number>();
  get anios(): number[] {
    const actual = new Date().getFullYear();
    return [...new Set([actual - 1, actual, actual + 1, this.anio])].sort((a, b) => b - a);
  }
  get ultimasSolicitudes() {
    return [...this.solicitudes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 3);
  }
  estadoEntrega(entrega: RespuestaSolicitudDocumento): string {
    return {
      ABIERTA: 'Por completar',
      PARCIAL: 'En preparación',
      ENVIADA: 'En revisión',
      COMPLETADA: 'Revisada',
      CANCELADA: 'Cancelada',
    }[entrega.estado];
  }
  get consumo() {
    return this.panel?.consumo ?? [];
  }
  get clientesActivos() {
    return this.clientes.filter((c) => c.activo).length;
  }
  get solicitudesAbiertas() {
    return this.solicitudes.filter((s) => s.estado === 'ABIERTA' || s.estado === 'PARCIAL').length;
  }
  mesFecha(fecha: string) {
    return new Date(fecha + 'T00:00:00')
      .toLocaleDateString('es-ES', { month: 'short' })
      .replace('.', '');
  }
  get emitidas() {
    return this.consumo.reduce((n, c) => n + c.facturasEmitidas, 0);
  }
  get recibidas() {
    return this.consumo.reduce((n, c) => n + c.facturasRecibidas, 0);
  }
  get documentosAnio() {
    return this.consumo.reduce((n, c) => n + c.documentos, 0);
  }
  get bytes() {
    return this.esAdmin && this.plan
      ? this.plan.bytesAlmacenados
      : this.consumo.reduce((n, c) => n + c.bytesAlmacenados, 0);
  }
  get porcentaje() {
    return this.plan?.maxBytesAlmacenamiento
      ? Math.min(100, (this.bytes * 100) / this.plan.maxBytesAlmacenamiento)
      : 0;
  }
  get clientesConsumo() {
    return this.clientes
      .map((c) => ({ ...c, consumo: this.consumo.find((d) => d.clienteId === c.id) }))
      .sort((a, b) => (b.consumo?.bytesAlmacenados ?? 0) - (a.consumo?.bytesAlmacenados ?? 0));
  }
  get tareas(): TareaPanel[] {
    const fiscales = this.agenda
      .filter((t) => t.estado !== 'PRESENTADA' && t.estado !== 'NO_APLICA')
      .map((t) => ({
        clave: 'f-' + t.id,
        titulo: t.codigoObligacion + ' · ' + t.nombreObligacion,
        cliente: t.nombreCliente,
        fecha: t.fechaLimite,
        clase: 'Obligación',
        fiscal: t,
      }));
    const peticiones = this.solicitudes
      .filter((t) => t.estado === 'ABIERTA' || t.estado === 'PARCIAL' || t.estado === 'ENVIADA')
      .map((t) => ({
        clave: 's-' + t.id,
        titulo: t.titulo,
        cliente: t.nombreCliente,
        fecha: t.fechaVencimiento,
        clase: t.estado === 'ENVIADA' ? 'Por revisar' : 'Entrega',
        solicitud: t,
      }));
    const planes: TareaPanel[] = this.esCliente
      ? []
      : this.clientes
          .filter((c) => c.activo)
          .flatMap((c) =>
            (c.planDocumental?.documentos ?? [])
              .filter(
                (d) =>
                  d.activa &&
                  d.periodicidad !== 'PERMANENTE' &&
                  d.fechaLimite &&
                  Number(d.fechaLimite.slice(0, 4)) === this.anio &&
                  !this.solicitudes.some(
                    (s) =>
                      s.clienteId === c.id &&
                      s.fechaVencimiento === d.fechaLimite &&
                      s.tiposDocumentoEsperados.includes(d.tipo),
                  ),
              )
              .map((d) => ({
                clave: 'p-' + c.id + '-' + d.id,
                titulo: d.nombre,
                cliente: c.nombre,
                fecha: d.fechaLimite!,
                clase: 'Plan documental',
                plan: c,
              })),
          );
    return [...fiscales, ...peticiones, ...planes]
      .filter((t) => Number(t.fecha.slice(0, 4)) === this.anio)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  abrir(t: TareaPanel): void {
    if (t.fiscal) this.vencimiento.emit(t.fiscal);
    else if (t.solicitud) this.solicitud.emit(t.solicitud);
    else if (t.plan) this.configurar.emit(t.plan);
  }
  iniciales(nombre: string) {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
  bytesTexto(bytes: number) {
    if (!bytes) return '0 B';
    const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(4, Math.floor(Math.log(bytes) / Math.log(1024)));
    return (
      (bytes / 1024 ** i).toLocaleString('es-ES', { maximumFractionDigits: i ? 1 : 0 }) +
      ' ' +
      unidades[i]
    );
  }
  dias(fecha: string): number {
    const hoy = new Date();
    return Math.round(
      (new Date(fecha + 'T00:00:00').getTime() -
        new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) /
        86400000,
    );
  }
  plazo(fecha: string): string {
    const dias = this.dias(fecha);
    return dias < 0
      ? 'Vencida'
      : dias === 0
        ? 'Hoy'
        : dias === 1
          ? 'Mañana'
          : 'En ' + dias + ' días';
  }
  trimestre(numero: number): number {
    return (this.panel?.clientes ?? []).reduce(
      (n, c) => n + (c.trimestres[numero]?.cantidadDocumentos ?? 0),
      0,
    );
  }
  altura(numero: number): number {
    const max = Math.max(1, ...[1, 2, 3, 4].map((t) => this.trimestre(t)));
    return (this.trimestre(numero) * 100) / max;
  }
  cambiarAnio(event: Event) {
    this.anioChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
