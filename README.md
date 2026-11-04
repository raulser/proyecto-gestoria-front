# Proyecto Gestoría · Frontend

Aplicación Angular 21 para administradores, gestores y clientes.

Se continúa el desarrollo en `main`. La alternativa Flutter permanece conservada
en `flutter-migration` y no se utiliza para construir ni arrancar esta rama.
El acceso conserva el tema de Savia en `keycloak-theme/savia`, montado por Compose
en `/opt/keycloak/themes/savia`. El realm debe usar `loginTheme: savia`.

Cuando no hay sesión, el portal abre directamente el formulario de Keycloak.
El diseño del acceso y de recuperación comparte la identidad de Savia. En local,
los botones Administrador, Gestor y Cliente rellenan los datos de demostración;
«Ver usuarios y contraseñas» permite consultarlos. Es necesario pulsar **Iniciar
sesión** para acceder. Estas ayudas solo se muestran en un host loopback.

El panel presenta tareas fiscales, entregas y fechas configuradas en los planes
documentales, junto con facturas del ejercicio y consumo de almacenamiento por
cliente. La cuota del plan corresponde a la gestoría y se muestra a sus
administradores; el consumo conserva las versiones retenidas. Los clientes ven
únicamente los agregados de sus archivos visibles.

El directorio tiene búsqueda por nombre, NIF o correo, filtros de estado y una
ficha lateral con acceso a documentos, obligaciones y configuración. Las vistas
de panel, directorio y alta se cargan cuando se necesitan.

En móvil, la barra inferior mantiene cuatro destinos con etiquetas y agrupa las
opciones secundarias en «Más». El área de contenido reserva el espacio de la barra
y la zona segura del dispositivo. La marca comparte los mismos SVG en el portal
y Keycloak; `scripts/generar-marca.ps1` permite regenerar sus contornos vectoriales.
El generador usa `fonttools` como dependencia de desarrollo (`python -m pip install
fonttools`). La tipografía [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope)
se sirve localmente con su licencia en `public/fonts/Manrope-OFL.txt`; el logo se
exporta a contornos SVG y no necesita fuentes instaladas en el equipo.
La paleta violeta/coral y el recurso del acceso están documentados, junto con el
prompt de generación, en [docs/identidad-v6.md](docs/identidad-v6.md).

## Vistas

- Panel con métricas, notificaciones, agenda fiscal y estado trimestral.
- Clientes y expediente propio/asignado.
- Alta y edición en tres pasos: tarjetas de tipo, plan documental individual y revisión.
- Documentos propios, periodicidad mensual/trimestral/anual/puntual o sin vencimiento, fechas y recordatorios editables.
- Ficha fiscal guiada con propuestas explicadas, calendario y configuración manual separada.
- Solicitudes, checklist, conversación, envío y reapertura.
- Repositorio histórico con filtros de origen, periodo, categoría y visibilidad.
- Subida múltiple de PDF/JPEG/PNG, libre o asociada a una solicitud.
- Equipo, asignaciones, plan, auditoría y marca para administradores.
- Estado de API e identidad de la sesión.

El plan documental se guarda con cada cliente. Las propuestas iniciales se copian;
modificarlas no altera otros clientes. «Otro» permite dar nombre al tipo y empezar
un plan vacío. Las fechas sugeridas son de entrega documental, no plazos fiscales.
La documentación sin vencimiento no genera solicitudes automáticas. Para recibir
avisos debe existir una cuenta activa de cliente, creada desde la administración.

## Arranque local

```powershell
pnpm install
pnpm start -- --host 127.0.0.1 --port 4200
```

La aplicación queda en `http://localhost:4200` y usa la API configurada en `public/config.js`. Para el recorrido integrado se recomienda arrancar toda la pila desde la raíz con `docker compose up --build` y acceder a `http://localhost:8090`. Keycloak utiliza `http://localhost:8091`.

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
