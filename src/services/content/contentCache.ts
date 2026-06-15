const databaseName = 'baptistone-content-cache';
const databaseVersion = 1;
const storeNames = ['bibleTranslations', 'hymnal'] as const;

export type ContentCacheStore = (typeof storeNames)[number];

export interface ContentCacheItem<TValue> {
  id: string;
  version: string;
  cachedAt: string;
  value: TValue;
}

let databasePromise: Promise<IDBDatabase> | null = null;

const canUseIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

const openDatabase = () => {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is unavailable.'));
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;

      for (const storeName of storeNames) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open content cache.'));
    request.onblocked = () => reject(new Error('Content cache upgrade was blocked.'));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
};

const createStore = async (storeName: ContentCacheStore, mode: IDBTransactionMode) => {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, mode);

  return transaction.objectStore(storeName);
};

const requestToPromise = <TValue>(request: IDBRequest<TValue>) =>
  new Promise<TValue>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Content cache request failed.'));
  });

export const getContentCacheItem = async <TValue>(
  storeName: ContentCacheStore,
  id: string,
): Promise<ContentCacheItem<TValue> | null> => {
  const store = await createStore(storeName, 'readonly');
  const result = await requestToPromise<ContentCacheItem<TValue> | undefined>(store.get(id));

  return result ?? null;
};

export const setContentCacheItem = async <TValue>(
  storeName: ContentCacheStore,
  item: ContentCacheItem<TValue>,
) => {
  const store = await createStore(storeName, 'readwrite');

  await requestToPromise(store.put(item));
};
