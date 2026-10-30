# Marca de Savia

`savia-logo.svg` y `savia-symbol.svg` son las fuentes vectoriales editables.
El símbolo y las letras están trazados como curvas, sin depender de una fuente
instalada o de servicios externos. El nombre accesible se conserva en la web
y en Flutter.

El tema de Keycloak usa el SVG completo; Flutter usa los PNG transparentes a
cuatro veces su tamaño de diseño. `savia-logo-light.png` conserva el símbolo
y cambia las letras a blanco para las cabeceras oscuras. Los iconos de pestaña
y aplicación web utilizan solo el símbolo para mantenerlo legible.

Para regenerar las copias y los PNG, ejecutar `node tool/build-brand.cjs` con
Sharp disponible. Si está instalado fuera del proyecto, `SAVIA_SHARP_MODULE`
puede apuntar a su directorio. Después hay que recompilar Flutter y reiniciar
Keycloak si se han cambiado los recursos montados. Los nombres publicados en
Keycloak y web se versionan al cambiar su contenido para invalidar la caché.

`gestoria-symbol.png` es un recurso histórico que ya no usa la aplicación.
