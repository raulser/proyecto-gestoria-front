import { Component, inject } from '@angular/core';
import { LucideCircleCheck, LucideCircleX, LucideInfo, LucideX } from '@lucide/angular';
import { ServicioFeedback } from './servicio-feedback';

@Component({
  selector: 'app-centro-feedback',
  standalone: true,
  imports: [LucideCircleCheck, LucideCircleX, LucideInfo, LucideX],
  template: `
    <section class="centro-feedback" aria-label="Mensajes de la aplicación" aria-live="polite">
      @for (mensaje of feedback.mensajes(); track mensaje.id) {
        <article
          class="mensaje"
          [class]="'mensaje ' + mensaje.tipo"
          [attr.role]="mensaje.tipo === 'error' ? 'alert' : 'status'"
        >
          <span class="icono" aria-hidden="true">
            @switch (mensaje.tipo) {
              @case ('exito') { <svg lucideCircleCheck size="20"></svg> }
              @case ('error') { <svg lucideCircleX size="20"></svg> }
              @default { <svg lucideInfo size="20"></svg> }
            }
          </span>
          <div>
            <strong>{{ mensaje.titulo }}</strong>
            @if (mensaje.detalle) { <p>{{ mensaje.detalle }}</p> }
          </div>
          <button type="button" (click)="feedback.cerrar(mensaje.id)" aria-label="Cerrar mensaje">
            <svg lucideX size="18"></svg>
          </button>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .centro-feedback {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 3000;
        display: grid;
        width: min(420px, calc(100vw - 32px));
        gap: 10px;
        pointer-events: none;
      }
      .mensaje {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        padding: 14px;
        border: 1px solid #d7e1dc;
        border-left: 4px solid #47765b;
        border-radius: 12px;
        background: #fff;
        color: #17211d;
        box-shadow: 0 16px 40px rgb(22 40 31 / 18%);
        pointer-events: auto;
      }
      .mensaje.error { border-left-color: #b42318; }
      .mensaje.exito { border-left-color: #23864b; }
      .mensaje.info { border-left-color: #356aa0; }
      .mensaje.error .icono { color: #b42318; }
      .mensaje.exito .icono { color: #23864b; }
      .mensaje.info .icono { color: #356aa0; }
      strong { display: block; line-height: 1.3; }
      p { margin: 4px 0 0; color: #5b6962; font-size: 13px; line-height: 1.4; }
      button {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #596760;
        cursor: pointer;
      }
      button:hover { background: #edf2ef; }
      @media (max-width: 680px) {
        .centro-feedback { top: 10px; right: 10px; width: calc(100vw - 20px); }
      }
    `,
  ],
})
export class CentroFeedbackComponent {
  readonly feedback = inject(ServicioFeedback);
}
