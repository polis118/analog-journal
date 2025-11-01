import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { FilmService } from '../../services/film.service';
import { FrameService } from '../../services/frame.service';
import { CameraService } from '../../services/camera.service';
import { SwipeBackDirective } from '../../directives/swipe-back.directive';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, SwipeBackDirective]
})
export class SettingsPage implements OnInit {
  appVersion = '1.0.0';
  dbStats = {
    films: 0,
    frames: 0,
    cameras: 0
  };

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private filmService: FilmService,
    private frameService: FrameService,
    private cameraService: CameraService
  ) {}

  async ngOnInit() {
    // Ensure database is initialized
    await this.databaseService.initializeDatabase();
    await this.loadStats();
  }

  async loadStats() {
    try {
      const films = await this.filmService.getAllFilms();
      const cameras = await this.cameraService.getAllCameras();
      
      // Count all frames from all films
      let totalFrames = 0;
      for (const film of films) {
        const frames = await this.frameService.getFramesByFilmId(film.id);
        totalFrames += frames.length;
      }

      this.dbStats = {
        films: films.length,
        frames: totalFrames,
        cameras: cameras.length
      };
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  async exportData() {
    try {
      // Get all data
      const films = await this.filmService.getAllFilms();
      const cameras = await this.cameraService.getAllCameras();
      
      const allFrames = [];
      for (const film of films) {
        const frames = await this.frameService.getFramesByFilmId(film.id);
        allFrames.push(...frames);
      }

      const exportData = {
        version: this.appVersion,
        exportDate: new Date().toISOString(),
        films,
        frames: allFrames,
        cameras
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analog-journal-backup-${new Date().getTime()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      this.showToast('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showToast('Error exporting data');
    }
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.films || !data.frames || !data.cameras) {
          this.showToast('Invalid backup file format');
          return;
        }

        const confirmed = await this.showConfirmDialog(
          'Import Data',
          `This will import:\n• ${data.films.length} films\n• ${data.frames.length} frames\n• ${data.cameras.length} cameras\n\nDuplicate items will be skipped.`,
          'Import',
          'Cancel'
        );

        if (!confirmed) return;

        const db = await this.databaseService.getDatabase();
        let imported = { cameras: 0, films: 0, frames: 0 };
        let skipped = { cameras: 0, films: 0, frames: 0 };

        // Import cameras first
        await new Promise<void>((resolve, reject) => {
          const cameraTx = db.transaction('cameras', 'readwrite');
          const cameraStore = cameraTx.objectStore('cameras');
          
          for (const camera of data.cameras) {
            const getRequest = cameraStore.get(camera.id);
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                skipped.cameras++;
              } else {
                cameraStore.add(camera);
                imported.cameras++;
              }
            };
          }
          
          cameraTx.oncomplete = () => resolve();
          cameraTx.onerror = () => reject(cameraTx.error);
        });

        // Import films
        await new Promise<void>((resolve, reject) => {
          const filmTx = db.transaction('films', 'readwrite');
          const filmStore = filmTx.objectStore('films');
          
          for (const film of data.films) {
            const getRequest = filmStore.get(film.id);
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                skipped.films++;
              } else {
                filmStore.add(film);
                imported.films++;
              }
            };
          }
          
          filmTx.oncomplete = () => resolve();
          filmTx.onerror = () => reject(filmTx.error);
        });

        // Import frames
        await new Promise<void>((resolve, reject) => {
          const frameTx = db.transaction('frames', 'readwrite');
          const frameStore = frameTx.objectStore('frames');
          
          for (const frame of data.frames) {
            const getRequest = frameStore.get(frame.id);
            getRequest.onsuccess = () => {
              if (getRequest.result) {
                skipped.frames++;
              } else {
                frameStore.add(frame);
                imported.frames++;
              }
            };
          }
          
          frameTx.oncomplete = () => resolve();
          frameTx.onerror = () => reject(frameTx.error);
        });

        await this.loadStats();
        
        const total = imported.cameras + imported.films + imported.frames;
        const totalSkipped = skipped.cameras + skipped.films + skipped.frames;
        
        if (totalSkipped > 0) {
          this.showToast(`Imported ${total} items, skipped ${totalSkipped} duplicates`);
        } else {
          this.showToast('Data imported successfully');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        this.showToast('Error importing data');
      }
    };

    input.click();
  }

  async clearAllData() {
    const confirmed = await this.showConfirmDialog(
      'Clear All Data',
      'Are you sure you want to delete ALL data?\n\nThis will permanently delete:\n• All films\n• All frames\n• All cameras\n\nThis action cannot be undone!',
      'Delete Everything',
      'Cancel'
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirmed = await this.showConfirmDialog(
      'Final Warning',
      'This is your last chance!\n\nAre you absolutely sure you want to delete everything?',
      'Yes, Delete All',
      'No, Keep Data'
    );

    if (!doubleConfirmed) return;

    try {
      await this.databaseService.clearDatabase();
      await this.loadStats();
      this.showToast('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showToast('Error clearing data');
    }
  }

  async resetDatabase() {
    const confirmed = await this.showConfirmDialog(
      'Reset Database',
      'This will reset the database structure.\n\nAll existing data will be preserved.',
      'Reset',
      'Cancel'
    );

    if (!confirmed) return;

    try {
      // Reinitialize database
      await this.databaseService.initDB();
      this.showToast('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      this.showToast('Error resetting database');
    }
  }

  openGitHub() {
    window.open('https://github.com/yourusername/analog-journal', '_blank');
  }

  openDocumentation() {
    this.showToast('Documentation coming soon');
  }

  shareFeedback() {
    const subject = encodeURIComponent('Analog Journal Feedback');
    const body = encodeURIComponent('Hi, I have feedback about Analog Journal:\n\n');
    window.location.href = `mailto:your@email.com?subject=${subject}&body=${body}`;
  }

  private showConfirmDialog(title: string, message: string, confirmText: string, cancelText: string): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full">
          <div class="p-6">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-3">${title}</h2>
            <p class="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">${message}</p>
          </div>
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
            <button class="cancel-btn flex-1 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">
              ${cancelText}
            </button>
            <button class="confirm-btn flex-1 p-3 rounded-xl bg-red-600 dark:bg-red-700 text-white font-semibold">
              ${confirmText}
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('.confirm-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      });
    });
  }

  showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-full shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2000);
  }
}
