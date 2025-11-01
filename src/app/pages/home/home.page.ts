import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Film } from '../../models/film.model';
import { Camera } from '../../models/camera.model';
import { FilmService } from '../../services/film.service';
import { CameraService } from '../../services/camera.service';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: './home-dark.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule]
})
export class HomePage implements OnInit {
  films: Film[] = [];
  cameras: Camera[] = [];
  isLoading = true;

  constructor(
    private filmService: FilmService,
    private cameraService: CameraService,
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('🚀 HomePage ngOnInit started');
    await this.initializeApp();
    await this.loadFilms();
    console.log('✅ HomePage loaded -', this.films.length, 'films');
  }

  async addSampleFilms() {
    const sampleFilms = [
      {
        name: 'Kodak Portra 400',
        type: 'color',
        brand: 'Kodak',
        iso: 400,
        camera: 'Canon AE-1',
        lens: '50mm f/1.8',
        date_started: new Date().toISOString(),
        date_finished: '',
        notes: 'Test film'
      },
      {
        name: 'Ilford HP5 Plus',
        type: 'bw',
        brand: 'Ilford',
        iso: 400,
        camera: 'Nikon FM2',
        lens: '35mm f/2',
        date_started: new Date().toISOString(),
        date_finished: '',
        notes: 'Black and white film'
      },
      {
        name: 'Fuji Velvia 50',
        type: 'slide',
        brand: 'Fujifilm',
        iso: 50,
        camera: 'Pentax K1000',
        lens: '28mm f/2.8',
        date_started: new Date().toISOString(),
        date_finished: '',
        notes: 'Slide film'
      }
    ];

    for (const filmData of sampleFilms) {
      console.log('➕ Adding sample film:', filmData.name);
      await this.filmService.createFilm(filmData);
    }
    
    console.log('✅ Sample films added!');
  }

  async initializeApp() {
    try {
      await this.databaseService.initializeDatabase();
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showToast('Error initializing database');
    }
  }

