import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import * as _ from 'lodash';

import { MatSnackBar } from '@angular/material/snack-bar';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { NameFromIdPipe } from '../../../../@shared/pipes/name-from-id.pipe';
import { VariableDisable } from '../../../../@shared/pipes/variable-disable.pipe';

@Component({
  selector: 'app-add-profile',
  templateUrl: './add-profile.component.html',
  styleUrls: ['./add-profile.component.scss'],
  providers: [NameFromIdPipe, VariableDisable],
})
export class AddProfileComponent implements OnInit, OnDestroy {
  allProfiles = [];
  tbProfile = [];
  allNodes = [];
  testBedProfileForm: UntypedFormGroup;
  allVariables = [];
  allVariablesNames = [];
  allTestbedSelectedVariables = [];
  allTestbedNames = [];
  className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
  classNameDuplicate = [
    'red-color',
    'orange-color',
    'pink-color',
    'green-color',
  ];
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
  sub10;
  sub11;
  subTestbedProfile;
  allTestSets = [];
  originalAllTestSets = [];
  notFoundTestSets = [];
  selectedTestSets = [];
  alreadyMappedTestSets = [];
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard',
    },
    {
      link: '#/pages/test-bed/testbed-profile',
      label: 'Test Bed profile',
    },
    {
      link: '#/pages/test-bed/testbed-profile/add',
      label: 'Add Testbed Profile',
    },
  ];
  constructor(
    private testBedService: TestBedService,
    private deviceInventoryService: DeviceInventoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dataService: DataService,
    private nameFromId: NameFromIdPipe,
    private r: ActivatedRoute
  ) {}

  ngOnInit() {
    this.testBedProfileForm = new UntypedFormGroup({
      testBedProfileName: new UntypedFormControl(null, Validators.required),
      nodes: new UntypedFormArray([]),
      variables: new UntypedFormArray([]),
      toggle: new UntypedFormControl(null),
      mappedTestSets: new UntypedFormArray([])
    });

    this.sub7 = this.testBedProfileForm
      .get('testBedProfileName')
      .valueChanges.subscribe((value) => {
        if (this.allTestbedNames.indexOf(value) !== -1) {
          this.testBedProfileForm.get('testBedProfileName').setErrors({ duplicate: true });
        } else if (this.testBedProfileForm.get('testBedProfileName').hasError('required')) {
          this.testBedProfileForm.get('testBedProfileName').setErrors(null);
          this.testBedProfileForm.get('testBedProfileName').setErrors({ required: true });
        } else {
          this.testBedProfileForm.get('testBedProfileName').setErrors(null);
        }
      });

    this.sub1 = this.testBedProfileForm
      .get('variables')
      .valueChanges.subscribe((value) => {
        this.allTestbedSelectedVariables = this.getAllSelectedVariables();
      });

    this.sub8 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.checkData();
      }
    });

    this.sub10 = this.dataService.getTCModules().subscribe(modules => {
      if (modules) {
        this.originalAllTestSets = _.cloneDeep(modules);
        this.allTestSets = _.cloneDeep(modules);
        this.notFoundTestSets = _.cloneDeep(modules);
        this.calculateNotFoundList();
      }
    });

    this.sub11 = this.testBedProfileForm
      .get('toggle')
      .valueChanges.subscribe((value) => {
        if (!value) {
          this.allTestSets.unshift(...this.alreadyMappedTestSets);
        } else {
          if (this.selectedTestSets && this.selectedTestSets.length) {
            this.selectedTestSets.forEach(item => {
              for (let i = 0; i < this.allTestSets.length; i++) {
                if (this.allTestSets[i]._id === item._id) {
                  this.allTestSets.splice(i, 1);
                  i--;
                }
              }
            })
          }
          this.alreadyMappedTestSets.forEach(item => {
            for (let i = 0; i < this.allTestSets.length; i++) {
              if (this.allTestSets[i]._id === item._id) {
                this.allTestSets.splice(i, 1);
                i--;
              }
            }
          })
        }
      });
  }

  calculateNotFoundList() {
    this.allTestSets = [];
    this.selectedTestSets = [];
    //Storing Testsets not mapped in notFoundList Array
    let notFoundList = [];
    this.tbProfile.forEach(element => {
      //If testbed profile has any testsets mapped
      if (element.mappedTestSets) {
        element.mappedTestSets.forEach(item => {
          notFoundList.push(item);
        })
      }
    })
    //Remove already mapped test sets
    notFoundList.forEach(item => {
      for (let i = 0; i < this.notFoundTestSets.length; i++) {
        if (this.notFoundTestSets[i]._id === item) {
          this.notFoundTestSets.splice(i, 1);
          i--;
        }
      }
    })
    let temp = _.cloneDeep(this.originalAllTestSets);
    //Add disabled field for items and add testBedProfileName field
    notFoundList.forEach(item => {
      for (let i = 0; i < temp.length; i++) {
        if (temp[i]._id === item) {
          temp[i]['disabled'] = true;
          let testBedProfile = this.tbProfile.filter( x => x.mappedTestSets?.filter( y => y === item).length);
          temp[i]['testBedProfileName'] = testBedProfile[0].testBedProfileName;
          this.alreadyMappedTestSets.push(temp[i]);
        }
      }
    })
    this.originalAllTestSets = temp;
    this.allTestSets = temp;
  }

  /**
   * Check data will validate weather profile data available or not
   */

  checkData() {
    this.subTestbedProfile = this.dataService
      .getTestbedProfile()
      .subscribe((profiles) => {
        if (profiles) {
          this.tbProfile = profiles;
        }
      });
    this.sub2 = this.dataService.getAllProfiles().subscribe((profiles) => {
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
        switchMap((data) => {
          this.dataService.getDeviceInventoryData().next(data);
          return this.testBedService.getTestBed();
        })
      )
      .subscribe((tb) => {
        if (tb) {
          this.dataService.getTestBedData().next(tb);
          this.loadData();
        }
      });
  }

  loadData() {
    if (this.subTestbedProfile) {
      this.subTestbedProfile.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
    this.sub2 = this.dataService.getAllProfiles().subscribe((profiles) => {
      if (profiles) {
        this.allProfiles = profiles;
      }
    });
    this.sub3 = this.dataService.getTestbedVariables().subscribe((variable) => {
      if (variable) {
        this.allVariables = variable;
        this.allVariablesNames = [];
        this.allVariables.forEach((varName) => {
          if (
            varName['variableName'] !== 'Text Value' &&
            varName['variableName'] !== 'ReturnValX'
          ) {
            this.allVariablesNames.push(varName['_id']);
          }
        });
      }
    });

    this.sub4 = this.dataService.getNodes().subscribe((nodes) => {
      if (nodes) {
        this.allNodes = nodes.slice().filter(obj => obj.nodeName!=='ReturnValX' && obj.nodeName!=='Text Value');

        this.allNodes.forEach((element) => {

          if(element.profileId !== null){
            element['profileName'] = this.nameFromId.transform(
              element['profileId'],
              this.allProfiles,
              '_id',
              'profileName'
            );
          }else{
            element['profileName'] = "NA";
          }
        });
      }
    });

    this.sub6 = this.dataService.getTestbedProfile().subscribe((testbedProfiles) => {
      if (testbedProfiles) {
        this.allTestbedNames = testbedProfiles.map((t) => t.testBedProfileName);
      }
    });
  }

  /**
   * Add New Variable Function
   */

  addNewVariable() {
    const formAry = this.testBedProfileForm.get('variables') as UntypedFormArray;
    formAry.push(
      new UntypedFormGroup({
        variableId: new UntypedFormControl(null, Validators.required),
        variableValue: new UntypedFormControl(null, Validators.required),
      })
    );
    this.flag = false;
  }

  /**
   * Delete Variable Function
   * @param index .
   */

  deleteVarible(index) {
    const formAry = this.testBedProfileForm.get('variables') as UntypedFormArray;
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
    const variableFormArray = this.testBedProfileForm.get('variables') as UntypedFormArray;
    variableFormArray.controls.forEach((ele) => {
      variableArray.push(ele.get('variableId').value);
    });
    return variableArray;
  }

  /**
   * Add testbed to the database via service call
   */

  addTestBed() {
    const formValue = this.testBedProfileForm.getRawValue();
    for (let index = 0; index < this.selectedNodes.length; index++) {
      const element = this.selectedNodes[index];
      formValue['nodes'].push({
        nodeId: element['_id'],
        profileId: element['profileId'],
        deviceId: null,
      });
    }
    let mappedTestSets = [];
    for (let index = 0; index < this.selectedTestSets.length; index++) {
      mappedTestSets.push(this.selectedTestSets[index]['_id']);
    }
    formValue['mappedTestSets'] = [];
    formValue['mappedTestSets'] = mappedTestSets;
    this.dataService.loading.next(true);
    this.sub5 = this.testBedService
      .addTestBed( formValue)
      .subscribe(
        (result) => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getTestBedData().next(result);
            this.snackBar.open('Testbed Profile Added Successfully', 'OK', {
              duration: 5000,
            });
            this.router.navigate(['../'], { relativeTo: this.r });
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Adding Testbed Profile', 'Try Again', {
            duration: 5000,
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
    if (this.sub10) {
      this.sub10.unsubscribe();
    }
    if (this.sub11) {
      this.sub11.unsubscribe();
    }
    this.allTestSets = [];
    this.originalAllTestSets = [];
    this.notFoundTestSets = [];
    this.selectedTestSets = [];
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
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
    transferArrayItem(
      this.allNodes,
      this.selectedNodes,
      index,
      this.selectedNodes.length
    );
  }

  selectANodeForTC(index) {
    transferArrayItem(
      this.allTestSets,
      this.selectedTestSets,
      index,
      this.selectedTestSets.length
    );
  }

  /**
   * Remove a selected node Function
   * @param index .
   */

  removeANode(index) {
    transferArrayItem(
      this.selectedNodes,
      this.allNodes,
      index,
      this.allNodes.length
    );
  }

  removeANodeForTC(index) {
    transferArrayItem(
      this.selectedTestSets,
      this.allTestSets,
      index,
      this.allTestSets.length
    );
  }
}
