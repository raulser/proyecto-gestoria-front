import { Component, input, model } from '@angular/core';
import { LucideFileText, LucideSettings, LucideUsers } from '@lucide/angular';
import { Rol } from '../modelos-aplicacion';

let siguienteGrupo = 0;

@Component({
  selector: 'app-selector-perfil',
  imports: [LucideFileText, LucideSettings, LucideUsers],
  templateUrl: './selector-perfil.component.html',
  styleUrl: './selector-perfil.component.scss',
})
export class SelectorPerfilComponent {
  readonly valor = model<Rol>('ASESOR');
  readonly deshabilitado = input(false);
  readonly grupo = `perfil-usuario-${++siguienteGrupo}`;
  readonly perfiles = [
    { valor: 'ADMIN' as const, nombre: 'Administrador', detalle: 'Equipo, clientes y configuración' },
    { valor: 'ASESOR' as const, nombre: 'Gestor', detalle: 'Trabaja con sus clientes asignados' },
    { valor: 'CLIENTE' as const, nombre: 'Cliente', detalle: 'Accede a su propio expediente' },
  ];
}
