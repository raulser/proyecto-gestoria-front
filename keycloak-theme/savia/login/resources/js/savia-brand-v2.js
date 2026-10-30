// Presentation only: the identity provider retains all sign-in behaviour.
(() => {
  const source = document.currentScript;
  if (!source) return;
  const logoUrl = new URL('../img/savia-logo-v1.svg', source.src).href;
  const symbolUrl = new URL('../img/savia-symbol-v1.svg', source.src).href;
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
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBrand, { once: true });
  } else {
    showBrand();
  }
})();
