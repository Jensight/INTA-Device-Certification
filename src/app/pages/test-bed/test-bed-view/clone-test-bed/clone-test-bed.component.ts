import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/@core/services/api.service';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import * as _ from 'lodash';
import { NameFromIdPipe } from 'src/app/@shared/pipes/name-from-id.pipe';
import { stat } from 'fs';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';

export interface INodeValue {
  deviceId: string;
  nodeId: string;
  profileId: string;
}

@Component({
  selector: 'app-clone-test-bed',
  templateUrl: './clone-test-bed.component.html',
  styleUrls: ['./clone-test-bed.component.scss'],
  providers: [NameFromIdPipe]
})
export class CloneTestBedComponent implements OnInit {
  public nodeForm: UntypedFormGroup;
  public allProfiles;
  public deviceProfiles;
  public availableDevice;
  public selectedTeam;
  public selectedTestbed;
  // subscriptions
  dInventoryServiceSubscription;
  dataSubscription;
  dataSubscription1;
  testbedSubscription;
  deviceSubscription;
  tbSubscription: any;
  sub6: any;
  public allNode = [];
  public allTestbedNames = [];
  sub1;
  sub2;
  sub3;
  sub4;
  showDynamicToggle = false;
  dynamicLocked = false;
  getFormValid() {
    this.nodeForm.updateValueAndValidity();
     return this.nodeForm.invalid;
  }
  constructor(
    public dInventoryService: DeviceInventoryService,
    public dialogRef: MatDialogRef<CloneTestBedComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dataService: DataService,
    public testBedService: TestBedService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private nameFromId: NameFromIdPipe,
    public router: Router,
    private r: ActivatedRoute,
    private dialog: MatDialog
  ) {

    this.tbSubscription = this.testBedService.selectedTestbed.subscribe(tb => {
      if (tb) {
          this.selectedTestbed = tb;
      } else {
          this.router.navigate(['../'], { relativeTo: this.r });
      }
      this.sub6=this.dataService.selectedTeam.subscribe(team => {
        if (team) {
            this.selectedTeam = team;
        }
    });
  });
    //this.selectedTeam = data.selectedTeam;
    //this.selectedTestbed = data.selectedTestbed;
    this.dInventoryServiceSubscription = this.dInventoryService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getDeviceInventoryData().next(data);
        }
      });
    this.dataSubscription = this.dataService
      .getTestbedProfile()
      .subscribe((profiles) => {
        if (profiles) {
          this.allProfiles = profiles;
        }
      });

    this.testbedSubscription = this.dataService
      .getAllProfiles()
      .subscribe((data) => {
        if (data) {
          this.deviceProfiles = data;
        }
      });

    this.deviceSubscription = this.dataService
      .getAllDevices()
      .subscribe((data) => {
        if (data) {
          this.availableDevice = data;
        }
      });

    this.dataSubscription1 = this.dataService.getNodes().subscribe((nodes) => {
      if (nodes) {
        this.allNode = [];
        nodes.forEach((element) => {
          this.allNode.push(element);
        });
      }
    });
  }

  getAvailableDevice(controls: UntypedFormArray, i): any[] {
    const nodeArrayForm = this.nodeForm.get('nodes') as UntypedFormArray;
    const mappingDevice = nodeArrayForm
      .at(i)
      .get('avaiDeviceArray') as UntypedFormArray;
      if (!mappingDevice) {
        return [];
      }
    return mappingDevice.value;
  }

  ngOnInit() {
    this.nodeForm = new UntypedFormGroup({
     // _id: new FormControl(null),
      testBedName: new UntypedFormControl(null, Validators.required),
      testBedProfileId: new UntypedFormControl(null, Validators.required),
      dutId: new UntypedFormControl(null, Validators.required),
      tfwId: new UntypedFormControl(null),
      modelName: new UntypedFormControl(null, Validators.required),
      status: new UntypedFormControl('active', Validators.required),
      dynamic: new UntypedFormControl(false)
    });

    this.sub3 = this.dataService.getTestBed().subscribe(testbeds => {
      if (testbeds) {
        this.allTestbedNames = testbeds.map(t => t.testBedName);
      }
    });

    this.sub4 = this.nodeForm.get('testBedName').valueChanges.subscribe(value => {
      if (value && this.allTestbedNames.indexOf(value) !== -1) {
        this.nodeForm.get('testBedName').setErrors({ duplicate: true });
      } else if (this.nodeForm.get('testBedName').hasError('required')) {
        this.nodeForm.get('testBedName').setErrors(null);
        this.nodeForm.get('testBedName').setErrors({ required: true });
      } else {
        this.nodeForm.get('testBedName').setErrors(null);
      }
    });

    const editSelectedTb = this.selectedTestbed;
    this.nodeForm.patchValue({
      //_id : editSelectedTb._id,
      testBedName : editSelectedTb.testBedName + '_1',
      testBedProfileId : editSelectedTb.testBedProfileId,
      dutId: editSelectedTb.dutId,
      tfwId: editSelectedTb.tfwId,
      modelName: editSelectedTb.modelName,
      status: editSelectedTb.status,
      dynamic: editSelectedTb.dynamic || false
    });

    // For dynamic testbeds, dutId and modelName are not needed
    if (editSelectedTb.dynamic) {
      this.nodeForm.get('dutId').clearValidators();
      this.nodeForm.get('dutId').updateValueAndValidity();
      this.nodeForm.get('modelName').clearValidators();
      this.nodeForm.get('modelName').updateValueAndValidity();
    }
    const variableCotrol = this.fb.array([]);
    editSelectedTb.variables.forEach(element => {
      variableCotrol.push(this.fb.group(element));
    });
    this.nodeForm.addControl('variables', variableCotrol);

    if(editSelectedTb.testBedProfileId !== null && editSelectedTb.testBedProfileId !== undefined){
      const nodesCotrol = this.fb.array([]);
      editSelectedTb.nodes.forEach(x => {
        // device.profileId may be a string (legacy) or array (multi-profile form).
        // Normalize before comparing against the node's single profileId.
        const ava = this.availableDevice.filter(
               (device) => {
                 const ids = Array.isArray(device.profileId) ? device.profileId : [device.profileId];
                 return ids.includes(x.profileId);
               }
             );
        const avilableControl = new UntypedFormArray([]);
        ava.forEach((x) => {
          avilableControl.push(
            this.fb.group({
              _id: x._id,
              deviceName: x.deviceName,
            })
          );
        });
        nodesCotrol.push(this.fb.group({
              deviceId: x.deviceId,
              nodeId: x.nodeId,
              nodeName: this.nameFromId.transform(
                         x.nodeId,
                         this.allNode,
                         '_id',
                         'nodeName'
                       ),
              profileId: x.profileId,
              profileName: this.nameFromId.transform(
                          x.profileId,
                         this.deviceProfiles,
                         '_id',
                         'profileName'
                       ),
              avaiDeviceArray: avilableControl,
              dut:x.dut,
              tfw:x.tfw,
              dyn: x.dyn || false,
              pool: x.pool || false
            }));
          });
      this.nodeForm.addControl('nodes', nodesCotrol);
    }
    else {
      this.nodeForm.addControl('nodes', new UntypedFormArray([]));
    }
    this.nodeForm.updateValueAndValidity();

    // Check if Dynamic Scheduler is enabled for this team
    const teamRegConfig = this.dataService.getMultiDeleteRegData(this.selectedTeam);
    this.showDynamicToggle = teamRegConfig && teamRegConfig.show_dynamic_scheduler ? true : false;

    // Lock the form if dynamic is enabled on this testbed but Dynamic Scheduler config is disabled
    const dynamicEnabled = editSelectedTb.dynamic || false;
    if (dynamicEnabled && !this.showDynamicToggle) {
      this.dynamicLocked = true;
      this.nodeForm.disable();
    } else {
      // Disable all controls except testBedName for clone
      this.nodeForm.get('testBedProfileId').disable();
      this.nodeForm.get('status').disable();
      this.nodeForm.get('dynamic').disable();
      const nodesArray = this.nodeForm.get('nodes') as UntypedFormArray;
      for (let i = 0; i < nodesArray.length; i++) {
        nodesArray.at(i).get('deviceId')?.disable();
        nodesArray.at(i).get('dut')?.disable();
        nodesArray.at(i).get('tfw')?.disable();
        nodesArray.at(i).get('dyn')?.disable();
        nodesArray.at(i).get('pool')?.disable();
      }
    }

  }

 
  /**
   * Add Node Function will save data to database
   */

   cloneNode() {
    console.log("inside cloceNode")
    this.dataService.loading.next(true);
    const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
    for (let index = 0; index < nodeControls.length; index++) {
      console.log("nodeControls", nodeControls )
      const xxx =  nodeControls.at(index) as UntypedFormGroup;
      xxx.removeControl('profileName');
      xxx.removeControl('nodeName');
      xxx.removeControl('avaiDeviceArray');
     }
     this.nodeForm.updateValueAndValidity();
     const formData = this.nodeForm.getRawValue();
     let testBedProfile = this.allProfiles.filter(element => element._id == formData.testBedProfileId);
     formData["mappedTestSets"] = testBedProfile.length && testBedProfile[0].mappedTestSets ? testBedProfile[0].mappedTestSets : [];
     console.log("testbedProfilke", testBedProfile)
     console.log(":nodeForm221", this.nodeForm)
     this.sub2 = this.testBedService
      .addTestBed(formData)
      .subscribe((result) => {
      this.dataService.loading.next(false);
      if (result) {
        this.dataService.getTestBedData().next(result);
        this.snackBar.open('Testbed Clone Successfully', 'OK', {
          duration: 5000,
        });
        
        if (!formData.dynamic) {
          setTimeout(() => {
            this.dialog.open(ConfirmationDiaogComponent, {
              width: '450px',
              data: {
                name: 'Reminder',
                text: 'Testbed is cloned successfully. Kindly map the testbed in the designated lab partition.',
                action: 'OK',
                showSingleButton: true
              },
              panelClass: 'app-full-bleed-dialog'
            });
          }, 500);
        }
        
        this.dialogRef.close();
        //this.router.navigate(['../'], { relativeTo: this.r });
      }
    },
    (error) => {
      this.dataService.loading.next(false);
      this.snackBar.open('Error in Clone Testbed Element', 'Try Again', {
        duration: 5000,
      });
      this.dialogRef.close();
      //this.router.navigate(['../'], { relativeTo: this.r });
    });
  }

  OnchangeDeviceEvent(event, i) {
    const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
    nodeControls.at(i).get('deviceId').setValue(event.value);
    this.nodeForm.updateValueAndValidity();
  }

  OnchangeEvent(event) {
    const profileId = event.value;
    const selectedProfileArray = this.allProfiles.filter(
      (profile) => profile._id === profileId
    );

    const selectedProfile = Object.assign({}, ...selectedProfileArray);
    const variableCotrol = this.fb.array([]);
    selectedProfile.variables.forEach(element => {
      variableCotrol.push(this.fb.group(element));
    });
    this.nodeForm.controls.variables = variableCotrol;
    this.nodeForm.updateValueAndValidity();
    
    const selectedNode = selectedProfile.nodes;
    const formValue = this.nodeForm.getRawValue();
    const getNodeFromArray = this.fb.array([]);
    for (let index = 0; index < selectedNode.length; index++) {
      const element = selectedNode[index];
      // device.profileId may be a string (legacy) or array (multi-profile form).
      // Normalize before comparing against the node's single profileId.
      const ava = this.availableDevice.filter(
        (device) => {
          const ids = Array.isArray(device.profileId) ? device.profileId : [device.profileId];
          return ids.includes(element['profileId']);
        }
      );
      
      const avilableControl = new UntypedFormArray([]);
      ava.forEach((x) => {
        avilableControl.push(
          this.fb.group({
            _id: x._id,
            deviceName: x.deviceName,
          })
        );
      });
      getNodeFromArray.push(
        this.fb.group({
          nodeId: element['nodeId'],
          nodeName: this.nameFromId.transform(
            element['nodeId'],
            this.allNode,
            '_id',
            'nodeName'
          ),
          profileId: element['profileId'],
          profileName: this.nameFromId.transform(
            element['profileId'],
            this.deviceProfiles,
            '_id',
            'profileName'
          ),
          deviceId: new UntypedFormControl(null, Validators.required),
          avaiDeviceArray: avilableControl,
        })
      );
    }
    this.nodeForm.controls.nodes = getNodeFromArray;
    this.nodeForm.updateValueAndValidity();
  }
  /**
   * Cancel Function will return to node list
   */
  cancel() {
    this.dialogRef.close({ event: 'cancel' });
  }
  ngOnDestroy() {
    if (this.dInventoryServiceSubscription) {
      this.dInventoryServiceSubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.dataSubscription1) {
      this.dataSubscription1.unsubscribe();
    }
    if (this.testbedSubscription) {
      this.testbedSubscription.unsubscribe();
    }
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
    if (this.deviceSubscription) {
      this.deviceSubscription.unsubscribe();
    }
  }

}
