import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { interceptorAutenticacion } from './interceptor-autenticacion';
import { ServicioAutenticacionKeycloak } from './servicio-autenticacion-keycloak';
import { rutas } from './rutas-aplicacion';

export const configuracionAplicacion: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(rutas),
    provideHttpClient(withInterceptors([interceptorAutenticacion])),
    provideAppInitializer(() => inject(ServicioAutenticacionKeycloak).inicializar()),
  ],
};
