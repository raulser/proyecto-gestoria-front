import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  HostListener,
  AfterViewChecked,
  OnDestroy,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideBuilding2,
  LucideCheck,
  LucidePlus,
  LucideSettings,
  LucideTrash2,
  LucideUserRound,
  LucideUsers,
  LucideX,
  LucideFileText,
} from '@lucide/angular';
import {
  FormularioCliente,
  PeriodicidadDocumental,
  PautaDocumentalCliente,
  RespuestaCliente,
  TipoCliente,
} from '../modelos-aplicacion';
import {
  fechasIniciales,
  nuevaPauta,
  propuestaDocumental,
  tiposDeCliente,
} from './plantillas-documentales';

@Component({
  selector: 'app-editor-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowLeft,
    LucideArrowRight,
    LucideBuilding2,
    LucideCheck,
    LucidePlus,
    LucideSettings,
    LucideTrash2,
    LucideUserRound,
    LucideUsers,
    LucideX,
    LucideFileText,
  ],
  templateUrl: './editor-cliente.component.html',
  styleUrl: './editor-cliente.component.scss',
})
export class EditorClienteComponent implements OnChanges, AfterViewChecked, OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private focoAnterior: HTMLElement | null = null;
  private desbordamientoAnterior = '';
  private pasoEnfocado = 0;
  @Input() abierto = false;
  @Input() cliente: RespuestaCliente | null = null;
  @Input() guardando = false;
  @Input() error = '';
  @Output() cancelar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<FormularioCliente>();
  tipos = tiposDeCliente;
  paso = 1;
  detalle: string | null = null;
  nuevoDocumento = '';
  modificado = false;
  periodos: Array<{ valor: PeriodicidadDocumental; nombre: string }> = [
    { valor: 'MENSUAL', nombre: 'Mensual' },
    { valor: 'TRIMESTRAL', nombre: 'Trimestral' },
    { valor: 'ANUAL', nombre: 'Anual' },
    { valor: 'PUNTUAL', nombre: 'Una vez' },
    { valor: 'PERMANENTE', nombre: 'Sin vencimiento' },
  ];
  formulario!: FormularioCliente;
  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['abierto']) {
      if (this.abierto) {
        this.focoAnterior = document.activeElement as HTMLElement;
        this.desbordamientoAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.pasoEnfocado = 0;
      } else this.restaurarFoco();
    }
    if (!this.abierto || (!cambios['abierto'] && !cambios['cliente'])) return;
    this.paso = 1;
    this.detalle = null;
    this.nuevoDocumento = '';
    this.modificado = false;
    this.formulario = {
      nombre: this.cliente?.nombre ?? '',
      nif: this.cliente?.nif ?? '',
      email: this.cliente?.email ?? '',
      telefono: this.cliente?.telefono ?? '',
      tipo: this.cliente?.tipo ?? 'AUTONOMO',
      activo: this.cliente?.activo ?? true,
      planDocumental: this.cliente?.planDocumental
        ? structuredClone(this.cliente.planDocumental)
        : {
            automatico: true,
            tipoPersonalizado: '',
            documentos: propuestaDocumental(this.cliente?.tipo ?? 'AUTONOMO'),
          },
    };
  }
  ngAfterViewChecked(): void {
    if (this.abierto && this.pasoEnfocado !== this.paso) {
      this.elemento.nativeElement.querySelector<HTMLElement>('#alta-titulo')?.focus();
      this.pasoEnfocado = this.paso;
    }
  }
  ngOnDestroy(): void {
    if (this.abierto) this.restaurarFoco();
  }
  private restaurarFoco(): void {
    document.body.style.overflow = this.desbordamientoAnterior;
    const anterior = this.focoAnterior;
    setTimeout(() => anterior?.isConnected && anterior.focus());
  }
  @HostListener('document:keydown.escape') cerrar(): void {
    if (this.abierto && !this.guardando) this.cancelar.emit();
  }
  @HostListener('keydown', ['$event']) mantenerFoco(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const elementos = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])',
      ),
    ).filter((e) => e.offsetParent !== null);
    const primero = elementos[0],
      ultimo = elementos.at(-1);
    if (
      event.shiftKey &&
      (document.activeElement === primero || document.activeElement?.id === 'alta-titulo')
    ) {
      event.preventDefault();
      ultimo?.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero?.focus();
    }
  }
  seleccionar(tipo: TipoCliente): void {
    this.formulario.tipo = tipo;
    if (!this.modificado && !this.cliente?.planDocumental)
      this.formulario.planDocumental.documentos = propuestaDocumental(tipo);
  }
  get activos(): PautaDocumentalCliente[] {
    return this.formulario?.planDocumental.documentos.filter((d) => d.activa) ?? [];
  }
  get datosValidos(): boolean {
    return (
      !!this.formulario?.nombre.trim() &&
      !!this.formulario?.nif.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formulario?.email ?? '') &&
      (this.formulario.tipo !== 'OTRO' || !!this.formulario.planDocumental.tipoPersonalizado.trim())
    );
  }
  get planValido(): boolean {
    return this.formulario.planDocumental.documentos.every(
      (d) =>
        !!d.nombre.trim() &&
        (!d.activa ||
          d.periodicidad === 'PERMANENTE' ||
          (!!d.apertura && !!d.fechaLimite && d.fechaLimite >= d.apertura)),
    );
  }
  get tipoSeleccionado(): string {
    return this.tipos.find((t) => t.valor === this.formulario?.tipo)?.nombre ?? '';
  }
  cambiarPeriodo(pauta: PautaDocumentalCliente): void {
    Object.assign(pauta, fechasIniciales(pauta.periodicidad));
    if (pauta.periodicidad === 'PERMANENTE') pauta.diasRecordatorio = null;
    this.modificado = true;
  }
  agregar(): void {
    if (!this.nuevoDocumento.trim() || this.formulario.planDocumental.documentos.length >= 40)
      return;
    const pauta = nuevaPauta(this.nuevoDocumento.trim(), 'OTRO', 'PUNTUAL');
    this.formulario.planDocumental.documentos.push(pauta);
    this.detalle = pauta.id;
    this.nuevoDocumento = '';
    this.modificado = true;
  }
  quitar(id: string): void {
    this.formulario.planDocumental.documentos = this.formulario.planDocumental.documentos.filter(
      (d) => d.id !== id,
    );
    this.modificado = true;
  }
  siguiente(): void {
    if (this.paso === 1 && this.datosValidos) this.paso = 2;
    else if (this.paso === 2 && this.planValido) this.paso = 3;
  }
  enviar(): void {
    if (this.datosValidos && this.planValido && !this.guardando)
      this.guardar.emit(structuredClone(this.formulario));
  }
}
