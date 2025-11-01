import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Camera } from '../../models/camera.model';
import { CameraService } from '../../services/camera.service';
import { SwipeBackDirective } from '../../directives/swipe-back.directive';

@Component({
  selector: 'app-cameras',
  templateUrl: './cameras.page.html',
  styleUrls: [],
  standalone: true,
  imports: [CommonModule, SwipeBackDirective]
})
export class CamerasPage implements OnInit {
  cameras: Camera[] = [];
  isLoading = true;

  constructor(
    private cameraService: CameraService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadCameras();
  }

  async loadCameras() {
    try {
      this.isLoading = true;
      this.cameras = await this.cameraService.getAllCameras();
      
      // Sort: cameras with film first, then by name
      this.cameras.sort((a, b) => {
        if (a.current_film_id && !b.current_film_id) return -1;
        if (!a.current_film_id && b.current_film_id) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error loading cameras:', error);
      this.showToast('Error loading cameras');
    } finally {
      this.isLoading = false;
    }
  }

  async addCamera() {
    try {
      // Camera name
      const name = await this.showTextInputDialog('Camera Name', 'Enter camera name', 'Canon AE-1');
      if (!name) return;
      
      // Brand
      const brand = await this.showTextInputDialog('Camera Brand', 'Enter brand', 'Canon');
      if (!brand) return;
      
      // Type selection
      const type = await this.showCameraTypeDialog();
      if (!type) return;
      
      // Notes (optional)
      const notes = await this.showTextInputDialog('Notes', 'Add notes about this camera (optional)', '', true) || '';

      await this.cameraService.createCamera({
        name,
        brand,
        type,
        notes,
        current_film_id: null,
        date_added: new Date().toISOString()
      });

      await this.loadCameras();
      this.showToast(`Camera "${name}" added`);
    } catch (error) {
      console.error('Error adding camera:', error);
      this.showToast('Error adding camera');
    }
  }

  async deleteCamera(camera: Camera, event: Event) {
    event.stopPropagation();

    let confirmMessage = `Are you sure you want to delete "${camera.name}"?`;
    
    if (camera.current_film_id) {
      confirmMessage = `Warning: "${camera.name}" has a film loaded!\n\nDeleting this camera will unload the film. The film data will be preserved.\n\nAre you sure you want to delete this camera?`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // If camera has a film loaded, unload it first
      if (camera.current_film_id) {
        await this.cameraService.unloadFilmFromCamera(camera.id);
      }
      
      await this.cameraService.deleteCamera(camera.id);
      await this.loadCameras();
      this.showToast('Camera deleted');
    } catch (error) {
      console.error('Error deleting camera:', error);
      this.showToast('Error deleting camera');
    }
  }

  goBack() {
    this.router.navigate(['/']);
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
      animation: slideUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}
