export interface Camera {
  id: string;
  name: string;           // e.g., "Canon AE-1"
  brand: string;          // e.g., "Canon"
  type: string;           // e.g., "35mm SLR", "Medium Format", "Point & Shoot"
  notes: string;
  current_film_id: string | null;  // ID of currently loaded film, null if empty
  date_added: string;     // ISO 8601 format
}
