export class ErrorSesionCaducada extends Error {
  constructor() {
    super('Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.');
    this.name = 'ErrorSesionCaducada';
  }
}

export class ErrorConexionSesion extends Error {
  constructor(cause: unknown) {
    super('No se pudo comprobar tu sesión. Revisa la conexión y vuelve a intentarlo.', { cause });
    this.name = 'ErrorConexionSesion';
  }
}
