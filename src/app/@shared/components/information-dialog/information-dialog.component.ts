import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-information-dialog',
    templateUrl: './information-dialog.component.html',
    styleUrls: ['./information-dialog.component.scss']
})
export class InformationDiaogComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<InformationDiaogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string; body: string }
    ) {}

    ngOnInit() {}

    close() {
        this.dialogRef.close();
    }
}
