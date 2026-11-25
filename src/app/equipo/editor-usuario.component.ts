import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RespuestaCliente, Rol } from '../modelos-aplicacion';
import { SelectorPerfilComponent } from './selector-perfil.component';

@Component({
  selector: 'app-editor-usuario',
  imports: [FormsModule, SelectorPerfilComponent],
  templateUrl: './editor-usuario.component.html',
  styleUrl: './editor-usuario.component.scss',
})
export class EditorUsuarioComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) formulario!: {
    nombre: string;
    email: string;
    contrasena: string;
    rol: Rol;
    dobleFactorRequerido: boolean;
  };
  @Input() cliente: RespuestaCliente | null = null;
  @Input() guardando = false;
  @Input() error = '';
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private foco: HTMLElement | null = null;
  private overflow = '';
  ngOnInit() {
    this.foco = document.activeElement as HTMLElement;
    this.overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  ngAfterViewInit() {
    this.elemento.nativeElement.querySelector<HTMLInputElement>('input')?.focus();
  }
  ngOnDestroy() {
    document.body.style.overflow = this.overflow;
    const foco = this.foco;
    queueMicrotask(() => foco?.isConnected && foco.focus());
  }
  cerrar() {
    if (!this.guardando) this.cancelar.emit();
  }
  @HostListener('keydown', ['$event']) teclado(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.cerrar();
    }
    if (e.key !== 'Tab') return;
    const controles = [
      ...this.elemento.nativeElement.querySelectorAll<HTMLElement>('button,input'),
    ].filter(
      (el) =>
        !el.matches(':disabled') &&
        (el.getAttribute('type') !== 'radio' || (el as HTMLInputElement).checked),
    );
    if (e.shiftKey && document.activeElement === controles[0]) {
      e.preventDefault();
      controles.at(-1)?.focus();
    } else if (!e.shiftKey && document.activeElement === controles.at(-1)) {
      e.preventDefault();
      controles[0]?.focus();
    }
  }
}
