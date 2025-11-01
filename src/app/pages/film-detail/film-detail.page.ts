import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Film } from '../../models/film.model';
import { Frame } from '../../models/frame.model';
import { FilmService } from '../../services/film.service';
import { FrameService } from '../../services/frame.service';
import { SwipeBackDirective } from '../../directives/swipe-back.directive';

@Component({
  selector: 'app-film-detail',
  templateUrl: './film-detail-dark.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, SwipeBackDirective]
})
export class FilmDetailPage implements OnInit {
  film: Film | null = null;
  frames: Frame[] = [];
  isLoading = true;
  filmId: string = '';
  isDevelopedButtonExpanded = false;
  private collapseTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private filmService: FilmService,
    private frameService: FrameService
  ) {}

  async ngOnInit() {
    this.filmId = this.route.snapshot.paramMap.get('id') || '';
    if (this.filmId) {
      await this.loadFilmData();
    }
  }

  async loadFilmData() {
    try {
      this.isLoading = true;
      this.film = await this.filmService.getFilmById(this.filmId);
      if (this.film) {
        this.frames = await this.frameService.getFramesByFilmId(this.filmId);
      }
    } catch (error) {
      console.error('Error loading film data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openFrameDetail(frame: Frame) {
    this.router.navigate(['/frame', frame.id]);
  }

  async editNotes() {
    if (!this.film) return;

    const notes = prompt('Film notes:', this.film.notes || '');
    if (notes === null) return; // User cancelled

    try {
      const updatedFilm: Film = {
        ...this.film,
        notes: notes
      };

      await this.filmService.updateFilm(updatedFilm);
      this.film = updatedFilm;
      this.showToast('Notes updated');
    } catch (error) {
      console.error('Error updating notes:', error);
      this.showToast('Error updating notes');
    }
  }

  async editFilm() {
    if (!this.film) return;

    const name = prompt('Film name:', this.film.name);
    if (name === null) return; // User cancelled

    const brand = prompt('Brand:', this.film.brand);
    if (brand === null) return;

    const type = prompt('Type (color/bw/slide):', this.film.type);
    if (type === null) return;

    const iso = prompt('ISO:', String(this.film.iso));
    if (iso === null) return;

    const camera = prompt('Camera:', this.film.camera);
    if (camera === null) return;

    const lens = prompt('Lens:', this.film.lens);
    if (lens === null) return;

    const notes = prompt('Notes:', this.film.notes);
    if (notes === null) return;

    try {
      const updatedFilm: Film = {
        ...this.film,
        name: name || this.film.name,
        brand: brand || this.film.brand,
        type: type || this.film.type,
        iso: parseInt(iso) || this.film.iso,
        camera: camera || this.film.camera,
        lens: lens || this.film.lens,
        notes: notes || this.film.notes
      };

      await this.filmService.updateFilm(updatedFilm);
      this.film = updatedFilm;
      this.showToast('Film updated successfully');
    } catch (error) {
      console.error('Error updating film:', error);
      this.showToast('Error updating film');
    }
  }

  async addFrame() {
    try {
      // Frame number
      const frameNumber = this.frames.length + 1;
      
      // Aperture selection
      const aperture = await this.showApertureDialog();
      if (!aperture) return;
      
      // Shutter speed selection
      const shutterSpeed = await this.showShutterDialog();
      if (!shutterSpeed) return;
      
      // Scene type selection
      const sceneTag = await this.showSceneDialog();
      if (!sceneTag) return;
      
      // Location selection
      const addMore = confirm('Add location and notes?');
      let location = '';
      let latitude: number | null = null;
      let longitude: number | null = null;
      let notes = '';
      
      if (addMore) {
        const locationData = await this.showLocationDialog();
        if (locationData) {
          location = locationData.location;
          latitude = locationData.latitude;
          longitude = locationData.longitude;
        }
        notes = prompt('Notes (optional):', '') || '';
      }

      const newFrame: Frame = {
        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        film_id: this.filmId,
        frame_number: frameNumber,
        aperture: aperture,
        shutter_speed: shutterSpeed,
        lens: this.film?.lens || '',
        scene_tag: sceneTag,
        location: location,
        notes: notes,
        latitude: latitude,
        longitude: longitude,
        date_taken: new Date().toISOString()
      };
      
      await this.frameService.createFrame(newFrame);
      await this.loadFilmData();
      this.showToast('Frame added');
    } catch (error) {
      console.error('Error adding frame:', error);
      this.showToast('Error adding frame');
    }
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
              <button data-value="${value}" class="aperture-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-zinc-900 dark:text-white font-semibold transition-all ${value === 'f/8' ? 'border-primary bg-primary/10' : ''}">
                ${value}
                ${value === 'f/8' ? '<div class="text-xs text-primary mt-1">Common</div>' : ''}
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
              <button data-value="${value}" class="shutter-btn p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-zinc-900 dark:text-white font-semibold transition-all ${value === '1/125s' ? 'border-primary bg-primary/10' : ''}">
                ${value}
                ${value === '1/125s' ? '<div class="text-xs text-primary mt-1">Common</div>' : ''}
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  }

  async togglePin() {
    if (!this.film) return;

    try {
      const updatedFilm: Film = {
        ...this.film,
        is_pinned: !this.film.is_pinned
      };

      await this.filmService.updateFilm(updatedFilm);
      this.film = updatedFilm;
      this.showToast(this.film.is_pinned ? 'Film pinned as active' : 'Film unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      this.showToast('Error updating pin status');
    }
  }

  async deleteFilm() {
    if (!this.film) return;

    if (!confirm(`Are you sure you want to delete "${this.film.name}"? This will also delete all ${this.frames.length} frames. This action cannot be undone.`)) {
      return;
    }

    try {
      await this.filmService.deleteFilm(this.filmId);
      this.showToast('Film deleted');
      setTimeout(() => this.goBack(), 500);
    } catch (error) {
      console.error('Error deleting film:', error);
      this.showToast('Error deleting film');
    }
  }

  toggleDevelopedButton() {
    // Clear any existing timer
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
    }

    // Toggle expansion
    this.isDevelopedButtonExpanded = !this.isDevelopedButtonExpanded;

    // If expanded, set timer to collapse after 5 seconds
    if (this.isDevelopedButtonExpanded) {
      this.collapseTimer = setTimeout(() => {
        this.isDevelopedButtonExpanded = false;
        this.collapseTimer = null;
      }, 5000);
    }
  }

  async markAsDeveloped() {
    if (!this.film) return;

    // Clear timer and collapse the button
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
    this.isDevelopedButtonExpanded = false;

    if (this.film.date_finished) {
      // Film is already developed - ask to unmark
      const confirmed = await this.showConfirmDialog(
        'Mark Film as Not Developed?',
        `Are you sure you want to mark "${this.film.name}" as not yet developed?\n\nThis will allow you to:\n• Add more frames\n• Load it back into a camera`,
        'Mark as Not Developed',
        'Cancel',
        true // isDestructive - red button
      );

      if (!confirmed) return;

      try {
        await this.filmService.unfinishFilm(this.filmId);
        await this.loadFilmData();
        this.showToast('Film marked as not developed');
      } catch (error) {
        console.error('Error unmarking film:', error);
        this.showToast('Error updating film status');
      }
    } else {
      // Film is not developed - ask to mark as developed
      const confirmed = await this.showConfirmDialog(
        'Mark Film as Developed?',
        `Are you sure you want to mark "${this.film.name}" as developed?\n\nThis will:\n• Unload the film from the camera\n• Mark all ${this.frames.length} frames as developed\n• Move to archived films`,
        'Mark as Developed',
        'Cancel'
      );

      if (!confirmed) return;

      try {
        await this.filmService.finishFilm(this.filmId);
        await this.loadFilmData();
        this.showToast('Film marked as developed');
      } catch (error) {
        console.error('Error marking film as developed:', error);
        this.showToast('Error updating film status');
      }
    }
  }

  private showConfirmDialog(title: string, message: string, confirmText: string, cancelText: string, isDestructive: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      const confirmBtnColor = isDestructive 
        ? 'bg-red-600 dark:bg-red-700' 
        : 'bg-green-600 dark:bg-green-700';
      
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
            <button class="confirm-btn flex-1 p-3 rounded-xl ${confirmBtnColor} text-white font-semibold">
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
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      });
    });
  }

  private showLocationDialog(): Promise<{location: string, latitude: number | null, longitude: number | null} | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      
      overlay.innerHTML = `
        <div class="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Add Location</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Choose how to add location</p>
          </div>
          <div class="p-4 space-y-3">
            <button class="gps-btn w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-left transition-all">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📍</span>
                <div class="flex-1">
                  <div class="font-semibold text-zinc-900 dark:text-white">Use Current GPS Location</div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Get coordinates from device</div>
                </div>
              </div>
            </button>
            
            <button class="map-btn w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-left transition-all">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🗺️</span>
                <div class="flex-1">
                  <div class="font-semibold text-zinc-900 dark:text-white">Pick Location on Map</div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Select precise location</div>
                </div>
              </div>
            </button>
            
            <button class="manual-btn w-full p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-primary hover:bg-primary/10 text-left transition-all">
              <div class="flex items-center gap-3">
                <span class="text-2xl">✏️</span>
                <div class="flex-1">
                  <div class="font-semibold text-zinc-900 dark:text-white">Enter Manually</div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Type location name</div>
                </div>
              </div>
            </button>
            
            <button class="skip-btn w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
              Skip Location
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // GPS button - get current location
      overlay.querySelector('.gps-btn')?.addEventListener('click', async () => {
        if (!navigator.geolocation) {
          alert('GPS not supported on this device');
          return;
        }
        
        const loadingToast = document.createElement('div');
        loadingToast.textContent = 'Getting GPS location...';
        loadingToast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10001;';
        document.body.appendChild(loadingToast);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            loadingToast.remove();
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Try to get location name from coordinates using reverse geocoding (OpenStreetMap)
            let locationName = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
              const data = await response.json();
              if (data.display_name) {
                locationName = data.display_name;
              }
            } catch (error) {
              console.log('Could not get location name, using coordinates');
            }
            
            document.body.removeChild(overlay);
            resolve({ location: locationName, latitude: lat, longitude: lon });
          },
          (error) => {
            loadingToast.remove();
            alert('Could not get GPS location: ' + error.message);
          }
        );
      });
      
      // Map button - show map picker
      overlay.querySelector('.map-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        this.showMapPicker().then(result => resolve(result));
      });
      
      // Manual button - text input
      overlay.querySelector('.manual-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        const locationName = prompt('Enter location name:', '');
        if (locationName) {
          resolve({ location: locationName, latitude: null, longitude: null });
        } else {
          resolve(null);
        }
      });
      
      // Skip button
      overlay.querySelector('.skip-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve({ location: '', latitude: null, longitude: null });
      });
    });
  }

  private showMapPicker(): Promise<{location: string, latitude: number | null, longitude: number | null} | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black z-50 flex flex-col';
      
      // Default to Prague if GPS fails
      let defaultLat = 50.0755;
      let defaultLon = 14.4378;
      let selectedLat = defaultLat;
      let selectedLon = defaultLon;
      
      overlay.innerHTML = `
        <div class="bg-zinc-900 p-4 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white">Pick Location on Map</h2>
          <button class="close-map-btn text-white text-2xl px-4">×</button>
        </div>
        <div id="map-container" class="flex-1 relative">
          <div id="map" style="width: 100%; height: 100%;"></div>
          <div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-3 text-sm">
            <div class="text-zinc-600 dark:text-zinc-400">📍 Getting your location...</div>
          </div>
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-3 text-sm">
            <div class="text-zinc-600 dark:text-zinc-400">Drag marker to adjust position</div>
            <div id="coords" class="font-mono text-xs mt-1 text-zinc-900 dark:text-white">${defaultLat.toFixed(6)}, ${defaultLon.toFixed(6)}</div>
          </div>
        </div>
        <div class="bg-zinc-900 p-4">
          <button class="confirm-location-btn w-full p-4 rounded-xl bg-primary text-white font-bold">
            Confirm Location
          </button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const mapDiv = overlay.querySelector('#map') as HTMLElement;
      const statusDiv = overlay.querySelector('.absolute.top-4') as HTMLElement;
      const coordsDiv = overlay.querySelector('#coords') as HTMLElement;
      
      // Try to get current GPS location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            defaultLat = position.coords.latitude;
            defaultLon = position.coords.longitude;
            selectedLat = defaultLat;
            selectedLon = defaultLon;
            
            if (statusDiv) {
              statusDiv.innerHTML = '<div class="text-green-600 dark:text-green-400">✓ Using your current location</div>';
              setTimeout(() => statusDiv.remove(), 3000);
            }
            
            initGoogleMap(defaultLat, defaultLon);
          },
          (error) => {
            console.log('GPS error, using default location:', error);
            if (statusDiv) {
              statusDiv.innerHTML = '<div class="text-amber-600 dark:text-amber-400">⚠ Using default location (Prague)</div>';
              setTimeout(() => statusDiv.remove(), 3000);
            }
            initGoogleMap(defaultLat, defaultLon);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        initGoogleMap(defaultLat, defaultLon);
      }
      
      function initGoogleMap(lat: number, lon: number) {
        // Google Maps API Key - replace with your own or leave empty to use OpenStreetMap
        const GOOGLE_MAPS_API_KEY = ''; // Add your API key here
        
        if (GOOGLE_MAPS_API_KEY) {
          // Load Google Maps API
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
          script.async = true;
          script.defer = true;
          
          script.onload = () => {
            // @ts-ignore
            const google = window.google;
            
            const mapOptions = {
              center: { lat, lng: lon },
              zoom: 15,
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: false
            };
            
            const map = new google.maps.Map(mapDiv, mapOptions);
            
            const marker = new google.maps.Marker({
              position: { lat, lng: lon },
              map: map,
              draggable: true,
              title: 'Drag to adjust location'
            });
            
            // Update coordinates when marker is dragged
            marker.addListener('dragend', () => {
              const position = marker.getPosition();
              selectedLat = position.lat();
              selectedLon = position.lng();
              
              if (coordsDiv) {
                coordsDiv.textContent = `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`;
              }
            });
            
            // Also allow clicking on map to move marker
            map.addListener('click', (e: any) => {
              marker.setPosition(e.latLng);
              selectedLat = e.latLng.lat();
              selectedLon = e.latLng.lng();
              
              if (coordsDiv) {
                coordsDiv.textContent = `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`;
              }
            });
            
            // Update initial coords display
            if (coordsDiv) {
              coordsDiv.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            }
          };
          
          script.onerror = () => {
            console.warn('Google Maps failed to load, falling back to OpenStreetMap');
            initOpenStreetMap(lat, lon);
          };
          
          document.head.appendChild(script);
        } else {
          // Fallback to OpenStreetMap (free, no API key required)
          console.log('No Google Maps API key, using OpenStreetMap');
          initOpenStreetMap(lat, lon);
        }
      }
      
      function initOpenStreetMap(lat: number, lon: number) {
        // Load Leaflet CSS and JS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          // @ts-ignore
          const L = window.L;
          
          const map = L.map('map').setView([lat, lon], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
          
          // Update coordinates when marker is dragged
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            selectedLat = position.lat;
            selectedLon = position.lng;
            
            if (coordsDiv) {
              coordsDiv.textContent = `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`;
            }
          });
          
          // Also allow clicking on map to move marker
          map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            selectedLat = e.latlng.lat;
            selectedLon = e.latlng.lng;
            
            if (coordsDiv) {
              coordsDiv.textContent = `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`;
            }
          });
          
          // Update initial coords display
          if (coordsDiv) {
            coordsDiv.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          }
        };
        document.head.appendChild(script);
      }
      
      // Close button
      overlay.querySelector('.close-map-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      // Confirm button
      overlay.querySelector('.confirm-location-btn')?.addEventListener('click', async () => {
        const loadingToast = document.createElement('div');
        loadingToast.textContent = 'Getting location name...';
        loadingToast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #333; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10001;';
        document.body.appendChild(loadingToast);
        
        let locationName = `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`;
        
        const GOOGLE_MAPS_API_KEY = ''; // Add your API key here
        
        // Try Google Geocoding API first (if API key available)
        if (GOOGLE_MAPS_API_KEY) {
          try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedLat},${selectedLon}&key=${GOOGLE_MAPS_API_KEY}`);
            const data = await response.json();
            if (data.results && data.results[0]) {
              locationName = data.results[0].formatted_address;
            }
          } catch (error) {
            console.log('Google Geocoding failed, trying OpenStreetMap');
          }
        }
        
        // Fallback to OpenStreetMap Nominatim (free, no API key)
        if (locationName === `${selectedLat.toFixed(6)}, ${selectedLon.toFixed(6)}`) {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${selectedLat}&lon=${selectedLon}&format=json`);
            const data = await response.json();
            if (data.display_name) {
              locationName = data.display_name;
            }
          } catch (error) {
            console.log('Could not get location name, using coordinates');
          }
        }
        
        loadingToast.remove();
        document.body.removeChild(overlay);
        resolve({ location: locationName, latitude: selectedLat, longitude: selectedLon });
      });
    });
  }

  showToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}
