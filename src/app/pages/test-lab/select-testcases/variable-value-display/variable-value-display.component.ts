import { Component, OnInit, Inject } from '@angular/core';
import { DataService } from '../../../../@core/services/data.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-variable-value-display',
    templateUrl: './variable-value-display.component.html',
    styleUrls: ['./variable-value-display.component.scss']
})
export class VariableValueDisplayComponent implements OnInit {
    constructor(
        public dataService: DataService,
        public dialogRef: MatDialogRef<VariableValueDisplayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        // console.log(data);
    }

    ngOnInit() {}
}