  async loadFilms() {
    try {
      console.log('📚 loadFilms started, isLoading:', this.isLoading);
      this.isLoading = true;
      const allFilms = await this.filmService.getAllFilms();
      
      // Sort: pinned films first, then by date
      this.films = allFilms.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.date_started).getTime() - new Date(a.date_started).getTime();
      });
      
      console.log('📚 Films loaded:', this.films.length, this.films);
    } catch (error) {
      console.error('❌ Error loading films:', error);
      this.showToast('Error loading films');
    } finally {
      this.isLoading = false;
      console.log('📚 loadFilms finished, isLoading:', this.isLoading);
    }
  }

  async addFilm() {
    try {
      // Film name
      const name = await this.showTextInputDialog('Film Name', 'Enter film name', 'Kodak Portra 400');
      if (!name) return;
      
      // Brand selection
      let brand = await this.showBrandDialog();
      if (brand === null) return; // User cancelled
      if (brand === undefined) {
        // User selected "Other", ask for custom brand
        brand = await this.showTextInputDialog('Custom Brand', 'Enter film brand', 'My Brand');
        if (!brand) return;
      }
      
      // Film type selection
      const type = await this.showFilmTypeDialog();
      if (!type) return;
      
      // ISO selection
      const iso = await this.showISODialog();
      if (!iso) return;
      
      // Camera selection - only from registered cameras
      const cameraChoice = await this.showCameraSelectionDialog();
      if (cameraChoice === null) return; // User cancelled
      
      let cameraId: string | undefined = undefined;
      let cameraName = '';
      
      if (cameraChoice === 'new') {
        // Add new camera to database
        const newCameraId = await this.addCamera();
        if (!newCameraId) return;
        cameraId = newCameraId;
        const camera = await this.cameraService.getCameraById(newCameraId);
        cameraName = camera?.name || '';
      } else {
        // Existing camera selected
        cameraId = cameraChoice;
        const camera = await this.cameraService.getCameraById(cameraChoice);
        cameraName = camera?.name || '';
      }
      
      // Lens (optional)
      const lens = await this.showTextInputDialog('Lens', 'Enter lens name (optional)', '50mm f/1.8', true) || '';

      await this.createFilm({ name, type, brand, iso: parseInt(iso), camera: cameraName, camera_id: cameraId, lens });
    } catch (error) {
      console.error('Error in addFilm:', error);
    }
  }

  async createFilm(data: any) {
    try {
      const newFilm = {
        name: data.name,
        type: data.type,
        brand: data.brand,
        iso: parseInt(data.iso) || 400,
        camera: data.camera || '',
        camera_id: data.camera_id || undefined,
        lens: data.lens || '',
        date_started: new Date().toISOString(),
        date_finished: '',
        notes: ''
      };

      console.log('🎬 Creating film:', newFilm);
      await this.filmService.createFilm(newFilm);
      await this.loadFilms();
      this.showToast('Film added');
    } catch (error) {
      console.error('❌ Error creating film:', error);
      this.showToast('Error creating film');
    }
  }

  async deleteFilm(film: Film, event: Event) {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${film.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.filmService.deleteFilm(film.id);
      await this.loadFilms();
      this.showToast('Film deleted');
    } catch (error) {
      console.error('❌ Error deleting film:', error);
      this.showToast('Error deleting film');
    }
  }

  openFilmDetail(film: Film) {
    this.router.navigate(['/film', film.id]);
  }

  openCameras() {
    this.router.navigate(['/cameras']);
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  }

  async resetDatabase() {
    if (!confirm('Are you sure you want to delete all films and reset the database?')) {
      return;
    }

    try {
      console.log('🗑️ Resetting database...');
      await this.databaseService.resetDatabase();
      await this.databaseService.initializeDatabase();
      await this.loadFilms();
      this.showToast('Database reset');
    } catch (error) {
      console.error('Error resetting database:', error);
      this.showToast('Error resetting database');
    }
  }

  showToast(message: string) {
    // Simple toast notification using div element
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
      animation: slideUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // Visual dialog for text input
  showTextInputDialog(title: string, label: string, placeholder: string, isOptional: boolean = false): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">${title}</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">${label}</p>
          <input type="text" class="text-input" placeholder="${placeholder}" style="
            width: 100%;
            padding: 12px 16px;
            background: #2a3142;
            border: 2px solid #374151;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s;
          " />
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="cancel-btn" style="
              flex: 1;
              padding: 12px;
              background: #374151;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
            ">Cancel</button>
            <button class="confirm-btn" style="
              flex: 1;
              padding: 12px;
              background: #1754cf;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
            ">${isOptional ? 'Skip' : 'Continue'}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const input = overlay.querySelector('.text-input') as HTMLInputElement;
      const confirmBtn = overlay.querySelector('.confirm-btn') as HTMLButtonElement;
      input.focus();

      // Update button text when user types (Skip -> Continue)
      if (isOptional) {
        input.addEventListener('input', () => {
          if (input.value.trim().length > 0) {
            confirmBtn.textContent = 'Continue';
          } else {
            confirmBtn.textContent = 'Skip';
          }
        });
      }

      // Enter key to confirm
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const value = input.value.trim();
          document.body.removeChild(overlay);
          resolve(value || (isOptional ? '' : null));
        }
      });

      overlay.querySelector('.confirm-btn')?.addEventListener('click', () => {
        const value = input.value.trim();
        document.body.removeChild(overlay);
        resolve(value || (isOptional ? '' : null));
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  // Visual dialog for brand selection
  showBrandDialog(): Promise<string | null | undefined> {
    return new Promise((resolve) => {
      const brands = [
        { name: 'Kodak', icon: '🟡' },
        { name: 'Fujifilm', icon: '🟢' },
        { name: 'Ilford', icon: '⚫' },
        { name: 'Lomography', icon: '🔵' },
        { name: 'CineStill', icon: '🔴' },
        { name: 'Fomapan', icon: '⚪' },
        { name: 'Rollei', icon: '🟣' },
        { name: 'Agfa', icon: '🟠' },
        { name: 'Other', icon: '❓' }
      ];

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      const brandButtons = brands.map(brand => `
        <button class="brand-option" data-value="${brand.name}" style="
          background: #2a3142;
          color: white;
          border: 2px solid #374151;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <span style="font-size: 24px;">${brand.icon}</span>
          <span>${brand.name}</span>
        </button>
      `).join('');

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">Select Film Brand</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">Choose the manufacturer</p>
          <div style="display: grid; gap: 12px;">
            ${brandButtons}
          </div>
          <button class="cancel-btn" style="
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            background: #374151;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;

      document.body.appendChild(overlay);

      // Hover effects
      overlay.querySelectorAll('.brand-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          (btn as HTMLElement).style.background = '#374151';
          (btn as HTMLElement).style.borderColor = '#1754cf';
        });
        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.background = '#2a3142';
          (btn as HTMLElement).style.borderColor = '#374151';
        });
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'];
          document.body.removeChild(overlay);
          resolve(value === 'Other' ? undefined : value || null);
        });
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  // Visual dialog for film type selection
  showFilmTypeDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const types = [
        { value: 'color', label: 'Color Negative', icon: '🎨', desc: 'C-41 process' },
        { value: 'bw', label: 'Black & White', icon: '⚫', desc: 'B&W negative' },
        { value: 'slide', label: 'Slide / Reversal', icon: '🌈', desc: 'E-6 process' }
      ];

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      const typeButtons = types.map(type => `
        <button class="type-option" data-value="${type.value}" style="
          background: #2a3142;
          color: white;
          border: 2px solid #374151;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        ">
          <div style="font-size: 32px; margin-bottom: 8px;">${type.icon}</div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${type.label}</div>
          <div style="font-size: 13px; color: #9ca3af;">${type.desc}</div>
        </button>
      `).join('');

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">Select Film Type</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">Choose the film chemistry</p>
          <div style="display: grid; gap: 12px;">
            ${typeButtons}
          </div>
          <button class="cancel-btn" style="
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            background: #374151;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelectorAll('.type-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          (btn as HTMLElement).style.background = '#374151';
          (btn as HTMLElement).style.borderColor = '#1754cf';
        });
        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.background = '#2a3142';
          (btn as HTMLElement).style.borderColor = '#374151';
        });
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'];
          document.body.removeChild(overlay);
          resolve(value || null);
        });
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  // Visual dialog for ISO selection
  showISODialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const isoValues = ['50', '100', '200', '400', '800', '1600', '3200'];

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      const isoButtons = isoValues.map((iso, index) => `
        <button class="iso-option ${iso === '400' ? 'preselected' : ''}" data-value="${iso}" style="
          background: ${iso === '400' ? '#1754cf' : '#2a3142'};
          color: white;
          border: 2px solid ${iso === '400' ? '#1754cf' : '#374151'};
          border-radius: 12px;
          padding: 20px;
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">ISO ${iso}</button>
      `).join('');

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">Select Film Speed</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">Choose ISO rating</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${isoButtons}
          </div>
          <button class="cancel-btn" style="
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            background: #374151;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelectorAll('.iso-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          if (!(btn as HTMLElement).classList.contains('preselected')) {
            (btn as HTMLElement).style.background = '#374151';
            (btn as HTMLElement).style.borderColor = '#1754cf';
          }
        });
        btn.addEventListener('mouseleave', () => {
          if (!(btn as HTMLElement).classList.contains('preselected')) {
            (btn as HTMLElement).style.background = '#2a3142';
            (btn as HTMLElement).style.borderColor = '#374151';
          }
        });
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'];
          document.body.removeChild(overlay);
          resolve(value || null);
        });
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  // Visual dialog for camera selection
  showCameraSelectionDialog(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const availableCameras = await this.cameraService.getAvailableCameras();
      console.log('📷 Available cameras for new film:', availableCameras.length, availableCameras);

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      const cameraButtons = availableCameras.map(camera => `
        <button class="camera-option" data-value="${camera.id}" style="
          background: #2a3142;
          color: white;
          border: 2px solid #374151;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        ">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${camera.name}</div>
          <div style="font-size: 13px; color: #9ca3af;">${camera.brand} ${camera.type}</div>
        </button>
      `).join('');

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">Select Camera</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">Choose from your available cameras</p>
          
          ${availableCameras.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Available Cameras</p>
              <div style="display: grid; gap: 8px;">
                ${cameraButtons}
              </div>
            </div>
          ` : `
            <div style="padding: 20px; text-align: center; background: #2a3142; border-radius: 8px; margin-bottom: 16px;">
              <span style="font-size: 32px; display: block; margin-bottom: 8px;">📷</span>
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">No available cameras.<br>All cameras have film loaded.<br><br>Add a new camera to continue.</p>
            </div>
          `}
          
          <div style="display: grid; gap: 8px;">
            <button class="add-camera-btn" style="
              width: 100%;
              padding: 12px;
              background: #1754cf;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            ">
              <span style="font-size: 18px;">➕</span>
              <span>Add New Camera</span>
            </button>
            <button class="cancel-btn" style="
              width: 100%;
              padding: 12px;
              background: #1a1f2e;
              color: #9ca3af;
              border: 1px solid #374151;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
            ">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Hover effects for camera options
      overlay.querySelectorAll('.camera-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          (btn as HTMLElement).style.background = '#374151';
          (btn as HTMLElement).style.borderColor = '#1754cf';
        });
        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.background = '#2a3142';
          (btn as HTMLElement).style.borderColor = '#374151';
        });
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'];
          document.body.removeChild(overlay);
          resolve(value || null);
        });
      });

      overlay.querySelector('.add-camera-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve('new');
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }

  // Add new camera to database
  async addCamera(): Promise<string | null> {
    try {
      // Camera name
      const name = await this.showTextInputDialog('Camera Name', 'Enter camera name', 'Canon AE-1');
      if (!name) return null;
      
      // Brand
      const brand = await this.showTextInputDialog('Camera Brand', 'Enter brand', 'Canon');
      if (!brand) return null;
      
      // Type selection
      const type = await this.showCameraTypeDialog();
      if (!type) return null;
      
      // Notes (optional)
      const notes = await this.showTextInputDialog('Notes', 'Add notes about this camera (optional)', '', true) || '';

      const newCamera = await this.cameraService.createCamera({
        name,
        brand,
        type,
        notes,
        current_film_id: null,
        date_added: new Date().toISOString()
      });

      this.showToast(`Camera "${name}" added`);
      return newCamera.id;
    } catch (error) {
      console.error('Error adding camera:', error);
      this.showToast('Error adding camera');
      return null;
    }
  }

  // Visual dialog for camera type selection
  showCameraTypeDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const types = [
        { value: '35mm SLR', icon: '📷', desc: 'Single-lens reflex' },
        { value: '35mm Rangefinder', icon: '📸', desc: 'Rangefinder camera' },
        { value: 'Point & Shoot', icon: '📱', desc: 'Compact camera' },
        { value: 'Medium Format', icon: '🎞️', desc: '120 film camera' },
        { value: 'Large Format', icon: '🎬', desc: 'Sheet film camera' },
        { value: 'TLR', icon: '👁️', desc: 'Twin-lens reflex' }
      ];

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      `;

      const typeButtons = types.map(type => `
        <button class="type-option" data-value="${type.value}" style="
          background: #2a3142;
          color: white;
          border: 2px solid #374151;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${type.icon}</span>
            <div>
              <div style="font-size: 15px; font-weight: 600;">${type.value}</div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">${type.desc}</div>
            </div>
          </div>
        </button>
      `).join('');

      overlay.innerHTML = `
        <div style="
          background: #1a1f2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        ">
          <h3 style="
            color: white;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          ">Select Camera Type</h3>
          <p style="
            color: #9ca3af;
            font-size: 14px;
            margin: 0 0 20px 0;
          ">Choose the camera format</p>
          <div style="display: grid; gap: 10px;">
            ${typeButtons}
          </div>
          <button class="cancel-btn" style="
            width: 100%;
            margin-top: 16px;
            padding: 12px;
            background: #374151;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Cancel</button>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelectorAll('.type-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          (btn as HTMLElement).style.background = '#374151';
          (btn as HTMLElement).style.borderColor = '#1754cf';
        });
        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.background = '#2a3142';
          (btn as HTMLElement).style.borderColor = '#374151';
        });
        btn.addEventListener('click', () => {
          const value = (btn as HTMLElement).dataset['value'];
          document.body.removeChild(overlay);
          resolve(value || null);
        });
      });

      overlay.querySelector('.cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
    });
  }
}
