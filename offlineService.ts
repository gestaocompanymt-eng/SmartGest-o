
import { ServiceOrder } from './types';

const DB_NAME = 'SmartGestaoOfflineDB';
const DB_VERSION = 1;
const OS_STORE = 'pending_service_orders';

/**
 * Inicializa ou abre o banco de dados IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OS_STORE)) {
        db.createObjectStore(OS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
};

/**
 * Salva uma Ordem de Serviço na fila de sincronização offline
 */
export const savePendingOS = async (os: ServiceOrder): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OS_STORE, 'readwrite');
    const store = transaction.objectStore(OS_STORE);
    const osWithStatus = { ...os, sync_status: 'pending' };
    const request = store.put(osWithStatus);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Recupera todas as Ordens de Serviço pendentes de sincronização
 */
export const getPendingOS = async (): Promise<ServiceOrder[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OS_STORE, 'readonly');
    const store = transaction.objectStore(OS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Remove uma Ordem de Serviço da fila após sincronização bem-sucedida
 */
export const removePendingOS = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OS_STORE, 'readwrite');
    const store = transaction.objectStore(OS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
