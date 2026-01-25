
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações.");
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("SmartGestão: Permissão de notificação concedida.");
      return true;
    } else {
      console.warn("SmartGestão: Permissão de notificação negada.");
      return false;
    }
  } catch (error) {
    console.error("SmartGestão: Erro ao solicitar permissão:", error);
    return false;
  }
};

export const sendLocalNotification = (title: string, body: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    console.warn("SmartGestão: Tentativa de envio sem permissão.");
    return;
  }

  // Usamos 'any' para evitar erros de tipagem com propriedades estendidas como 'vibrate' e 'badge'
  const options: any = {
    body,
    icon: 'https://img.icons8.com/fluency/192/maintenance.png',
    badge: 'https://img.icons8.com/fluency/96/maintenance.png',
    vibrate: [200, 100, 200],
    tag: 'smartgestao-notif',
    renotify: true
  };

  // No celular/PWA, notificações funcionam melhor através do Service Worker
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    }).catch(err => {
      console.error("Erro no Service Worker para notificação:", err);
      new Notification(title, options);
    });
  } else {
    try {
      new Notification(title, options);
    } catch (e) {
      console.error("Fallback de notificação falhou:", e);
    }
  }
};

export const checkNotificationSupport = () => {
  return {
    supported: "Notification" in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    isPWA: window.matchMedia('(display-mode: standalone)').matches
  };
};
