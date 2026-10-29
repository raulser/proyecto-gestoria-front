import { Injectable, signal } from '@angular/core';

export type TipoFeedback = 'exito' | 'error' | 'info';

export interface MensajeFeedback {
  id: number;
  tipo: TipoFeedback;
  titulo: string;
  detalle?: string;
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

  cerrar(id: number): void {
    this.mensajes.update((mensajes) => mensajes.filter((mensaje) => mensaje.id !== id));
  }

  private publicar(
    tipo: TipoFeedback,
    titulo: string,
    detalle?: string,
    duracion?: number,
  ): void {
    const texto = titulo.trim();
    if (!texto) return;
    const id = ++this.secuencia;
    this.mensajes.update((mensajes) => [
      ...mensajes.filter((mensaje) => mensaje.titulo !== texto || mensaje.tipo !== tipo),
      { id, tipo, titulo: texto, detalle },
    ]);
    if (duracion) globalThis.setTimeout(() => this.cerrar(id), duracion);
  }
}
