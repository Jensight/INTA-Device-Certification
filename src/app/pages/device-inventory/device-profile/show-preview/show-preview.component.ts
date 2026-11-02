import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
@Component({
    selector: 'app-show-preview',
    templateUrl: './show-preview.component.html',
    styleUrls: ['./show-preview.component.scss']
})
export class ShowPreviewComponent  {
   
    constructor(
        public dialogRef: MatDialogRef<ShowPreviewComponent>,
        @Inject(MAT_DIALOG_DATA) public deviceProfileForm: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
        )
        {
        }
    }
