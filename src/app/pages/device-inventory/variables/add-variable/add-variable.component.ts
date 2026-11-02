import { Validators } from '@angular/forms';
import { UntypedFormGroup } from '@angular/forms';
import { UntypedFormControl } from '@angular/forms';
import { UntypedFormArray } from '@angular/forms';
import { DeviceInventoryService } from './../../../../@core/services/device-inventory.service';
import { DataService } from './../../../../@core/services/data.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, Inject } from '@angular/core';
import * as _ from 'lodash';
@Component({
    selector: 'app-add-variable',
    templateUrl: './add-variable.component.html',
    styleUrls: ['./add-variable.component.scss']
})
export class AddVariableComponent implements OnInit {
    public variableForm: UntypedFormGroup;
    subcriptions = [];
    oldVariableNames = []
    sub1;
    sub2;
    constructor(
        public dialogRef: MatDialogRef<AddVariableComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.oldVariableNames = this.data.selectedGroup.variables.map(a => a.variableName)
    }

    ngOnInit() {
        this.variableForm = new UntypedFormGroup({
            _id: new UntypedFormControl(null),
            groupName: new UntypedFormControl(this.data.selectedGroup.groupName || null, Validators.required),
            variables: new UntypedFormArray([], this.customGroupValidation)
        });
        this.variableForm.patchValue(this.data.selectedGroup);
        this.addNewVariable();
    }

    /**
     * Retrieves the form data and sends it to the backend using API
     */

    addNewVariable() {
        const formArrayData = this.variableForm.get('variables') as UntypedFormArray;
        const element = new UntypedFormControl(null, Validators.required);
        formArrayData.push(element);
        const index = formArrayData.length - 1;
        this.sub1 = element.valueChanges.subscribe(value => {
            const ary = this.variableForm.get('variables') as UntypedFormArray;
            const ele = ary.at(index);
            if (this.oldVariableNames.indexOf(value) !== -1) {
                ele.setErrors({ ...ele.errors, oldDuplicate: true });
            } else if (ele.hasError('required')) {
                ele.setErrors(null);
                ele.setErrors({ ...ele.errors, required: true });
            } else {
                ele.setErrors(null);
            }
        });
    }

    /**
     * Custom validations for selected model variables
     * @param formArray .
     */

    customGroupValidation(formArray) {
        let isError = false;
        const result = _.groupBy(formArray.controls, c => c.value);
        for (let prop in result) {
            if (result[prop].length > 1 && prop !== '') {
                isError = true;
                _.forEach(result[prop], function(item) {
                    item.setErrors({ ...item.errors, duplicate: true });
                });
            } else {
                const err = result[prop][0].errors;
                if (err && err['duplicate']) {
                    delete err['duplicate'];
                    if (_.isEmpty(err)) {
                        result[prop][0].setErrors(null);
                    } else {
                        result[prop][0].setErrors(err);
                    }
                }
            }
        }
        if (isError) {
            return { duplicate: 'duplicate entries' };
        }
    }

    /**
     * Called to remove a variable from the form
     * @param index .
     */

    deleteVariable(index) {
        const formArrayData = this.variableForm.get('variables') as UntypedFormArray;
        formArrayData.removeAt(index);
    }

    /**
     * Called to add a variable to the selected variable group
     */

    addVariable() {
        const newData = _.cloneDeep(this.data.selectedGroup);
        const variablesToObj = this.variableForm.get('variables').value.map(a => {
            return {variableName: a};
        });
        newData['variables'] = [...newData['variables'], ...variablesToObj];
        const updatedVar = this.variableForm.getRawValue();
        updatedVar['variables'] = newData['variables'];
        console.log('updatedVar*****', updatedVar);
        console.log('newData*****', newData.variables);
        console.log('updatedVar*****', updatedVar.variables);

        
        this.sub2 = this.dInventoryService.editVariable(updatedVar).subscribe(
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
