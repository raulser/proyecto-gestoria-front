import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucidePlus, LucideX } from '@lucide/angular';
import { Recurrencia, RespuestaCliente, RespuestaUsuario, TipoDocumento } from '../modelos-aplicacion';

export interface FormularioSolicitud {
  clienteId: number | null;
  asesorAsignadoId: number | null;
  titulo: string;
  descripcion: string;
  tiposDocumentoEsperados: TipoDocumento[];
  anio: number;
  trimestre: number;
  fechaVencimiento: string;
  recurrencia: Recurrencia;
}

@Component({
  selector: 'app-editor-solicitud',
  standalone: true,
  imports: [FormsModule, LucidePlus, LucideX],
  template: `
    @if (editando) {
      <button type="button" class="fondo" aria-label="Cancelar edición" (click)="cancelar.emit()"></button>
    }
    <section
      #panel
      class="panel"
      [class.lateral]="editando"
      [attr.role]="editando ? 'dialog' : null"
      [attr.aria-modal]="editando ? 'true' : null"
      aria-labelledby="titulo-editor-solicitud"
    >
      <header>
        <div>
          <span>{{ editando ? 'Editando petición' : 'Nueva petición' }}</span>
          <h2 id="titulo-editor-solicitud">{{ editando ? 'Editar solicitud' : 'Pedir documentación' }}</h2>
          <p>Indica claramente qué debe entregar el cliente y cuándo.</p>
        </div>
        @if (editando) {
          <button type="button" class="cerrar" (click)="cancelar.emit()" aria-label="Cancelar edición">
            <svg lucideX size="19"></svg>
          </button>
        }
      </header>

      <form (ngSubmit)="guardar.emit()">
        <label>Cliente
          <select name="requestClient" [(ngModel)]="formulario.clienteId" [disabled]="editando">
            @for (cliente of clientes; track cliente.id) { <option [ngValue]="cliente.id">{{ cliente.nombre }}</option> }
          </select>
        </label>
        @if (puedeAdministrar) {
          <label>Responsable
            <select name="requestAdvisor" [(ngModel)]="formulario.asesorAsignadoId">
              <option [ngValue]="null">Sin asignar</option>
              @for (asesor of asesores; track asesor.id) { <option [ngValue]="asesor.id">{{ asesor.nombre }}</option> }
            </select>
          </label>
        }
        <label>Qué necesitas
          <input #titulo name="requestTitle" [(ngModel)]="formulario.titulo" placeholder="Facturas recibidas de julio" />
        </label>
        <label>Instrucciones para el cliente
          <textarea name="requestDescription" [(ngModel)]="formulario.descripcion" rows="3"></textarea>
        </label>
        <label>Documentación esperada
          <select name="requestType" multiple size="6" [(ngModel)]="formulario.tiposDocumentoEsperados">
            @for (opcion of opcionesTipo; track opcion.valor) { <option [value]="opcion.valor">{{ opcion.etiqueta }}</option> }
          </select>
          <small>Puedes seleccionar varias categorías con Ctrl o Cmd.</small>
        </label>
        <div class="fila">
          <label>Vencimiento
            <input name="requestDue" type="date" [(ngModel)]="formulario.fechaVencimiento" />
          </label>
          <label>Repetición
            <select name="requestRecurrence" [(ngModel)]="formulario.recurrencia" [disabled]="editando">
              <option value="NINGUNA">Una vez</option>
              <option value="MENSUAL">Mensual</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </label>
        </div>
        <footer>
          @if (editando) { <button type="button" class="secundario" (click)="cancelar.emit()">Cancelar</button> }
          <button type="submit" class="principal">
            <svg lucidePlus size="17"></svg>
            {{ editando ? 'Guardar cambios' : 'Crear solicitud' }}
          </button>
        </footer>
      </form>
    </section>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .panel { padding: 20px; border: 1px solid #dce5df; border-radius: 14px; background: #fff; }
      .fondo { position: fixed; inset: 0; z-index: 2200; border: 0; background: rgb(11 24 17 / 52%); backdrop-filter: blur(2px); }
      .panel.lateral { position: fixed; top: 0; right: 0; z-index: 2250; width: min(580px,100vw); height: 100dvh; overflow-y: auto; border: 0; border-radius: 0; box-shadow: -20px 0 60px rgb(0 0 0 / 22%); }
      header { display: grid; grid-template-columns: 1fr auto; gap: 16px; margin-bottom: 18px; }
      header span { color: var(--brand-primary); font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
      h2 { margin: 3px 0 0; font-size: 20px; }
      p { margin: 5px 0 0; color: #627068; font-size: 14px; }
      .cerrar { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 9px; background: #eef3f0; color: #435149; cursor: pointer; }
      form { display: grid; gap: 13px; }
      label { display: grid; gap: 6px; color: #344239; font-size: 13px; font-weight: 700; }
      input, select, textarea { width: 100%; min-height: 42px; padding: 9px 11px; border: 1px solid #cbd6d0; border-radius: 9px; background: #fff; font: inherit; }
      textarea { resize: vertical; }
      input:focus, select:focus, textarea:focus { border-color: var(--brand-primary); outline: 3px solid rgb(34 107 59 / 12%); }
      select[multiple] { min-height: 152px; }
      small { color: #6a766f; font-weight: 400; }
      .fila { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 5px; }
      footer button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 0 15px; border-radius: 9px; font: inherit; font-weight: 700; cursor: pointer; }
      .principal { border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; }
      .secundario { border: 1px solid #cbd6d0; background: #fff; color: #26342c; }
      @media(max-width:560px) { .fila { grid-template-columns: 1fr; } footer { display:grid; } }
    `,
  ],
})
export class EditorSolicitudComponent implements OnChanges {
  @Input({ required: true }) formulario!: FormularioSolicitud;
  @Input() clientes: RespuestaCliente[] = [];
  @Input() asesores: RespuestaUsuario[] = [];
  @Input() opcionesTipo: Array<{ valor: TipoDocumento; etiqueta: string }> = [];
  @Input() puedeAdministrar = false;
  @Input() editando = false;
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @ViewChild('titulo') titulo?: ElementRef<HTMLInputElement>;
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['editando']?.currentValue) {
      queueMicrotask(() => {
        this.panel?.nativeElement.scrollTo({ top: 0 });
        this.titulo?.nativeElement.focus();
      });
    }
  }
}
