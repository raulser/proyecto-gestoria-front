import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RespuestaCliente } from '../modelos-aplicacion';
@Component({
  selector: 'app-cabecera-expediente',
  template: ` <header>
    <button type="button" class="volver" (click)="volver.emit()">← Clientes</button>
    <div class="identidad">
      <span class="avatar" aria-hidden="true">{{ cliente.nombre.slice(0, 1) }}</span>
      <div>
        <h1>{{ cliente.nombre }}</h1>
        <p>{{ cliente.nif }} · Expediente de cliente</p>
      </div>
      @if (!subida) {
        <button type="button" class="subir" (click)="subir.emit()">+ Subir documento</button>
      }
    </div>
    <nav aria-label="Secciones del expediente">
      <button
        type="button"
        [attr.aria-current]="!subida ? 'page' : null"
        (click)="documentos.emit()"
      >
        Documentos
      </button>
      <button type="button" (click)="obligaciones.emit()">Obligaciones y trámites</button>
      @if (subida) {
        <span aria-current="page">Añadir documentos</span>
      }
    </nav>
  </header>`,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      header {
        margin-bottom: 24px;
      }
      button {
        cursor: pointer;
        font: inherit;
      }
      .volver {
        border: 0;
        background: none;
        color: #81718f;
        font-size: 12px;
        padding: 0 0 18px;
      }
      .identidad {
        display: flex;
        align-items: center;
        gap: 14px;
        padding-bottom: 24px;
      }
      .avatar {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: #ece3f8;
        color: #8956bd;
        font-size: 22px;
        flex: 0 0 auto;
      }
      h1 {
        margin: 0;
        color: #2b263d;
        font:
          650 clamp(20px, 2.5vw, 28px)/1.3 Manrope,
          Inter,
          sans-serif;
        overflow-wrap: anywhere;
      }
      p {
        margin: 6px 0 0;
        color: #81738f;
        font-size: 12px;
      }
      .subir {
        margin-left: auto;
        border: 0;
        border-radius: 9px;
        padding: 12px 16px;
        background: #7040c7;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }
      nav {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 24px;
        border-bottom: 1px solid #e5ddeb;
      }
      nav button,
      nav span {
        border: 0;
        border-bottom: 2px solid transparent;
        padding: 12px 0;
        background: none;
        color: #80718e;
        font-size: 12px;
      }
      nav [aria-current='page'] {
        border-bottom-color: #7844c2;
        color: #7040b4;
        font-weight: 650;
      }
      button:focus-visible {
        outline: 2px solid #a284df;
        outline-offset: 3px;
      }
      @media (max-width: 620px) {
        .identidad {
          flex-wrap: wrap;
        }
        .identidad > div {
          flex: 1;
          min-width: 0;
        }
        .subir {
          margin-left: 62px;
        }
        nav {
          gap: 18px;
        }
      }
    `,
  ],
})
export class CabeceraExpedienteComponent {
  @Input({ required: true }) cliente!: RespuestaCliente;
  @Input() subida = false;
  @Output() volver = new EventEmitter<void>();
  @Output() documentos = new EventEmitter<void>();
  @Output() obligaciones = new EventEmitter<void>();
  @Output() subir = new EventEmitter<void>();
}
