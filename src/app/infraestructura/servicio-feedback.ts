import { Injectable, signal } from '@angular/core';

export type TipoFeedback = 'exito' | 'error' | 'info';

export interface MensajeFeedback {
  id: number;
  tipo: TipoFeedback;
  titulo: string;
  detalle?: string;
  accion?: 'iniciar-sesion' | 'recargar';
}

@Injectable({ providedIn: 'root' })
export class ServicioFeedback {
  readonly mensajes = signal<MensajeFeedback[]>([]);
  private secuencia = 0;

  exito(titulo: string, detalle?: string): void {
    this.publicar('exito', titulo, detalle, 6000);
  }

  error(titulo: string, detalle?: string): void {
    this.publicar('error', titulo, detalle);
  }

  info(titulo: string, detalle?: string): void {
    this.publicar('info', titulo, detalle, 8000);
  }

  conAccion(titulo: string, detalle: string, accion: MensajeFeedback['accion']): void {
    this.publicar('info', titulo, detalle, undefined, accion);
  }

  cerrar(id: number): void {
    this.mensajes.update((mensajes) => mensajes.filter((mensaje) => mensaje.id !== id));
  }

  private publicar(
    tipo: TipoFeedback,
    titulo: string,
    detalle?: string,
    duracion?: number,
    accion?: MensajeFeedback['accion'],
  ): void {
    const texto = titulo.trim();
    if (!texto) return;
    if (
      accion &&
      this.mensajes().some((mensaje) => mensaje.titulo === texto && mensaje.accion === accion)
    )
      return;
    const id = ++this.secuencia;
    this.mensajes.update((mensajes) => [
      ...mensajes.filter((mensaje) => mensaje.titulo !== texto || mensaje.tipo !== tipo),
      { id, tipo, titulo: texto, detalle, accion },
    ]);
    if (duracion) globalThis.setTimeout(() => this.cerrar(id), duracion);
  }
}
