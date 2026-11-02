import { OnDestroy } from '@angular/core';
import { Validators, UntypedFormArray } from '@angular/forms';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
    selector: 'app-add-model-variable',
    templateUrl: './add-variable-group.component.html',
    styleUrls: ['./add-variable-group.component.scss']
})
export class AddVariableGroupComponent implements OnInit, OnDestroy {
    variableGroupForm: UntypedFormGroup;
    allVariableNames = [];
    sub2;
    sub1;
    constructor(
        public dialogRef: MatDialogRef<AddVariableGroupComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.allVariableNames = this.data.allVariableGroup.map(a=> a.groupName)
    }

    ngOnInit(): void {
        this.variableGroupForm = new UntypedFormGroup({
            groupName: new UntypedFormControl(null, Validators.required),
            variables: new UntypedFormArray([])
        });

        this.sub1 = this.variableGroupForm.get('groupName').valueChanges.subscribe(value => {
            if (this.allVariableNames.indexOf(value) !== -1) {
                this.variableGroupForm.get('groupName').setErrors({ duplicate: true });
            } else if (this.variableGroupForm.get('groupName').hasError('required')) {
                this.variableGroupForm.get('groupName').setErrors(null);
                this.variableGroupForm.get('groupName').setErrors({ required: true });
            } else {
                this.variableGroupForm.get('groupName').setErrors(null);
            }
        });
    }

    /**
     * Wordt gebruikt om een ??variabelegroep te maken
     */

    addVariableGroup() {
        this.dataService.loading.next(true);
        this.sub2 = this.dInventoryService.addNewModel( this.variableGroupForm.value).subscribe(
            allData => {
                this.dataService.loading.next(false);
                if (allData) {
                    this.dataService.getDeviceInventoryData().next(allData);
                    this.snackBar.open('Variable Group Added Succesfully.', 'Ok', {
                        duration: 5000
                    });
                } else {
                    this.snackBar.open('Error Adding Variable Group.', 'Try Again', {
                        duration: 5000
                    });
                }
                this.dialogRef.close();
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Variable Group.', 'Try Again', {
                    duration: 5000
                });
                this.dialogRef.close();
            }
        );
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }
}
