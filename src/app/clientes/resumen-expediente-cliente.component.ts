import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideDownload, LucideFileText, LucideMail, LucidePhone, LucideUserRound } from '@lucide/angular';
import { RespuestaCliente } from '../modelos-aplicacion';

@Component({
  selector: 'app-resumen-expediente-cliente',
  standalone: true,
  imports: [LucideDownload, LucideFileText, LucideMail, LucidePhone, LucideUserRound],
  template: `
    @if (cliente) {
      <section class="expediente">
        <header>
          <div class="identidad">
            <span class="avatar"><svg lucideUserRound size="24"></svg></span>
            <div>
              <span>Tu expediente</span>
              <h2>{{ cliente.nombre }}</h2>
              <p>{{ cliente.nif }} · {{ etiquetaTipo }}</p>
            </div>
          </div>
          <button type="button" (click)="exportar.emit(cliente)">
            <svg lucideDownload size="17"></svg> Descargar mis datos
          </button>
        </header>
        <div class="datos">
          <div><svg lucideMail size="18"></svg><span>Email</span><strong>{{ cliente.email }}</strong></div>
          <div><svg lucidePhone size="18"></svg><span>Teléfono</span><strong>{{ cliente.telefono || 'No informado' }}</strong></div>
          <div><svg lucideFileText size="18"></svg><span>Estado</span><strong>{{ cliente.activo ? 'Expediente activo' : 'Expediente inactivo' }}</strong></div>
        </div>
      </section>
    } @else {
      <section class="expediente vacio" role="status">Estamos preparando los datos de tu expediente…</section>
    }
  `,
  styles: [
    `
      .expediente { margin-bottom: 18px; padding: 20px; border: 1px solid #d8e2dc; border-radius: 14px; background: linear-gradient(135deg,#fff 0%,#f4f9f6 100%); }
      header { display: flex; justify-content: space-between; align-items: center; gap: 18px; }
      .identidad { display: flex; align-items: center; gap: 14px; }
      .avatar { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 14px; background: #deefe4; color: var(--brand-primary); }
      .identidad span:not(.avatar) { color: #577066; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
      h2 { margin: 3px 0 0; font-size: 23px; }
      p { margin: 3px 0 0; color: #617068; }
      button { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 14px; border: 1px solid #c7d4cc; border-radius: 9px; background: #fff; color: #26342c; font: inherit; font-weight: 700; cursor: pointer; }
      .datos { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin-top: 18px; }
      .datos div { display: grid; grid-template-columns: auto 1fr; gap: 3px 9px; padding: 13px; border: 1px solid #e0e7e3; border-radius: 10px; background: #fff; }
      .datos svg { grid-row: 1 / 3; align-self: center; color: #4e705b; }
      .datos span { color: #67746d; font-size: 12px; }
      .datos strong { overflow: hidden; text-overflow: ellipsis; }
      .vacio { color: #66736c; }
      @media (max-width: 760px) { header { align-items: stretch; flex-direction: column; } .datos { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ResumenExpedienteClienteComponent {
  @Input() cliente: RespuestaCliente | null = null;
  @Input() etiquetaTipo = '';
  @Output() exportar = new EventEmitter<RespuestaCliente>();
}
