import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RespuestaCliente } from '../modelos-aplicacion';

let siguienteSelector = 0;

@Component({
  selector: 'app-selector-cliente',
  imports: [FormsModule],
  template: ` <div class="selector" (focusout)="salir($event)">
    <label [for]="identificador">{{ etiqueta }}</label>
    <div class="entrada">
      <input
        [id]="identificador"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        [attr.aria-controls]="identificador + '-opciones'"
        [attr.aria-expanded]="abierto"
        [attr.aria-activedescendant]="
          abierto && resultados[activo] ? identificador + '-' + resultados[activo].id : null
        "
        [placeholder]="placeholder"
        [disabled]="deshabilitado"
        [ngModelOptions]="{ standalone: true }"
        [ngModel]="abierto ? texto : nombreSeleccionado"
        (ngModelChange)="texto = $event; activo = 0"
        (focus)="abrir()"
        (keydown)="tecla($event)"
      />
      @if (seleccionado !== null) {
        <button type="button" [disabled]="deshabilitado"
          [attr.aria-label]="permitirTodos ? 'Ver todos los clientes' : 'Quitar cliente seleccionado'"
          (click)="elegir(null)">×</button>
      }
    </div>
    @if (abierto) {
      <div
        class="opciones"
        [id]="identificador + '-opciones'"
        role="listbox"
        aria-label="Clientes encontrados"
      >
        @if (permitirTodos) {
          <button type="button" role="option" [attr.aria-selected]="seleccionado === null"
            (click)="elegir(null)">Todos los clientes</button>
        }
        @for (cliente of resultados; track cliente.id; let i = $index) {
          <button
            type="button"
            role="option"
            [id]="identificador + '-' + cliente.id"
            [class.enfocado]="activo === i"
            [attr.aria-selected]="seleccionado === cliente.id"
            (mouseenter)="activo = i"
            (click)="elegir(cliente.id)"
          >
            <strong>{{ cliente.nombre }}</strong
            ><small>{{ cliente.nif }}</small>
          </button>
        } @empty {
          <p role="status">No hay coincidencias</p>
        }
        @if (coincidencias.length > 8) {
          <p role="status">{{ coincidencias.length }} clientes · escribe para acotar</p>
        }
      </div>
    }
  </div>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
        flex: 1 1 180px;
      }
      .selector {
        position: relative;
      }
      label {
        display: block;
        margin-bottom: 7px;
        color: #5b6175;
        font-size: 13px;
        font-weight: 600;
      }
      .entrada {
        display: flex;
        align-items: center;
        min-height: 44px;
        border: 1px solid #e2dfea;
        border-radius: 9px;
        background: #fff;
      }
      input {
        width: 100%;
        min-width: 0;
        height: 42px;
        padding: 0 11px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #303449;
        font: inherit;
        font-size: 13px;
      }
      .entrada:focus-within {
        outline: 2px solid #a284df;
        outline-offset: 2px;
      }
      button {
        cursor: pointer;
        font: inherit;
      }
      .entrada button {
        border: 0;
        background: none;
        padding: 8px;
        color: #746783;
      }
      .opciones {
        position: absolute;
        z-index: 15;
        top: calc(100% + 5px);
        left: 0;
        width: max(100%, 250px);
        max-width: 85vw;
        padding: 5px;
        border: 1px solid #dfd6ed;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 12px 35px #30213e20;
      }
      .opciones button {
        display: block;
        width: 100%;
        border: 0;
        background: transparent;
        padding: 9px;
        min-height: 44px;
        border-radius: 6px;
        text-align: left;
        color: #4b415a;
        font-size: 12px;
      }
      .opciones button:hover,
      .opciones .enfocado {
        background: #f2ecfa;
      }
      strong,
      small {
        display: block;
      }
      strong {
        font-weight: 500;
      }
      small {
        margin-top: 4px;
        color: #796b88;
        font-size: 10px;
      }
      p {
        margin: 8px;
        color: #766880;
        font-size: 11px;
      }
      button:focus-visible {
        outline: 2px solid #a284df;
      }
    `,
  ],
})
export class SelectorClienteComponent {
  @Input() etiqueta = 'Cliente';
  @Input() placeholder = 'Todos los clientes';
  @Input() permitirTodos = true;
  @Input() deshabilitado = false;
  @Input() clientes: RespuestaCliente[] = [];
  @Input() seleccionado: number | null = null;
  @Output() cambiar = new EventEmitter<number | null>();
  abierto = false;
  texto = '';
  activo = 0;
  readonly identificador = `buscar-cliente-${++siguienteSelector}`;
  get nombreSeleccionado(): string {
    return this.clientes.find((c) => c.id === this.seleccionado)?.nombre ?? '';
  }
  get coincidencias(): RespuestaCliente[] {
    const normalizar = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const texto = normalizar(this.texto.trim());
    return this.clientes.filter((c) =>
      normalizar(c.nombre + ' ' + c.nif + ' ' + c.email).includes(texto),
    );
  }
  get resultados(): RespuestaCliente[] {
    return this.coincidencias.slice(0, 8);
  }
  abrir(): void {
    if (this.deshabilitado) return;
    this.abierto = true;
    this.texto = '';
    this.activo = 0;
  }
  elegir(id: number | null): void {
    if (this.deshabilitado) return;
    this.abierto = false;
    this.texto = '';
    this.cambiar.emit(id);
  }
  salir(evento: FocusEvent): void {
    if (!(evento.currentTarget as HTMLElement).contains(evento.relatedTarget as Node | null))
      this.abierto = false;
  }
  tecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      this.abierto = false;
      return;
    }
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!this.abierto) this.abrir();
      else
        this.activo = Math.max(
          0,
          Math.min(this.resultados.length - 1, this.activo + (evento.key === 'ArrowDown' ? 1 : -1)),
        );
    }
    if (evento.key === 'Enter' && this.abierto) {
      evento.preventDefault();
      if (this.resultados[this.activo]) this.elegir(this.resultados[this.activo].id);
    }
  }
}
