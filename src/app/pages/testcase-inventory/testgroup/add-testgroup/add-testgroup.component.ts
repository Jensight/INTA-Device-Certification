import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { AddTestGroupROIParamsComponent } from '../add-roi-parameter/add-roi-parameter.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-add-testgroup',
    templateUrl: './add-testgroup.component.html',
    styleUrls: ['./add-testgroup.component.scss']
})
export class AddTestGroupComponent implements OnInit, OnDestroy {
    public testGroupForm: UntypedFormGroup;
    public allTestgroupNames = [];
    sub1;
    sub2;
    sub3;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/testcase-inventory/test-set',
            label: 'TestCase Inventory'
        },
        {
            link: '/pages/testcase-inventory/testgroup',
            label: 'Test Group'
        }
    ]
    defaultXQuestions = [
        {
            question: 'What is the Complexity to Automate Testcase?',
            answer: 0
        },
        {
            question: 'What is the Effort needed to Automate Testcase?',
            answer: 0
        },
        {
            question: 'What is the Cost of Automation?',
            answer: 0
        },
        {
            question: 'What is the Amount of Automatable Testcases?',
            answer: 0
        }
    ];

    defaultYQuestions = [
        {
            question: 'What is the frequency of usablilty in regressions?',
            answer: 0
        },
        {
            question: 'What is the priority of testcases ?',
            answer: 0
        },
        {
            question: 'What is the effort savings in time ?',
            answer: 0
        },
        {
            question: 'What is the number of times testcase getting failed ?',
            answer: 0
        }
    ];
    constructor(
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        public dialogRef: MatDialogRef<AddTestGroupComponent>,
        @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
    ) {
        this.dataService.selectedTeam.subscribe(data => {
            if (data) {
                this.selectedTeam = data;
            }
        });
        this.testGroupForm = new UntypedFormGroup({
            testGroupName: new UntypedFormControl(null, Validators.required),
            easeOfAutomation: new UntypedFormArray([]),
            impactOfAutomation: new UntypedFormArray([])
        });

        this.defaultXQuestions.forEach(question => {
            const newGroup = new UntypedFormGroup({
                question: new UntypedFormControl(null),
                answer: new UntypedFormControl(null)
            });
            newGroup.patchValue(question);
            const frmArray = this.testGroupForm.get('easeOfAutomation') as UntypedFormArray;
            frmArray.push(newGroup);
        });

        this.defaultYQuestions.forEach(question => {
            const newGroup = new UntypedFormGroup({
                question: new UntypedFormControl(null),
                answer: new UntypedFormControl(null)
            });
            newGroup.patchValue(question);
            const frmArray = this.testGroupForm.get('impactOfAutomation') as UntypedFormArray;
            frmArray.push(newGroup);
        });
        this.sub1 = this.dataService.getTestGroup().subscribe(modules => {
            if (modules) {
                this.allTestgroupNames = [];
                modules.forEach(element => {
                    this.allTestgroupNames.push(element['testGroupName']);
                });
            }
        });
    }

    ngOnInit() {
        this.sub2 = this.testGroupForm.get('testGroupName').valueChanges.subscribe(value => {
            if (this.allTestgroupNames.indexOf(value) !== -1) {
                this.testGroupForm.get('testGroupName').setErrors({ duplicate: true });
            } else if (this.testGroupForm.get('testGroupName').hasError('required')) {
                this.testGroupForm.get('testGroupName').setErrors(null);
                this.testGroupForm.get('testGroupName').setErrors({ required: true });
            } else {
                this.testGroupForm.get('testGroupName').setErrors(null);
            }
        });
    }

    /**
     * Add Test Group Function
     */

    addTestGroup() {
        this.dataService.loading.next(true);
        this.testGroupForm.setErrors({ formSubbited: true });
        this.sub3 = this.tcInventoryService.add( this.testGroupForm.value).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testgroup Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Testgropup', 'Try Again', {
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
    }
    /**
     * Add New Params Function
     * @param type .
     */

    addNewParams(type) {
        const dialogRef = this.dialog.open(AddTestGroupROIParamsComponent, { width: '400px' });
        dialogRef.afterClosed().subscribe(result => {
            if (result.event === 'ADD') {
                const formGroup = result.data as UntypedFormGroup;
                const allQuesions = formGroup.get('questions') as UntypedFormArray;
                for (let index = 0; index < allQuesions.length; index++) {
                    const element = allQuesions['controls'][index];
                    const temp = this.testGroupForm.get(type) as UntypedFormArray;
                    temp.push(element);
                }
            }
        });
    }

    /**
     * Remove Params Function
     * @param type .
     * @param index .
     */

    removeParams(type, index) {
        const formArray = this.testGroupForm.get(type) as UntypedFormArray;
        formArray.removeAt(index);
    }
}
