import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-regression-delete',
  templateUrl: './regression-delete.component.html',
  styleUrls: ['./regression-delete.component.scss']
})
export class RegressionDeleteComponent implements OnInit {

constructor(
        public dialogRef: MatDialogRef<RegressionDeleteComponent>,
        private modal: MatDialog,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            action: string;
            successText: string;
            name: string;
            data: any;
            alert: any;
        }
    ) {}
  ngOnInit(): void {
  }

}


