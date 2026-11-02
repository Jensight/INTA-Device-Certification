import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewTargetComponent } from './view-target/view-target.component';

@Component({
    selector: 'app-api-inventory-delete',
    templateUrl: './api-inventory-delete.component.html',
    styleUrls: ['./api-inventory-delete.component.scss']
})
export class APIInventoryDeleteComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<APIInventoryDeleteComponent>,
        private modal: MatDialog,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            action: string;
            moduleDelete: boolean;
            successText: string;
            errorText: string;
            name: string;
            data: any;
            targetName: string;
            targetFields: [string];
            testSuiteDelete: boolean;
        }
    ) {}

    ngOnInit(): void {
    }

    viewTarget() {
        if(this.data.moduleDelete){
        this.modal.open(ViewTargetComponent, {
            data: {
                targetName: this.data.targetName,
                targetFields: this.data.targetFields,
                data: this.data.data['testSuiteNames']
            },
            width: '700px',
            autoFocus: false,
            panelClass: 'app-full-bleed-dialog'
        });
    }
    else if (this.data.testSuiteDelete) {
         this.modal.open(ViewTargetComponent, {
            data: {
                targetName: this.data.targetName,
                targetFields: this.data.targetFields,
                data: this.data.data['testBedNames']
            },
            width: '700px',
            autoFocus: false,
            panelClass: 'app-full-bleed-dialog'
        });

    }

    else{
        this.modal.open(ViewTargetComponent, {
            data: {
                targetName: this.data.targetName,
                targetFields: this.data.targetFields,
                data: this.data.data['target']
            },
            width: '700px',
            autoFocus: false,
            panelClass: 'app-full-bleed-dialog'
        });

    }

}
}
