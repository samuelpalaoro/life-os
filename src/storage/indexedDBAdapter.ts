import { AppStateData } from '../types';

const DB_NAME = 'life_os_database';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_RECORD_KEY = 'root_state';

class IndexedDBAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB não é suportado neste ambiente.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error || new Error('Falha ao abrir banco IndexedDB.'));
        };

        request.onblocked = () => {
          console.warn('Abertura do IndexedDB bloqueada por outra aba.');
        };
      });
    }

    return this.dbPromise;
  }

  public async get(): Promise<AppStateData | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(STATE_RECORD_KEY);

        req.onsuccess = () => {
          resolve(req.result || null);
        };

        req.onerror = () => {
          reject(req.error || new Error('Erro ao ler estado do IndexedDB.'));
        };
      });
    } catch (err) {
      console.warn('IndexedDB read fallback:', err);
      return null;
    }
  }

  public async set(data: AppStateData): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, STATE_RECORD_KEY);

        req.onsuccess = () => {
          resolve(true);
        };

        req.onerror = () => {
          reject(req.error || new Error('Erro ao persistir no IndexedDB.'));
        };

        tx.onabort = () => {
          reject(new Error('Transação do IndexedDB abortada.'));
        };
      });
    } catch (err) {
      console.warn('IndexedDB write fallback:', err);
      return false;
    }
  }

  public async clear(): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(STATE_RECORD_KEY);

        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB clear error:', err);
      return false;
    }
  }
}

export const indexedDBAdapter = new IndexedDBAdapter();
