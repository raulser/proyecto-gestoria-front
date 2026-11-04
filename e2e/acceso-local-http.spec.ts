import { expect, test } from '@playwright/test';

const base = new URL(process.env['GESTORIA_E2E_URL'] ?? 'http://localhost:8090');
test.skip(
  !['localhost', '127.0.0.1'].includes(base.hostname),
  'Comprobación del alias local de Docker',
);

test('la IP redirige a localhost conservando ruta, puerto y solicitud', async ({ request }) => {
  const url = new URL('/expediente/?solicitud=31&nombre=a%20b', base);
  url.hostname = '127.0.0.1';
  const respuesta = await request.get(url.href, { maxRedirects: 0 });
  url.hostname = 'localhost';
  expect(respuesta.status()).toBe(308);
  expect(respuesta.headers()['location']).toBe(url.href);
});

test('localhost sirve el arranque sin bucles de redirección', async ({ request }) => {
  const url = new URL('/', base);
  url.hostname = 'localhost';
  const respuesta = await request.get(url.href, { maxRedirects: 0 });
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['location']).toBeUndefined();
  expect(await respuesta.text()).toContain('Abriendo Savia');
});

test('la normalización no redirige otros nombres de host', async ({ request }) => {
  const respuesta = await request.get(base.href, {
    maxRedirects: 0,
    headers: { Host: 'savia.example.test' },
  });
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['location']).toBeUndefined();
});
