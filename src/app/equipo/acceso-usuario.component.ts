import { Component, input, output } from '@angular/core';
import { RespuestaUsuario } from '../modelos-aplicacion';

@Component({
  selector: 'app-acceso-usuario',
  templateUrl: './acceso-usuario.component.html',
  styleUrl: './acceso-usuario.component.scss',
})
export class AccesoUsuarioComponent {
  readonly usuario = input.required<RespuestaUsuario>();
  readonly perfil = input.required<string>();
  readonly cuentaPropia = input(false);
  readonly guardando = input(false);
  readonly dobleFactor = output<void>();
  readonly restablecer = output<void>();
  readonly acceso = output<void>();
}
