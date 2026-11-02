import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import * as _ from 'lodash';

import { DataService } from '../../../../@core/services/data.service';
import { NamesFromIdsPipe } from '../../../../@shared/pipes/names-from-ids.pipe';

@Component({
    selector: 'app-edit-test-bed',
    templateUrl: './edit-test-bed.component.html',
    styleUrls: ['./edit-test-bed.component.scss'],
    providers: [NamesFromIdsPipe]
})
export class EditTestBedComponent implements OnInit, OnDestroy {
    allProfiles = [];
    tbProfile = [];
    allNodes = [];
    allNodesDuplicate = [];
    testBedForm: UntypedFormGroup;
    allVariables = [];
    allVariablesNames = [];
    allTestbedSelectedVariables = [];
    zeroStatus = true;
    usedNodes = [];
    flag = true;
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    classNameDuplicate = ['red-color', 'orange-color', 'pink-color', 'green-color'];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
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
            link: '#/pages/test-bed/view/edit',
            label: 'Edit Testbed'
        },

    ]
    tbSubscription;
    selectedTestbed;
    selectedProfile;
    selectedTeam;
    selectedNodes = [];
    constructor(
        private testBedService: TestBedService,
        private snackBar: MatSnackBar,
        private router: Router,
        private dataService: DataService,
        private nameFromId: NamesFromIdsPipe,
        private r: ActivatedRoute
    ) {
        this.tbSubscription = this.testBedService.selectedTestbed.subscribe(tb => {
            if (tb) {
                this.selectedTestbed = tb;
                console.log(tb);
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });
        this.sub6=this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.subTestbedProfile = this.dataService.getTestbedProfile().subscribe(profiles => {
            if (profiles) {
                this.tbProfile = profiles;
            }             
        });

    }

    ngOnInit() {
        this.testBedForm = new UntypedFormGroup({
            _id: new UntypedFormControl(null),
            testBedName: new UntypedFormControl(null, Validators.required),
            nodes: new UntypedFormArray([]),
            variables: new UntypedFormArray([])
        });

        this.testBedForm.patchValue(this.selectedTestbed);
        this.selectedTestbed['nodes'].forEach(node => {
            this.usedNodes.push(node.nodeId);
        });
        this.selectedTestbed['variables'].forEach(tbVar => {
            this.flag = false;
            const varGroup = new UntypedFormGroup({
                variableId: new UntypedFormControl(null, Validators.required),
                variableValue: new UntypedFormControl(null, Validators.required)
            });
            varGroup.patchValue(tbVar);
            const varArray = this.testBedForm.get('variables') as UntypedFormArray;
            varArray.push(varGroup);
        });

        this.sub1 = this.testBedForm.get('variables').valueChanges.subscribe(value => {
            this.allTestbedSelectedVariables = this.getAllSelectedVariables();
        });
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
                const temp = nodes.slice();
                this.nameFromId.transform(temp, this.allProfiles, 'profileId', '_id', 'profileName');
                this.allNodesDuplicate = temp.slice();
                this.allNodes = _.filter(temp, node => {
                    return this.usedNodes.indexOf(node._id) === -1;
                });
                this.selectedNodes = _.filter(temp, node => {
                    return this.usedNodes.indexOf(node._id) !== -1;
                });
            }
        });
    }

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

    deleteVarible(index) {
        const formAry = this.testBedForm.get('variables') as UntypedFormArray;
        formAry.removeAt(index);
        if (formAry.length === 0) {
            this.flag = true;
        }
    }

    getAllSelectedVariables() {
        const variableArray = [];
        const variableFormArray = this.testBedForm.get('variables') as UntypedFormArray;
        variableFormArray.controls.forEach(ele => {
            variableArray.push(ele.get('variableId').value);
        });
        return variableArray;
    }

    updateTestBed() {
        this.dataService.loading.next(true);
        const formValue = this.testBedForm.getRawValue();
        for (let index = 0; index < this.selectedNodes.length; index++) {
            const element = this.selectedNodes[index];
            const oldIndex = _.findIndex(this.selectedTestbed['nodes'], { nodeId: element['_id'] });
            if (oldIndex > -1) {
                formValue['nodes'].push(this.selectedTestbed['nodes'][oldIndex]);
            } else {
                formValue['nodes'].push({
                    nodeId: element['_id'],
                    profileId: element['profileId'],
                    deviceId: null
                });
            }
        }
        this.sub5 = this.testBedService.updateTestbedSettings( formValue).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTestBedData().next(result);
                    this.snackBar.open('Testbed Updated Successfully', 'OK', {
                        duration: 5000
                    });
                    this.router.navigate(['../'], { relativeTo: this.r });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Updating Testbed', 'Try Again', {
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
        if (this.tbSubscription) {
            this.tbSubscription.unsubscribe();
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

    selectANode(index) {
        transferArrayItem(this.allNodes, this.selectedNodes, index, this.selectedNodes.length);
    }

    removeANode(index) {
        transferArrayItem(this.selectedNodes, this.allNodes, index, this.allNodes.length);
    }
}
