import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddCalendarDialogComponent } from 'src/app/dialogs/add-calendar-dialog/add-calendar-dialog.component';

/**
 * DialogService is a service that contains all dialogs used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  /**
   * Construct the dialog service 
   * 
   * @param _dialog The encapsulated material dialog service
   */
  constructor(
    private _dialog: MatDialog,
  ) { }

  /**
   * Open the add calendar dialog and returns a reference to that dialog
   * 
   * @return Reference to the dialog (so the component can do something with it)
   */
  addCalendarDialog(): MatDialogRef<AddCalendarDialogComponent> {
    // Open the dialog
    const dialogRef: MatDialogRef<AddCalendarDialogComponent> = this._dialog.open(AddCalendarDialogComponent, {
      width: "50%",
      data: {},
    });

    return dialogRef;
  }
}
