import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormGroup, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from '../../../../@core/services/data.service';
import { NameFromIdPipe } from '../../../../@shared/pipes/name-from-id.pipe';
import { APIInventoryDeleteComponent } from 'src/app/@shared/components/api-inventory-delete/api-inventory-delete.component';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  providers: [NameFromIdPipe],
})
export class EditProfileComponent implements OnInit, OnDestroy {
  allProfiles = [];
  tbProfile = [];
  allNodes = [];
  allNodesDuplicate = [];
  searchTextboxControl = new UntypedFormControl();
  testBedProfileForm: UntypedFormGroup;
  allVariables = [];
  allVariablesNames = [];
  allTestbedSelectedVariables = [];
  zeroStatus = true;
  usedNodes = [];
  flag = true;
  className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
  classNameDuplicate = [
    'red-color',
    'orange-color',
    'pink-color',
    'green-color',
  ];
  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  sub10;
  sub11;
  subTestbedProfile;
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard',
    },
    {
      link: '#/pages/test-bed/testbed-profile',
      label: 'Test Bed Profile',
    },
    {
      link: '#/pages/test-bed/testbed-profile/edit',
      label: 'Edit Testbed profile',
    },
  ];
  tbSubscription;
  selectedTestbed;
  selectedProfile;
  selectedTeam;
  disableButton;
  selectedNodes = [];
  allTestSets = [];
  originalAllTestSets = [];
  originalselectedTestSets = [];
  notFoundTestSets = [];
  selectedTestSets = [];
  alreadyMappedTestSets = [];
  sub7: any;
  allTestbedNames: any;
  constructor(
    private testBedService: TestBedService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dataService: DataService,
    private nameFromId: NameFromIdPipe,
    private r: ActivatedRoute,
    private dialog: MatDialog,
  ) {
    this.tbSubscription = this.testBedService.selectedTestbed.subscribe(
      (tb) => {
        if (tb) {
          this.selectedTestbed = _.cloneDeep(tb);
          this.originalselectedTestSets = tb.mappedTestSets ? tb.mappedTestSets : [];
          console.log(tb);
        } else {
          this.router.navigate(['../'], { relativeTo: this.r });
        }
      }
    );
    this.sub6 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.subTestbedProfile = this.dataService
      .getTestbedProfile()
      .subscribe((profiles) => {
        if (profiles) {
          this.tbProfile = profiles;
        }
      });
  }

  ngOnInit() {
    this.testBedProfileForm = new UntypedFormGroup({
      _id: new UntypedFormControl(null),
      testBedProfileName: new UntypedFormControl(null, Validators.required),
      nodes: new UntypedFormArray([]),
      variables: new UntypedFormArray([]),
      toggle: new UntypedFormControl(null),
      mappedTestSets: new UntypedFormArray([])
    });
    if (this.selectedTestbed.count >= 0) {
      this.disableButton = false;
    } else {
      this.disableButton = true;
    }

    this.testBedProfileForm.patchValue(this.selectedTestbed);
    this.selectedTestbed['nodes'].forEach((node) => {
      this.usedNodes.push(node.nodeId);
    });
    this.selectedTestbed['variables'].forEach((tbVar) => {
      this.flag = false;
      const varGroup = new UntypedFormGroup({
        variableId: new UntypedFormControl(null, Validators.required),
        variableValue: new UntypedFormControl(null, Validators.required),
      });
      varGroup.patchValue(tbVar);
      const varArray = this.testBedProfileForm.get('variables') as UntypedFormArray;
      varArray.push(varGroup);
    });
    this.dataService.getTestbedProfile().subscribe((testbedProfiles) => {
      if (testbedProfiles) {
        this.allTestbedNames = testbedProfiles.map((t) => t.testBedProfileName);
      }
    });
    this.testBedProfileForm.get('testBedProfileName').valueChanges.subscribe(value => {
      if (this.allTestbedNames.indexOf(value) !== -1 && value !== this.selectedTestbed['testBedProfileName']) {
        this.testBedProfileForm.get('testBedProfileName').setErrors({ duplicate: true });
      }else {
        this.testBedProfileForm.get('testBedProfileName').setErrors(null);
      }
    });
    this.sub1 = this.testBedProfileForm
      .get('variables')
      .valueChanges.subscribe((value) => {
        this.allTestbedSelectedVariables = this.getAllSelectedVariables();
      });
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
        const temp = nodes.slice();
        temp.forEach((element) => {
          if (element.profileId !== null) {
            const resolvedProfileName = this.nameFromId.transform(
              element['profileId'],
              this.allProfiles,
              '_id',
              'profileName'
            );
            // When the device profile has been deleted the pipe returns the raw
            // profileId; treat that as no mapping and show 'NA' instead of the id.
            element['profileName'] =
              resolvedProfileName === element['profileId'] ? 'NA' : resolvedProfileName;
          } else {
            element['profileName'] = 'NA';
          }
        });

        this.allNodes = _.filter(temp, (node) => {
          return this.usedNodes.indexOf(node._id) === -1;
        });
        this.selectedNodes = _.filter(temp, (node) => {
          return this.usedNodes.indexOf(node._id) !== -1;
        });
      }
    });

    this.sub10 = this.dataService.getTCModules().subscribe(modules => {
      if (modules) {
        console.log("this.allTestSets",this.allTestSets)
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
    let notFoundList = [];
    this.tbProfile.forEach(element => {
      //If testbed profile has any testsets mapped
      if (element.mappedTestSets) {
        element.mappedTestSets.forEach(item => {
          notFoundList.push(item);
        })
      }
    })
    let temp = _.cloneDeep(this.originalAllTestSets);
    let foundTestSets = [];
    this.originalselectedTestSets.forEach(item => {
      for (let i = 0; i < temp.length; i++) {
        if (temp[i]._id === item) {
          foundTestSets.push(temp[i]);
        }
      }
    })
    this.selectedTestSets = [];
    this.selectedTestSets = foundTestSets;
    //Remove already mapped test sets
    notFoundList.forEach(item => {
      for (let i = 0; i < this.notFoundTestSets.length; i++) {
        if (this.notFoundTestSets[i]._id === item) {
          this.notFoundTestSets.splice(i, 1);
          i--;
        }
      }
    })
    let originalIds = this.selectedTestbed.mappedTestSets ? this.selectedTestbed.mappedTestSets : [];
    //Add disabled field for items and add testBedProfileName field
    notFoundList.forEach(item => {
      for (let i = 0; i < temp.length; i++) {
        if (temp[i]._id === item && !originalIds.includes(temp[i]._id)) {
          temp[i]['disabled'] = true;
          let testBedProfile = this.tbProfile.filter( x => x.mappedTestSets?.filter( y => y === item).length);
          temp[i]['testBedProfileName'] = testBedProfile[0].testBedProfileName;
          this.alreadyMappedTestSets.push(temp[i]);
        }
      }
    })
    this.originalselectedTestSets.forEach(item => {
      for (let i = 0; i < temp.length; i++) {
        if (temp[i]._id === item) {
          temp.splice(i, 1);
        }
      }
    })
    this.originalAllTestSets = temp;
    this.allTestSets = temp;
    this.originalselectedTestSets = _.cloneDeep(foundTestSets);
  }

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

  disableUpdateButton() {
    
    if (this.testBedProfileForm.invalid || this.selectedNodes.length <= 0) {
      return true;
    }
    // else if(this.selectedTestbed.count > 0){
    //   return true;
    // }
    return false;
  }

  deleteVarible(index) {
    const formAry = this.testBedProfileForm.get('variables') as UntypedFormArray;
    formAry.removeAt(index);
    if (formAry.length === 0) {
      this.flag = true;
    }
  }

  getAllSelectedVariables() {
    const variableArray = [];
    const variableFormArray = this.testBedProfileForm.get(
      'variables'
    ) as UntypedFormArray;
    variableFormArray.controls.forEach((ele) => {
      variableArray.push(ele.get('variableId').value);
    });
    return variableArray;
  }

  updateTestBed() {
    this.dataService.loading.next(true);
    let updateTb: any[] = [];
    this.dataService.getTestBedData().subscribe((res: { testBedName: string }[]) => {
      updateTb = _.intersectionWith(res, this.selectedTestbed.target as { testBedName: string }[], (tb, name) => tb.testBedName === name.testBedName);
    });
    const formValue = this.testBedProfileForm.getRawValue();
    let mappedTestSets = [];
    for (let index = 0; index < this.selectedTestSets.length; index++) {
      mappedTestSets.push(this.selectedTestSets[index]['_id']);
    }
    for (let index = 0; index < this.selectedNodes.length; index++) {
      const element = this.selectedNodes[index];
      const oldIndex = _.findIndex(this.selectedTestbed['nodes'], {
        nodeId: element['_id'],
      });
      if (oldIndex > -1) {
        console.log(element['_id'],"if")
        formValue['nodes'].push(this.selectedTestbed['nodes'][oldIndex]);
      } else {
        formValue['nodes'].push({
          nodeId: element['_id'],
          profileId: element['profileId'],
          deviceId: null,
        });
        updateTb.forEach((tb)=>{
          tb.nodes.push({
            nodeId: element['_id'],
            profileId: element['profileId'],
            deviceId: null,
            dut:false
          });
        })        
      }

    }
    updateTb.forEach((tb)=>{
      tb.nodes= _.intersectionBy(tb.nodes,formValue.nodes, 'nodeId');
      tb['mappedTestSets'] = [];
      tb['mappedTestSets'] = mappedTestSets;
    })
    formValue['mappedTestSets'] = [];
    formValue['mappedTestSets'] = mappedTestSets;
    this.sub5 = this.testBedService
      .updateTestbedSettings(formValue)
      .subscribe(
        async(result) => {
          this.dataService.loading.next(false);
          if (result) {
            for await(let tb of updateTb){
              delete tb?.isConfigured
              delete tb?.profileName
              delete tb?.allNodes
              this.testBedService.updateTestbedSettings( tb).subscribe((res)=>{
               
              })
             }

            this.dataService.getTestBedData().next(result);            
            this.snackBar.open('Testbed Profile Updated Successfully', 'OK', {
              duration: 5000,
            });
            this.router.navigate(['../'], { relativeTo: this.r });
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Updating Testbed Profile', 'Try Again', {
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
    if (this.tbSubscription) {
      this.tbSubscription.unsubscribe();
    }
    if (this.sub10) {
      this.sub10.unsubscribe();
    }
    if (this.sub11) {
      this.sub11.unsubscribe();
    }
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

  removeANode(index,node) {
     let oldIndex = _.findIndex(this.selectedTestbed['nodes'], {
        nodeId: node['_id'],
      });
      if (oldIndex> -1) {
        this.selectedTestbed.node=true
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
          width: '400px',
          data: {
            name: 'Network Element',
            successText: `Removing this network element will remove the network element from the Testbed(s) and this action can't be reversed.
              Are you want to Proceed?`,
            action: 'Remove',
            errorText: `Cannot Remove Network Element as ${this.selectedTestbed.count} Testbed(s) using this Profile.`,
            data: this.selectedTestbed,
            targetName: 'TestBed',
            targetFields: ['No', 'testBedName'],
          },
          minWidth: '700px',
          panelClass: 'app-full-bleed-dialog',
        });
        this.sub7 = dialogRef.afterClosed().subscribe((result) => {
          if (result === true) {
            this.selectedTestbed.nodes= _.filter(this.selectedTestbed.nodes, function(x) { return x.nodeId !== node._id; });
            transferArrayItem(
              this.selectedNodes,
              this.allNodes,
              index,
              this.allNodes.length
            );
            delete this.selectedTestbed.node
          }
        });
      } else {
        transferArrayItem(
          this.selectedNodes,
          this.allNodes,
          index,
          this.allNodes.length
        );
    }
   
  }

  removeANodeForTC(index) {
    transferArrayItem(
      this.selectedTestSets,
      this.allTestSets,
      index,
      this.allTestSets.length
    );
  }
  searchTestSet(event) {
    let name = event.target.value.toLowerCase();

    if (this.testBedProfileForm.get('toggle').value === true){
      let filteredTestSets = this.originalAllTestSets.filter(el => !el.disabled);
      filteredTestSets = filteredTestSets.filter(el => !this.selectedTestSets.includes(el));
      this.allTestSets = filteredTestSets.filter(el => el.moduleName.toLowerCase().includes(name));
    } else {
        this.allTestSets = this.originalAllTestSets.filter((el) => (el.moduleName.toLowerCase()).includes(name));
    }
  }

    clearFilter(): void {
      this.searchTextboxControl.patchValue('');
     
    }
    
     handleInput(event: KeyboardEvent): void{
    event.stopPropagation();
    
 }
    
  }


