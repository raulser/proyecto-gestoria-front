import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

@Component({
  selector: 'app-visor-manual-pdf',
  template: `
    <section class="visor" aria-label="Visor del manual PDF" [attr.aria-busy]="ocupado()">
      <div class="herramientas">
        <div class="paginas">
          <button
            type="button"
            aria-label="Página anterior del PDF"
            [disabled]="ocupado() || pagina() <= 1"
            (click)="irPagina(pagina() - 1)"
          >
            ←
          </button>
          <label
            >Página
            <select
              aria-label="Página del PDF"
              [value]="pagina()"
              [disabled]="ocupado() || !total()"
              (change)="irPagina(+$any($event.target).value)"
            >
              @for (numero of numerosPagina; track numero) {
                <option [value]="numero">{{ numero }}</option>
              }
            </select>
            de {{ total() || '…' }}</label
          >
          <button
            type="button"
            aria-label="Página siguiente del PDF"
            [disabled]="ocupado() || pagina() >= total()"
            (click)="irPagina(pagina() + 1)"
          >
            →
          </button>
        </div>
        <label
          >Ampliación
          <select
            aria-label="Ampliación del PDF"
            [value]="zoom()"
            [disabled]="ocupado()"
            (change)="ampliar(+$any($event.target).value)"
          >
            <option value="1">Ajustar al ancho</option>
            <option value="1.25">125 %</option>
            <option value="1.5">150 %</option>
            <option value="2">200 %</option>
          </select></label
        >
      </div>
      @if (error()) {
        <div class="mensaje" role="alert">
          <p>{{ error() }}</p>
          <button type="button" (click)="cargar()">Volver a cargar PDF</button>
        </div>
      }
      @if (ocupado()) {
        <p class="mensaje" role="status">Preparando la página del manual…</p>
      }
      <div class="papel" #area [class.cargando]="ocupado()" [hidden]="!!error()">
        <canvas
          #lienzo
          role="img"
          [attr.aria-label]="nombre + ', página ' + pagina() + ' de ' + total()"
        ></canvas>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .visor {
        border: 1px solid #ded6e9;
        border-radius: 14px;
        overflow: hidden;
        background: white;
      }
      .herramientas {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        flex-wrap: wrap;
        border-bottom: 1px solid #eae3f2;
      }
      .paginas {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      label {
        color: #786a87;
        font-size: 12px;
        line-height: 1.5;
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      button,
      select {
        min-height: 36px;
        font: inherit;
        font-size: 12px;
        color: #644586;
        border: 1px solid #e3daed;
        border-radius: 8px;
        padding: 6px 10px;
        background: white;
      }
      button {
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.4;
        cursor: default;
      }
      button:focus-visible,
      select:focus-visible {
        outline: 3px solid #bba0e9;
        outline-offset: 2px;
      }
      .papel {
        overflow: auto;
        max-height: 75svh;
        padding: 16px;
        background: #eeeaf3;
      }
      .papel.cargando {
        opacity: 0.3;
      }
      canvas {
        display: block;
        margin: 0 auto;
        box-shadow: 0 3px 18px #30234015;
        background: white;
      }
      .mensaje {
        padding: 16px;
        color: #796989;
        font-size: 13px;
      }
      [hidden] {
        display: none;
      }
      @media (max-width: 600px) {
        .herramientas {
          padding: 10px;
        }
        .papel {
          padding: 8px;
        }
      }
    `,
  ],
})
export class VisorManualPdfComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) url = '';
  @Input() nombre = 'Manual de Savia';
  @ViewChild('lienzo', { static: true }) lienzo!: ElementRef<HTMLCanvasElement>;
  @ViewChild('area', { static: true }) area!: ElementRef<HTMLDivElement>;
  readonly pagina = signal(1);
  readonly total = signal(0);
  readonly zoom = signal(1);
  readonly ocupado = signal(true);
  readonly error = signal('');
  private documento: PDFDocumentProxy | null = null;
  private carga: PDFDocumentLoadingTask | null = null;
  private dibujo: RenderTask | null = null;
  private observador?: ResizeObserver;
  private listo = false;
  private version = 0;
  private destruido = false;
  private ultimoAncho = 0;
  get numerosPagina(): number[] {
    return Array.from({ length: this.total() }, (_, indice) => indice + 1);
  }

  ngAfterViewInit(): void {
    this.listo = true;
    this.observador = new ResizeObserver(([entrada]) => {
      if (Math.abs(entrada.contentRect.width - this.ultimoAncho) < 1) return;
      this.ultimoAncho = entrada.contentRect.width;
      if (this.documento && !this.ocupado()) void this.dibujar();
    });
    this.observador.observe(this.area.nativeElement);
    void this.cargar();
  }
  ngOnChanges(): void {
    if (this.listo) void this.cargar();
  }
  ngOnDestroy(): void {
    this.destruido = true;
    this.version++;
    this.observador?.disconnect();
    this.dibujo?.cancel();
    void this.carga?.destroy();
  }
  async cargar(): Promise<void> {
    const version = ++this.version;
    this.error.set('');
    this.ocupado.set(true);
    this.total.set(0);
    this.pagina.set(1);
    this.dibujo?.cancel();
    try {
      await this.carga?.destroy();
      this.documento = null;
      const pdf = await import('pdfjs-dist');
      if (this.destruido || version !== this.version) return;
      pdf.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs/pdf.worker.min.mjs',
        document.baseURI,
      ).href;
      this.carga = pdf.getDocument({ url: this.url, enableXfa: false });
      this.documento = await this.carga.promise;
      if (this.destruido || version !== this.version) return;
      this.total.set(this.documento.numPages);
      await this.dibujar();
    } catch {
      if (!this.destruido && version === this.version) {
        this.error.set('No se pudo mostrar el PDF. Puedes volver a intentarlo o descargarlo.');
        this.ocupado.set(false);
      }
    }
  }
  irPagina(numero: number): void {
    if (this.ocupado() || numero < 1 || numero > this.total()) return;
    this.pagina.set(numero);
    this.area.nativeElement.scrollTop = 0;
    void this.dibujar();
  }
  ampliar(valor: number): void {
    if (this.ocupado() || ![1, 1.25, 1.5, 2].includes(valor)) return;
    this.zoom.set(valor);
    void this.dibujar();
  }
  private async dibujar(): Promise<void> {
    const documento = this.documento;
    if (!documento || this.destruido) return;
    const version = this.version;
    this.ocupado.set(true);
    try {
      const pagina = await documento.getPage(this.pagina());
      if (this.destruido || version !== this.version) return;
      const canvas = this.lienzo.nativeElement;
      const contexto = canvas.getContext('2d');
      if (!contexto) throw new Error('Lienzo no disponible');
      const base = pagina.getViewport({ scale: 1 });
      const ancho = Math.max(1, this.area.nativeElement.clientWidth - 32);
      const vista = pagina.getViewport({ scale: (ancho / base.width) * this.zoom() });
      const densidad = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(vista.width * densidad);
      canvas.height = Math.ceil(vista.height * densidad);
      canvas.style.width = `${vista.width}px`;
      canvas.style.height = `${vista.height}px`;
      this.dibujo = pagina.render({
        canvas,
        canvasContext: contexto,
        viewport: vista,
        transform: [densidad, 0, 0, densidad, 0, 0],
      });
      await this.dibujo.promise;
    } catch {
      if (!this.destruido && version === this.version)
        this.error.set('No se pudo mostrar esta página. Prueba a volver a cargar el PDF.');
    } finally {
      if (!this.destruido && version === this.version) this.ocupado.set(false);
    }
  }
}
