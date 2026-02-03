
// Serviço de notificações removido permanentemente.
export const requestNotificationPermission = async (): Promise<boolean> => {
  return false;
};

export const sendLocalNotification = (title: string, body: string) => {
  // Operação desativada
};

export const checkNotificationSupport = () => {
  return {
    supported: false,
    permission: 'denied',
    isPWA: false,
    requiresInstallation: false
  };
};
