import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RespuestaCliente, RespuestaSolicitudDocumento } from '../modelos-aplicacion';
import { tiposDeCliente } from './plantillas-documentales';

@Component({
  selector: 'app-directorio-clientes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './directorio-clientes.component.html',
  styleUrl: './directorio-clientes.component.scss',
})
export class DirectorioClientesComponent {
  @Input() clientes: RespuestaCliente[] = [];
  @Input() solicitudes: RespuestaSolicitudDocumento[] = [];
  @Input() puedeGestionar = false;
  @Output() crear = new EventEmitter<void>();
  @Output() editar = new EventEmitter<RespuestaCliente>();
  @Output() documentos = new EventEmitter<RespuestaCliente>();
  @Output() fiscal = new EventEmitter<RespuestaCliente>();
  @Output() archivar = new EventEmitter<RespuestaCliente>();
  @Output() exportar = new EventEmitter<RespuestaCliente>();
  busqueda = '';
  filtro = 'ACTIVOS';
  seleccionadoId: number | null = null;

  get activos(): number {
    return this.clientes.filter((c) => c.activo).length;
  }
  get porRevisar(): number {
    return this.solicitudes.filter((s) => s.estado === 'ENVIADA').length;
  }
  get filtrados(): RespuestaCliente[] {
    const texto = this.busqueda.trim().toLocaleLowerCase('es');
    return this.clientes.filter(
      (c) =>
        (this.filtro === 'TODOS' || (this.filtro === 'ACTIVOS' ? c.activo : !c.activo)) &&
        `${c.nombre} ${c.nif} ${c.email}`.toLocaleLowerCase('es').includes(texto),
    );
  }
  get seleccionado(): RespuestaCliente | null {
    return this.filtrados.find((c) => c.id === this.seleccionadoId) ?? this.filtrados[0] ?? null;
  }
  iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
  tipo(cliente: RespuestaCliente): string {
    return cliente.tipo === 'OTRO'
      ? cliente.planDocumental?.tipoPersonalizado || 'Otro tipo'
      : (tiposDeCliente.find((t) => t.valor === cliente.tipo)?.nombre ?? cliente.tipo);
  }
  entregas(cliente: RespuestaCliente, revisar = false): number {
    return this.solicitudes.filter(
      (s) =>
        s.clienteId === cliente.id &&
        (revisar ? s.estado === 'ENVIADA' : s.estado === 'ABIERTA' || s.estado === 'PARCIAL'),
    ).length;
  }
  pautas(cliente: RespuestaCliente): number {
    return cliente.planDocumental?.documentos.filter((d) => d.activa).length ?? 0;
  }
}
