import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-visor-documento',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fondo" role="presentation" (click)="cerrar.emit()">
        <section
          class="dialogo"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visor-titulo"
          (click)="$event.stopPropagation()"
        >
          <header>
            <div>
              <small>Vista previa segura</small>
              <h2 id="visor-titulo">{{ nombre }}</h2>
            </div>
            <button type="button" aria-label="Cerrar vista previa" (click)="cerrar.emit()">
              Cerrar
            </button>
          </header>
          @if (cargando) {
            <p class="mensaje" role="status">Preparando el documento…</p>
          } @else if (error) {
            <p class="mensaje error" role="alert">{{ error }}</p>
          } @else if (esImagen && url) {
            <img [src]="url" [alt]="'Vista previa de ' + nombre" />
          } @else if (esPdf && urlSeguro) {
            <iframe [src]="urlSeguro" [title]="'Vista previa de ' + nombre"></iframe>
          } @else {
            <p class="mensaje">
              Este formato no admite vista previa. Puedes descargarlo para abrirlo con su aplicación
              habitual.
            </p>
          }
        </section>
      </div>
    }
  `,
  styles: [
    `
      .fondo {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgb(10 20 15 / 72%);
      }
      .dialogo {
        width: min(1080px, 96vw);
        height: min(820px, 92vh);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 24px 80px rgb(0 0 0 / 35%);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        padding: 16px 20px;
        border-bottom: 1px solid #dce3df;
      }
      h2 {
        margin: 3px 0 0;
        font-size: 19px;
        overflow-wrap: anywhere;
      }
      small {
        color: #557064;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      button {
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid #cbd7d0;
        border-radius: 8px;
        background: #fff;
        font: inherit;
        cursor: pointer;
      }
      iframe,
      img {
        width: 100%;
        min-height: 0;
        flex: 1;
        border: 0;
        object-fit: contain;
        background: #eef2ef;
      }
      .mensaje {
        margin: auto;
        max-width: 560px;
        padding: 24px;
        text-align: center;
      }
      .error {
        color: #9b2c2c;
      }
      @media (max-width: 600px) {
        .fondo {
          padding: 0;
        }
        .dialogo {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
        }
      }
    `,
  ],
})
export class VisorDocumentoComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private urlInterna = '';

  @Input() visible = false;
  @Input() nombre = '';
  @Input() tipoContenido = '';
  @Input() cargando = false;
  @Input() error = '';
  @Output() cerrar = new EventEmitter<void>();

  @Input() set url(valor: string) {
    this.urlInterna = valor;
  }

  get url(): string {
    return this.urlInterna;
  }
  get urlSeguro(): SafeResourceUrl | null {
    return this.urlInterna ? this.sanitizer.bypassSecurityTrustResourceUrl(this.urlInterna) : null;
  }
  get esImagen(): boolean {
    return this.tipoContenido.startsWith('image/');
  }
  get esPdf(): boolean {
    return this.tipoContenido === 'application/pdf';
  }
}
