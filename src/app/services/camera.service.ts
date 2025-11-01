import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Camera } from '../models/camera.model';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor(private databaseService: DatabaseService) {}

  async createCamera(camera: Omit<Camera, 'id'>): Promise<Camera> {
    const db = await this.databaseService.getDatabase();
    const newCamera: Camera = {
      ...camera,
      id: this.generateId()
    };

    const tx = db.transaction('cameras', 'readwrite');
    const store = tx.objectStore('cameras');
    await store.add(newCamera);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(newCamera);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllCameras(): Promise<Camera[]> {
    const db = await this.databaseService.getDatabase();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cameras', 'readonly');
      const store = tx.objectStore('cameras');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAvailableCameras(): Promise<Camera[]> {
    const cameras = await this.getAllCameras();
    console.log('📷 All cameras:', cameras);
    // Return only cameras without a film loaded
    const available = cameras.filter(camera => !camera.current_film_id);
    console.log('✅ Available cameras (without film):', available);
    return available;
  }

  async getCameraById(id: string): Promise<Camera | undefined> {
    const db = await this.databaseService.getDatabase();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cameras', 'readonly');
      const store = tx.objectStore('cameras');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCamera(camera: Camera): Promise<void> {
    const db = await this.databaseService.getDatabase();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cameras', 'readwrite');
      const store = tx.objectStore('cameras');
      const request = store.put(camera);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCamera(id: string): Promise<void> {
    const db = await this.databaseService.getDatabase();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cameras', 'readwrite');
      const store = tx.objectStore('cameras');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadFilmIntoCamera(cameraId: string, filmId: string): Promise<void> {
    console.log(`📷 Loading film ${filmId} into camera ${cameraId}`);
    const camera = await this.getCameraById(cameraId);
    if (!camera) throw new Error('Camera not found');
    if (camera.current_film_id) throw new Error('Camera already has a film loaded');

    await this.updateCamera({
      ...camera,
      current_film_id: filmId
    });
    console.log(`✅ Film loaded into camera ${camera.name}`);
  }

  async unloadFilmFromCamera(cameraId: string): Promise<void> {
    const camera = await this.getCameraById(cameraId);
    if (!camera) throw new Error('Camera not found');

    await this.updateCamera({
      ...camera,
      current_film_id: null
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
