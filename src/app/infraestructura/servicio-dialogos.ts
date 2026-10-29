import { Injectable, signal } from '@angular/core';

export interface PeticionDialogo {
  id: number;
  tipo: 'confirmacion' | 'texto';
  titulo: string;
  descripcion: string;
  etiquetaConfirmar: string;
  etiquetaCancelar: string;
  peligro: boolean;
  etiquetaCampo?: string;
  valorInicial?: string;
  obligatorio?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServicioDialogos {
  readonly peticion = signal<PeticionDialogo | null>(null);
  private secuencia = 0;
  private resolver: ((valor: boolean | string | null) => void) | null = null;

  confirmar(configuracion: {
    titulo: string;
    descripcion: string;
    confirmar?: string;
    cancelar?: string;
    peligro?: boolean;
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.reemplazarResolver((valor) => resolve(valor === true));
      this.peticion.set({
        id: ++this.secuencia,
        tipo: 'confirmacion',
        titulo: configuracion.titulo,
        descripcion: configuracion.descripcion,
        etiquetaConfirmar: configuracion.confirmar ?? 'Confirmar',
        etiquetaCancelar: configuracion.cancelar ?? 'Cancelar',
        peligro: configuracion.peligro ?? false,
      });
    });
  }

  pedirTexto(configuracion: {
    titulo: string;
    descripcion: string;
    etiquetaCampo: string;
    valorInicial?: string;
    confirmar?: string;
    cancelar?: string;
    peligro?: boolean;
  }): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.reemplazarResolver((valor) => resolve(typeof valor === 'string' ? valor : null));
      this.peticion.set({
        id: ++this.secuencia,
        tipo: 'texto',
        titulo: configuracion.titulo,
        descripcion: configuracion.descripcion,
        etiquetaCampo: configuracion.etiquetaCampo,
        valorInicial: configuracion.valorInicial ?? '',
        obligatorio: true,
        etiquetaConfirmar: configuracion.confirmar ?? 'Continuar',
        etiquetaCancelar: configuracion.cancelar ?? 'Cancelar',
        peligro: configuracion.peligro ?? false,
      });
    });
  }

  resolverPeticion(valor: boolean | string | null): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.peticion.set(null);
    resolver?.(valor);
  }

  private reemplazarResolver(resolver: (valor: boolean | string | null) => void): void {
    this.resolver?.(null);
    this.resolver = resolver;
  }
}
