import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Frame } from '../models/frame.model';

@Injectable({
  providedIn: 'root'
})
export class FrameService {
  constructor(private db: DatabaseService) {}

  async getAllFrames(): Promise<Frame[]> {
    return await this.db.executeQuery('frames');
  }

  async getFramesByFilmId(filmId: string): Promise<Frame[]> {
    const frames = await this.db.executeQuery('frames', 'film_id', filmId);
    return frames.sort((a: Frame, b: Frame) => (a.frame_number || 0) - (b.frame_number || 0));
  }

  async getFrameById(id: string): Promise<Frame | null> {
    const frame = await this.db.getById('frames', id);
    return frame || null;
  }

  async createFrame(frame: Frame): Promise<void> {
    await this.db.executeRun('frames', 'add', frame);
  }

  async updateFrame(frame: Frame): Promise<void> {
    await this.db.executeRun('frames', 'put', frame);
  }

  async deleteFrame(id: string): Promise<void> {
    await this.db.executeRun('frames', 'delete', undefined, id);
  }

  async getNextFrameNumber(filmId: string): Promise<number> {
    const frames = await this.getFramesByFilmId(filmId);
    if (frames.length === 0) {
      return 1;
    }
    const maxNumber = Math.max(...frames.map(f => f.frame_number || 0));
    return maxNumber + 1;
  }

  generateId(): string {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
