import { Injectable } from '@angular/core';
import { Film } from '../models/film.model';
import { Frame } from '../models/frame.model';

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {
  constructor() {}

  /**
   * Export filmu a jeho snímků do CSV souboru
   */
  async exportFilmToCSV(film: Film, frames: Frame[]): Promise<void> {
    try {
      // Vytvoření CSV obsahu
      const csvContent = this.generateCSV(film, frames);
      
      // Název souboru
      const fileName = `${this.sanitizeFileName(film.name)}_${new Date().getTime()}.csv`;

      // Vytvoření Blob a stažení souboru
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('CSV file downloaded:', fileName);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

  /**
   * Generování CSV obsahu z filmu a snímků
   */
  private generateCSV(film: Film, frames: Frame[]): string {
    let csv = '';

    // Hlavička filmu
    csv += '=== FILM METADATA ===\n';
    csv += 'Field,Value\n';
    csv += `Name,${this.escapeCSV(film.name)}\n`;
    csv += `Type,${this.escapeCSV(film.type)}\n`;
    csv += `Brand,${this.escapeCSV(film.brand)}\n`;
    csv += `ISO,${film.iso}\n`;
    csv += `Camera,${this.escapeCSV(film.camera)}\n`;
    csv += `Lens,${this.escapeCSV(film.lens)}\n`;
    csv += `Date Started,${film.date_started}\n`;
    csv += `Date Finished,${film.date_finished}\n`;
    csv += `Notes,${this.escapeCSV(film.notes)}\n`;
    csv += '\n';

    // Hlavička snímků
    csv += '=== FRAMES ===\n';
    csv += 'Frame Number,Date Taken,Scene Tag,Aperture,Shutter Speed,Lens,Location,Latitude,Longitude,Notes\n';

    // Data snímků
    frames.forEach(frame => {
      csv += `${frame.frame_number},`;
      csv += `${frame.date_taken},`;
      csv += `${this.escapeCSV(frame.scene_tag)},`;
      csv += `${this.escapeCSV(frame.aperture)},`;
      csv += `${this.escapeCSV(frame.shutter_speed)},`;
      csv += `${this.escapeCSV(frame.lens)},`;
      csv += `${this.escapeCSV(frame.location)},`;
      csv += `${frame.latitude || ''},`;
      csv += `${frame.longitude || ''},`;
      csv += `${this.escapeCSV(frame.notes)}\n`;
    });

    return csv;
  }

  /**
   * Escape CSV hodnot (ošetření čárek a uvozovek)
   */
  private escapeCSV(value: string | null | undefined): string {
    if (!value) return '';
    
    // Pokud obsahuje čárku, uvozovky nebo nový řádek, obalíme uvozovkami
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Zdvojíme uvozovky uvnitř hodnoty
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  /**
   * Očištění názvu souboru od nebezpečných znaků
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50);
  }
}
