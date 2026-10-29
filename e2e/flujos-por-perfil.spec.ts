import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const usuarios = {
  admin: { usuario: 'admin@gestoria.local', clave: 'Admin123!' },
  asesor: { usuario: 'asesor@gestoria.local', clave: 'Asesor123!' },
  cliente: { usuario: 'cliente@gestoria.local', clave: 'Cliente123!' },
};

async function iniciarSesion(page: Page, perfil: keyof typeof usuarios): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar con Keycloak' }).click();
  await page.getByLabel('Usuario o email').fill(usuarios[perfil].usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(usuarios[perfil].clave);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/localhost:8080/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function comprobarAccesibilidad(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).analyze();
  const graves = resultado.violations.filter(
    (violacion) => violacion.impact === 'critical' || violacion.impact === 'serious',
  );
  expect(
    graves,
    graves.map((violacion) => `${violacion.id}: ${violacion.help}`).join('\n'),
  ).toEqual([]);
}

test('administración: equipo, carga de trabajo e importación validada', async ({ page }) => {
  await iniciarSesion(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Panel de asesoría' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carga del equipo' })).toBeVisible();

  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await page.getByText('Importar varios clientes desde CSV').click();
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: 'clientes.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'nombre;nif;email;telefono;tipo\nCliente E2E;B87654321;e2e@test.local;600000000;EMPRESA',
    ),
  });
  await expect(page.getByText('1 clientes preparados')).toBeVisible();
  await comprobarAccesibilidad(page);
});

test('asesor: distingue petición documental de obligación fiscal', async ({ page }) => {
  await iniciarSesion(page, 'asesor');
  await page.getByRole('button', { name: 'Solicitudes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Peticiones de documentación' })).toBeVisible();
  await expect(
    page.getByText('Petición documental y obligación fiscal son cosas distintas'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Equipo', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
  const editor = page.getByRole('dialog');
  await expect(editor.getByRole('heading', { name: 'Editar solicitud' })).toBeVisible();
  await expect(editor.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(editor).toHaveCount(0);

  await page.getByRole('button', { name: 'Ver documentos', exact: true }).first().click();
  await expect(page.getByText('Viendo una petición concreta')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver todo el repositorio' })).toBeVisible();

  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await expect(page.getByText('Viendo una petición concreta')).toHaveCount(0);
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Filtros avanzados' })).toBeVisible();

  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Obligaciones', exact: true }).first().click();
  await expect(page.getByRole('navigation', { name: 'Secciones de la ficha del cliente' })).toBeVisible();
  await expect(page.getByText('Configuración fiscal', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Obligaciones recomendadas' })).toBeVisible();
  await comprobarAccesibilidad(page);
});

test('cliente: entiende la entrega y conserva acceso a su expediente', async ({ page }) => {
  await iniciarSesion(page, 'cliente');
  await expect(page.getByRole('button', { name: 'Mi expediente' })).toBeVisible();
  await page.getByRole('button', { name: 'Mi expediente' }).click();
  await expect(page.locator('app-resumen-expediente-cliente h2')).toContainText('Cliente');
  await expect(page.getByText('Listado', { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder('Buscar por nombre, NIF o email')).toHaveCount(0);

  await page.getByRole('button', { name: 'Lo que debo entregar', exact: true }).click();
  await expect(page.getByText('Puedes añadir tantas facturas como necesites')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Equipo' })).toHaveCount(0);
  await comprobarAccesibilidad(page);
});

test('@mobile móvil: todos los iconos del menú y el cierre de sesión tienen nombre', async ({
  page,
}) => {
  await iniciarSesion(page, 'admin');
  await expect(page.getByRole('button', { name: 'Panel', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Documentos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});
