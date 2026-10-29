export interface ConfiguracionEjecucionGestoria {
  urlApi: string;
  urlKeycloak: string;
  reinoKeycloak: string;
  idClienteKeycloak: string;
  nombreProveedor: string;
  nifProveedor: string;
  emailPrivacidad: string;
  emailSoporte: string;
  horarioSoporte: string;
  versionPrivacidad: string;
}

declare global {
  interface Window {
    __GESTORIA_CONFIG__?: Partial<ConfiguracionEjecucionGestoria>;
  }
}

export const configuracionEjecucion: ConfiguracionEjecucionGestoria = {
  urlApi: window.__GESTORIA_CONFIG__?.urlApi ?? 'http://localhost:30001',
  urlKeycloak: window.__GESTORIA_CONFIG__?.urlKeycloak ?? 'http://localhost:8081',
  reinoKeycloak: window.__GESTORIA_CONFIG__?.reinoKeycloak ?? 'gestoria',
  idClienteKeycloak: window.__GESTORIA_CONFIG__?.idClienteKeycloak ?? 'gestoria-web',
  nombreProveedor:
    window.__GESTORIA_CONFIG__?.nombreProveedor ?? 'Proveedor pendiente de configurar',
  nifProveedor: window.__GESTORIA_CONFIG__?.nifProveedor ?? 'NIF pendiente de configurar',
  emailPrivacidad: window.__GESTORIA_CONFIG__?.emailPrivacidad ?? 'privacidad@example.com',
  emailSoporte: window.__GESTORIA_CONFIG__?.emailSoporte ?? 'soporte@example.com',
  horarioSoporte:
    window.__GESTORIA_CONFIG__?.horarioSoporte ?? 'Laborables de 09:00 a 18:00 (Europe/Madrid)',
  versionPrivacidad: window.__GESTORIA_CONFIG__?.versionPrivacidad ?? '2026-08-13',
};
