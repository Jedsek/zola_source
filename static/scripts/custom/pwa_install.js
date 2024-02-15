const PWAInstallationGuide = () => {
  // @ts-ignore
  let deferredPrompt = 'init';

  // P.S. Cancel WPA installation dialog will trigger beforeinstallprompt
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    if (deferredPrompt === 'init') {
      deferredPrompt = e;
    }

    window.addEventListener('click', () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      deferredPrompt = null;
    });
  });
};

PWAInstallationGuide();
