import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { DataService } from '../../../../@core/services/data.service';
import { ApiService } from '../../../../@core/services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { debounceTime } from 'rxjs/operators';
import { InformationDiaogComponent } from '../../../../@shared/components/information-dialog/information-dialog.component';

@Component({
    selector: 'app-clone-api',
    templateUrl: './clone-api.component.html',
    styleUrls: ['./clone-api.component.scss']
})
export class CloneAPIComponent implements OnInit, OnDestroy {
    public apiForm: UntypedFormGroup;
    public selectedTeam;
    public allAPIGroup;
    public allAPIGroupNames;
    public allTestbedData: any = [];

    public allAPISelectedVariables = [];
    public allAPI = [];
    public allAPINames = [];

    public allNodes = [];
    public allProfiles = [];

    public testbedVariables = [];

    public selectedArguments = [];
    public selectedNode;
    public selectedNodeIndex;
    public selectedAPI;
    public selectedAPIDuplicate;
    apiSubscription;
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
    Type;
    apiType;
    TestCase;
    apiGroupMap = {};
    allVariableGroup = [];
    allVariables = [];
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/api-inventory/api',
            label: 'API Inventory'
        },
        {
            link: '#/pages/api-inventory/api/clone',
            label: 'Clone API'
        }
    ];
    constructor(
        private dataService: DataService,
        private apiService: ApiService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private dInventoryService: DeviceInventoryService,
        private testBedSevice: TestBedService,
        private router: Router,
        private r: ActivatedRoute
    ) {
        this.apiSubscription = this.apiService.selectedAPI.subscribe(api => {
            if (api) {
                this.selectedAPI = _.cloneDeep(api);
                this.selectedAPIDuplicate = _.cloneDeep(api);
                this.loadData();
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });
    }

    ngOnInit() {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });

        this.sub2 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getDeviceInventoryData().next(data);
            }
        });

        this.sub3 = this.testBedSevice.getTestBed().subscribe(testbed => {
            if (testbed) {
                this.dataService.getTestBedData().next(testbed);
            }
        });

        this.sub4 = this.apiService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getAPIData().next(data);
            }
        });

        this.sub5 = this.dataService.getAllAPIGroup().subscribe(apiGroup => {
            if (apiGroup) {
                this.allAPIGroup = apiGroup;
                this.allAPIGroupNames = [];
                this.allAPIGroup.forEach(element => {
                    this.allAPIGroupNames.push(element['name']);
                });
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

        this.sub6 = this.dataService.getNodes().subscribe(data => {
            if (data) {
                this.allNodes = data;
            }
        });

        this.sub7 = this.dataService.getAllAPI().subscribe(api => {
            if (api) {
                this.allAPI = api;
                this.allAPINames = [];
                 this.allAPI.forEach((apiData) => {
                    this.allAPINames.push(apiData['apiName']);
                    if (!this.apiGroupMap[apiData.apiGroupId]) { this.apiGroupMap[apiData.apiGroupId] = []; }
                    this.apiGroupMap[apiData.apiGroupId].push(apiData.apiName);
                  });
            }
        });

        this.sub8 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
            }
        });

        this.sub9 = this.dataService.getTestbedVariables().subscribe(tbVariable => {
            if (tbVariable) {
                this.testbedVariables = tbVariable;
            }
        });

        this.sub10 = this.apiForm.get('apiGroupId').valueChanges.subscribe(apiGroupId => {
            const apiGroup = _.find(this.allAPIGroup, { _id: apiGroupId });
            this.apiForm.get('apiId').setValue(apiGroup['name'] + '_' + (Number(apiGroup['counter']) + 1));
        });
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
        if (this.apiSubscription) {
            this.apiSubscription.unsubscribe();
        }
    }

    /**
     * Validate label names
     * @param formArray .
     */

    labelNameValidator(formArray): { invalid: boolean } {
        for (let index = 0; index < formArray.length; index++) {
            const element = formArray.at(index) as UntypedFormGroup;
            for (let j = 0; j < formArray.length; j++) {
                const tempElement = formArray.at(j) as UntypedFormGroup;
                if (element.get('argumentName').value === tempElement.get('argumentName').value && index !== j) {
                    element
                        .get('argumentName')
                        .setErrors({ ...element.get('argumentName').errors, duplicateLabelName: true });
                    tempElement
                        .get('argumentName')
                        .setErrors({ ...element.get('argumentName').errors, duplicateLabelName: true });
                    break;
                } else if (element.get('argumentName').hasError('duplicateLabelName')) {
                    const allErrors = element.get('argumentName').errors;
                    if (allErrors) {
                        delete allErrors['duplicateLabelName'];
                        element.get('argumentName').setErrors(_.isEmpty(allErrors) ? null : allErrors);
                    }
                    const allErrors1 = tempElement.get('argumentName').errors;
                    if (allErrors1) {
                        delete allErrors1['duplicateLabelName'];
                        tempElement.get('argumentName').setErrors(_.isEmpty(allErrors1) ? null : allErrors1);
                    }
                }
            }
        }
        return null;
    }

    /**
     * Loads form with available API data
     */

    loadData() {
        if (this.selectedAPI['Type'] == 'Reserve') {
            this.apiForm = new UntypedFormGroup({
                Type: new UntypedFormControl(this.selectedAPI['Type']),
                oldApiName: new UntypedFormControl(this.selectedAPI['apiName']),

                apiName: new UntypedFormControl(null, Validators.required),
                apiGroupId: new UntypedFormControl(
                    { value: this.selectedAPI['apiGroupId'], disabled: true },
                    Validators.required
                ),
                apiId: new UntypedFormControl(this.selectedAPI['apiId']),
                apiTimeOut: new UntypedFormControl({
                    value: this.selectedAPI['apiTimeOut'],
                    disabled: true,
                    },
                    Validators.required,
                    ),
                arguments: new UntypedFormArray(
                    [
                        new UntypedFormGroup({
                            argumentName: new UntypedFormControl(null),
                            argumentValue: new UntypedFormArray([])
                        }),
                        new UntypedFormGroup({
                            argumentName: new UntypedFormControl(null),
                            argumentValue: new UntypedFormArray([])
                        })
                    ],
                    [Validators.required]
                ),
                nodesRequired: new UntypedFormControl({ value: this.selectedAPI['nodesRequired'] || false, disabled: true })
            });
            this.reserveAPIArguments();
            this.sub15 = this.apiForm.get('apiName').valueChanges.subscribe(value => {
                if (this.allAPI.indexOf(value) !== -1) {
                    this.apiForm.get('apiName').setErrors({ duplicate: true });
                }
            });
        } else {
            this.apiForm = new UntypedFormGroup({
                Type: new UntypedFormControl(this.selectedAPI['Type']),
                oldApiName: new UntypedFormControl(this.selectedAPI['apiName']),
                apiName: new UntypedFormControl(null, Validators.required),

                apiGroupId: new UntypedFormControl(
                    { value: this.selectedAPI['apiGroupId'], disabled: true },
                    Validators.required
                ),
                apiId: new UntypedFormControl(this.selectedAPI['apiId']),
                apiTimeOut: new UntypedFormControl({
                    value: this.selectedAPI['apiTimeOut']?this.selectedAPI['apiTimeOut']:30 ,
                    disabled: true,
                  },
                    Validators.required,
                  ),
                arguments: new UntypedFormArray([], [Validators.required]),
                nodesRequired: new UntypedFormControl({ value: this.selectedAPI['nodesRequired'] || false, disabled: true })
            });
            this.testCaseAPIArguments();
        }
       
        this.apiForm.get('apiName').valueChanges.subscribe(d => {
            this.apiNameValidate();
            
             });
    }

    /**
     * Reserves API arguments
     */

    reserveAPIArguments() {
        this.TestCase = false;
        this.apiType = this.selectedAPI['Type'];
        this.selectedAPI['arguments'].forEach(element => {
            const tempFormGroup: UntypedFormGroup = new UntypedFormGroup({
                oldArgumentName: new UntypedFormControl(''),
                argumentName: new UntypedFormControl(''),
                argumentValue: new UntypedFormArray([])
            });
            const argsValue = tempFormGroup.get('argumentValue') as UntypedFormArray;
            element['argumentValue'].forEach(val => {
                argsValue.push(new UntypedFormControl(val));
            });

            const mainArray = this.apiForm.get('arguments') as UntypedFormArray;
            mainArray.push(tempFormGroup);
        });
        this.apiForm.patchValue(this.selectedAPI);

        this.apiForm.get('apiName').setValue(null);
    }

    /**
     * Used to test arguments
     */
    testCaseAPIArguments() {
        this.TestCase = true;
        this.apiType = 'TestCase';
        this.selectedAPI['arguments'].forEach(element => {
            const tempFormGroup: UntypedFormGroup = new UntypedFormGroup({
                oldArgumentName: new UntypedFormControl(element['argumentName']),
                argumentName: new UntypedFormControl(element['argumentName'], [Validators.required]),
                argumentValue: new UntypedFormArray([], Validators.required)
            });
            const argsValue = tempFormGroup.get('argumentValue') as UntypedFormArray;
            element['argumentValue'].forEach(val => {
                argsValue.push(new UntypedFormControl(val));
            });

            const mainArray = this.apiForm.get('arguments') as UntypedFormArray;
            mainArray.push(tempFormGroup);
        });
        this.sub13 = this.apiForm
            .get('arguments')
            .valueChanges.pipe(debounceTime(1000))
            .subscribe(changes => {
                this.labelNameValidator(this.apiForm.get('arguments'));
            });

        this.apiForm.patchValue(this.selectedAPI);
        this.apiForm.get('apiName').setValue(null);
    }

    /**
     * Gets the argument of the selected node
     * @param node .
     * @param index .
     */
    getArgumentsOfSelectedNode(node, index) {
        this.selectedNodeIndex = index;
        this.selectedNode = node;
        this.selectedArguments = [];
        if (node['profileId'] !== null) { 
        const selectedProfile = _.find(this.allProfiles, { _id: node['profileId'] });
        this.selectedArguments = [...selectedProfile['labels']];
        this.selectedArguments.forEach(function(obj) {
            obj.nodeId = node['_id'];
        });

        const reqVariableGroups = this.allVariableGroup.filter(a => {
            const requiredVars = selectedProfile.variableGroups || [];
            return requiredVars.indexOf(a._id) > -1;
        });

        for (let i = 0; i < reqVariableGroups.length; i++) {
            const element = reqVariableGroups[i]['variables'];
            for (let j = 0; j < element.length; j++) {
                const vars = element[j];
                const varDetails = { name: vars.variableName, variableId: vars._id, nodeId: node['_id'] };
                this.selectedArguments.push(varDetails);
            }
        }
    }else {
        const varDetails = { name: node['nodeName'], elementId: node['_id'] };
        this.selectedArguments.push(varDetails);
      }
    }

    /**
     * Loads global variables
     */

    loadGlobalVariables() {
        this.selectedNodeIndex = -1;
        this.selectedArguments = [];
    }

    /**
     * Add a new argument
     */

    addNewArgument() {
        const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
        argumentArray.push(
            new UntypedFormGroup({
                argumentName: new UntypedFormControl(null, Validators.required),
                argumentValue: new UntypedFormArray([], Validators.required)
            })
        );
    }

    /**
     * Delete argument
     * @param i .
     */

    deleteArgument(i) {
        const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
        argumentArray.removeAt(i);
    }

    /**
     * Add variable to argument
     * @param event .
     * @param i .
     */

     addVaribaleToArguments(event, i) {
        const returnValuexId = _.find(this.allNodes, {
          nodeName: 'ReturnValX',
        })['_id'];
        const textValueId = _.find(this.allNodes, {
          nodeName: 'Text Value',
        })['_id'];
        const argArray = this.apiForm.get('arguments') as UntypedFormArray;
        const arg = argArray.at(i) as UntypedFormGroup;
        const argValueArray = arg.get('argumentValue') as UntypedFormArray;
        const tempArray = [];
        argValueArray.controls.forEach((argValue) => {
          tempArray.push(...argValue.value.split(':'));
        });
    
        if (tempArray.indexOf(returnValuexId) > -1 || tempArray.indexOf(textValueId) > -1) {
          this.dialog.open(InformationDiaogComponent, {
            data: {
              title: 'Invalid Selection',
              body:
                'ReturnValx and Text value should be the only one inside an argument.' +
                'Please remove all other values before dropping them into arguments.',
            },
            panelClass: 'app-full-bleed-dialog',
            width: '600px',
          });
          return;
        }
       
        if (
          event['item']['data']['nodeId'] &&
          !event['item']['data']['variableId'] &&
          event['item']['data']['name'] &&
          i >= 0
        ) {
          const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
          const argument = argumentArray.at(i) as UntypedFormGroup;
          const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
          const tempValue =
            event['item']['data']['nodeId'] + ':' + event['item']['data']['name'];
          if (argumentValueArray.value.indexOf(tempValue) == -1) {
            argumentValueArray.push(
              new UntypedFormControl(
                event['item']['data']['nodeId'] +
                  ':' +
                  event['item']['data']['name']
              )
            );
          }
        } else if (
          event['item']['data']['elementId'] &&
          event['item']['data']['name'] &&
          i >= 0 &&
          event['item']['data']['name'] !== 'ReturnValX' &&
          event['item']['data']['name'] !== 'Text Value'
        ) {
          const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
          const argument = argumentArray.at(i) as UntypedFormGroup;
          const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
          const tempValue = 'ELEMENT' + ':' + event['item']['data']['elementId'];
          if (argumentValueArray.value.indexOf(tempValue) == -1) {
            argumentValueArray.push(
              new UntypedFormControl('ELEMENT' + ':' + event['item']['data']['elementId'])
            );
          }
        } else if (
          event['item']['data']['name'] === 'ReturnValX' ||
          event['item']['data']['name'] === 'Text Value'
        ) {
          const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
          const argument = argumentArray.at(i) as UntypedFormGroup;
          const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
          if (argumentValueArray.length > 0) {
            this.dialog.open(InformationDiaogComponent, {
              data: {
                title: 'Invalid Selection',
                body:
                  'ReturnValx and Text value should be the only one inside an argument.' +
                  'Please remove all other values before dropping them into arguments.',
              },
              panelClass: 'app-full-bleed-dialog',
              width: '600px',
            });
          } else {
            const tempValue = 'ELEMENT' + ':' + event['item']['data']['elementId'];
            if (argumentValueArray.value.indexOf(tempValue) == -1) {
              argumentValueArray.push(
                new UntypedFormControl('ELEMENT' + ':' + event['item']['data']['elementId'])
              );
            }
          }
        } else if (event['item']['data']['variableId']) {
          const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
          const argument = argumentArray.at(i) as UntypedFormGroup;
          const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
          const tempValue =
            'MODEL' +
            '-' +
            event['item']['data']['nodeId'] +
            ':' +
            event['item']['data']['variableId'];
          if (argumentValueArray.value.indexOf(tempValue) == -1) {
            argumentValueArray.push(
              new UntypedFormControl(
                'MODEL' +
                  '-' +
                  event['item']['data']['nodeId'] +
                  ':' +
                  event['item']['data']['variableId']
              )
            );
          }
        } else if (event['item']['data']['elementId']) {
          const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
          const argument = argumentArray.at(i) as UntypedFormGroup;
          const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
          const tempValue = 'ELEMENT' + ':' + event['item']['data']['elementId'];
          if (argumentValueArray.value.indexOf(tempValue) == -1) {
            argumentValueArray.push(
              new UntypedFormControl('ELEMENT' + ':' + event['item']['data']['elementId'])
            );
          }
        } else if (event.previousContainer === event.container) {
          moveItemInArray(
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        }
      }

    /**
     * Remove variable from argument
     * @param event .
     */

    removeVariableFromArguments(event) {
        if (event['item']['data']['indexI'] >= 0 && event['item']['data']['indexJ'] >= 0) {
            const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
            const argument = argumentArray.at(event['item']['data']['indexI']) as UntypedFormGroup;
            const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
            argumentValueArray.removeAt(event['item']['data']['indexJ']);
        }
    }


    /**
     * Adding the API method will call the API to save the API in a backend
     */

    addAPI() {
        this.dataService.loading.next(true);
        if (this.apiType == 'Reserve') {
            this.apiForm.removeControl('arguments');
            this.apiForm.addControl('arguments', new UntypedFormArray([]));
        }

        this.sub12 = this.apiService.addAPI( this.apiForm.getRawValue()).subscribe(
            data => {
                this.dataService.loading.next(false);
                if (data) {
                    this.dataService.getAPIData().next(data);

                    this.snackBar.open('API  Added Succesfully.', 'Ok', {
                        duration: 5000
                    });
                    this.router.navigate(['../'], { relativeTo: this.r });
                } else {
                    this.snackBar.open('Error Adding API .', 'Try Again', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding API.', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    /**
    * Validation for api names
    */
    validateapiname() {
        if (this.allAPINames.indexOf(this.apiForm.get('apiName').value) !== -1) {
            this.apiForm.get('apiName').setErrors({ unique: true });
        } else {
            if (this.apiForm.get('apiName').hasError('required')) {
                this.apiForm.get('apiName').setErrors({ required: true });
            } else {
                this.apiForm.get('apiName').setErrors(null);
            }
        }
    }
   // API Name Validations
  apiNameValidate(): void {
     //this.apiForm.get('apiName').setErrors(null);
     if(!Boolean(this.apiForm.get('apiName').value)) {
        this.apiForm.get('apiName').setErrors({ required: true });
    }
    if (this.apiGroupMap[this.apiForm.get('apiGroupId').value] &&
      this.apiGroupMap[this.apiForm.get('apiGroupId').value].includes(this.apiForm.get('apiName').value)) {
      this.apiForm.get('apiName').setErrors({ duplicateName: true });
    
    }
  }
 
}
