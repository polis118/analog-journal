import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor() {}

  /**
   * Inicializace - žádost o povolení notifikací (web verze - zatím neimplementováno)
   */
  async requestPermission(): Promise<boolean> {
    console.log('Notifications not implemented for web version');
    return false;
  }

  /**
   * Kontrola, zda jsou notifikace povoleny (web verze - zatím neimplementováno)
   */
  async checkPermission(): Promise<boolean> {
    return false;
  }

  /**
   * Naplánování připomínky k filmu (web verze - zatím neimplementováno)
   */
  async scheduleFilmReminder(
    filmName: string,
    scheduleDate: Date,
    message?: string
  ): Promise<void> {
    console.log('Notifications not implemented for web version');
  }

  /**
   * Okamžitá notifikace (web verze - zatím neimplementováno)
   */
  async showInstantNotification(title: string, body: string): Promise<void> {
    console.log('Notifications not implemented for web version');
  }

  /**
   * Zrušení všech naplánovaných notifikací (web verze - zatím neimplementováno)
   */
  async cancelAllNotifications(): Promise<void> {
    console.log('Notifications not implemented for web version');
  }

  /**
   * Seznam naplánovaných notifikací (web verze - zatím neimplementováno)
   */
  async getPendingNotifications(): Promise<any> {
    return [];
  }
}
