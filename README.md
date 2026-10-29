# Portal Gestoría · Flutter

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

El cliente público de Keycloak debe admitir además estas URI para las apps
nativas:

```text
com.raulser.proyectogestoria:/oauthredirect
com.raulser.proyectogestoria:/
```
