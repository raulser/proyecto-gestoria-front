import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Rol, Vista } from './modelos-aplicacion';

@Component({
  selector: 'app-guia-inicial',
  standalone: true,
  template: `
    <section class="guia" [attr.aria-label]="titulo">
      <header>
        <div>
          <span>Guía rápida</span>
          <h2>{{ titulo }}</h2>
        </div>
        <div class="acciones">
          <button type="button" class="principal" (click)="navegar.emit(destino)">{{ accion }}</button>
          <button type="button" class="secundario" (click)="cerrar.emit()" aria-label="Cerrar guía inicial">
            Ocultar guía
          </button>
        </div>
      </header>
      <ol>
        @for (paso of pasos; track paso.titulo) {
          <li>
            <strong>{{ paso.titulo }}</strong
            ><span>{{ paso.texto }}</span>
          </li>
        }
      </ol>
    </section>
  `,
  styles: [
    `
      .guia {
        margin-bottom: 18px;
        padding: 16px 18px;
        border: 1px solid #a9c8b4;
        border-left: 5px solid var(--brand-primary);
        border-radius: 10px;
        background: linear-gradient(135deg, #f3fbf6 0%, #fff 72%);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .acciones { display: flex; gap: 8px; flex-wrap: wrap; }
      h2 {
        margin: 4px 0 0;
        font-size: 20px;
      }
      header span {
        color: #247343;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      ol {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin: 12px 0 0;
        padding: 0;
        list-style: none;
        counter-reset: paso;
      }
      li {
        position: relative;
        min-height: 0;
        padding: 9px 10px 9px 38px;
        border-left: 1px solid #cfe0d5;
        counter-increment: paso;
      }
      li::before {
        content: counter(paso);
        position: absolute;
        top: 7px;
        left: 7px;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #dff3e5;
        color: #226b3b;
        font-weight: 800;
      }
      li strong,
      li span {
        display: block;
      }
      li span {
        display: none;
      }
      button {
        min-height: 38px;
        padding: 0 14px;
        border-radius: 8px;
        font: inherit;
        cursor: pointer;
      }
      .secundario {
        border: 1px solid #ccd7d1;
        background: #fff;
        color: #26342c;
      }
      .principal {
        border: 0;
        background: var(--brand-primary);
        color: #fff;
        font-weight: 700;
      }
      @media (max-width: 980px) {
        header {
          flex-direction: column;
        }
        ol {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 560px) {
        ol { grid-template-columns: 1fr; }
        .acciones { width: 100%; }
        .acciones button { flex: 1; }
      }
    `,
  ],
})
export class GuiaInicialComponent {
  @Input({ required: true }) rol!: Rol;
  @Output() cerrar = new EventEmitter<void>();
  @Output() navegar = new EventEmitter<Vista>();

  get esCliente(): boolean {
    return this.rol === 'CLIENTE';
  }
  get esAdmin(): boolean {
    return this.rol === 'ADMIN' || this.rol === 'ADMIN_PLATAFORMA';
  }
  get titulo(): string {
    return this.esCliente
      ? 'Tu espacio con la gestoría'
      : this.esAdmin
        ? 'Preparar la gestoría para trabajar'
        : 'Organiza el trabajo de tus clientes';
  }
  get destino(): Vista {
    return this.esAdmin ? 'equipo' : 'solicitudes';
  }
  get accion(): string {
    return this.esCliente
      ? 'Ver lo que debo entregar'
      : this.esAdmin
        ? 'Configurar equipo y accesos'
        : 'Ir a las peticiones';
  }
  get pasos(): Array<{ titulo: string; texto: string }> {
    if (this.esCliente)
      return [
        {
          titulo: 'Revisa qué te piden.',
          texto: 'En “Lo que debo entregar” verás cada encargo y su fecha.',
        },
        {
          titulo: 'Añade todos los archivos necesarios.',
          texto: 'Puedes subir muchas facturas y volver varias veces.',
        },
        {
          titulo: 'Envía la entrega al terminar.',
          texto: 'Subir archivos no presenta ningún modelo fiscal.',
        },
        {
          titulo: 'Consulta tus resultados.',
          texto: 'Los modelos y justificantes publicados estarán en “Mis archivos”.',
        },
      ];
    if (this.esAdmin)
      return [
        {
          titulo: 'Da de alta al equipo.',
          texto: 'Cada persona recibirá su acceso y los perfiles internos configurarán MFA.',
        },
        {
          titulo: 'Asigna clientes a cada asesor.',
          texto: 'Solo verá los expedientes que tenga asignados.',
        },
        {
          titulo: 'Configura obligaciones.',
          texto: 'Valida por cliente qué modelos, libros y fechas le corresponden.',
        },
        {
          titulo: 'Comprueba la visibilidad.',
          texto: 'Los borradores internos no los ve el cliente hasta que se publican.',
        },
      ];
    return [
      { titulo: 'Revisa tu agenda.', texto: 'Prioriza vencimientos y documentación enviada.' },
      {
        titulo: 'Pide documentación.',
        texto: 'La petición recopila archivos; no equivale a presentar la obligación.',
      },
      {
        titulo: 'Revisa y corrige.',
        texto: 'El cliente verá el motivo cuando rechaces un documento.',
      },
      {
        titulo: 'Publica resultados.',
        texto: 'Comprueba siempre la etiqueta de visibilidad antes de publicar.',
      },
    ];
  }
}
