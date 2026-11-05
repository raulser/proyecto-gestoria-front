import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';
import { configuracionEjecucion } from './configuracion-ejecucion';

export function destinoApi(url: string, base: string, origen: string): URL | null {
  try {
    const api = new URL(`${base.replace(/\/$/, '')}/api/`, origen);
    const destino = new URL(url, origen);
    return destino.origin === api.origin && destino.pathname.startsWith(api.pathname)
      ? destino
      : null;
  } catch {
    return null;
  }
}

export const interceptorAutenticacion: HttpInterceptorFn = (solicitud, siguiente) => {
  const destino = destinoApi(solicitud.url, configuracionEjecucion.urlApi, window.location.origin);
  if (!destino) {
    return siguiente(solicitud);
  }
  if (destino.pathname.endsWith('/api/salud')) {
    return siguiente(solicitud.clone({ headers: solicitud.headers.delete('Authorization') }));
  }
  const autenticacion = inject(ServicioAutenticacionKeycloak);

  return from(autenticacion.obtenerTokenActualizado()).pipe(
    switchMap((token) =>
      siguiente(
        token
          ? solicitud.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : solicitud.clone({ headers: solicitud.headers.delete('Authorization') }),
      ),
    ),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return throwError(() => autenticacion.notificarSesionCaducada());
      }
      return throwError(() => error);
    }),
  );
};
