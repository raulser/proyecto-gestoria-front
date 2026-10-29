import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EstadoDatoFiscal,
  PeticionPerfilFiscalCliente,
  RespuestaCliente,
} from '../modelos-aplicacion';

@Component({
  selector: 'app-perfil-fiscal-cliente',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil-fiscal-cliente.component.html',
  styleUrl: './perfil-fiscal-cliente.component.scss',
})
export class PerfilFiscalClienteComponent {
  @Input({ required: true }) cliente!: RespuestaCliente;
  @Input({ required: true }) formulario!: PeticionPerfilFiscalCliente;
  @Input() porcentaje = 0;
  @Input() guardando = false;
  @Output() guardar = new EventEmitter<void>();

  pasoActual = 1;
  readonly pasos = [
    { numero: 1, etiqueta: 'Situación' },
    { numero: 2, etiqueta: 'Regímenes' },
    { numero: 3, etiqueta: 'Circunstancias' },
    { numero: 4, etiqueta: 'Revisar' },
  ];
  readonly preguntas: Array<{
    campo: keyof PeticionPerfilFiscalCliente;
    etiqueta: string;
  }> = [
    { campo: 'tieneTrabajadores', etiqueta: '¿Tiene trabajadores?' },
    { campo: 'pagaProfesionalesRetencion', etiqueta: '¿Paga profesionales con retención?' },
    { campo: 'alquilerSujetoRetencion', etiqueta: '¿Paga alquiler sujeto a retención?' },
    {
      campo: 'rendimientosCapital',
      etiqueta: '¿Paga dividendos, intereses u otras rentas de capital?',
    },
    { campo: 'operacionesIntracomunitarias', etiqueta: '¿Realiza operaciones intracomunitarias?' },
    { campo: 'operacionesTerceros', etiqueta: '¿Tiene operaciones con terceros declarables?' },
    { campo: 'recibeDonativosDeducibles', etiqueta: '¿Recibe donativos con derecho a deducción?' },
    { campo: 'entidadAtribucionRentas', etiqueta: '¿Es entidad en atribución de rentas?' },
  ];

  valorDato(campo: keyof PeticionPerfilFiscalCliente): EstadoDatoFiscal {
    return this.formulario[campo] as EstadoDatoFiscal;
  }

  cambiarDato(campo: keyof PeticionPerfilFiscalCliente, valor: EstadoDatoFiscal): void {
    (this.formulario as unknown as Record<string, unknown>)[campo] = valor;
  }

  etiquetaTipoCliente(cliente: RespuestaCliente): string {
    const etiquetas: Record<string, string> = {
      AUTONOMO: 'Autónomo',
      EMPRESA: 'Sociedad / empresa',
      PARTICULAR: 'Particular',
      COMUNIDAD_BIENES: 'Comunidad de bienes',
      SOCIEDAD_CIVIL: 'Sociedad civil',
      COMUNIDAD_PROPIETARIOS: 'Comunidad de propietarios',
      ASOCIACION_FUNDACION: 'Asociación o fundación',
      ENTIDAD_SIN_PERSONALIDAD: 'Entidad sin personalidad jurídica',
      OTRO: 'Otra entidad',
    };
    return etiquetas[cliente.tipo] ?? cliente.tipo;
  }
}
