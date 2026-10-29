import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideClipboardCheck, LucideX } from '@lucide/angular';
import { RespuestaDocumento, RespuestaSolicitudDocumento } from '../modelos-aplicacion';

@Component({
  selector: 'app-asociar-documento',
  standalone: true,
  imports: [FormsModule, LucideClipboardCheck, LucideX],
  template: `
    @if (documento) {
      <button type="button" class="fondo" aria-label="Cancelar asociación" (click)="cancelar.emit()"></button>
      <section class="dialogo" role="dialog" aria-modal="true" aria-labelledby="titulo-asociacion">
        <header>
          <span class="icono"><svg lucideClipboardCheck size="22"></svg></span>
          <div>
            <span>Clasificar documento</span>
            <h2 id="titulo-asociacion">Asociar a una petición</h2>
          </div>
          <button type="button" class="cerrar" aria-label="Cancelar asociación" (click)="cancelar.emit()">
            <svg lucideX size="19"></svg>
          </button>
        </header>
        <div class="archivo">
          <strong>{{ documento.nombreArchivoOriginal }}</strong>
          <span>{{ documento.nombreCliente }}</span>
        </div>
        @if (solicitudes.length > 0) {
          <p>Solo aparecen peticiones abiertas compatibles con el cliente, periodo y tipo documental.</p>
          <label>Petición documental
            <select [(ngModel)]="solicitudId">
              @for (solicitud of solicitudes; track solicitud.id) {
                <option [ngValue]="solicitud.id">
                  {{ solicitud.titulo }} · vence {{ solicitud.fechaVencimiento }}
                </option>
              }
            </select>
          </label>
          <footer>
            <button type="button" class="secundario" (click)="cancelar.emit()">Cancelar</button>
            <button type="button" class="principal" [disabled]="!solicitudId" (click)="confirmar()">
              Asociar documento
            </button>
          </footer>
        } @else {
          <div class="vacio">
            <strong>No hay peticiones compatibles</strong>
            <span>Crea o reabre una petición para este cliente, tipo y periodo antes de asociar el archivo.</span>
          </div>
          <footer><button type="button" class="principal" (click)="cancelar.emit()">Entendido</button></footer>
        }
      </section>
    }
  `,
  styles: [
    `
      .fondo { position:fixed; inset:0; z-index:2200; border:0; background:rgb(11 24 17 / 52%); backdrop-filter:blur(2px); }
      .dialogo { position:fixed; top:50%; left:50%; z-index:2250; display:grid; gap:17px; width:min(520px,calc(100vw - 28px)); max-height:calc(100dvh - 32px); overflow:auto; padding:22px; border-radius:16px; background:#fff; box-shadow:0 24px 80px rgb(0 0 0 / 26%); transform:translate(-50%,-50%); }
      header { display:grid; grid-template-columns:auto 1fr auto; gap:11px; align-items:start; }
      header > div > span { color:#226b3b; font-size:11px; font-weight:800; letter-spacing:.055em; text-transform:uppercase; }
      h2 { margin:3px 0 0; font-size:21px; }
      .icono { display:grid; place-items:center; width:42px; height:42px; border-radius:11px; background:#e3f0e7; color:#226b3b; }
      .cerrar { display:grid; place-items:center; width:35px; height:35px; padding:0; border:0; border-radius:9px; background:#eef3f0; cursor:pointer; }
      .archivo { padding:12px; border:1px solid #dfe7e2; border-radius:10px; background:#f8faf9; }
      .archivo strong, .archivo span { display:block; overflow:hidden; text-overflow:ellipsis; }
      .archivo span, p { margin:4px 0 0; color:#637169; font-size:13px; line-height:1.45; }
      label { display:grid; gap:7px; color:#344239; font-size:13px; font-weight:750; }
      select { width:100%; min-height:44px; padding:0 11px; border:1px solid #cbd6d0; border-radius:9px; background:#fff; font:inherit; }
      .vacio { display:grid; gap:5px; padding:15px; border:1px solid #ead4ad; border-radius:10px; background:#fff9ed; }
      .vacio span { color:#75531a; font-size:13px; line-height:1.45; }
      footer { display:flex; justify-content:flex-end; gap:9px; }
      footer button { min-height:42px; padding:0 14px; border-radius:9px; font:inherit; font-weight:750; cursor:pointer; }
      .principal { border:1px solid var(--brand-primary); background:var(--brand-primary); color:#fff; }
      .secundario { border:1px solid #cbd6d0; background:#fff; color:#26342c; }
      button:disabled { opacity:.5; cursor:not-allowed; }
    `,
  ],
})
export class AsociarDocumentoComponent implements OnChanges {
  @Input() documento: RespuestaDocumento | null = null;
  @Input() solicitudes: RespuestaSolicitudDocumento[] = [];
  @Output() asociar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();
  solicitudId: number | null = null;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['documento'] || cambios['solicitudes']) {
      this.solicitudId = this.solicitudes[0]?.id ?? null;
    }
  }

  confirmar(): void {
    if (this.solicitudId) this.asociar.emit(this.solicitudId);
  }
}
