import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';

@Component({
    selector: 'app-add-testsuite',
    templateUrl: './add-testsuite.component.html',
    styleUrls: ['./add-testsuite.component.scss']
})
export class AddTestSuiteComponent implements OnInit, OnDestroy {
    public testSuiteForm: UntypedFormGroup;
    public testSuiteNames = [];
    public allModule = [];
    sub1;
    sub2;
    sub3;
    sub4;
    constructor(
        public dialogRef: MatDialogRef<AddTestSuiteComponent>,
        @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.sub1 = this.dataService.getTCModules().subscribe(module => {
            if (module) {
                this.allModule = module;
            }
        });
        this.sub2 = this.dataService.getTestSuites().subscribe(testSuite => {
            if (testSuite) {
                this.testSuiteNames = [];
                testSuite.forEach(element => {
                    this.testSuiteNames.push(element['testSuiteName']);
                });
            }
        });
    }

    ngOnInit() {
        this.testSuiteForm = new UntypedFormGroup({
            //  testSuiteName: new UntypedFormControl(null, Validators.required),
            testSuiteName: new UntypedFormControl(
                null,
                Validators.compose([Validators.required,
                Validators.maxLength(128),
                Validators.pattern(/^[A-Za-z0-9\][_-]+$/)]
            )
            
        ),
            moduleId: new UntypedFormControl([], Validators.required),
            testCases: new UntypedFormArray([])
        });
        this.sub3 = this.testSuiteForm.get('testSuiteName').valueChanges.subscribe(value => {
            if (this.testSuiteNames.indexOf(value) !== -1) {
                this.testSuiteForm.get('testSuiteName').setErrors({ duplicate: true });
            } else if (this.testSuiteForm.get('testSuiteName').hasError('required')) {
                this.testSuiteForm.get('testSuiteName').setErrors(null);
                this.testSuiteForm.get('testSuiteName').setErrors({ required: true });
            }
            else if ( this.testSuiteForm.get('testSuiteName').hasError('pattern')) {
                this.testSuiteForm.get('testSuiteName').setErrors({ pattern: true });
            }
            
             else {
                this.testSuiteForm.get('testSuiteName').setErrors(null);
            }
        });
    }

    /**
     * Add Testsuit function to add a new testsuit to backed through API call
     */

    addTestSuite() {
        this.dataService.loading.next(true)
        this.testSuiteForm.setErrors({ formSubbited: true });
        this.sub4 = this.tcInventoryService.add( this.testSuiteForm.value).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testsuite Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Adding Testsuite', 'Try Again', {
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
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
    }
}
