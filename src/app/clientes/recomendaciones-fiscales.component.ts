import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { EstadoRecomendacionFiscal, RespuestaRecomendacionFiscal } from '../modelos-aplicacion';

@Component({
  selector: 'app-recomendaciones-fiscales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recomendaciones-fiscales.component.html',
  styleUrl: './recomendaciones-fiscales.component.scss',
})
export class RecomendacionesFiscalesComponent {
  @Input() recomendaciones: RespuestaRecomendacionFiscal[] = [];
  @Input() procesandoClave = '';
  @Output() confirmar = new EventEmitter<RespuestaRecomendacionFiscal>();
  @Output() descartar = new EventEmitter<RespuestaRecomendacionFiscal>();
  @Output() reabrir = new EventEmitter<RespuestaRecomendacionFiscal>();

  porEstado(estado: EstadoRecomendacionFiscal): RespuestaRecomendacionFiscal[] {
    return this.recomendaciones.filter((recomendacion) => recomendacion.estado === estado);
  }

  etiquetaPeriodicidad(valor: string): string {
    const etiquetas: Record<string, string> = {
      MENSUAL: 'Mensual',
      TRIMESTRAL: 'Trimestral',
      ANUAL: 'Anual',
      PERSONALIZADA: 'Calendario específico',
      PUNTUAL: 'Puntual',
    };
    return etiquetas[valor] ?? valor;
  }
}
