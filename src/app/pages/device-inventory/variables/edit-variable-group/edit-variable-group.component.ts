import { OnDestroy } from '@angular/core';
import { UntypedFormControl, Validators, FormArray } from '@angular/forms';
import { DeviceInventoryService } from './../../../../@core/services/device-inventory.service';
import { DataService } from './../../../../@core/services/data.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UntypedFormGroup } from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
    selector: 'app-edit-variable-group',
    templateUrl: './edit-variable-group.component.html',
    styleUrls: ['./edit-variable-group.component.scss']
})
export class EditVariableGroupComponent implements OnInit, OnDestroy {
    variableGroupForm: UntypedFormGroup;
    allVariableNames = [];
    selectedGroup;
    sub2;
    sub1;
    constructor(
        public dialogRef: MatDialogRef<EditVariableGroupComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.allVariableNames = this.data.allVariableGroup.map(a => a.groupName);
        this.selectedGroup = this.data.selectedGroup;
    }

    ngOnInit(): void {
        this.variableGroupForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.data.selectedGroup._id),
            groupName: new UntypedFormControl(this.data.selectedGroup.groupName, Validators.required),
            variables: new UntypedFormControl(this.data.selectedGroup.variables)
        });

        this.sub1 = this.variableGroupForm.get('groupName').valueChanges.subscribe(value => {
            if (
                this.allVariableNames.indexOf(value) !== -1 &&
                this.variableGroupForm.get('groupName').value !== this.selectedGroup.groupName
            ) {
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
     * Called to edit the variable group
     */

    editVariableGroup() {
        this.dataService.loading.next(true);
        this.sub2 = this.dInventoryService.editVariable(this.variableGroupForm.value).subscribe(
            allData => {
                this.dataService.loading.next(false);
                if (allData) {
                    this.dataService.getDeviceInventoryData().next(allData);
                    this.snackBar.open('Variable Group Updated Succesfully.', 'Ok', {
                        duration: 5000
                    });
                } else {
                    this.snackBar.open('Error Updating Variable Group.', 'Try Again', {
                        duration: 5000
                    });
                }
                this.dialogRef.close();
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Updating Variable Group.', 'Try Again', {
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
