import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Frame } from '../../models/frame.model';
import { Film } from '../../models/film.model';
import { FrameService } from '../../services/frame.service';
import { FilmService } from '../../services/film.service';
import { SwipeBackDirective } from '../../directives/swipe-back.directive';

@Component({
  selector: 'app-frame-detail',
  templateUrl: './frame-detail.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, SwipeBackDirective]
})
export class FrameDetailPage implements OnInit {
  frame: Frame | null = null;
  film: Film | null = null;
  isLoading = true;
  frameId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private frameService: FrameService,
    private filmService: FilmService
  ) {}

  async ngOnInit() {
    this.frameId = this.route.snapshot.paramMap.get('id') || '';
    if (this.frameId) {
      await this.loadFrameData();
    }
  }

  async loadFrameData() {
    try {
      this.isLoading = true;
      this.frame = await this.frameService.getFrameById(this.frameId);
      if (this.frame) {
        this.film = await this.filmService.getFilmById(this.frame.film_id);
      }
    } catch (error) {
      console.error('Error loading frame data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    if (this.frame) {
      this.router.navigate(['/film', this.frame.film_id]);
    } else {
      this.router.navigate(['/']);
    }
  }

  async editFrame() {
    if (!this.frame) return;
    
    try {
      // Show edit menu dialog
      const field = await this.showEditMenuDialog();
      if (!field) return;

      let updatedFrame = { ...this.frame };

      switch (field) {
        case 'aperture':
          const newAperture = await this.showApertureDialog();
          if (newAperture) {
            updatedFrame.aperture = newAperture;
          }
          break;

        case 'shutter':
          const newShutter = await this.showShutterDialog();
          if (newShutter) {
            updatedFrame.shutter_speed = newShutter;
          }
          break;

        case 'lens':
          const newLens = await this.showTextInputDialog('Edit Lens', 'Enter lens focal length', this.frame.lens);
          if (newLens) {
            updatedFrame.lens = newLens;
          }
          break;

        case 'scene':
          const newScene = await this.showSceneDialog();
          if (newScene) {
            updatedFrame.scene_tag = newScene;
          }
          break;

        case 'location':
          const newLocation = await this.showTextInputDialog('Edit Location', 'Enter location name', this.frame.location);
          if (newLocation) {
            updatedFrame.location = newLocation;
          }
          break;

        case 'notes':
          const newNotes = await this.showTextInputDialog('Edit Notes', 'Enter frame notes', this.frame.notes);
          if (newNotes !== null) {
            updatedFrame.notes = newNotes;
          }
          break;

        default:
          return;
      }

      // Update frame in database
      await this.frameService.updateFrame(updatedFrame);
      this.frame = updatedFrame;
      this.showToast('Frame updated');
      
    } catch (error) {
      console.error('Error updating frame:', error);
      this.showToast('Error updating frame');
    }
  }

  private showEditMenuDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      const fields = [
        { value: 'aperture', label: 'Aperture', icon: 'camera', current: this.frame?.aperture },
        { value: 'shutter', label: 'Shutter Speed', icon: 'shutter_speed', current: this.frame?.shutter_speed },
        { value: 'lens', label: 'Lens', icon: 'photo_camera', current: this.frame?.lens },
        { value: 'scene', label: 'Scene Type', icon: 'category', current: this.frame?.scene_tag },
        { value: 'location', label: 'Location', icon: 'location_on', current: this.frame?.location },
        { value: 'notes', label: 'Notes', icon: 'notes', current: this.frame?.notes }
      ];
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Edit Frame ${this.frame?.frame_number}</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Select field to edit</p>
          </div>
          <div class="p-4 space-y-2">
            ${fields.map(field => `
              <button data-value="${field.value}" class="field-btn w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-left transition-all">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined">${field.icon}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-zinc-900 dark:text-white">${field.label}</div>
                    <div class="text-sm text-zinc-500 dark:text-zinc-400 truncate">${field.current || 'Not set'}</div>
                  </div>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button class="cancel-btn w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelectorAll('.field-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'] || null;
          document.body.removeChild(overlay);
          resolve(value);
        });
      });
      
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  private showApertureDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Select Aperture</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Lower f-number = more light, shallow depth</p>
          </div>
          <div class="p-4 grid grid-cols-3 gap-2">
            ${['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'].map(value => `
              <button data-value="${value}" class="aperture-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-zinc-900 dark:text-white font-semibold transition-all">
                ${value}
              </button>
            `).join('')}
            <button data-value="custom" class="custom-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 text-zinc-900 dark:text-white font-semibold transition-all">
              ✏️ Custom
            </button>
          </div>
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button class="cancel-btn w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelectorAll('.aperture-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'] || null;
          document.body.removeChild(overlay);
          resolve(value);
        });
      });

      overlay.querySelector('.custom-btn')?.addEventListener('click', async () => {
        document.body.removeChild(overlay);
        const customValue = prompt('Enter custom aperture (e.g., f/1.8, f/3.5):', 'f/');
        resolve(customValue || null);
      });
      
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  private showShutterDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Select Shutter Speed</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Faster speed = freeze motion, less light</p>
          </div>
          <div class="p-4 grid grid-cols-3 gap-2">
            ${['1/1000s', '1/500s', '1/250s', '1/125s', '1/60s', '1/30s', '1/15s', '1/8s', '1/4s', '1/2s', '1s'].map(value => `
              <button data-value="${value}" class="shutter-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-zinc-900 dark:text-white font-semibold transition-all">
                ${value}
              </button>
            `).join('')}
            <button data-value="custom" class="custom-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 text-zinc-900 dark:text-white font-semibold transition-all">
              ✏️ Custom
            </button>
          </div>
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button class="cancel-btn w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelectorAll('.shutter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'] || null;
          document.body.removeChild(overlay);
          resolve(value);
        });
      });

      overlay.querySelector('.custom-btn')?.addEventListener('click', async () => {
        document.body.removeChild(overlay);
        const customValue = prompt('Enter custom shutter speed (e.g., 1/2000s, 2s, B):', '1/');
        resolve(customValue || null);
      });
      
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  private showSceneDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      const scenes = [
        { value: 'portrait', label: 'Portrait', icon: 'person', desc: 'People & faces' },
        { value: 'landscape', label: 'Landscape', icon: 'landscape', desc: 'Nature & scenery' },
        { value: 'street', label: 'Street', icon: 'location_city', desc: 'Urban & candid' },
        { value: 'architecture', label: 'Architecture', icon: 'business', desc: 'Buildings & structures' },
        { value: 'nature', label: 'Nature', icon: 'park', desc: 'Wildlife & plants' },
        { value: 'other', label: 'Other', icon: 'category', desc: 'Everything else' }
      ];
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Select Scene Type</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">What are you photographing?</p>
          </div>
          <div class="p-4 space-y-2">
            ${scenes.map(scene => `
              <button data-value="${scene.value}" class="scene-btn w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-left transition-all flex items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span class="material-symbols-outlined">${scene.icon}</span>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-zinc-900 dark:text-white">${scene.label}</div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">${scene.desc}</div>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <button class="cancel-btn w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelectorAll('.scene-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'] || null;
          document.body.removeChild(overlay);
          resolve(value);
        });
      });
      
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  private showTextInputDialog(title: string, label: string, currentValue: string): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-4">${title}</h2>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">${label}</label>
          <input type="text" 
                 class="input-field w-full p-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:border-primary focus:outline-none"
                 value="${currentValue}"
                 autofocus>
          <div class="flex gap-3 mt-6">
            <button class="cancel-btn flex-1 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold">Cancel</button>
            <button class="confirm-btn flex-1 p-3 rounded-xl bg-primary text-white font-semibold">Save</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const input = overlay.querySelector('.input-field') as HTMLInputElement;
      input.focus();
      input.select();
      
      const confirm = () => {
        const value = input.value.trim();
        document.body.removeChild(overlay);
        resolve(value || null);
      };
      
      overlay.querySelector('.confirm-btn')?.addEventListener('click', confirm);
      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirm();
      });
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
