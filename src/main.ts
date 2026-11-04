import { bootstrapApplication } from '@angular/platform-browser';
import { configuracionAplicacion } from './app/configuracion-aplicacion';
import { Aplicacion } from './app/aplicacion';
import { mostrarErrorDeArranque } from './error-arranque';

bootstrapApplication(Aplicacion, configuracionAplicacion).catch((err) => {
  console.error(err);
  mostrarErrorDeArranque(document, () => window.location.reload());
});
