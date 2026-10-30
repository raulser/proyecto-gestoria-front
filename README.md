# Savia · Flutter

Frontend multiplataforma del proyecto de gestoría. La misma base de código genera:

- aplicación web responsive;
- aplicación Android;
- aplicación iOS (la compilación y firma de iOS requieren macOS con Xcode).

La versión Angular anterior se conserva en la rama `main` y en la etiqueta
`angular-stable-2026-10-29`. El desarrollo Flutter vive en `flutter-migration`.

## Requisitos

- Flutter 3.47.8 estable (el proyecto puede gestionarse con Puro);
- API Java y Keycloak del proyecto para trabajar con datos reales;
- Android SDK para generar APK/AAB;
- macOS y Xcode para generar el binario de iOS.

## Ejecutar en local

```powershell
flutter pub get
flutter run -d chrome --web-port 4200
```

La configuración local se encuentra en `assets/config/app-config.json`. Dentro de
Docker se reescribe al arrancar el contenedor con las variables ya utilizadas por
el `compose.yaml`: `GESTORIA_API_URL`, `GESTORIA_KEYCLOAK_URL`,
`GESTORIA_KEYCLOAK_REALM`, `GESTORIA_KEYCLOAK_CLIENT_ID` y
`GESTORIA_ORGANIZATION_NAME`. `GESTORIA_SUPPORT_EMAIL` es opcional: si no se
configura, el acceso no muestra un contacto ficticio.

## Validación

```powershell
flutter test
flutter analyze
flutter build web --release
flutter build apk --debug
```

Nginx sirve la aplicación web, aplica el fallback de SPA y redirige `/api/` al
contenedor Java. El inicio de sesión usa OpenID Connect con PKCE contra Keycloak,
con almacenamiento seguro de la sesión en Android/iOS.

En web, una visita sin sesión abre directamente el formulario de Keycloak. El
retorno con un error y el cierre de sesión dejan una pantalla de recuperación
con un botón para reintentar; no reinician automáticamente el acceso. Android e
iOS mantienen la apertura del navegador de autenticación por acción del usuario.

El tema de acceso de Savia está versionado en `keycloak-theme/savia`. Compose
debe montar ese directorio en `/opt/keycloak/themes/savia` (solo lectura) y el
realm debe tener `displayName: Savia` y `loginTheme: savia`. El nombre visible en
Flutter usa `GESTORIA_ORGANIZATION_NAME`, cuyo valor predeterminado es `Savia`.
La configuración de identidad conserva los identificadores y esquemas anteriores
para que las cuentas y las redirecciones nativas sigan funcionando.

Los estilos de acceso están en `resources/css/savia-access-v3.css` dentro del
tema. El fondo vectorial y la fuente se sirven desde el propio Keycloak, sin
dependencias externas. Al cambiar el tema montado basta con reiniciar Keycloak;
no es necesario recompilar Flutter. Si se cambia un recurso ya publicado, se
debe versionar su nombre para evitar que el navegador reutilice la copia en caché.

El cliente público de Keycloak debe admitir además estas URI para las apps
nativas:

```text
com.raulser.proyectogestoria:/oauthredirect
com.raulser.proyectogestoria:/
```
