import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideFilter, LucideSearch, LucideX } from '@lucide/angular';
import { RespuestaCliente, TipoDocumento } from '../modelos-aplicacion';
import {
  ESTADOS_DOCUMENTO,
  FILTROS_DOCUMENTOS_VACIOS,
  FiltrosRepositorio,
} from './filtros-repositorio';

@Component({
  selector: 'app-filtros-documentos',
  imports: [FormsModule, LucideFilter, LucideSearch, LucideX],
  templateUrl: './filtros-documentos.component.html',
  styleUrl: './filtros-documentos.component.scss',
})
export class FiltrosDocumentosComponent implements OnChanges, OnDestroy {
  @Input() esCliente = false;
  @Input() filtros: FiltrosRepositorio = { ...FILTROS_DOCUMENTOS_VACIOS };
  @Input() clientes: RespuestaCliente[] = [];
  @Input() anios: number[] = [];
  @Input() opcionesTipo: Array<{ valor: TipoDocumento; etiqueta: string }> = [];
  @Output() cambiar = new EventEmitter<Partial<FiltrosRepositorio>>();
  @Output() limpiar = new EventEmitter<void>();
  readonly estados = Object.entries(ESTADOS_DOCUMENTO);
  panelAbierto = false;
  textoLocal = '';
  private busquedaPendiente?: ReturnType<typeof setTimeout>;

  ngOnChanges(cambios: SimpleChanges): void {
    const cambio = cambios['filtros'];
    if (cambio && cambio.previousValue?.texto !== cambio.currentValue.texto) {
      this.cancelarBusqueda();
      this.textoLocal = this.filtros.texto;
    }
  }
  buscar(texto: string): void {
    this.textoLocal = texto;
    this.cancelarBusqueda();
    this.busquedaPendiente = setTimeout(() => this.aplicar({}), 400);
  }
  aplicar(cambios: Partial<FiltrosRepositorio>): void {
    this.cancelarBusqueda();
    this.cambiar.emit({ texto: this.textoLocal, ...cambios });
  }
  restablecer(): void {
    this.cancelarBusqueda();
    this.textoLocal = '';
    this.limpiar.emit();
  }
  get cantidadAvanzados(): number {
    return [this.filtros.estado, this.filtros.periodo, this.filtros.visibilidad].filter(Boolean)
      .length;
  }
  ngOnDestroy(): void {
    this.cancelarBusqueda();
  }
  private cancelarBusqueda(): void {
    clearTimeout(this.busquedaPendiente);
    this.busquedaPendiente = undefined;
  }
}
