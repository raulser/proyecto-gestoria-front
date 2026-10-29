import { Component, Input } from '@angular/core';
import { LucideFileUp } from '@lucide/angular';

@Component({
  selector: 'app-progreso-subida',
  standalone: true,
  imports: [LucideFileUp],
  template: `
    @if (activo) {
      <section class="progreso" role="status" aria-live="polite">
        <div class="cabecera">
          <span class="icono"><svg lucideFileUp size="20"></svg></span>
          <div>
            <strong>Subiendo documentos</strong>
            <span>{{ archivoActual }}</span>
          </div>
          <strong>{{ progreso }}%</strong>
        </div>
        <div
          class="pista"
          role="progressbar"
          aria-label="Progreso de subida"
          [attr.aria-valuenow]="progreso"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="barra" [style.width.%]="progreso"></div>
        </div>
        <small>Archivo {{ indiceActual }} de {{ totalArchivos }}. No cierres esta pantalla.</small>
      </section>
    }
  `,
  styles: [
    `
      .progreso {
        position: sticky;
        bottom: 14px;
        z-index: 20;
        display: grid;
        gap: 10px;
        margin-top: 14px;
        padding: 14px;
        border: 1px solid #b7d5c2;
        border-radius: 12px;
        background: #f4fbf6;
        box-shadow: 0 10px 28px rgb(22 66 40 / 14%);
      }
      .cabecera { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; }
      .cabecera div { min-width: 0; }
      .cabecera span { display: block; overflow: hidden; color: #526259; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
      .icono { display: grid !important; place-items: center; width: 38px; height: 38px; border-radius: 10px; background: #dff1e5; color: #226b3b !important; }
      .pista { height: 9px; overflow: hidden; border-radius: 999px; background: #dbe7df; }
      .barra { height: 100%; border-radius: inherit; background: var(--brand-primary); transition: width 180ms ease; }
      small { color: #5d6b63; }
    `,
  ],
})
export class ProgresoSubidaComponent {
  @Input() activo = false;
  @Input() progreso = 0;
  @Input() archivoActual = '';
  @Input() indiceActual = 0;
  @Input() totalArchivos = 0;
}
