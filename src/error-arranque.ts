export function mostrarErrorDeArranque(documento: Document, reintentar: () => void): void {
  const raiz = documento.querySelector('app-root');
  if (!raiz) return;

  const panel = documento.createElement('section');
  panel.className = 'estado-arranque';
  panel.setAttribute('role', 'alert');

  const logo = documento.createElement('img');
  logo.src = 'savia-logo-v6.svg';
  logo.alt = 'Savia';
  logo.width = 148;
  logo.height = 44;

  const titulo = documento.createElement('h1');
  titulo.textContent = 'No se pudo abrir Savia';
  const detalle = documento.createElement('p');
  detalle.textContent = 'No se ha podido iniciar la aplicación. Vuelve a intentarlo.';
  const boton = documento.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Volver a intentar';
  boton.addEventListener('click', reintentar);

  panel.append(logo, titulo, detalle, boton);
  raiz.replaceChildren(panel);
}
