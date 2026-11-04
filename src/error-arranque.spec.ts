import { mostrarErrorDeArranque } from './error-arranque';

describe('Error de arranque', () => {
  it('sustituye la espera por un aviso accesible y permite reintentar', () => {
    const documento = document.implementation.createHTMLDocument();
    const raiz = documento.createElement('app-root');
    raiz.textContent = 'Abriendo Savia…';
    documento.body.append(raiz);
    const reintentar = vi.fn();

    mostrarErrorDeArranque(documento, reintentar);

    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('No se pudo abrir Savia');
    expect(raiz.textContent).not.toContain('Abriendo Savia…');
    raiz.querySelector<HTMLButtonElement>('button')!.click();
    expect(reintentar).toHaveBeenCalledOnce();
  });
});
