// Presentation only: the identity provider retains all sign-in behaviour.
(() => {
  const source = document.currentScript;
  if (!source) return;
  const logoUrl = new URL('../img/savia-logo-v2.svg', source.src).href;
  const symbolUrl = new URL('../img/savia-symbol-v2.svg', source.src).href;
  const showBrand = () => {
    const header = document.getElementById('kc-header-wrapper');
    if (header) {
      const logo = document.createElement('img');
      logo.src = logoUrl;
      logo.alt = 'Savia';
      logo.width = 196;
      logo.height = 56;
      header.replaceChildren(logo);
      const brandHeader = header.closest('header');
      const card = document.querySelector('.pf-v5-c-login__main');
      if (brandHeader && card) card.prepend(brandHeader);
    }
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) {
      icon.type = 'image/svg+xml';
      icon.href = symbolUrl;
    }
    // These public fixture accounts are shown only on a loopback development origin.
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    const form = document.getElementById('kc-form-login');
    if (!form) return;
    const accounts = [
      ['Administrador', 'admin@gestoria.local', 'Admin123!'],
      ['Asesor', 'asesor@gestoria.local', 'Asesor123!'],
      ['Cliente', 'cliente@gestoria.local', 'Cliente123!'],
    ];
    const panel = document.createElement('section');
    panel.className = 'savia-demo-accounts';
    panel.setAttribute('aria-label', 'Cuentas locales de prueba');
    const title = document.createElement('h2');
    title.textContent = 'Cuentas de prueba';
    panel.append(title);
    const caption = document.createElement('p');
    caption.textContent = 'Entorno local · elige un perfil para probar la aplicación.';
    panel.append(caption);
    for (const [role, username, password] of accounts) {
      const row = document.createElement('div');
      row.className = 'savia-demo-account';
      const label = document.createElement('strong');
      label.textContent = role;
      const user = document.createElement('code');
      user.textContent = username;
      const secret = document.createElement('code');
      secret.textContent = password;
      const choose = document.createElement('button');
      choose.type = 'button';
      choose.textContent = 'Usar cuenta';
      choose.setAttribute('aria-label', `Usar cuenta de ${role.toLowerCase()}`);
      choose.addEventListener('click', () => {
        const userField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        if (!userField || !passwordField) return;
        userField.value = username;
        passwordField.value = password;
        userField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('kc-login')?.focus();
      });
      row.append(label, user, secret, choose);
      panel.append(row);
    }
    form.after(panel);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBrand, { once: true });
  } else {
    showBrand();
  }
})();
