import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: IDBDatabase | null = null;
  private dbName = 'analog_journal';
  private dbVersion = 2;  // Increased for cameras table

  constructor() {}

  async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing IndexedDB database...');
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.error('Database failed to open');
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('✅ Database initialized successfully, version:', this.db.version);
          
          // Verify cameras store exists
          if (!this.db.objectStoreNames.contains('cameras')) {
            console.warn('⚠️ Cameras store missing - database needs reset');
            this.db.close();
            this.resetDatabase().then(() => {
              console.log('Database reset, reinitializing...');
              this.initializeDatabase().then(resolve).catch(reject);
            }).catch(reject);
            return;
          }
          
          resolve();
        };

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result as IDBDatabase;
          const oldVersion = event.oldVersion;
          console.log(`Database upgrade needed from version ${oldVersion} to ${this.dbVersion}`);

          // Create films table
          if (!db.objectStoreNames.contains('films')) {
            console.log('Creating films store...');
            const filmStore = db.createObjectStore('films', { keyPath: 'id' });
            filmStore.createIndex('name', 'name', { unique: false });
            filmStore.createIndex('date_started', 'date_started', { unique: false });
          }

          // Create frames table
          if (!db.objectStoreNames.contains('frames')) {
            console.log('Creating frames store...');
            const frameStore = db.createObjectStore('frames', { keyPath: 'id' });
            frameStore.createIndex('film_id', 'film_id', { unique: false });
            frameStore.createIndex('frame_number', 'frame_number', { unique: false });
          }

          // Create cameras table (NEW in version 2)
          if (!db.objectStoreNames.contains('cameras')) {
            console.log('Creating cameras store...');
            const cameraStore = db.createObjectStore('cameras', { keyPath: 'id' });
            cameraStore.createIndex('name', 'name', { unique: false });
            cameraStore.createIndex('current_film_id', 'current_film_id', { unique: false });
          }

          console.log('✅ Tables created successfully');
        };
      });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    console.log('🗑️ Resetting database...');
    
    return new Promise((resolve, reject) => {
      // Close existing connection
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Delete the database
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onsuccess = () => {
        console.log('✅ Database deleted successfully');
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('❌ Error deleting database');
        reject(deleteRequest.error);
      };

      deleteRequest.onblocked = () => {
        console.warn('⚠️ Database deletion blocked - close all tabs using this app');
      };
    });
  }

  async clearDatabase(): Promise<void> {
    console.log('🗑️ Clearing all data from database...');
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stores = ['films', 'frames', 'cameras'];
    
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`✅ Cleared ${storeName} store`);
          resolve();
        };

        request.onerror = () => {
          console.error(`❌ Error clearing ${storeName} store`);
          reject(request.error);
        };
      });
    }

    console.log('✅ All data cleared successfully');
  }

  async initDB(): Promise<void> {
    // Reinitialize database (same as initializeDatabase)
    await this.initializeDatabase();
  }

  async getDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async executeQuery(storeName: string, indexName?: string, value?: any): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async executeRun(storeName: string, operation: 'add' | 'put' | 'delete', data?: any, key?: any): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      switch (operation) {
        case 'add':
          request = store.add(data);
          break;
        case 'put':
          request = store.put(data);
          break;
        case 'delete':
          request = store.delete(key);
          break;
        default:
          reject(new Error('Invalid operation'));
          return;
      }

      request.onsuccess = () => {
        resolve({ changes: 1 });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getById(storeName: string, id: string): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
