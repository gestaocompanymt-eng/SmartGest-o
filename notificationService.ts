
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações.");
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Erro ao solicitar permissão:", error);
    return false;
  }
};

export const sendLocalNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.warn("Sem permissão ou suporte para notificações.");
    return;
  }

  // Changed type to any to support ServiceWorker specific notification options like vibrate and badge
  const options: any = {
    body,
    icon: 'https://img.icons8.com/fluency/192/maintenance.png',
    badge: 'https://img.icons8.com/fluency/96/maintenance.png',
    vibrate: [200, 100, 200],
    tag: 'smartgestao-alert',
    renotify: true,
    data: {
      url: window.location.href
    }
  };

  // No mobile, showNotification via Service Worker é o único método confiável
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    }).catch(() => {
      // Fallback para desktop se o SW falhar
      new Notification(title, options);
    });
  } else {
    new Notification(title, options);
  }
};

export const checkNotificationSupport = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return {
    supported: "Notification" in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    isPWA: isStandalone,
    requiresInstallation: isIOS && !isStandalone
  };
};
