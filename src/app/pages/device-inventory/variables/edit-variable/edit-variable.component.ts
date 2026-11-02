import { OnDestroy } from '@angular/core';
import { Component, OnInit, Inject } from '@angular/core';
import { Validators, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';

import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { DataService } from '../../../../@core/services/data.service';

@Component({
    selector: 'app-edit-variable',
    templateUrl: './edit-variable.component.html',
    styleUrls: ['./edit-variable.component.scss']
})
export class EditVariableComponent implements OnInit, OnDestroy {
    public variableForm: UntypedFormGroup;
    subcriptions = [];
    oldVariableNames = [];
    selectedVariable;
    sub1;
    sub2;
    constructor(
        public dialogRef: MatDialogRef<EditVariableComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.oldVariableNames = this.data.selectedGroup.variables.map(a => a.variableName);
        this.selectedVariable = this.data.selectedVariable;
    }

    ngOnInit() {
        this.variableForm = new UntypedFormGroup({
            _id: new UntypedFormControl(null, Validators.required),
            variableName: new UntypedFormControl(null, Validators.required)
        });

        this.sub1 = this.variableForm.get('variableName').valueChanges.subscribe(value => {
            if (this.oldVariableNames.indexOf(value) !== -1) {
                this.variableForm.get('variableName').setErrors({ duplicate: true });
            } else if (this.variableForm.get('variableName').hasError('required')) {
                this.variableForm.get('variableName').setErrors(null);
                this.variableForm.get('variableName').setErrors({ required: true });
            } else {
                this.variableForm.get('variableName').setErrors(null);
            }
        });
        this.variableForm.patchValue(this.data.selectedVariable);
    }

    /**
     * Wordt gebruikt om een ??variabelegroep te bewerken
     */

    editVariable() {
        const newData = _.cloneDeep(this.data.selectedGroup);
        const index = _.findIndex(this.data.selectedGroup['variables'], { _id: this.selectedVariable['_id'] });

        if (index > -1) {
            newData['variables'][index] = this.variableForm.value;
            this.sub2 = this.dInventoryService.editVariable(newData).subscribe(
                allData => {
                    this.dataService.loading.next(false);
                    if (allData) {
                        this.dataService.getDeviceInventoryData().next(allData);
                        this.snackBar.open('Variable  Added Succesfully.', 'Ok', {
                            duration: 5000
                        });
                    } else {
                        this.snackBar.open('Error Adding Variable .', 'Try Again', {
                            duration: 5000
                        });
                    }
                    this.dialogRef.close();
                },
                error => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Error Adding Variable .', 'Try Again', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            );
        } else {
            this.snackBar.open('Error Adding Variable .', 'Try Again', {
                duration: 5000
            });
            this.dialogRef.close();
        }
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
