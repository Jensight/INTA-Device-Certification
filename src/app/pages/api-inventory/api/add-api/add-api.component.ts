import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { DataService } from '../../../../@core/services/data.service';
import { ApiService } from '../../../../@core/services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import * as _ from 'lodash';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { Router, ActivatedRoute } from '@angular/router';
import { InformationDiaogComponent } from '../../../../@shared/components/information-dialog/information-dialog.component';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-add-api',
  templateUrl: './add-api.component.html',
  styleUrls: ['./add-api.component.scss'],
})
export class AddAPIComponent implements OnInit, OnDestroy {
  public apiForm: UntypedFormGroup;
  public selectedTeam;
  public allAPIGroup;
  public allAPIGroupNames;
  public allTestbedData: any = [];
  TestCase = true;
  public tcApiType = true;
  public allAPISelectedVariables = [];
  public allAPI = [];
  public allAPINames = [];

  public allNodes = [];
  public allProfiles = [];

  public testbedVariables = [];

  public selectedArguments = [];
  public selectedNode;
  public selectedNodeIndex;
  timeOutFlag: Boolean = true;

  allVariableGroup = [];
  allVariables = [];
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
  type;
  apiGroupMap = {};
  duplicateName;
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard',
    },
    {
      link: '#/pages/api-inventory/api',
      label: 'API Inventory',
    },
    {
      link: '#/pages/api-inventory/api/add',
      label: 'Add API',
    },
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
  ) {}

  ngOnInit() {
    this.sub1 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });

    this.sub2 = this.dInventoryService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getDeviceInventoryData().next(data);
        }
      });

    this.sub3 = this.testBedSevice
      .getTestBed()
      .subscribe((testbed) => {
        if (testbed) {
          this.dataService.getTestBedData().next(testbed);
        }
      });

    this.sub4 = this.apiService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getAPIData().next(data);
        }
      });

    this.sub5 = this.dataService.getAllAPIGroup().subscribe((apiGroup) => {
      console.log('apiGroup$$$$$$$', apiGroup);
      
      if (apiGroup) {
        this.allAPIGroup = apiGroup;
        this.allAPIGroupNames = [];
        this.allAPIGroup.forEach((element) => {
          this.allAPIGroupNames.push(element['name']);
        });
      }
    });

    this.sub6 = this.dataService.getNodes().subscribe((data) => {
      if (data) {
        this.allNodes = data;
      }
    });

    this.sub13 = this.dataService.getDeviceVariableGroup().subscribe((data) => {
      if (data) {
        this.allVariableGroup = data;
        for (let i = 0; i < this.allVariableGroup.length; i++) {
          const element = this.allVariableGroup[i]['variables'];
          this.allVariables = [...this.allVariables, ...element];
        }
      }
    });

    this.sub7 = this.dataService.getAllAPI().subscribe((api) => {
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
    this.sub8 = this.dataService.getAllProfiles().subscribe((profiles) => {
      if (profiles) {
        this.allProfiles = profiles;
      }
    });

    this.sub9 = this.dataService
      .getTestbedVariables()
      .subscribe((tbVariable) => {
        if (tbVariable) {
          this.testbedVariables = tbVariable;
        }
      });
    this.loadForm();
  }
  checkIt() {
    if (this.TestCase) {
      this.TestCase = false;
      this.loadForm();
    } else {
      this.TestCase = true;
      this.loadForm();
    }
  }

  /**
   * Loads form with available API data
   */
  loadForm() {
    if (this.sub11) {
      this.sub11.unsubscribe();
    }
    let previousValue = { apiName: null, apiGroupId: null,timeOut: 30 };
    if (this.apiForm) {
      previousValue = this.apiForm.getRawValue();
    }

    if (this.TestCase) {
      this.apiForm = new UntypedFormGroup({
        apiName: new UntypedFormControl(
          previousValue.apiName || null,
         [ Validators.required]
        ),
        apiGroupId: new UntypedFormControl(
          previousValue.apiGroupId || null,
          Validators.required
        ),
        apiId: new UntypedFormControl(null),
        apiTimeOut: new UntypedFormControl({
          value: previousValue.timeOut || 30,
          disabled: this.timeOutFlag,
        },
          Validators.required,
        ),
        nodesRequired: new UntypedFormControl(false),
        arguments: new UntypedFormArray(
          [
            new UntypedFormGroup({
              argumentName: new UntypedFormControl(null, [Validators.required]),
              argumentValue: new UntypedFormArray([], Validators.required),
            }),
            new UntypedFormGroup({
              argumentName: new UntypedFormControl(null, Validators.required),
              argumentValue: new UntypedFormArray([], Validators.required),
            }),
          ],
          [Validators.required]
        ),
      });
      this.sub10 = this.apiForm
        .get('apiGroupId')
        .valueChanges.subscribe((apiGroupId) => {
          const apiGroup = _.find(this.allAPIGroup, { _id: apiGroupId });
          this.apiForm
            .get('apiId')
            .setValue(
              apiGroup['name'] + '_' + (Number(apiGroup['counter']) + 1)
            );
        });
      this.type = 'TestCase';
      this.sub11 = this.apiForm
        .get('arguments')
        .valueChanges.pipe(debounceTime(1000))
        .subscribe((changes) => {
          this.labelNameValidator(this.apiForm.get('arguments'));
        });
    } else {
      this.apiForm = new UntypedFormGroup({
        apiName: new UntypedFormControl(
          previousValue.apiName || null,
          Validators.required
        ),
        apiGroupId: new UntypedFormControl(
          previousValue.apiGroupId || null,
          Validators.required
        ),
        apiId: new UntypedFormControl(null),
        apiTimeOut: new UntypedFormControl({
          value: previousValue.timeOut || 30,
          disabled: this.timeOutFlag,
        },
          Validators.required,
        ),
        nodesRequired: new UntypedFormControl(false),
        arguments: new UntypedFormArray(
          [
            new UntypedFormGroup({
              argumentName: new UntypedFormControl(null),
              argumentValue: new UntypedFormArray([]),
            }),
            new UntypedFormGroup({
              argumentName: new UntypedFormControl(null),
              argumentValue: new UntypedFormArray([]),
            }),
          ],
          [Validators.required]
        ),
      });
      this.sub10 = this.apiForm
        .get('apiGroupId')
        .valueChanges.subscribe((apiGroupId) => {
          const apiGroup = _.find(this.allAPIGroup, { _id: apiGroupId });
          this.apiForm
            .get('apiId')
            .setValue(
              apiGroup['name'] + '_' + (Number(apiGroup['counter']) + 1)
            );
        });
      this.type = 'Reserve';
    }
    this.apiForm.get('apiName').valueChanges.subscribe(d => {
      this.apiNameValidate();
      
    });
      
  }

  /**
   * Loads arguments from selected nodes
   * @param node .
   * @param index .
   */
  getArgumentsOfSelectedNode(node, index) {
    this.selectedNodeIndex = index;
    this.selectedNode = node;
    this.selectedArguments = [];
    //to show default device UI values in Api 
   let hardcodeddValues =[
    {
    name: "deviceName",
    type: "text",
    value: null,
    textType: "text"
   },
   {
    name: "model",
    type: "text",
    value: null,
    textType: "text"
   },
   {
    name: "vendor",
    type: "text",
    value: null,
    textType: "text"
   },
   {
    name: "deviceIp",
    type: "text",
    value: null,
    textType: "text"
   },
   {
    name: "deviceMac",
    type: "text",
    value: null,
    textType: "text"
   },
   {
    name: "deviceFWVersion",
    type: "text",
    value: null,
    textType: "text"
   }
  
  ]
    if (node['profileId'] !== null) {
      const selectedProfile = _.find(this.allProfiles, {
        _id: node['profileId'],
      });

      this.selectedArguments = [...selectedProfile['labels']];
    //  this.selectedArguments.push(hardcodeddValues)
       this.selectedArguments = this.selectedArguments.concat(hardcodeddValues)
      this.selectedArguments.forEach(function (obj) {
        obj.nodeId = node['_id'];
      });

      const reqVariableGroups = this.allVariableGroup.filter((a) => {
        const requiredVars = selectedProfile.variableGroups || [];
        return requiredVars.indexOf(a._id) > -1;
      });

      for (let i = 0; i < reqVariableGroups.length; i++) {
        const element = reqVariableGroups[i]['variables'];
        for (let j = 0; j < element.length; j++) {
          const vars = element[j];
          const varDetails = {
            name: vars.variableName,
            variableId: vars._id,
            nodeId: node['_id'],
          };
          this.selectedArguments.push(varDetails);
        }
      }
      
    } else {
        const varDetails = { name: node["nodeName"], elementId: node['_id'] };
        this.selectedArguments.push(varDetails);
    }
  }

  loadGlobalVariables() {
    this.selectedNodeIndex = -1;
    this.selectedArguments = [];
  }

  /**
   * Add an API call to the backend
   */

  addAPI() {
    this.dataService.loading.next(true);
    if (this.type == 'Reserve') {
      this.apiForm.removeControl('arguments');
      this.apiForm.addControl('arguments', new UntypedFormArray([]));
    }
    this.apiForm.value['Type'] = this.type;
    this.sub12 = this.apiService
      .addAPI( this.apiForm.value)
      .subscribe(
        (data) => {
          this.dataService.loading.next(false);
          if (data) {
            this.dataService.getAPIData().next(data);
            this.snackBar.open('API  Added Succesfully.', 'Ok', {
              duration: 5000,
            });
            this.router.navigate(['../'], { relativeTo: this.r });
          } else {
            this.snackBar.open('Error Adding API .', 'Try Again', {
              duration: 5000,
            });
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Adding APIGroup.', 'Try Again', {
            duration: 5000,
          });
        }
      );
  }

  // API Name Validations
  apiNameValidate(): void {
      this.apiForm.get('apiName').setErrors(null);
      if(!Boolean(this.apiForm.get('apiName').value)) {
          this.apiForm.get('apiName').setErrors({ required: true });
      }
       
      if (this.apiGroupMap[this.apiForm.get('apiGroupId').value] &&
          this.apiGroupMap[this.apiForm.get('apiGroupId').value].includes(this.apiForm.get('apiName').value)) {
          this.apiForm.get('apiName').setErrors({ duplicateName: true });
    }
  }
  /**
   * Add a new argument
   */

  addNewArgument() {
    const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
    argumentArray.push(
      new UntypedFormGroup({
        argumentName: new UntypedFormControl(null, Validators.required),
        argumentValue: new UntypedFormArray([], Validators.required),
      })
    );
  }

  /**
   * Remove an argument
   * @param i .
   */

  deleteArgument(i) {
    const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
    argumentArray.removeAt(i);
  }

  /**
   * Add variables to argument
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
    }else if (
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
   * Removes variables from argument
   * @param event .
   */

  removeVariableFromArguments(event) {
    if (
      event['item']['data']['indexI'] >= 0 &&
      event['item']['data']['indexJ'] >= 0
    ) {
      const argumentArray = this.apiForm.get('arguments') as UntypedFormArray;
      const argument = argumentArray.at(
        event['item']['data']['indexI']
      ) as UntypedFormGroup;
      const argumentValueArray = argument.get('argumentValue') as UntypedFormArray;
      argumentValueArray.removeAt(event['item']['data']['indexJ']);
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
        if (
          element.get('argumentName').value ===
            tempElement.get('argumentName').value &&
          index !== j
        ) {
          element
            .get('argumentName')
            .setErrors({
              ...element.get('argumentName').errors,
              duplicateLabelName: true,
            });
          tempElement
            .get('argumentName')
            .setErrors({
              ...element.get('argumentName').errors,
              duplicateLabelName: true,
            });
          break;
        } else if (element.get('argumentName').hasError('duplicateLabelName')) {
          const allErrors = element.get('argumentName').errors;
          if (allErrors) {
            delete allErrors['duplicateLabelName'];
            element
              .get('argumentName')
              .setErrors(_.isEmpty(allErrors) ? null : allErrors);
          }
          const allErrors1 = tempElement.get('argumentName').errors;
          if (allErrors1) {
            delete allErrors1['duplicateLabelName'];
            tempElement
              .get('argumentName')
              .setErrors(_.isEmpty(allErrors1) ? null : allErrors1);
          }
        }
      }
    }
    return null;
  }

  ngOnDestroy(): void {
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
  }

  editTimeOut(){
    console.log("editTimeOut>>>>");
    this.timeOutFlag = false;
    this.apiForm.get("apiTimeOut").enable();
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
}
