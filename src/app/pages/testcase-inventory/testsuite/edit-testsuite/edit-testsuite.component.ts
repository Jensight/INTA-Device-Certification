import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, FormArray, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
    selector: 'app-edit-testsuite',
    templateUrl: './edit-testsuite.component.html',
    styleUrls: ['./edit-testsuite.component.scss']
})
export class EditTestSuiteComponent implements OnInit, OnDestroy {
    searchTextboxControl = new UntypedFormControl();
    public testSuiteForm: UntypedFormGroup;
    public testSuiteNames = [];
    public allModule = [];
    public selectedTeam;
    public selectedTestSuite;
    originalModuleList = [...this.allModule];
    actionType ="Edit"
    sub1;
    sub2;
    sub3;
    sub4;
    duplicateClone: boolean = false;
    testSet: any = [];
    filteredOptions: Observable<any[]>;
    selectedValues = [];
    constructor(
        public dialogRef: MatDialogRef<EditTestSuiteComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.selectedTeam = this.data['selectedTeam'];
        console.log("this.data['selectedTeam']>>>>", this.data);
        this.selectedTestSuite = this.data['selectedTestSuite'];
        this.actionType = this.data['action'];
        this.sub1 = this.dataService.getTCModules().subscribe(module => {
            if (module) {
                this.allModule = module;
                this.allModule = _.sortBy(this.allModule, 'moduleName');   
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
        
    this.filteredOptions = this.searchTextboxControl.valueChanges
        .pipe(
          startWith<string>(''),
          map(name => this._filter(name))
        );
        var moduleId = [];
        if(typeof this.selectedTestSuite.moduleId == "string"){
            moduleId.push(this.selectedTestSuite.moduleId);
        } else {
            moduleId = this.selectedTestSuite.moduleId;
        }
        if(this.actionType === "Edit"){
            this.testSuiteForm = new UntypedFormGroup({
                _id: new UntypedFormControl(this.selectedTestSuite['_id']),
                testSuiteName: new UntypedFormControl(this.selectedTestSuite['testSuiteName'], 
                                 Validators.compose([Validators.required,
                                Validators.maxLength(128),
                                Validators.pattern(/^[A-Za-z0-9\][_-]+$/)]
                            ),
                        ),
                moduleId: new UntypedFormControl(moduleId, Validators.required)
                // testCases: new FormArray(this.selectedTestSuite['testCases'])[]
            });
        }else{
            this.testSuiteForm = new UntypedFormGroup({
                testSuiteName: new UntypedFormControl(this.selectedTestSuite['testSuiteName'] + '_cloned', 
                    Validators.compose([Validators.required,
                    Validators.maxLength(128),
                    Validators.pattern(/^[A-Za-z0-9\][_-]+$/)]
                ),
                ),
                moduleId: new UntypedFormControl({ value: moduleId, disabled: true }, Validators.required),
                // testCases: new UntypedFormArray(this.selectedTestSuite['testCases'], Validators.required)
            });
        }
        // this.testSuiteForm = new UntypedFormGroup({
        //     _id: new UntypedFormControl(this.selectedTestSuite['_id']),
        //     testSuiteName: new UntypedFormControl(this.selectedTestSuite['testSuiteName'], Validators.required),
        //     moduleId: new UntypedFormControl(moduleId, Validators.required)
        //     // testCases: new FormArray(this.selectedTestSuite['testCases'])[]
        // });
        this.sub3 = this.testSuiteForm.get('testSuiteName').valueChanges.subscribe(value => {
            this.duplicateClone = false;
            if (this.testSuiteNames.indexOf(value) !== -1 || value === this.selectedTestSuite['testSuiteName']) {
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

        if (this.actionType === 'Clone' && (this.testSuiteNames.indexOf(this.testSuiteForm.get('testSuiteName').value) !== -1 || this.testSuiteForm.get('testSuiteName').value === this.selectedTestSuite['testSuiteName'])) {
            this.testSuiteForm.get('testSuiteName').setErrors({ duplicate: true });
            this.duplicateClone = true;
        }
    }
    private _filter(value: string): any {
        this.setSelectedValues();
        this.testSuiteForm.get('moduleId').patchValue(this.selectedValues);
        const filterValue = value.toLowerCase();
        return this.allModule.filter(option => option.moduleName.toLowerCase().includes(filterValue));
    }

      /**
   * Set selected values to retain the state
   */
  setSelectedValues(): void {
    if (this.testSuiteForm.get('moduleId').value && this.testSuiteForm.get('moduleId').value.length > 0) {
      this.testSuiteForm.get('moduleId').value.forEach((e) => {
        if (this.selectedValues.indexOf(e) === -1) {
          this.selectedValues.push(e);
        }
      });
    }
  }

  /**
 * Remove from selected values based on uncheck
 */
  selectionChange(event): void {
    if (event.isUserInput && event.source.selected === false) {
      const index = this.selectedValues.indexOf(event.source.value);
      this.selectedValues.splice(index, 1);
    }
    // this.selectedTestSuites = this.selectedValues;
  }

    openedChange(e): void {
        this.searchTextboxControl.patchValue('');
       
      }

    /**
     * Edit Testsuit function to modify a testsuit to backed through API call
     */

    editTestSuite() {
        if(this.actionType === 'Clone'){
            this.dataService.loading.next(true)
            this.testSuiteForm.setErrors({ formSubbited: true });
            const temp = this.testSuiteForm.getRawValue();
            temp['testCases'] = this.selectedTestSuite['testCases'];
            console.log("this.selectedTestSuite['testCases']>>>>>", this.testSuiteForm.value);
            this.sub4 = this.tcInventoryService.add( temp).subscribe(
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
        }else {
            this.dataService.loading.next(true)
            this.testSuiteForm.setErrors({ formSubbited: true });
            const temp = this.testSuiteForm.getRawValue();
            temp['testCases'] = this.selectedTestSuite['testCases'];
            this.sub4 = this.tcInventoryService.edit( temp).subscribe(
                result => {
                    this.dataService.loading.next(false)
                    if (result) {
                        this.dataService.getTcInventoryData().next(result);
                        this.snackBar.open('Testsuite Updated Successfully', 'OK', {
                            duration: 5000
                        });
                        this.dialogRef.close();
                    }
                },
                error => {
                    this.dataService.loading.next(false)
                    this.snackBar.open('Error Updating Testsuite', 'Try Again', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            );
        }
        
    }

    cancel() {
        this.dialogRef.close();
    }
    clearFilter(event): void {
        event.stopPropagation();
        this.searchTextboxControl.patchValue('');
    }
    handleInput(event: KeyboardEvent): void{
        event.stopPropagation();
    
        
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
