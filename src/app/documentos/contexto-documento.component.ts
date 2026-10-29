import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  LucideClipboardList,
  LucideFileOutput,
  LucideLandmark,
  LucideUnlink,
} from '@lucide/angular';
import {
  RespuestaCumplimientoObligacion,
  RespuestaDocumento,
  RespuestaSolicitudDocumento,
} from '../modelos-aplicacion';

@Component({
  selector: 'app-contexto-documento',
  standalone: true,
  imports: [DatePipe, LucideClipboardList, LucideFileOutput, LucideLandmark, LucideUnlink],
  template: `
    @if (cumplimiento) {
      <div class="contexto obligacion">
        <span class="icono"><svg lucideLandmark size="17"></svg></span>
        <div>
          <span>Obligación fiscal</span>
          <strong>{{ cumplimiento.codigoObligacion }} · {{ cumplimiento.nombreObligacion }}</strong>
          <small>{{ cumplimiento.periodoClave }} · límite {{ cumplimiento.fechaLimite | date: 'dd/MM/yyyy' }}</small>
        </div>
      </div>
    } @else if (solicitud) {
      <div class="contexto solicitud">
        <span class="icono"><svg lucideClipboardList size="17"></svg></span>
        <div>
          <span>Petición documental</span>
          <strong>{{ solicitud.titulo }}</strong>
          <small>Vence {{ solicitud.fechaVencimiento | date: 'dd/MM/yyyy' }}</small>
        </div>
      </div>
    } @else if (documento.origen === 'GENERADO_GESTORIA') {
      <div class="contexto salida">
        <span class="icono"><svg lucideFileOutput size="17"></svg></span>
        <div>
          <span>Documento de la gestoría</span>
          <strong>{{ documento.visibilidad === 'COMPARTIDO_CLIENTE' ? 'Entregado al cliente' : 'Borrador interno' }}</strong>
          <small>Sin obligación vinculada</small>
        </div>
      </div>
    } @else {
      <div class="contexto sin-asociar">
        <span class="icono"><svg lucideUnlink size="17"></svg></span>
        <div>
          <span>Sin asociar</span>
          <strong>Subida libre del cliente</strong>
          <small>Conviene vincularla a una petición</small>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .contexto { display:grid; grid-template-columns:auto minmax(0,1fr); gap:9px; align-items:start; min-width:210px; }
      .icono { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:#e7f0ea; color:#226b3b; }
      .contexto > div { min-width:0; }
      .contexto div > span { display:block; margin:0 0 2px; color:#627068; font-size:11px; font-weight:800; letter-spacing:.035em; text-transform:uppercase; }
      strong, small { display:block; overflow:hidden; text-overflow:ellipsis; }
      strong { color:#26342c; font-size:13px; line-height:1.35; }
      small { margin-top:2px; color:#66736c; font-size:11px; white-space:nowrap; }
      .solicitud .icono { background:#e7eff8; color:#2d6092; }
      .obligacion .icono { background:#f2ead8; color:#805c12; }
      .salida .icono { background:#e8edf7; color:#435f91; }
      .sin-asociar .icono { background:#fff0dc; color:#935b0e; }
      .sin-asociar strong { color:#7b4d0d; }
    `,
  ],
})
export class ContextoDocumentoComponent {
  @Input({ required: true }) documento!: RespuestaDocumento;
  @Input() solicitud: RespuestaSolicitudDocumento | null = null;
  @Input() cumplimiento: RespuestaCumplimientoObligacion | null = null;
}
