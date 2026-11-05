import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rol, Vista } from '../modelos-aplicacion';
import { buscarCapitulos, obtenerManual } from './manual-usuario';
import { VisorManualPdfComponent } from './visor-manual-pdf.component';

@Component({
  selector: 'app-manual-usuario',
  imports: [FormsModule, VisorManualPdfComponent],
  templateUrl: './manual-usuario.component.html',
  styleUrl: './manual-usuario.component.scss',
})
export class ManualUsuarioComponent implements OnChanges {
  @Input({ required: true }) rol!: Rol;
  @Input() seccionInicial = '';
  @Output() navegar = new EventEmitter<Vista>();
  @ViewChild('contenido') contenido?: ElementRef<HTMLElement>;
  private readonly cambios = inject(ChangeDetectorRef);
  manual = obtenerManual('CLIENTE');
  consulta = '';
  seccionActiva = '';
  vista: 'lectura' | 'pdf' = 'lectura';

  ngOnChanges(): void {
    this.manual = obtenerManual(this.rol);
    this.consulta = '';
    this.vista = 'lectura';
    this.seccionActiva = this.manual.capitulos.some(
      (capitulo) => capitulo.id === this.seccionInicial,
    )
      ? this.seccionInicial
      : this.manual.capitulos[0].id;
  }
  get urlPdf(): string {
    return `${this.manual.archivo}?v=${this.manual.version}`;
  }
  get resultados() {
    return buscarCapitulos(this.manual.capitulos, this.consulta);
  }
  get capitulo() {
    return this.resultados.find((capitulo) => capitulo.id === this.seccionActiva);
  }
  get indice(): number {
    return this.resultados.findIndex((capitulo) => capitulo.id === this.seccionActiva);
  }
  get numeroCapitulo(): string {
    return String(
      this.manual.capitulos.findIndex((capitulo) => capitulo.id === this.seccionActiva) + 1,
    ).padStart(2, '0');
  }
  buscar(consulta: string): void {
    this.consulta = consulta;
    if (!this.resultados.some((capitulo) => capitulo.id === this.seccionActiva)) {
      this.seccionActiva = this.resultados[0]?.id ?? '';
    }
  }
  seleccionar(id: string): void {
    if (!this.resultados.some((capitulo) => capitulo.id === id)) return;
    this.seccionActiva = id;
    this.cambios.detectChanges();
    this.contenido?.nativeElement.focus();
  }
  avanzar(direccion: number): void {
    const siguiente = this.resultados[this.indice + direccion];
    if (siguiente) this.seleccionar(siguiente.id);
  }
}
