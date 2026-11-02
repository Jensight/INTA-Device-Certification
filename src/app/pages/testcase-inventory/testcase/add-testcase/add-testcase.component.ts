import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import * as _ from 'lodash';
import { DeviceInventoryService } from './../../../../@core/services/device-inventory.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import { ApiService } from '../../../../@core/services/api.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { ExtarctAPIArgumentValuePipe } from '../../../../@shared/pipes/extract-argument-value.pipe';
import { NameFromIdPipe } from '../../../../@shared/pipes/name-from-id.pipe';
import { ExtarctAPIArgumentPipe } from '../../../../@shared/pipes/extract-arguments.pipe';
import { InformationDiaogComponent } from '../../../../@shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
    selector: 'app-add-testcase',
    templateUrl: './add-testcase.component.html',
    styleUrls: ['./add-testcase.component.scss'],
    providers: [ExtarctAPIArgumentValuePipe, ExtarctAPIArgumentPipe, NameFromIdPipe]
})
export class AddTestCaseComponent implements OnInit, AfterViewInit, OnDestroy {
    public allAPIGroup = [];
    public allTestGroup = [];
    public allAPI = [];
    public allTcId = [];
    public selectedAPIGroup = {};
    public selectedAPIGroupStatus = { invalid: true, valid: true };
    public selectedAPIStatus = { invalid: true, valid: true };
    public testCaseForm: UntypedFormGroup;
    public selectedAPI = [];
    public allTestcases = [];
    public selectedTeam;
    allTestBedVariable = [];
    allNodes = [];
    public maxWidth = 615;
    public returnAndTextIdList = [null, null];

