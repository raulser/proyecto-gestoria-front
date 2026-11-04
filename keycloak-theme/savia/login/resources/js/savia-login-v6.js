// Layout and local fixtures only. Keycloak owns credentials, validation and redirects.
(() => {
  const script = document.currentScript;
  if (!script) return;
  const asset = (name) => new URL('../img/' + name, script.src).href;
  const initialise = () => {
    const main = document.querySelector('.pf-v5-c-login__main');
    const container = document.querySelector('.pf-v5-c-login__container');
    if (!main || !container) return;
    const header = document.getElementById('kc-header-wrapper');
    if (header) {
      const logo = Object.assign(document.createElement('img'), {
        src: asset('savia-logo-v3.svg'),
        alt: 'Savia',
        width: 154,
        height: 48,
      });
      header.replaceChildren(logo);
      const brandHeader = header.closest('header');
      if (brandHeader) main.prepend(brandHeader);
    }
    const identity = document.createElement('aside');
    identity.className = 'savia-identity';
    identity.setAttribute('aria-hidden', 'true');
    const brand = Object.assign(document.createElement('img'), {
      src: asset('savia-logo-light-v3.svg'),
      alt: '',
      className: 'savia-wordmark',
    });
    const art = Object.assign(document.createElement('img'), {
      src: asset('savia-flow-v3.svg'),
      alt: '',
      className: 'savia-art',
    });
    const footer = document.createElement('p');
    footer.innerHTML = '<span>El espacio de tu gestoría.</span><span>Gestoría · Clientes</span>';
    identity.append(brand, art, footer);
    container.prepend(identity);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.type = 'image/svg+xml';
      favicon.href = asset('savia-symbol-v3.svg');
    }
    const form = document.getElementById('kc-form-login');
    if (!form) return;
    const caption = document.createElement('p');
    caption.className = 'savia-login-caption';
    caption.innerHTML = '<span aria-hidden="true"></span>Accede con la cuenta de tu gestoría.';
    document.querySelector('.pf-v5-c-login__main-header')?.append(caption);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    const accounts = [
      ['Administrador', 'admin@gestoria.local', 'Admin123!'],
      ['Gestor', 'asesor@gestoria.local', 'Asesor123!'],
      ['Cliente', 'cliente@gestoria.local', 'Cliente123!'],
    ];
    const panel = document.createElement('section');
    panel.className = 'savia-demo-accounts';
    panel.setAttribute('aria-label', 'Cuentas locales de prueba');
    const heading = document.createElement('div');
    heading.className = 'savia-demo-heading';
    heading.innerHTML = '<h2>Prueba un perfil</h2><span>SOLO LOCAL</span>';
    const profiles = document.createElement('div');
    profiles.className = 'savia-profiles';
    profiles.setAttribute('role', 'group');
    profiles.setAttribute('aria-label', 'Perfiles de demostración');
    const status = document.createElement('p');
    status.className = 'savia-demo-status';
    status.textContent = 'Elige un perfil para rellenar el formulario.';
    status.setAttribute('role', 'status');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Ver usuarios y contraseñas';
    details.append(summary);
    const credentials = document.createElement('div');
    credentials.className = 'savia-credentials';
    for (const [role, username, password] of accounts) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = role;
      button.setAttribute('aria-label', `Usar cuenta de ${role.toLowerCase()}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const userField = document.getElementById('username'),
          passwordField = document.getElementById('password');
        if (!userField || !passwordField) return;
        userField.value = username;
        passwordField.value = password;
        userField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        for (const option of profiles.querySelectorAll('button'))
          option.setAttribute('aria-pressed', String(option === button));
        status.textContent = `${role} seleccionado. Pulsa Iniciar sesión.`;
        document.getElementById('kc-login')?.focus();
      });
      profiles.append(button);
      const row = document.createElement('div'),
        label = document.createElement('strong'),
        credential = document.createElement('code');
      label.textContent = role;
      credential.textContent = `${username} · ${password}`;
      row.append(label, credential);
      credentials.append(row);
    }
    details.append(credentials);
    panel.append(heading, profiles, status, details);
    form.after(panel);
  };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
