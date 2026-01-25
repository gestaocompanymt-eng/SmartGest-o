
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    alert("Este navegador não suporta notificações nativas.");
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("SmartGestão: Permissão de notificação concedida.");
      return true;
    } else {
      console.warn("SmartGestão: Permissão de notificação negada pelo usuário.");
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
    console.warn("SmartGestão: Tentativa de envio sem permissão concedida.");
    return;
  }

  // Fix: Using 'any' type for options because properties like 'vibrate', 'badge', and 'renotify' 
  // are available in ServiceWorker NotificationOptions but might be missing from standard DOM types.
  const options: any = {
    body,
    icon: 'https://img.icons8.com/fluency/192/maintenance.png',
    badge: 'https://img.icons8.com/fluency/96/maintenance.png',
    vibrate: [200, 100, 200],
    tag: 'smartgestao-notification', // Evita empilhar notificações iguais
    renotify: true
  };

  // Prioriza o Service Worker para garantir que funcione em segundo plano (PWA)
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    }).catch(err => {
      console.error("Erro no Service Worker ready:", err);
      new Notification(title, options);
    });
  } else {
    // Fallback para quando o app está aberto no navegador comum
    try {
      new Notification(title, options);
    } catch (e) {
      console.error("Erro ao disparar notificação simples:", e);
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
