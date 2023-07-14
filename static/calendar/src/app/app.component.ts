import { Component } from '@angular/core';
import { Calendar } from './classes/calendar/calendar';
import { DialogService } from './services/dialog/dialog.service';

/**
 * AppComponent is the outermost component, which contains an
 * addable list of calendars and a navigation link to the
 * generation page.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /** The list of saved calendars in the class */
  public calendars: Calendar[] = [];

  /**
   * Initialize all of the app's services
   *  
   * @param _dialogService The dialog service for the application
   */
  constructor(
    private _dialogService: DialogService,
  ) { }

  /**
   * Add a calendar to the list of saved calendars
   * 
   * @param url The name/url of the calendar to add
   * @param color The color of the calendar to add
   */
  public addCalendar(): void {
    const dialog = this._dialogService.addCalendarDialog();
    dialog.afterClosed().subscribe((result: Calendar) => {
      if (result != undefined) {
        this.calendars.push(result);
      }
    });
  }

  /**
   * Remove a calendar from the list of saved calendars
   * 
   * @param url The name/url of the calendar to remove
   */
  public removeCalendar(url: string): void {
    this.calendars = this.calendars.filter(x => x.url !== url);
  }
}