    allVariableGroup = [];
    allVariables = [];
    @ViewChild('divBodyTag', { static: true })
    bodyTag: MatSelect;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;
    sub9;
    sub10;
    sub11;
    sub12;
    sub13;
    sub14;
    sub15;
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    testcasename: RegExp = /^[a-zA-Z0-9~`@#$%^&(),.;'[]{}_-]+$/;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/testcase-inventory/testcase',
            label: 'TestCase Inventory'
        },
        {
            link: '#/pages/testcase-inventory/testcase/add',
            label: 'Add TestCase'
        }
    ];
    priority_flag2: boolean = false;
    col1: any = 'col-md-2';
    col2: any = 'col-md-4';
    priority_value: any = [];
    jiraExists = false;
    constructor(
        private tcInventoryService: TestCaseInventoryService,
        private dataService: DataService,
        private apiService: ApiService,
        private snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute,
        private testBedService: TestBedService,
        private extractValue: ExtarctAPIArgumentValuePipe,
        private dInventoryService: DeviceInventoryService,
        private nameFromId: NameFromIdPipe,
        private extractArgs: ExtarctAPIArgumentPipe,
        private dialog: MatDialog,
        private userService: UserService
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            this.selectedTeam = team;
            this.dataService.getTcInventoryData().subscribe(dt => {
                if (!dt) {
                    this.sub2 = this.tcInventoryService.getAllData().subscribe(data => {
                        if (data) {
                            this.dataService.getTcInventoryData().next(data);
                        }
                    });
                }
            });
            this.dataService.getTestBedData().subscribe(dt => {
                if (!dt) {
                    this.sub3 = this.testBedService.getTestBed().subscribe(data => {
                        if (data) {
                            this.dataService.getTestBedData().next(data);
                        }
                    });
                }
            });
            this.dataService.getDeviceInventoryData().subscribe(dt => {
                if (!dt) {
                    this.sub15 = this.dInventoryService.getAllData().subscribe((data: any) => {
                        if (data && data.length > 0) {
                            this.dataService.getDeviceInventoryData().next(data);
                        }
                    });
                }
            });
            this.userService.getAllusers().subscribe((data: any) => {
                console.log(data);
                if (data[0].dashboardConfig && data[0].dashboardConfig[0]) {
                    if (data[0].dashboardConfig[0].teams) {
                        console.log('data[0].dashboardConfig[0].teams => ', data[0].dashboardConfig[0].teams);
                        data[0].dashboardConfig[0].teams.forEach(ele => {
                            console.log(ele);
                            if (ele.name == this.selectedTeam && ele.enable_priority_two_For_TC_Re == true) {
                                console.log('inside If if(ele.name == this.selectedTeam)')
                                this.col1 = 'col-md-1';
                                this.col2 = 'col-md-3';
                                this.priority_flag2 = true;
                                this.priority_value = ele.priority_value_arry;
                            }
                        });
                    }
                }
            })
        });
    }

    ngOnInit() {
        this.sub4 = this.dataService.getTestGroup().subscribe(testGroup => {
            if (testGroup) {
                this.allTestGroup = _.sortBy(testGroup, 'testGroupName');
                this.allTestGroup.sort((a, b) => {
                    if (a.testGroupName.toLowerCase() > b.testGroupName.toLowerCase()) {
                        return 1;

                    }
                    if (a.testGroupName.toLowerCase() < b.testGroupName.toLowerCase()) {
                        return -1;

                    }

                    return 0;
                });
                console.log("testcasegroup", this.allTestGroup);
            }
        });
        this.sub5 = this.dataService.getTestbedVariables().subscribe(variables => {
            if (variables) {
                this.allTestBedVariable = variables;
                // this.returnAndTextIdList[0] = _.find(this.allTestBedVariable, { variableName: 'ReturnValX' })
                //     ? _.find(this.allTestBedVariable, { variableName: 'ReturnValX' })['_id']
                //     : null;
                // this.returnAndTextIdList[1] = _.find(this.allTestBedVariable, { variableName: 'Text Value' })
                //     ? _.find(this.allTestBedVariable, { variableName: 'Text Value' })['_id']
                //     : null;
                // console.log(this.returnAndTextIdList);
            }
        });

        this.sub6 = this.dataService.getNodes().subscribe(node => {
            if (node) {
                this.allNodes = node.slice();

                this.returnAndTextIdList[0] = _.find(this.allNodes, { nodeName: 'ReturnValX' })
                    ? _.find(this.allNodes, { nodeName: 'ReturnValX' })['_id']
                    : null;
                this.returnAndTextIdList[1] = _.find(this.allNodes, { nodeName: 'Text Value' })
                    ? _.find(this.allNodes, { nodeName: 'Text Value' })['_id']
                    : null;
            }
        });

        this.sub7 = this.dataService.getTestCases().subscribe(tc => {
            if (tc) {
                this.allTestcases = tc;
                this.allTcId = [];
                this.allTestcases.forEach(tempAPI => {
                    this.allTcId.push(tempAPI['tcId']);
                });
            }
        });
        this.dataService.getAPIData().subscribe(dt => {
            if (!dt) {
                this.sub8 = this.apiService.getAllData().subscribe(allData => {
                    if (allData) {
                        this.dataService.getAPIData().next(allData);
                    }
                });
            }
        });

        this.sub9 = this.dataService.getAllAPIGroup().subscribe(apiGroup => {
            if (apiGroup) {
                this.allAPIGroup = _.sortBy(apiGroup, 'name');
                console.log("allAPIGroup>>", this.allAPIGroup);
                this.allAPIGroup.sort((a, b) => {
                    if (a.name.toLowerCase() > b.name.toLowerCase()) {
                        return 1;

                    }
                    if (a.name.toLowerCase() < b.name.toLowerCase()) {
                        return -1;

                    }

                    return 0;
                });
            }
        });

        this.sub10 = this.dataService.getAllAPI().subscribe(api => {
            if (api) {
                this.allAPI = api;
            }
        });

        this.sub14 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
                for (let i = 0; i < this.allVariableGroup.length; i++) {
                    const element = this.allVariableGroup[i]['variables'];
                    this.allVariables = [...this.allVariables, ...element];
                }
            }
        });
        this.testCaseForm = new UntypedFormGroup({
            tcGroupId: new UntypedFormControl({ value: null, disabled: true }, Validators.required),
            tcId: new UntypedFormControl(null, Validators.required),
            // tcName: new FormControl([{ value: null, disabled: true }, Validators.compose([Validators.required, Validators.maxLength(128)])]),
            tcName: new UntypedFormControl({ value: null, disabled: true }, Validators.compose([Validators.required, Validators.maxLength(128), Validators.pattern(/^[A-Za-z0-9 \][_-]+$/)])),
            autoExectime: new UntypedFormControl(null),
            manualExectime: new UntypedFormControl({ value: null, disabled: true }, Validators.required),
            tcCreator: new UntypedFormControl(this.dataService.getCurrentUser()['username'], Validators.required),
            tcEditor: new UntypedFormControl(this.dataService.getCurrentUser()['username'], Validators.required),
            tcPriority: new UntypedFormControl({ value: null, disabled: true }, Validators.required),
            tcPrioritytwo: new UntypedFormControl({ value: null, disabled: true }),
            testSteps: new UntypedFormArray([], Validators.required),
            issueKey: new UntypedFormControl(null),
            createdAt: new UntypedFormControl(new Date().toISOString()),
            updatedAt: new UntypedFormControl(new Date().toISOString()),
            jiraKey: new UntypedFormControl(null)
        });

        this.sub11 = this.testCaseForm.get('tcId').valueChanges.subscribe(value => {
            if (this.allTcId.indexOf(value) !== -1) {
                this.testCaseForm.get('tcId').setErrors({ duplicate: true });
            } else if (this.testCaseForm.get('tcId').hasError('required')) {
                this.testCaseForm.get('tcId').setErrors(null);
                this.testCaseForm.get('tcId').setErrors({ required: true });
            } else {
                this.testCaseForm.get('tcId').setErrors(null);
            }
        });


    }

    /**
     * Get API Function
     */

    getAPI() {
        if (this.selectedAPIGroup) {
            const temp = this.allAPI.filter(data => {
                if (data['apiGroup']['name'] === this.selectedAPIGroup['name']) {
                    return data;
                }
            });
        }
    }

    ngAfterViewInit() {
        const mainDiv = document.getElementById('mainDiv');
        if (mainDiv) {
            this.maxWidth = mainDiv.clientWidth;
            const tempNumber = this.maxWidth;
            setTimeout(() => {
                const ele = Array.from(document.getElementsByClassName('live__scroll--box'));
                const temp = [];
                ele.forEach(width => {
                    temp.push(width.clientWidth);
                });
                const max = _.max(temp);
                if (Number(max) >= tempNumber || tempNumber - Number(max) <= 25) {
                    this.maxWidth = max + 15;
                } else {
                    const div = document.getElementById('mainDiv');
                    if (div) {
                        this.maxWidth = div.clientWidth;
                    }
                }
            });
        }
    }

    /**
     * Add API to Testcase
     * @param event .
     */

    addAPItoTC(event) {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;

        if (event.previousContainer === event.container) {
            const draggedStep = testStepArray.at(event.previousIndex) as UntypedFormGroup;
            const draggedStepHasComment = !this.isCommentStep(draggedStep) &&
                event.previousIndex > 0 &&
                this.isCommentStep(testStepArray.at(event.previousIndex - 1));
            let targetStepHasComment = false;
            let targetCommentIndex = -1;
            if (event.currentIndex > 0 && event.currentIndex < testStepArray.length) {
                const targetStep = testStepArray.at(event.currentIndex) as UntypedFormGroup;
                if (!this.isCommentStep(targetStep)) {
                    const prevItem = testStepArray.at(event.currentIndex - 1);
                    if (this.isCommentStep(prevItem)) {
                        targetStepHasComment = true;
                        targetCommentIndex = event.currentIndex - 1;
                    }
                }
            }

            let movedStepIndex: number;
            if (draggedStepHasComment) {
                const commentIndex = event.previousIndex - 1;
                const stepIndex = event.previousIndex;
                let targetIndex = event.currentIndex;
                let targetComment = null;
                if (targetStepHasComment && targetCommentIndex >= 0) {
                    if (targetCommentIndex !== commentIndex) {
                        targetComment = testStepArray.at(targetCommentIndex);
                    }
                }
                const draggedComment = testStepArray.at(commentIndex);
                const draggedStepControl = testStepArray.at(stepIndex);
                testStepArray.removeAt(commentIndex);
                testStepArray.removeAt(commentIndex);
                if (targetIndex > stepIndex) {
                    targetIndex = targetIndex - 2;
                }
                if (targetComment && targetCommentIndex > stepIndex) {
                    targetCommentIndex = targetCommentIndex - 2;
                }
                testStepArray.insert(targetIndex, draggedComment);
                testStepArray.insert(targetIndex + 1, draggedStepControl);
                movedStepIndex = targetIndex + 1;
                if (targetComment) {
                    for (let i = 0; i < testStepArray.length; i++) {
                        const ctrl = testStepArray.at(i);
                        if (ctrl === targetComment) {
                            if (i + 1 < testStepArray.length) {
                                const nextItem = testStepArray.at(i + 1);
                                if (this.isCommentStep(nextItem) ||
                                    (i + 1 <= movedStepIndex)) {
                                    testStepArray.removeAt(i);
                                    const newPos = movedStepIndex;
                                    testStepArray.insert(newPos, targetComment);
                                }
                            }
                            break;
                        }
                    }
                }
            } else {
                let targetIsComment = false;
                if (event.currentIndex < testStepArray.length) {
                    targetIsComment = this.isCommentStep(testStepArray.at(event.currentIndex));
                }
                let targetCommentControl = null;
                let targetCommentOriginalIndex = -1;
                let targetStepControl = null;

                if (event.previousIndex > event.currentIndex && targetStepHasComment) {
                    targetCommentOriginalIndex = event.currentIndex - 1;
                    targetCommentControl = testStepArray.at(targetCommentOriginalIndex);
                } else if (event.previousIndex < event.currentIndex) {
                    if (targetIsComment) {
                        targetCommentOriginalIndex = event.currentIndex;
                        targetCommentControl = testStepArray.at(targetCommentOriginalIndex);
                        if (event.currentIndex + 1 < testStepArray.length) {
                            targetStepControl = testStepArray.at(event.currentIndex + 1);
                        }
                    } else if (targetStepHasComment) {
                        targetCommentOriginalIndex = event.currentIndex - 1;
                        targetCommentControl = testStepArray.at(targetCommentOriginalIndex);
                        targetStepControl = testStepArray.at(event.currentIndex);
                    }
                }
                moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
                movedStepIndex = event.currentIndex;
                if (targetCommentControl && targetCommentOriginalIndex >= 0) {
                    if (event.previousIndex > event.currentIndex) {
                        testStepArray.removeAt(event.currentIndex - 1);
                        testStepArray.insert(event.currentIndex, targetCommentControl);
                        movedStepIndex = event.currentIndex - 1;
                    } else {
                        let targetStepNewIndex = -1;
                        if (targetStepControl) {
                            for (let i = 0; i < testStepArray.length; i++) {
                                if (testStepArray.at(i) === targetStepControl) {
                                    targetStepNewIndex = i;
                                    break;
                                }
                            }
                        }
                        let commentNewIndex = -1;
                        for (let i = 0; i < testStepArray.length; i++) {
                            if (testStepArray.at(i) === targetCommentControl) {
                                commentNewIndex = i;
                                break;
                            }
                        }
                        if (commentNewIndex >= 0 && targetStepNewIndex >= 0 && commentNewIndex !== targetStepNewIndex - 1) {
                            testStepArray.removeAt(commentNewIndex);
                            if (commentNewIndex < targetStepNewIndex) {
                                targetStepNewIndex--;
                            }
                            testStepArray.insert(targetStepNewIndex, targetCommentControl);
                            if (movedStepIndex >= targetStepNewIndex) {
                                movedStepIndex++;
                            }
                        }
                    }
                }
            }

            const movedStep = testStepArray.at(movedStepIndex) as UntypedFormGroup;
            if (!this.isCommentStep(movedStep)) {
                if (movedStep.get('step')) {
                    movedStep.get('step').setValue('');
                }
                const doHttp = movedStep.get('doHttp') as UntypedFormGroup;
                if (doHttp && doHttp.get('postBody')) {
                    const postBody = doHttp.get('postBody') as UntypedFormGroup;
                    const bodyParameter = postBody.get('bodyParameter') as UntypedFormArray;
                    if (bodyParameter && bodyParameter.controls) {
                        bodyParameter.controls.forEach((paramCtrl) => {
                            const apiId = movedStep.get('api_id')?.value;
                            const argumentName = paramCtrl.get('argumentName')?.value;
                            if (apiId && argumentName) {
                                const argumentValues = this.extractArgs.transform(apiId, this.allAPI, argumentName);
                                if (
                                    argumentValues &&
                                    argumentValues.length > 0 &&
                                    argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
                                ) {
                                    paramCtrl.get('argumentValue').setValue('');
                                }
                            }
                        });
                    }
                }
            }

            [event.previousIndex, event.currentIndex].forEach(idx => {
                const stepGroup = testStepArray.at(idx) as UntypedFormGroup;
                if (stepGroup.get('isComment')?.value === true) {
                    return;
                }

                const doHttpGroup = stepGroup.get('doHttp') as UntypedFormGroup;
                if (doHttpGroup && doHttpGroup.get('postBody')) {
                    const postBodyGroup = doHttpGroup.get('postBody') as UntypedFormGroup;
                    const bodyParamArray = postBodyGroup.get('bodyParameter') as UntypedFormArray;
                    if (bodyParamArray && bodyParamArray.controls) {
                        bodyParamArray.controls.forEach(paramCtrl => {
                            const apiId = stepGroup.get('api_id')?.value;
                            const argumentName = paramCtrl.get('argumentName')?.value;
                            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, argumentName);
                            if (
                                argumentValues &&
                                argumentValues.length > 0 &&
                                argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
                            ) {
                                paramCtrl.get('argumentValue').setValue('');
                            }
                        });
                    }
                }
            });

            const stepCount = testStepArray.length;
            for (let i = 0; i < testStepArray.length; i++) {
                const stepGroup = testStepArray.at(i) as UntypedFormGroup;
                if (stepGroup.get('isComment')?.value === true) {
                    continue;
                }

                const doHttpGroup = stepGroup.get('doHttp') as UntypedFormGroup;
                if (doHttpGroup && doHttpGroup.get('postBody')) {
                    const postBodyGroup = doHttpGroup.get('postBody') as UntypedFormGroup;
                    const bodyParamArray = postBodyGroup.get('bodyParameter') as UntypedFormArray;
                    if (bodyParamArray && bodyParamArray.controls) {
                        bodyParamArray.controls.forEach(paramCtrl => {
                            const apiId = stepGroup.get('api_id')?.value;
                            const argumentName = paramCtrl.get('argumentName')?.value;
                            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, argumentName);
                            if (
                                argumentValues &&
                                argumentValues.length > 0 &&
                                argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
                            ) {
                                const val = paramCtrl.get('argumentValue')?.value;
                                if (val && typeof val === 'string' && val.startsWith('RETURN_VAL:')) {
                                    const refStepStr = val.split(':')[1];
                                    const refStepNum = parseInt(refStepStr, 10);
                                    if (
                                        isNaN(refStepNum) ||
                                        refStepNum < 1 ||
                                        refStepNum > stepCount ||
                                        refStepNum === event.currentIndex + 1 ||
                                        refStepNum === event.previousIndex + 1
                                    ) {
                                        paramCtrl.get('argumentValue').setValue('');
                                    }
                                }
                            }
                        });
                    }
                }
            }
            this.updateStepNumbers();
        }
        else if (isNaN(event['item']['data'])) {
            let insertIndex = event.currentIndex;
            if (insertIndex > 0 && insertIndex < testStepArray.length) {
                const prevItem = testStepArray.at(insertIndex - 1);
                const currentItem = testStepArray.at(insertIndex);
                if (this.isCommentStep(prevItem) && !this.isCommentStep(currentItem)) {
                    insertIndex = insertIndex - 1;
                }
            }

            const testStepLength = testStepArray.length + 1;
            const api = event['item']['data'];
            const selectedAPIGroup = _.find(this.allAPIGroup, { _id: api.apiGroupId });
            let url: string = selectedAPIGroup.primaryURL;
            url = url.trim();
            if (url.charAt(url.length - 1) === '/') {
                url = url + selectedAPIGroup.name + '/' + api.apiName;
            } else {
                url = url + '/' + selectedAPIGroup.name + '/' + api.apiName;
            }
            const tempGroup = new UntypedFormGroup(
                {
                    method: new UntypedFormControl('POST', Validators.required),
                    url: new UntypedFormControl(url, Validators.required),
                    postBody: new UntypedFormGroup({
                        contentType: new UntypedFormControl('application/json', Validators.required),
                        bodyParameter: new UntypedFormArray([])
                    })
                },
                Validators.required
            );

            const postBody = tempGroup.get('postBody') as UntypedFormGroup;
            const bodyParameter = postBody.get('bodyParameter') as UntypedFormArray;
            api['arguments'].forEach(element => {
                bodyParameter.push(
                    new UntypedFormGroup({
                        argumentName: new UntypedFormControl(element['argumentName']),
                        argumentValue: new UntypedFormControl(null, Validators.required)
                    })
                );
            });
            const newStepForm = this.createNewStep(testStepLength) as UntypedFormGroup;
            newStepForm.addControl('api_id', new UntypedFormControl(api._id));
            newStepForm.addControl('apiId', new UntypedFormControl(api.apiId));
            newStepForm.addControl('apiTimeOut', new UntypedFormControl(api.apiTimeOut));
            newStepForm.addControl('description', new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()]));
            newStepForm.addControl('data', new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()]));
            newStepForm.addControl('expectedResult', new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()]));
            newStepForm.addControl('doHttp', tempGroup);
            newStepForm.addControl('nodeList', new UntypedFormControl([]));
            testStepArray.insert(insertIndex, newStepForm);
            const insertedStep = testStepArray.at(insertIndex) as UntypedFormGroup;
            const insertedBodyParams = (insertedStep.get('doHttp') as UntypedFormGroup)
                .get('postBody').get('bodyParameter') as UntypedFormArray;
            insertedBodyParams.controls.forEach(paramCtrl => {
                const apiId = insertedStep.get('api_id').value;
                const argumentName = paramCtrl.get('argumentName').value;
                const argumentValues = this.extractArgs.transform(apiId, this.allAPI, argumentName);
                if (
                    argumentValues &&
                    argumentValues.length > 0 &&
                    argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
                ) {
                    paramCtrl.get('argumentValue').setValue(null); // Clear only for ReturnValue
                }
            });

            for (let i = 0; i < testStepArray.length; i++) {
                const stepGroup = testStepArray.at(i) as UntypedFormGroup;
                const doHttpGroup = stepGroup.get('doHttp') as UntypedFormGroup;
                if (doHttpGroup && doHttpGroup.get('postBody')) {
                    const postBodyGroup = doHttpGroup.get('postBody') as UntypedFormGroup;
                    const bodyParamArray = postBodyGroup.get('bodyParameter') as UntypedFormArray;
                    if (bodyParamArray && bodyParamArray.controls) {
                        bodyParamArray.controls.forEach(paramCtrl => {
                            const apiId = stepGroup.get('api_id')?.value;
                            const argumentName = paramCtrl.get('argumentName')?.value;
                            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, argumentName);
                            if (
                                argumentValues &&
                                argumentValues.length > 0 &&
                                argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
                            ) {
                                const val = paramCtrl.get('argumentValue')?.value;
                                if (val && typeof val === 'string' && val.startsWith('RETURN_VAL:')) {
                                    const refStepStr = val.split(':')[1];
                                    const refStepNum = parseInt(refStepStr, 10);
                                    if (!isNaN(refStepNum) && refStepNum >= insertIndex + 1) {
                                        paramCtrl.get('argumentValue').setValue('');
                                    }
                                }
                            }
                        });
                    }
                }
            }
            this.updateStepNumbers();
            const tempNumber = this.maxWidth;
            setTimeout(() => {
                const ele = Array.from(document.getElementsByClassName('live__scroll--box'));
                const temp = [];
                ele.forEach(width => {
                    temp.push(width.clientWidth);
                });
                const max = _.max(temp);
                if (Number(max) >= tempNumber || tempNumber - Number(max) <= 25) {
                    this.maxWidth = max + 15;
                } else {
                    const mainDiv = document.getElementById('mainDiv');
                    if (mainDiv) {
                        this.maxWidth = mainDiv.clientWidth;
                    }
                }
            }, 1);
        }
    }

    private cloneAbstractControl(control: AbstractControl): AbstractControl {
        let newControl: any;
        if (control instanceof UntypedFormGroup) {
            newControl = new UntypedFormGroup({});
            Object.keys(control.controls).forEach(key => {
                newControl.addControl(key, this.cloneAbstractControl(control.controls[key]));
            });
        } else if (control instanceof UntypedFormArray) {
            newControl = new UntypedFormArray([]);
            control.controls.forEach(ctrl => {
                newControl.push(this.cloneAbstractControl(ctrl));
            });
        } else if (control instanceof UntypedFormControl) {
            newControl = new UntypedFormControl(
                control.value,
                control.validator,
                control.asyncValidator
            );
            if (control.disabled) {
                newControl.disable({ emitEvent: false });
            }
        }
        return newControl;
    }

    duplicateTestStep(index: number) {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;
        const original = testStepArray.at(index) as UntypedFormGroup;
        const clonedStep = this.cloneAbstractControl(original) as UntypedFormGroup;
        testStepArray.insert(index + 1, clonedStep);
        this.updateStepNumbers();
    }

    /**
     * Add a comment step at the specified index
     * @param index The index of the step where the comment should be added
     */
    addCommentStep(index: number) {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;
        const currentStep = testStepArray.at(index) as UntypedFormGroup;
        const currentStepNumber = index + 1;

        // Check if the previous step is already a comment for this step
        if (index > 0) {
            const prevStep = testStepArray.at(index - 1) as UntypedFormGroup;
            if (prevStep.get('isComment')?.value === true) {
                this.snackBar.open('Only one comment allowed per step', 'OK', {
                    duration: 3000
                });
                return;
            }
        }

        // Create a minimal comment step with only required fields
        const commentStep = new UntypedFormGroup({
            step: new UntypedFormControl({ value: currentStepNumber, disabled: true }, Validators.required),
            isComment: new UntypedFormControl(true), // Flag to identify comment steps
            commentText: new UntypedFormControl('') // Comment text
        });

        // Insert the comment step right before the current step
        testStepArray.insert(index, commentStep);

        // Update step numbers - comment steps keep the same number as their parent
        this.updateStepNumbers();

        // Update width
        const tempNumber = this.maxWidth;
        setTimeout(() => {
            const ele = Array.from(document.getElementsByClassName('live__scroll--box'));
            const temp = [];
            ele.forEach(width => {
                temp.push(width.clientWidth);
            });
            const max = _.max(temp);
            if (Number(max) >= tempNumber || tempNumber - Number(max) <= 25) {
                this.maxWidth = max + 15;
            } else {
                const mainDiv = document.getElementById('mainDiv');
                if (mainDiv) {
                    this.maxWidth = mainDiv.clientWidth;
                }
            }
        }, 1);
    }

    /**
     * Delete a comment step
     * @param index The index of the comment step to delete
     */
    deleteCommentStep(index: number) {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;
        testStepArray.removeAt(index);
        this.updateStepNumbers();
    }

    /**
     * Update step numbers for all test steps
     * Comment steps inherit the step number of the NEXT regular step (since comments appear BEFORE steps)
     */
    updateStepNumbers() {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;
        let actualStepNumber = 1;

        testStepArray.controls.forEach((ctrl, idx) => {
            const isComment = ctrl.get('isComment')?.value;
            
            if (!isComment) {
                // Regular step - use the current step number and increment for next
                if (ctrl.get('step')) {
                    ctrl.get('step').setValue(actualStepNumber);
                }
                actualStepNumber++;
            } else {
                // Comment step - look FORWARD to find the next regular step and use its number
                let nextRegularStepNumber = actualStepNumber; // Default to current if no next step found
                
                // Search forward for the next regular step
                for (let i = idx + 1; i < testStepArray.controls.length; i++) {
                    const nextCtrl = testStepArray.controls[i];
                    if (!nextCtrl.get('isComment')?.value) {
                        nextRegularStepNumber = actualStepNumber;
                        break;
                    }
                }
                
                if (ctrl.get('step')) {
                    ctrl.get('step').setValue(nextRegularStepNumber);
                }
            }
        });
    }

    /**
     * Check if a step is a comment step
     * @param item The form group to check
     */
    isCommentStep(item: any): boolean {
        return item.get('isComment')?.value === true;
    }

    /**
     * Get list of actual step numbers (excluding comments) up to the current index
     * Used for Return Value dropdown to show only actual API steps
     * @param currentIndex The current step index in the testSteps array
     * @returns Array of step numbers (e.g., [1, 2, 3])
     */
    getReturnValueStepOptions(currentIndex: number): number[] {
        const testStepArray = this.testCaseForm.get('testSteps') as UntypedFormArray;
        const stepNumbers = [];
        
        // Count only actual API steps (non-comment steps) before the current index
        for (let i = 0; i < currentIndex; i++) {
            const step = testStepArray.at(i) as UntypedFormGroup;
            if (!this.isCommentStep(step)) {
                const stepNumber = step.get('step')?.value;
                if (stepNumber) {
                    stepNumbers.push(stepNumber);
                }
            }
        }
        
        return stepNumbers;
    }
    
    /**
     * Remove API From Testcase
     * @param event .
     */
    removeAPItoTC(event) {
        if (event['item']['data'] !== undefined && !isNaN(event['item']['data'])) {
            const testSteps = this.testCaseForm.get('testSteps') as UntypedFormArray;
            const indexToRemove = event['item']['data'];
            const stepToRemove = testSteps.at(indexToRemove) as UntypedFormGroup;
            const isRegularStep = !stepToRemove.get('isComment')?.value;
            if (isRegularStep && indexToRemove > 0) {
                const prevStep = testSteps.at(indexToRemove - 1) as UntypedFormGroup;
                if (prevStep.get('isComment')?.value === true) {
                    testSteps.removeAt(indexToRemove - 1);
                    testSteps.removeAt(indexToRemove - 1);
                } else {
                    testSteps.removeAt(indexToRemove);
                }
            } else {
                testSteps.removeAt(indexToRemove);
            }

            this.updateStepNumbers();
        }
    }

    /**
     * Create a new step from function
     */
    noQuoteOrSemicolonValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const forbidden = /[";]/.test(control.value);
            return forbidden ? { forbiddenChars: true } : null;
        };
    }
    
    createNewStep(count) {
        return new UntypedFormGroup({
            step: new UntypedFormControl({ value: count, disabled: true }, Validators.required),
            gotoOnFail: new UntypedFormControl(0, Validators.required),
            gotoOnPass: new UntypedFormControl(0, Validators.required),
            description: new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()]),
            data: new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()]),
            expectedResult: new UntypedFormControl(null, [this.noQuoteOrSemicolonValidator()])
        });
    }

    /**
     * Add Testcase function
     */

    addTestcase() {
        this.dataService.loading.next(true);
        const testSteps = this.testCaseForm.get('testSteps') as UntypedFormArray;
        for (let i = 0; i < testSteps.length; i++) {
            const tempFromGroup = testSteps.at(i) as UntypedFormGroup;
            const isComment = tempFromGroup.get('isComment')?.value;
            
            if (!isComment) {
                // Only set step number and returnValue for regular API steps
                tempFromGroup.get('step').setValue(tempFromGroup.get('step').value);
                if (!tempFromGroup.get('returnValue')) {
                    tempFromGroup.addControl('returnValue', new UntypedFormControl(null));
                }
            } else {
                // For comment steps, just keep the step number
                tempFromGroup.get('step').setValue(tempFromGroup.get('step').value);
            }
        }
        
        // Send all steps to backend including comments (backend will skip isComment steps during execution)
        this.sub13 = this.tcInventoryService.add(this.testCaseForm.getRawValue()).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.unSetForm();
                    this.testCaseForm.get('tcId').setValue(null);
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testcase Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.router.navigate(['../'], { relativeTo: this.r });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Testcase', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    /**
     * Get API Argument Value function
     * @param i .
     * @param item .
     */

    getAPIArgumentValue(i, item) {
        try {
            const value = this.testCaseForm.get('testSteps')['controls'][i]['controls']['api_id']['value'];
            const retrnVal = this.extractArgs.transform(value, this.allAPI, item.get('argumentName').value);
            const finalValue = retrnVal[0].split(':')[1]
            return (this.returnAndTextIdList.indexOf(finalValue) === -1);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get API Name Function
     * @param item .
     */

    getAPIName(item) {
        try {
            return item.controls.doHttp.controls.url.value
                .split('/')
                .slice(-1)
                .pop();
        } catch (error) {
            return null;
        }
    }

    /**
     * Get Node Details
     * @param item .
     */

    getNodeDetails(item) {
        try {
            return this.nameFromId.transform(item['controls']['api_id'].value, this.allAPI, '_id', 'nodesRequired') == true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Function to check Text value validation
     * @param i .
     * @param item .
     */

    checkIfTextValue(i, item) {
        try {
            const apiId = this.testCaseForm.get('testSteps')['controls'][i]['controls']['api_id']['value'];
            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, item.get('argumentName').value);
            return argumentValues[0].split(':')[1] === this.returnAndTextIdList[1]
        } catch (e) {
            return false;
        }

    }

    /**
     * Function to check Return value validation
     * @param i .
     * @param item .
     */
    checkIfReturnValue(i, item) {
        try {
            const apiId = this.testCaseForm.get('testSteps')['controls'][i]['controls']['api_id']['value'];
            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, item.get('argumentName').value);
            return argumentValues[0].split(':')[1] === this.returnAndTextIdList[0]
        } catch (e) {
            return false;
        }
    }

    /**
     * Function to check Dropdown value validation
     * @param i .
     * @param item .
     */
    checkIfDropdown(i, item) {
        try {
            const apiId = this.testCaseForm.get('testSteps')['controls'][i]['controls']['api_id']['value'];
            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, item.get('argumentName').value);
            return this.returnAndTextIdList.indexOf(argumentValues[0].split(':')[1]) === -1
        } catch (e) {
            return false;
        }
    }

    /**
     * Function to check Empty validation
     * @param i .
     * @param item .
     */

    checkIfEmpty(i, item) {
        try {
            const apiId = this.testCaseForm.get('testSteps')['controls'][i]['controls']['api_id']['value'];
            const argumentValues = this.extractArgs.transform(apiId, this.allAPI, item.get('argumentName').value);
            if (argumentValues.length === 0) {
                return true
            }
            return false;
        } catch (e) {
            return false
        }
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
        if (this.sub10) {
            this.sub10.unsubscribe();
        }
        if (this.sub11) {
            this.sub11.unsubscribe();
        }
        if (this.sub12) {
            this.sub12.unsubscribe();
        }

        if (this.sub13) {
            this.sub13.unsubscribe();
        }
        if (this.sub14) {
            this.sub14.unsubscribe();
        }
        if (this.sub15) {
            this.sub15.unsubscribe();
        }
    }

    flip() {
        document.getElementById('flip').classList.toggle('flipped');
    }

    getTestCaseDetail(event): any {
        this.sub2 = this.tcInventoryService.getTestCaseDetail(event.target.value).subscribe(
            data => {
                if (data) {
                    if (data.error === 1) {
                        this.testCaseNotFoundConfirmation('Please enter TestCase details Manually.');
                    } else {
                        this.dataService.getTcInventoryData().subscribe(dt => {
                            if (dt) {
                                const tempTcData = dt?.filter(element => {
                                    return (element.jiraKey === event.target.value);
                                });
                                if (tempTcData && tempTcData.length > 0) {
                                    this.jiraExists = true;
                                    this.unSetForm();
                                    this.testCaseForm.get('tcId').setValue(null);
                                    this.testCaseNotFoundConfirmation('Test Case already exists with this jira Key');
                                } else {
                                    this.jiraExists = false;
                                    this.testCaseForm.get('tcName').enable();
                                    this.testCaseForm.get('tcGroupId').enable();
                                    this.testCaseForm.get('tcPriority').enable();
                                    this.testCaseForm.get('manualExectime').enable();
                                    if (this.priority_flag2 == true) {
                                        this.testCaseForm.get('tcPrioritytwo').enable();
                                        console.log('this.priority_value[0] => ', this.priority_value[0]);
                                        //this.testCaseForm.get('tcPrioritytwo').setValue(this.priority_value[0]);
                                        this.testCaseForm.patchValue({
                                            tcPrioritytwo: this.priority_value[0]
                                        })
                                    }

                                    this.testCaseForm.get('tcName').setValue(data.fields.summary);
                                    if (data.fields.priority.name === 'P1' || data.fields.priority.name === 'P2') {
                                        this.testCaseForm.get('tcPriority').setValue('High');
                                    } else if (data.fields.priority.name === 'P3') {
                                        this.testCaseForm.get('tcPriority').setValue('Medium');
                                    } else {
                                        this.testCaseForm.get('tcPriority').setValue('Low');
                                    }
                                    this.testCaseForm.get('issueKey').setValue(data.id);
                                    this.testCaseForm.get('jiraKey').setValue(event.target.value);
                                    /// console.log('jira exists', this.jiraExists, this.testCaseForm.get('jiraKey'));
                                }

                            }
                        });
                    }
                    this.dataService.loading.next(false);
                }
            },
            error => {
                this.dataService.loading.next(false);
            }
        );
    }

    testCaseNotFoundConfirmation(body) {

        const dialog = this.dialog.open(InformationDiaogComponent,
            {
                panelClass: 'app-full-bleed-dialog',
                data: {
                    title: 'Enter Data Manually',
                    body: body
                },
                width: '600px'
            });
        this.sub2 = dialog.afterClosed().subscribe(() => {
            this.unSetForm();
        });
    }

    private unSetForm() {
        this.jiraExists = false;
        this.testCaseForm.get('tcName').enable();
        this.testCaseForm.get('tcGroupId').enable();
        this.testCaseForm.get('tcPriority').enable();
        if (this.priority_flag2 == true) {
            this.testCaseForm.get('tcPrioritytwo').enable();
        }
        this.testCaseForm.get('manualExectime').enable();
        this.testCaseForm.get('tcName').setValue(null);
        this.testCaseForm.get('tcGroupId').setValue(null);
        this.testCaseForm.get('tcPriority').setValue(null);
        this.testCaseForm.get('manualExectime').setValue(null);
        if (this.priority_flag2 == true) {
            this.testCaseForm.get('tcPrioritytwo').setValue(this.priority_value[0]);
        }
    }
}
