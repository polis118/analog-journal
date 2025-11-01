export interface Frame {
  id: string;
  film_id: string;
  frame_number: number;
  date_taken: string;    // ISO 8601 format
  latitude: number | null;
  longitude: number | null;
  location: string;      // např. "Kyoto, Japan"
  scene_tag: string;     // např. "portrait", "landscape", "street"
  aperture: string;      // např. "f/8"
  shutter_speed: string; // např. "1/125s"
  lens: string;          // např. "50mm"
  notes: string;
}
