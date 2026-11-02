import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
    selector: 'app-reservation-overlapping',
    templateUrl: './reservation-overlapping.component.html',
    styleUrls: ['./reservation-overlapping.component.scss']
})
export class ReservationOverlappingComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<ReservationOverlappingComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,) { }

    ngOnInit(): void {
        let temp =new Date(this.data.nextPossibleReservation);
        temp.setTime(temp.getTime() + 1000 * 60);
        this.data.nextPossibleReservation = temp;
     }

     close() {
         this.dialogRef.close()
     }
}
