import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl,Validators, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
    selector: 'app-add-testgroup-params',
    templateUrl: './add-roi-parameter.component.html',
    styleUrls: ['./add-roi-parameter.component.scss']
})
export class AddTestGroupROIParamsComponent implements OnInit {
    public ROIParamsForm: UntypedFormGroup;
    constructor(
        public dialogRef: MatDialogRef<AddTestGroupROIParamsComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
    }

    ngOnInit() {
        const temp = new UntypedFormGroup({
            question: new UntypedFormControl( null, Validators.required),
            answer: new UntypedFormControl(0)
        })
        this.ROIParamsForm = new UntypedFormGroup({
            questions: new UntypedFormArray([temp])
        });
    }

    /**
     * Add New Question Model
     */
    addNewQuestion() {
        const formArrayData = this.ROIParamsForm.get('questions') as UntypedFormArray;
        const temp = new UntypedFormGroup({
            question: new UntypedFormControl( null, Validators.required),
            answer: new UntypedFormControl(0)
        });
        formArrayData.push(temp);
    }
    /**
     * Delete a variable
     * @param index .
     */

    deleteVariable(index) {
        const formArrayData = this.ROIParamsForm.get('questions') as UntypedFormArray;
        formArrayData.removeAt(index);
    }

    /**
     * Add Questions Function
     */

    addQuestions() {
        this.dialogRef.close({event: 'ADD', data : this.ROIParamsForm})

    }

}

