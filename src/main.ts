import { bootstrapApplication } from '@angular/platform-browser';
import { configuracionAplicacion } from './app/configuracion-aplicacion';
import { Aplicacion } from './app/aplicacion';

bootstrapApplication(Aplicacion, configuracionAplicacion).catch((err) => console.error(err));
