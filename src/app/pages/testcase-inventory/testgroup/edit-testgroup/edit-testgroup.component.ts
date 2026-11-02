import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AddTestGroupROIParamsComponent } from '../add-roi-parameter/add-roi-parameter.component';
import { AddTestGroupComponent } from '../add-testgroup/add-testgroup.component';

@Component({
    selector: 'app-edit-testgroup',
    templateUrl: './edit-testgroup.component.html',
    styleUrls: ['./edit-testgroup.component.scss']
})
export class EditTestGroupComponent implements OnInit, OnDestroy {
    public testGroupForm: UntypedFormGroup;
    public allTestgroupNames = [];
    private selectedTeam;
    private selectedTestgroup;
    tgSubscription;
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
        private router: Router,
        private r: ActivatedRoute,
        private dialog: MatDialog,
        public dialogRef: MatDialogRef<AddTestGroupComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        this.tgSubscription = this.tcInventoryService.selectedTestGroup.subscribe(tg => {
            if (tg) {
                this.selectedTestgroup = tg;
                this.loadData();
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });


    }

    loadData() {
        console.log(this.selectedTestgroup)
        this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        })
        this.testGroupForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedTestgroup['_id']),
            testGroupName: new UntypedFormControl(this.selectedTestgroup['testGroupName'], Validators.required),
            easeOfAutomation: new UntypedFormArray([]),
            impactOfAutomation: new UntypedFormArray([])
        });

        if (this.selectedTestgroup.easeOfAutomation) {
            for (let index = 0; index < this.selectedTestgroup.easeOfAutomation.length; index++) {
                const element = this.selectedTestgroup.easeOfAutomation[index];
                const newGroup = new UntypedFormGroup({
                    question: new UntypedFormControl(null),
                    answer: new UntypedFormControl(0)
                });
                newGroup.patchValue(element);
                const frmArray = this.testGroupForm.get('easeOfAutomation') as UntypedFormArray;
                frmArray.push(newGroup);
            }
        } else {
            this.defaultXQuestions.forEach(question => {
                const newGroup = new UntypedFormGroup({
                    question: new UntypedFormControl(null),
                    answer: new UntypedFormControl(null)
                });
                newGroup.patchValue(question);
                const frmArray = this.testGroupForm.get('easeOfAutomation') as UntypedFormArray;
                frmArray.push(newGroup);
            });

        }

        if (this.selectedTestgroup.impactOfAutomation) {
            for (let index = 0; index < this.selectedTestgroup.impactOfAutomation.length; index++) {
                const element = this.selectedTestgroup.impactOfAutomation[index];
                const newGroup = new UntypedFormGroup({
                    question: new UntypedFormControl(null),
                    answer: new UntypedFormControl(0)
                });
                newGroup.patchValue(element);
                const frmArray = this.testGroupForm.get('impactOfAutomation') as UntypedFormArray;
                frmArray.push(newGroup);
            }
        } else {
            this.defaultYQuestions.forEach(question => {
                const newGroup = new UntypedFormGroup({
                    question: new UntypedFormControl(null),
                    answer: new UntypedFormControl(null)
                });
                newGroup.patchValue(question);
                const frmArray = this.testGroupForm.get('impactOfAutomation') as UntypedFormArray;
                frmArray.push(newGroup);
            });
        }

        this.sub1 = this.dataService.getTestGroup().subscribe(tg => {
            if (tg) {
                this.allTestgroupNames = [];
                tg.forEach(element => {
                    this.allTestgroupNames.push(element['testGroupName']);
                });
            }
        });
    }

    ngOnInit() {
        this.sub2 = this.testGroupForm.get('testGroupName').valueChanges.subscribe(value => {
            if (this.allTestgroupNames.indexOf(value) !== -1 && this.selectedTestgroup['testGroupName'] !== value) {
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
     * Update Test Group Function
     */

    updateTestGroup() {
        this.dataService.loading.next(true)
        this.testGroupForm.setErrors({ formSubbited: true });
        this.sub3 = this.tcInventoryService.edit( this.testGroupForm.value).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testgroup updated Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error updating Testgropup', 'Try Again', {
                    duration: 5000
                });
                this.dialogRef.close();
            }
        );
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

    cancel() {
        this.dialogRef.close();
    }

    /**
     * Remove Params function
     * @param type .
     * @param index .
     */
    removeParams(type, index) {
        const formArray = this.testGroupForm.get(type) as UntypedFormArray;
        formArray.removeAt(index);
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
}
