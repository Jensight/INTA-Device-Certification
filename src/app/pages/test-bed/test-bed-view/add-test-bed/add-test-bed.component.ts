import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import * as _ from 'lodash';

import { MatSnackBar } from '@angular/material/snack-bar';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { NamesFromIdsPipe } from '../../../../@shared/pipes/names-from-ids.pipe';
import { VariableDisable } from '../../../../@shared/pipes/variable-disable.pipe';

@Component({
    selector: 'app-test-bed',
    templateUrl: './add-test-bed.component.html',
    styleUrls: ['./add-test-bed.component.scss'],
    providers: [NamesFromIdsPipe, VariableDisable]
})
export class AddTestBedComponent implements OnInit, OnDestroy {
    allProfiles = [];
    tbProfile = [];
    allNodes = [];
    testBedForm: UntypedFormGroup;
    allVariables = [];
    allVariablesNames = [];
    allTestbedSelectedVariables = [];
    allTestbedNames = [];
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    classNameDuplicate = ['red-color', 'orange-color', 'pink-color', 'green-color'];
    zeroStatus = true;
    flag = true;
    selectedNodes = [];
    selectedTeam;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;
    sub9;
    subTestbedProfile;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/test-bed/view',
            label: 'Test Bed'
        },
        {
            link: '#/pages/test-bed/view/add',
            label: 'Add Testbed'
        },

    ]
    constructor(
        private testBedService: TestBedService,
        private deviceInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar,
        private router: Router,
        private dataService: DataService,
        private nameFromId: NamesFromIdsPipe,
        private r: ActivatedRoute
    ) { }

    ngOnInit() {
        this.testBedForm = new UntypedFormGroup({
            testBedName: new UntypedFormControl(null, Validators.required),
            testBedProfileName: new UntypedFormControl(null, Validators.required),
            nodes: new UntypedFormArray([]),
            variables: new UntypedFormArray([])
        });

        this.sub7 = this.testBedForm.get('testBedName').valueChanges.subscribe(value => {
            if (this.allTestbedNames.indexOf(value) !== -1) {
                this.testBedForm.get('testBedName').setErrors({ duplicate: true });
            } else if (this.testBedForm.get('testBedName').hasError('required')) {
                this.testBedForm.get('testBedName').setErrors(null);
                this.testBedForm.get('testBedName').setErrors({ required: true });
            } else {
                this.testBedForm.get('testBedName').setErrors(null);
            }
        });

        this.sub1 = this.testBedForm.get('variables').valueChanges.subscribe(value => {
            this.allTestbedSelectedVariables = this.getAllSelectedVariables();
        });

        this.sub8 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.checkData();
            }
        });
    }

    /**
     * Check data will validate weather profile data available or not
     */

    checkData() {
        this.subTestbedProfile = this.dataService.getTestbedProfile().subscribe(profiles => {
            if (profiles) {
                this.tbProfile = profiles;
            } 
        });
        this.sub2 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
                this.loadData();
            } else {
                this.loadDataFromDB();
            }
        });


    }

    /**
     * Loads all available data from database
     */

    loadDataFromDB() {
        this.sub9 = this.deviceInventoryService
            .getAllData()
            .pipe(
                switchMap(data => {
                    this.dataService.getDeviceInventoryData().next(data);
                    return this.testBedService.getTestBed();
                })
            )
            .subscribe(tb => {
                if (tb) {
                    this.dataService.getTestBedData().next(tb);
                    this.loadData();
                }
            });
    }

    loadData() {
        if(this.subTestbedProfile){
            this.subTestbedProfile.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        this.sub2 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
            }
        });
        this.sub3 = this.dataService.getTestbedVariables().subscribe(variable => {
            if (variable) {
                this.allVariables = variable;
                this.allVariablesNames = [];
                this.allVariables.forEach(varName => {
                    if (varName['variableName'] !== 'Text Value' && varName['variableName'] !== 'ReturnValX') {
                        this.allVariablesNames.push(varName['_id']);
                    }
                });
            }
        });

        this.sub4 = this.dataService.getNodes().subscribe(nodes => {
            if (nodes) {
                this.allNodes = nodes.slice();
                this.nameFromId.transform(this.allNodes, this.allProfiles, 'profileId', '_id', 'profileName');
            }
        });


        this.sub6 = this.dataService.getTestBed().subscribe(testbeds => {
            if (testbeds) {
                this.allTestbedNames = testbeds.map(t => t.testBedName)
            }
        });

        console.log(this.allNodes);
        
    }

    /**
     * Add New Variable Function
     */

    addNewVariable() {
        const formAry = this.testBedForm.get('variables') as UntypedFormArray;
        formAry.push(
            new UntypedFormGroup({
                variableId: new UntypedFormControl(null, Validators.required),
                variableValue: new UntypedFormControl(null, Validators.required)
            })
        );
        this.flag = false;
    }

    /**
     * Delete Variable Function
     * @param index .
     */

    deleteVarible(index) {
        const formAry = this.testBedForm.get('variables') as UntypedFormArray;
        formAry.removeAt(index);
        if (formAry.length === 0) {
            this.flag = true;
        }
    }

    /**
     * Gets All selected variables
     */

    getAllSelectedVariables() {
        const variableArray = [];
        const variableFormArray = this.testBedForm.get('variables') as UntypedFormArray;
        variableFormArray.controls.forEach(ele => {
            variableArray.push(ele.get('variableId').value);
        });
        return variableArray;
    }

    /**
     * Add testbed to the database via service call
     */

    addTestBed() {
        const formValue = this.testBedForm.getRawValue();
        for (let index = 0; index < this.selectedNodes.length; index++) {
            const element = this.selectedNodes[index];
            formValue['nodes'].push({
                nodeId: element['_id'],
                profileId: element['profileId'],
                deviceId: null
            });
        }
        this.dataService.loading.next(true);
        this.sub5 = this.testBedService.addTestBed(formValue).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTestBedData().next(result);
                    this.snackBar.open('Testbed Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.router.navigate(['../'], { relativeTo: this.r });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Testbed', 'Try Again', {
                    duration: 5000
                });
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
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
        if (this.sub9) {
            this.sub9.unsubscribe();
        }
    }

    drop(event: CdkDragDrop<any[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
    }

    /**
     * Select a node Function
     * @param index .
     */
    selectANode(index) {
        transferArrayItem(this.allNodes, this.selectedNodes, index, this.selectedNodes.length);
    }

    /**
     * Remove a selected node Function
     * @param index .
     */

    removeANode(index) {
        transferArrayItem(this.selectedNodes, this.allNodes, index, this.allNodes.length);
    }

}
