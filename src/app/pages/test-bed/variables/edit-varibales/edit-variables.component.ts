import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-edit-variables',
    templateUrl: './edit-variables.component.html',
    styleUrls: ['./edit-variables.component.scss']
})
export class EditVariablesComponent implements OnInit, OnDestroy {
    allVariables = [];
    allvariableNames = [];
    variableForm: UntypedFormGroup;
    dataSubscription;
    testBedSubscription;
    sub1;
    constructor(
        public dialogRef: MatDialogRef<EditVariablesComponent>,
        @Inject(MAT_DIALOG_DATA) public varData: { selectedTeam: string; data: any },
        public dataService: DataService,
        public testBedService: TestBedService,
        private snackBar: MatSnackBar
    ) {
        this.dataSubscription = this.dataService.getTestbedVariables().subscribe(data => {
            if (data) {
                this.allVariables = data;
                this.allvariableNames = [];
                this.allVariables.forEach(varibale => {
                    this.allvariableNames.push(varibale['variableName']);
                });
            }
        });
    }

    ngOnInit() {
        this.variableForm = new UntypedFormGroup({
            _id: new UntypedFormControl(null),
            variableName: new UntypedFormControl(null, Validators.required)
        });

        if (this.varData.data) {
            this.variableForm.patchValue(this.varData.data);
        }
        this.sub1 = this.variableForm.get('variableName').valueChanges.subscribe(value => {
            if (this.allvariableNames.indexOf(value) !== -1) {
                this.variableForm.get('variableName').setErrors({ duplicate: true });
            } else if (this.variableForm.get('variableName').hasError('required')) {
                this.variableForm.get('variableName').setErrors(null);
                this.variableForm.get('variableName').setErrors({ required: true });
            } else {
                this.variableForm.get('variableName').setErrors(null);
            }
        });
    }

    /**
     * Add Variable Function invoked to modify Variable data to backend via API service call
     */

    editVariable() {
        this.dataService.loading.next(true)
        this.testBedSubscription = this.testBedService
            .updateVariable(this.variableForm.value)
            .subscribe(
                result => {
                    this.dataService.loading.next(false)
                    if (result) {
                        this.dataService.getTestBedData().next(result);
                        this.snackBar.open('Variable Updated Successfully', 'OK', {
                            duration: 5000
                        });
                        this.dialogRef.close();
                    }
                },
                error => {
                    this.dataService.loading.next(false)
                    this.snackBar.open('Error Updating Varibale', 'Try Again', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            );
    }

    cancel() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }

        if (this.testBedSubscription) {
            this.testBedSubscription.unsubscribe();
        }
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
