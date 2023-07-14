import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Calendar } from 'src/app/classes/calendar/calendar';

/** A list of random color presets to set calendars to */
const CALENDAR_COLORS = ["#ff0000", "#00ff00", "#0000ff"];

/** A regular expression to match URLs */
const URL_REGEXP = '[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}(.[a-z]{2,4})?\b(/[-a-zA-Z0-9@:%_+.~#?&//=]*)?';

/**
 * AddCalendarDialogComponent creates a dialog to add a calendar
 */
@Component({
  selector: 'app-add-calendar-dialog',
  templateUrl: './add-calendar-dialog.component.html',
  styleUrls: ['./add-calendar-dialog.component.scss']
})
export class AddCalendarDialogComponent {
  /** Form control for the color picker */
  public colorControl: FormControl = new FormControl(null, [Validators.required, Validators.pattern(URL_REGEXP)]);

  /** Form control for the url input */
  public urlControl: FormControl = new FormControl(null, [Validators.required]);

  /** The calendar this dialog is creating */
  public calendar: Calendar;

  /**
   * Default constructor for the dialog, which initializes the base calendar
   * 
   * @param _dialogRef The reference to this opened dialog
   * @param data Injected data to the component
   */
  constructor(
    private _dialogRef: MatDialogRef<AddCalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.calendar = new Calendar("", CALENDAR_COLORS[Math.floor(Math.random() * CALENDAR_COLORS.length)]);
  }

  /**
   * Close the dialog
   */
  public close(): void {
    this._dialogRef.close();
  }
}
