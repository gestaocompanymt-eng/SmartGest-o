
// Serviço de notificações desativado para garantir estabilidade do salvamento de dados
export const requestNotificationPermission = async (): Promise<boolean> => {
  return false;
};

export const sendLocalNotification = (title: string, body: string) => {
  console.log("Notificação (Desativada):", title, body);
};

export const checkNotificationSupport = () => {
  return {
    supported: false,
    permission: 'denied',
    isPWA: false,
    requiresInstallation: false
  };
};
