export interface Film {
  id: string;
  name: string;
  type: string;  // např. "color negative", "black & white", "slide"
  brand: string; // např. "Kodak", "Fuji", "Ilford"
  iso: number;
  camera: string;        // Camera name (for backward compatibility)
  camera_id?: string;    // ID reference to Camera object (optional, new system)
  lens: string;
  date_started: string;  // ISO 8601 format
  date_finished?: string; // ISO 8601 format (optional - undefined if not developed yet)
  notes: string;
  is_pinned?: boolean;   // true if this is the currently active film
}
