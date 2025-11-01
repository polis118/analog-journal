import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { CameraService } from './camera.service';
import { Film } from '../models/film.model';

@Injectable({
  providedIn: 'root'
})
export class FilmService {
  constructor(
    private db: DatabaseService,
    private cameraService: CameraService
  ) {}

  async getAllFilms(): Promise<Film[]> {
    const films = await this.db.executeQuery('films');
    return films.sort((a: Film, b: Film) => 
      new Date(b.date_started || 0).getTime() - new Date(a.date_started || 0).getTime()
    );
  }

  async getFilmById(id: string): Promise<Film | null> {
    const film = await this.db.getById('films', id);
    return film || null;
  }

  async createFilm(film: Omit<Film, 'id'>): Promise<string> {
    const newFilm: Film = {
      ...film,
      id: this.generateId()
    };
    
    // If camera_id is provided, load film into camera
    if (newFilm.camera_id) {
      await this.cameraService.loadFilmIntoCamera(newFilm.camera_id, newFilm.id);
    }
    
    await this.db.executeRun('films', 'add', newFilm);
    return newFilm.id;
  }

  async updateFilm(film: Film): Promise<void> {
    await this.db.executeRun('films', 'put', film);
  }

  async deleteFilm(id: string): Promise<void> {
    const film = await this.getFilmById(id);
    
    // If film is in a camera, unload it first
    if (film?.camera_id) {
      await this.cameraService.unloadFilmFromCamera(film.camera_id);
    }
    
    await this.db.executeRun('films', 'delete', undefined, id);
  }

  async finishFilm(filmId: string): Promise<void> {
    const film = await this.getFilmById(filmId);
    if (!film) throw new Error('Film not found');

    // Unload from camera if loaded
    if (film.camera_id) {
      await this.cameraService.unloadFilmFromCamera(film.camera_id);
    }

    // Update film with finish date
    await this.updateFilm({
      ...film,
      date_finished: new Date().toISOString(),
      camera_id: undefined  // Remove camera reference
    });
  }

  async unfinishFilm(filmId: string): Promise<void> {
    const film = await this.getFilmById(filmId);
    if (!film) throw new Error('Film not found');

    // Remove finish date to mark as not developed
    await this.updateFilm({
      ...film,
      date_finished: undefined
    });
  }

  generateId(): string {
    return `film_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
