import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { LucideCheck, LucideX } from '@lucide/angular';
import {
  Recurrencia,
  RespuestaCliente,
  RespuestaUsuario,
  TipoDocumento,
} from '../modelos-aplicacion';

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
  imports: [FormsModule, LucideCheck, LucideX],
  templateUrl: './editor-solicitud.component.html',
  styleUrl: './editor-solicitud.component.scss',
})
export class EditorSolicitudComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private focoAnterior: HTMLElement | null = null;
  private overflowAnterior = '';
  @Input({ required: true }) formulario!: FormularioSolicitud;
  @Input() clientes: RespuestaCliente[] = [];
  @Input() asesores: RespuestaUsuario[] = [];
  @Input() opcionesTipo: Array<{ valor: TipoDocumento; etiqueta: string }> = [];
  @Input() puedeAdministrar = false;
  @Input() editando = false;
  @Input() guardando = false;
  @Input() error = '';
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  @ViewChild('titulo') titulo?: ElementRef<HTMLInputElement>;
  intentoEnviar = false;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['guardando']?.previousValue === true && !this.guardando) {
      queueMicrotask(() => {
        const boton =
          this.elemento.nativeElement.querySelector<HTMLButtonElement>('button[type=submit]');
        if (boton?.isConnected) boton.focus();
      });
    }
  }

  ngOnInit(): void {
    this.focoAnterior = document.activeElement as HTMLElement;
    this.overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  ngAfterViewInit(): void {
    this.titulo?.nativeElement.focus();
  }
  ngOnDestroy(): void {
    document.body.style.overflow = this.overflowAnterior;
    const anterior = this.focoAnterior;
    queueMicrotask(() => anterior?.isConnected && anterior.focus());
  }
  alternarTipo(tipo: TipoDocumento, seleccionado: boolean): void {
    this.formulario.tiposDocumentoEsperados = seleccionado
      ? [...new Set([...this.formulario.tiposDocumentoEsperados, tipo])]
      : this.formulario.tiposDocumentoEsperados.filter((t) => t !== tipo);
  }
  enviar(form: NgForm): void {
    if (this.guardando) return;
    this.intentoEnviar = true;
    if (
      form.invalid ||
      !this.formulario.titulo.trim() ||
      !this.formulario.tiposDocumentoEsperados.length
    ) {
      form.control.markAllAsTouched();
      this.elemento.nativeElement
        .querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid, .documentacion input')
        ?.focus();
      return;
    }
    this.guardar.emit();
  }
  cerrar(): void {
    if (!this.guardando) this.cancelar.emit();
  }
  @HostListener('keydown', ['$event'])
  teclado(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cerrar();
    }
    if (event.key !== 'Tab') return;
    const controles = Array.from(
      this.elemento.nativeElement.querySelectorAll<HTMLElement>('button, input, select, textarea'),
    ).filter((el) => !el.matches(':disabled'));
    const primero = controles[0],
      ultimo = controles.at(-1);
    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo?.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero?.focus();
    }
  }
}
