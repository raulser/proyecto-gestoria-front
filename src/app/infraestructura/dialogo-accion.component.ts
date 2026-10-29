import { Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';
import { ServicioDialogos } from './servicio-dialogos';

@Component({
  selector: 'app-dialogo-accion',
  standalone: true,
  imports: [FormsModule, LucideAlertTriangle, LucideX],
  template: `
    @if (dialogos.peticion(); as peticion) {
      <div class="fondo" (mousedown)="cerrarDesdeFondo($event)">
        <section
          class="dialogo"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'dialogo-titulo-' + peticion.id"
        >
          <header>
            <span class="icono" [class.peligro]="peticion.peligro" aria-hidden="true">
              <svg lucideAlertTriangle size="21"></svg>
            </span>
            <div>
              <h2 [id]="'dialogo-titulo-' + peticion.id">{{ peticion.titulo }}</h2>
              <p>{{ peticion.descripcion }}</p>
            </div>
            <button type="button" class="cerrar" (click)="cancelar()" aria-label="Cerrar diálogo">
              <svg lucideX size="19"></svg>
            </button>
          </header>

          @if (peticion.tipo === 'texto') {
            <label>
              {{ peticion.etiquetaCampo }}
              <textarea
                #campoTexto
                [(ngModel)]="valor"
                rows="4"
                maxlength="800"
                (keydown.control.enter)="confirmar()"
              ></textarea>
              <small>{{ valor.trim().length }}/800 caracteres</small>
            </label>
          }

          <footer>
            <button type="button" class="secundario" (click)="cancelar()">
              {{ peticion.etiquetaCancelar }}
            </button>
            <button
              #botonPrincipal
              type="button"
              class="principal"
              [class.peligro]="peticion.peligro"
              [disabled]="peticion.tipo === 'texto' && !valor.trim()"
              (click)="confirmar()"
            >
              {{ peticion.etiquetaConfirmar }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .fondo {
        position: fixed;
        inset: 0;
        z-index: 2500;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgb(10 22 16 / 58%);
        backdrop-filter: blur(3px);
      }
      .dialogo {
        width: min(520px, 100%);
        padding: 20px;
        border-radius: 16px;
        background: #fff;
        color: #17211d;
        box-shadow: 0 24px 70px rgb(0 0 0 / 28%);
      }
      header { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; }
      .icono {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #e8f3ec;
        color: #226b3b;
      }
      .icono.peligro { background: #fce8e6; color: #b42318; }
      h2 { margin: 0; font-size: 20px; }
      p { margin: 6px 0 0; color: #596a61; line-height: 1.5; }
      .cerrar {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #66736c;
        cursor: pointer;
      }
      label { display: grid; gap: 7px; margin-top: 18px; font-weight: 700; }
      textarea {
        width: 100%;
        padding: 11px 12px;
        border: 1px solid #bdc9c2;
        border-radius: 10px;
        resize: vertical;
        font: inherit;
        line-height: 1.45;
      }
      textarea:focus { outline: 3px solid rgb(34 107 59 / 18%); border-color: #226b3b; }
      small { justify-self: end; color: #6b7770; font-weight: 400; }
      footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
      footer button { min-height: 42px; padding: 0 16px; border-radius: 9px; font: inherit; font-weight: 700; cursor: pointer; }
      .secundario { border: 1px solid #ccd6d0; background: #fff; color: #26342c; }
      .principal { border: 1px solid #226b3b; background: #226b3b; color: #fff; }
      .principal.peligro { border-color: #b42318; background: #b42318; }
      .principal:disabled { opacity: 0.5; cursor: not-allowed; }
      @media (max-width: 540px) {
        .fondo { padding: 10px; align-items: end; }
        .dialogo { border-radius: 16px 16px 8px 8px; }
        footer { display: grid; }
        footer button { width: 100%; }
      }
    `,
  ],
})
export class DialogoAccionComponent {
  readonly dialogos = inject(ServicioDialogos);
  @ViewChild('campoTexto') campoTexto?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('botonPrincipal') botonPrincipal?: ElementRef<HTMLButtonElement>;
  valor = '';

  constructor() {
    effect(() => {
      const peticion = this.dialogos.peticion();
      this.valor = peticion?.valorInicial ?? '';
      if (peticion) {
        queueMicrotask(() =>
          (this.campoTexto?.nativeElement ?? this.botonPrincipal?.nativeElement)?.focus(),
        );
      }
    });
  }

  @HostListener('document:keydown.escape')
  cancelar(): void {
    this.dialogos.resolverPeticion(null);
  }

  confirmar(): void {
    const peticion = this.dialogos.peticion();
    if (!peticion) return;
    if (peticion.tipo === 'texto') {
      const texto = this.valor.trim();
      if (!texto) return;
      this.dialogos.resolverPeticion(texto);
      return;
    }
    this.dialogos.resolverPeticion(true);
  }

  cerrarDesdeFondo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.cancelar();
  }
}
