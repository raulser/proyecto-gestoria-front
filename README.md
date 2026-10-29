# Proyecto Gestoría · Frontend

Aplicación Angular 21 para administradores, asesores y clientes.

## Vistas

- Panel con métricas, notificaciones, agenda fiscal y estado trimestral.
- Clientes y expediente propio/asignado.
- Ficha fiscal guiada con propuestas explicadas, calendario y configuración manual separada.
- Solicitudes, checklist, conversación, envío y reapertura.
- Repositorio histórico con filtros de origen, periodo, categoría y visibilidad.
- Subida múltiple de PDF/JPEG/PNG, libre o asociada a una solicitud.
- Equipo, asignaciones, plan, auditoría y marca para administradores.
- Estado de API e identidad de la sesión.

## Arranque local

```powershell
pnpm install
pnpm start -- --host 127.0.0.1 --port 4200
```

La aplicación queda en `http://localhost:4200` y usa la API configurada en `public/config.js`. Para el recorrido integrado se recomienda arrancar toda la pila desde la raíz con `docker compose up --build` y acceder a `http://localhost:8080`.

## Calidad

```powershell
pnpm exec ng test --no-progress --coverage --watch=false
pnpm build
pnpm audit --prod
```

La batería automatizada cubre lógica de negocio, autenticación, formularios y componentes; los recorridos E2E con Playwright y axe validan los tres perfiles y la vista móvil.

```bash
pnpm test:coverage --watch=false
pnpm test:e2e
```

Los recorridos E2E cubren los tres perfiles y una vista móvil. Incluyen comprobación WCAG automática sin infracciones graves o críticas.
