import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';

const usuarios = {
  admin: { usuario: 'admin@gestoria.local', clave: 'Admin123!' },
  gestor: { usuario: 'asesor@gestoria.local', clave: 'Asesor123!' },
  cliente: { usuario: 'cliente@gestoria.local', clave: 'Cliente123!' },
};

async function iniciarSesion(page: Page, perfil: keyof typeof usuarios): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Correo o usuario').fill(usuarios[perfil].usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(usuarios[perfil].clave);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect
    .poll(() => new URL(page.url()).origin)
    .toBe(new URL(process.env['GESTORIA_E2E_URL'] ?? 'http://localhost:8090').origin);
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

test('el login mantiene el formulario y el botón visibles en una ventana baja', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 620 });
  await page.goto('/');
  await expect(page.getByLabel('Correo o usuario')).toBeInViewport({ ratio: 1 });
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeInViewport({
    ratio: 1,
  });
});

test('administración: panel de trabajo e importación validada', async ({ page }) => {
  await iniciarSesion(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Panel de trabajo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Almacenamiento' })).toBeVisible();

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

test('gestor: distingue petición documental de obligación fiscal', async ({ page }) => {
  await iniciarSesion(page, 'gestor');
  await expect(page.locator('.sidebar').getByText('Gestor', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Solicitudes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Peticiones de documentación' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ayuda con los estados', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Equipo', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Documentos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Documentos', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Cliente', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Año', exact: true })).toBeVisible();
  await expect(page.getByText('Comprueba quién lo aportó y quién puede verlo')).toHaveCount(0);
  await expect(page.locator('app-repositorio-documental .seleccion')).toHaveCount(0);
  await expect(page.getByText('Viendo una petición concreta')).toHaveCount(0);
  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Filtros avanzados' })).toBeVisible();

  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Cartera de clientes/ })).toBeVisible();
  await comprobarAccesibilidad(page);
});

test('cliente: entiende la entrega y conserva acceso a su expediente', async ({ page }) => {
  await iniciarSesion(page, 'cliente');
  await expect(
    page.locator('.sidebar').getByRole('button', { name: 'Mi expediente', exact: true }),
  ).toBeVisible();
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Mi expediente', exact: true })
    .click();
  await expect(page.locator('app-resumen-expediente-cliente h2')).toContainText('Cliente');
  await expect(page.getByText('Listado', { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder('Buscar por nombre, NIF o email')).toHaveCount(0);

  await page.getByRole('button', { name: 'Lo que debo entregar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Ayuda con los estados', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Equipo' })).toHaveCount(0);
  await comprobarAccesibilidad(page);
});

test('la sesión perdida redirige al login y explica el motivo sin modales', async ({
  page,
  context,
}) => {
  await iniciarSesion(page, 'admin');
  const otraPestana = await context.newPage();
  await otraPestana.goto('/');
  await expect(
    otraPestana.getByRole('heading', { name: 'Panel de trabajo', exact: true }),
  ).toBeVisible();
  await otraPestana.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();

  await expect(
    page.getByText('Se ha perdido la sesión. Inicia sesión de nuevo.', { exact: true }),
  ).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Correo o usuario').fill(usuarios.admin.usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(usuarios.admin.clave);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Panel de trabajo', exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.has('sesion')).toBe(false);
  await expect(page.locator('.centro-feedback .mensaje')).toHaveCount(0);
  await otraPestana.close();
});

test('@mobile móvil: muestra etiquetas y mantiene las opciones secundarias accesibles', async ({
  page,
}) => {
  await iniciarSesion(page, 'admin');
  await expect(page.getByRole('button', { name: 'Panel', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Documentos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await page
    .getByRole('region', { name: 'Más opciones' })
    .getByRole('button', { name: 'Plan y uso' })
    .click();
  await expect(page.getByRole('heading', { name: 'Plan y consumo', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Más opciones' })).toHaveCount(0);
});
