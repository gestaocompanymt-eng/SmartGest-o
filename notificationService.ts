
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Este navegador não suporta notificações.");
    return false;
  }
  
  if (Notification.permission === "granted") return true;
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const sendLocalNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const options = {
    body,
    icon: 'https://img.icons8.com/fluency/192/maintenance.png',
    badge: 'https://img.icons8.com/fluency/96/maintenance.png',
    vibrate: [200, 100, 200],
  };

  // Se o app estiver em segundo plano ou PWA ativo
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    });
  } else {
    new Notification(title, options);
  }
};
