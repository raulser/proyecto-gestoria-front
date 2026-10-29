import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';

import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';
import { configuracionEjecucion } from './configuracion-ejecucion';

export const interceptorAutenticacion: HttpInterceptorFn = (solicitud, siguiente) => {
  const autenticacion = inject(ServicioAutenticacionKeycloak);
  if (!solicitud.url.startsWith(configuracionEjecucion.urlApi)) {
    return siguiente(solicitud);
  }

  return from(autenticacion.obtenerTokenActualizado()).pipe(
    switchMap((token) =>
      siguiente(
        token ? solicitud.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : solicitud,
      ),
    ),
  );
};
