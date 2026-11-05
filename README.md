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

En Docker, `http://127.0.0.1:8090` redirige a `http://localhost:8090`, conservando
la ruta, el puerto publicado y los parámetros del enlace. El acceso local usa
`localhost` de forma consistente con las redirecciones autorizadas de Keycloak.
Si la inicialización falla, se muestra un mensaje con reintento en lugar de dejar
la pantalla vacía.
El tema del acceso elimina los márgenes heredados del logo y compacta sus
espaciados en ventanas de poca altura para mantener visible el botón de entrada.

## Acceso desde la misma red

Con Docker Desktop arrancado y PowerShell 7, desde este repositorio:

```powershell
./ops/lan/iniciar.ps1
# Para seleccionar la tarjeta de red o cambiar los puertos:
./ops/lan/iniciar.ps1 -Ip 192.168.1.43 -Puerto 8090 -PuertoCertificado 8092
```

El script imprime la dirección HTTPS de la aplicación y la dirección HTTP de
preparación de Android. Esta segunda página permite descargar únicamente el
certificado público e incluye los pasos de instalación. El móvil debe estar en
la misma Wi-Fi. El PC y Docker deben permanecer encendidos. La configuración es
de desarrollo; no abre puertos del router ni configura acceso desde Internet.

El acceso local del PC sigue en `http://localhost:8090`. En la IP de la red se
utiliza HTTPS, aunque coincida el número de puerto: el navegador considera
`localhost` un contexto seguro especial, pero no una IP LAN por HTTP. El adaptador
Keycloak necesita Web Crypto para el flujo con PKCE. Véanse los
[contextos seguros del navegador](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)
y la [configuración del hostname de Keycloak](https://www.keycloak.org/server/hostname).

El override `ops/lan/compose.lan.yaml` añade un proxy Nginx publicado exclusivamente
en la IP elegida. La base de datos, MinIO y la administración de Keycloak mantienen
sus enlaces a loopback. El proxy solo publica el realm `gestoria` y sus recursos;
los endpoints administrativos, el realm `master` y la salud de Keycloak no se
publican. Se autorizan en el cliente OIDC solo la URL exacta de este entorno y
sus rutas, conservando las redirecciones locales existentes y PKCE S256.

La CA y la clave del servidor se generan localmente. La clave de la CA no es
exportable y permanece en el almacén del usuario de Windows. Los PEM del servidor,
el entorno generado y los metadatos se guardan en `../storage/lan`, fuera de este
repositorio y con permisos restringidos. El certificado público de la CA se
instala en las raíces del usuario de Windows y, una vez, en el Android de prueba.
La página muestra su huella SHA-256. Se puede retirar después desde los almacenes
de confianza de ambos dispositivos. Las instrucciones de Android pueden variar
según el fabricante: [ayuda oficial de Google](https://support.google.com/pixelphone/answer/2844832?hl=es).

Si Windows bloquea el acceso de Docker y no existe una regla de entrada para
Docker Desktop, ejecutar en PowerShell **como administrador**:

```powershell
./ops/lan/iniciar.ps1 -ConfigurarFirewall
```

Ese parámetro añade reglas solo para los dos puertos, la IP, la interfaz y la
subred local. No desactiva el firewall ni modifica las reglas previas de Docker.
Una Wi-Fi de invitados puede aislar los dispositivos aunque compartan el router.
Si cambia la IP del PC, repetir `iniciar.ps1` y utilizar la nueva dirección;
mantiene la misma CA mientras siga vigente, y renueva el certificado del servidor.

Mientras se use LAN, arrancar con este script para conservar las URLs públicas
coherentes entre Keycloak, la API y Angular. No modifica el `.env` base ni los
datos. `./ops/lan/verificar.ps1` comprueba TLS, las URLs OIDC, la protección de la
API, los bloqueos de rutas internas y el certificado descargable.
Para volver al arranque exclusivamente local:

```powershell
./ops/lan/parar.ps1
```

El script retira la URL LAN del cliente OIDC, elimina el proxy LAN y restaura la
configuración local de los servicios. Si se crearon reglas de firewall con el
parámetro anterior, ejecutar también la parada como administrador. Conserva los
certificados para reutilizarlos. Al cambiar entre ambos modos habrá que iniciar
sesión de nuevo.

## Manual de usuario

La sesión se renueva antes de las peticiones protegidas. Si Keycloak rechaza la
renovación o la API devuelve 401, el portal muestra un único aviso con «Iniciar
sesión» y bloquea nuevos envíos hasta recuperar el acceso. No repite operaciones
automáticamente. Un fallo de red permite reintentar y no cierra la sesión; la
comprobación pública de salud funciona sin enviar credenciales. El token solo se
adjunta a la ruta y al origen configurados para la API.

Ayuda muestra un manual adaptado al perfil: cliente, gestor o administrador
(incluye administración de plataforma). El lector permite buscar sin acentos,
cambiar de capítulo y volver al flujo de trabajo desde su acceso directo.
«Ayuda con los estados» en Solicitudes abre el capítulo correspondiente.
Cuenta, soporte y privacidad quedan disponibles en un desplegable separado.

«Ver PDF» permite visualizarlo dentro de Ayuda con PDF.js, navegación por páginas
y ampliación; también se puede abrir en otra pestaña o descargar. El motor y su
worker se sirven desde la aplicación y se cargan al abrir el visor. El lector HTML
permanece disponible para buscar y leer por capítulos. Los tres documentos incluyen índice enlazado y
marcadores. El contenido de ambas versiones sale de
`src/app/ayuda/manuales.json`; al modificarlo, regenerar los PDF:

```powershell
python scripts/generar-manuales.py
```

El generador requiere `reportlab` y `pypdf`, y usa Segoe UI en Windows. En otros
sistemas se puede indicar `--fuentes /ruta/familia`, con `Regular.ttf` y
`Bold.ttf`. Los archivos se publican desde `public/manuales`. Revisar sus páginas
renderizadas antes de publicar cambios en el contenido o la maquetación.

El selector de cuentas de prueba del login se habilita en loopback o mediante
`SAVIA_DEMO_ACCOUNTS=true` en Keycloak. El override LAN activa esta opción para
las pruebas desde otros dispositivos; la configuración base no la activa.

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
