import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormArray,
  UntypedFormBuilder,
  FormGroupName,
  FormControlName,
} from '@angular/forms';
import { SimpleChanges } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { NameFromIdPipe } from 'src/app/@shared/pipes/name-from-id.pipe';
import { domainToUnicode } from 'url';
import * as _ from 'lodash';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
export interface INodeValue {
  deviceId: string;
  nodeId: string;
  profileId: string;
}

@Component({
  selector: 'app-edit-testbed-config',
  templateUrl: './edit-testbed-config.component.html',
  styleUrls: ['./edit-testbed-config.component.scss'],
  providers: [NameFromIdPipe],
})
export class EditTestbedConfigComponent implements OnInit, OnDestroy {
  public nodeForm: UntypedFormGroup;
  searchTextboxControl = new UntypedFormControl();
  filteredOptions: Observable<any[]>;
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
  modelDevice;
  public allNode = [];
  sub1;
  sub2;
  request;
  dutButton = true
  tfwButton = false;
  oldNodes: any;
  selectedValues = [];
  hasDutEnabled: boolean = false;
  settingsData: any;
  allowInactive  = false;
  showInactiveError: boolean = false;
  oldStatus: string = '';
  dynamicEnabled = false;
  showDynamicToggle = false;
  dynamicLocked = false;
  getFormValid() {
    this.nodeForm.updateValueAndValidity();
    if (!this.dynamicEnabled) {
      this.hasDutEnabled = this.nodeForm.value.nodes.some((node) => node.dut === true);
      return this.nodeForm.invalid || !this.hasDutEnabled;
    }
    return this.nodeForm.invalid;
  }
  constructor(
    public dInventoryService: DeviceInventoryService,
    public dialogRef: MatDialogRef<EditTestbedConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dataService: DataService,
    public testBedService: TestBedService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private nameFromId: NameFromIdPipe,
    private dialog: MatDialog
  ) {
    this.request = data.request;
    this.selectedTeam = data.selectedTeam;
    this.selectedTestbed = data.selectedTestbed;
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
          this.modelDevice = data
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
  ngOnChanges(changes: SimpleChanges) {
    console.log(this.dutButton, "button ")
  }
  ngOnInit() {
    this.dataService.getSettingsData().subscribe((data) => {
      if (data) {
        this.settingsData = data;
        this.allowInactive = this.settingsData?.LabSetUp?.show_inactive_testbeds;
        console.log(this.settingsData, "settings data in edit testbed");
      }
    });

    // Check if Dynamic Scheduler is enabled for this team
    const teamRegConfig = this.dataService.getMultiDeleteRegData(this.selectedTeam);
    this.showDynamicToggle = teamRegConfig && teamRegConfig.show_dynamic_scheduler ? true : false;

    this.filteredOptions = this.searchTextboxControl.valueChanges
      .pipe(
        startWith<string>(''),
        map(name => this._filter(name))
      );
    this.nodeForm = new UntypedFormGroup({
      _id: new UntypedFormControl(null),
      testBedName: new UntypedFormControl(null, Validators.required),
      testBedProfileId: new UntypedFormControl(null, Validators.required),
      status: new UntypedFormControl('active', Validators.required),
      dynamic: new UntypedFormControl(false)
    });

    this.nodeForm.get('status').valueChanges
      .subscribe(value => {
        console.log('Status changed to:', value, this.allowInactive, this.selectedTestbed.labIndex);
        if(value === 'inactive' && !this.allowInactive && this.selectedTestbed.labIndex && this.selectedTestbed.labIndex !== '' &&   this.selectedTestbed.labIndex !== 'NA') {
          console.log('Reverting status to active as inactive testbeds are not allowed.');
          this.showInactiveError = true;
        } else {
          this.showInactiveError = false;
        }
      });

    const editSelectedTb = this.selectedTestbed;
    this.oldStatus = editSelectedTb.status; // Store the original status
    this.nodeForm.patchValue({
      _id: editSelectedTb._id,
      testBedName: editSelectedTb.testBedName,
      testBedProfileId: editSelectedTb.testBedProfileId,
      status: editSelectedTb.status,
      dynamic: editSelectedTb.dynamic || false
    });
    this.dynamicEnabled = editSelectedTb.dynamic || false;

    // Lock the form if dynamic is enabled on this testbed but Dynamic Scheduler config is disabled
    if (this.dynamicEnabled && !this.showDynamicToggle) {
      this.dynamicLocked = true;
      this.nodeForm.disable();
    }
    const variableCotrol = this.fb.array([]);
    editSelectedTb.variables.forEach(element => {
      variableCotrol.push(this.fb.group(element));
    });
    this.nodeForm.addControl('variables', variableCotrol);

    if (editSelectedTb.testBedProfileId !== null && editSelectedTb.testBedProfileId !== undefined) {
      const nodesCotrol = this.fb.array([]);
      editSelectedTb.nodes.forEach(x => {
        // device.profileId may be a string (legacy) or array (multi-profile form).
        // Normalize before comparing against the node's single profileId.
        const ava = this.availableDevice.filter((device) => {
          const ids = Array.isArray(device.profileId) ? device.profileId : [device.profileId];
          return ids.includes(x.profileId);
        });
        const avilableControl = new UntypedFormArray([]);
        ava.forEach((x) => {
          avilableControl.push(
            this.fb.group({
              _id: x._id,
              deviceName: x.deviceName,
            })
          );
        });
        const isDynOrPool = (x.dyn || false) || (x.pool || false);
        nodesCotrol.push(this.fb.group({
          deviceId: isDynOrPool ? x.deviceId : new UntypedFormControl(x.deviceId, Validators.required),
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
          dut: x.dut,
          tfw: x.tfw || false,
          dyn: x.dyn || false,
          pool: x.pool || false,
          avaiDeviceArray: avilableControl,
        }));
      });
      this.nodeForm.addControl('nodes', nodesCotrol);
      this.oldNodes = this.nodeForm.controls.nodes.value;
    }
    else {
      this.nodeForm.addControl('nodes', new UntypedFormArray([]));
    }
    this.nodeForm.updateValueAndValidity();

  }


  /**
   * Add Node Function will save data to database
   */

  editNode() {
    if (this.request == 'selectTc') {
      this.nodeForm.removeControl('_id');
      this.nodeForm.patchValue({
        //_id : editSelectedTb._id,
        testBedName: this.selectedTestbed.testBedName + '_reused',
        testBedProfileId: this.selectedTestbed.testBedProfileId
      });
      this.dataService.loading.next(true);
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      for (let index = 0; index < nodeControls.length; index++) {
        const xxx = nodeControls.at(index) as UntypedFormGroup;
        xxx.removeControl('profileName');
        xxx.removeControl('nodeName');
        xxx.removeControl('avaiDeviceArray');
      }
      this.nodeForm.updateValueAndValidity();
      let testBedProfile = this.allProfiles.filter(element => element._id == this.nodeForm.value.testBedProfileId);
      this.nodeForm.value["mappedTestSets"] = testBedProfile.length && testBedProfile[0].mappedTestSets ? testBedProfile[0].mappedTestSets : [];
      this.sub2 = this.testBedService
        .addTestBed(this.nodeForm.value)
        .subscribe((result) => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getTestBedData().next(result);
            this.snackBar.open('Testbed Edit Successfully', 'OK', {
              duration: 5000,
            });
            
            if (!this.nodeForm.value.dynamic) {
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
            
            this.dialogRef.close({ event: 'clone' });
            //this.dialogRef.close();
            //this.router.navigate(['../'], { relativeTo: this.r });
          }
        },
          (error) => {
            this.dataService.loading.next(false);
            this.snackBar.open('Error in Clone Testbed Element', 'Try Again', {
              duration: 5000,
            });
          })
    } else {
      const originalNodes = _.cloneDeep(this.nodeForm.get('nodes').value);
      this.dataService.loading.next(true);
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      for (let index = 0; index < nodeControls.length; index++) {
        const xxx = nodeControls.at(index) as UntypedFormGroup;
        xxx.removeControl('profileName');
        xxx.removeControl('nodeName');
        xxx.removeControl('avaiDeviceArray');
      }
      this.nodeForm.updateValueAndValidity();

      // let obj = this.nodeForm.value
      let obj = _.cloneDeep(this.nodeForm.value);
      if(this.selectedTestbed.labIndex && this.selectedTestbed.labIndex !== '') {
        obj['labIndex'] = this.selectedTestbed.labIndex;
        obj['columnName'] = this.selectedTestbed.columnName;
        obj['rackId'] = this.selectedTestbed.rackId;
        obj['selfName'] = this.selectedTestbed.selfName;
      }
      this.nodeForm.value.nodes.forEach((res) => {

        if (res.dut == true) {
          obj.dutId = res.deviceId
          this.modelDevice.forEach((model) => {
            if (res.deviceId == model._id) {
              obj.modelName = model.model
            }
          })
        }
        if (res.tfw == true) {
          obj.tfwId = res.deviceId
        }
  
        // if (res.tfw == true) {
        //   obj.tfwId = res.deviceId
        //   this.modelDevice.forEach((model) => {
        //     if (res.deviceId == model._id) {
        //       obj.tfwModelName = model.model
        //     }
        //   })
        // }
      })

      // Clean node fields based on dynamic toggle
      if (!this.dynamicEnabled) {
        obj.nodes = obj.nodes.map(node => {
          const { dyn, pool, ...rest } = node;
          return rest;
        });
      }

      this.validateDut()
      this.validateTfw()
      if (this.dutButton == false) {
        for (let index = 0; index < originalNodes.length; index++) {
          const nodeControl = nodeControls.at(index) as UntypedFormGroup;
          nodeControl.addControl('nodeName', new UntypedFormControl(originalNodes[index].nodeName));
          nodeControl.addControl('profileName', new UntypedFormControl(originalNodes[index].profileName));
          nodeControl.addControl('avaiDeviceArray', new UntypedFormArray([]));
          const avaiDeviceArrayControl = nodeControl.get('avaiDeviceArray') as UntypedFormArray;
          originalNodes[index].avaiDeviceArray.forEach((device) => {
            avaiDeviceArrayControl.push(this.fb.group(device));
          });
        }
        this.nodeForm.updateValueAndValidity();
        this.dataService.loading.next(false);
      }
      else {
        let testBedProfile = this.allProfiles.filter(element => element._id == obj.testBedProfileId);
        obj["mappedTestSets"] = testBedProfile.length && testBedProfile[0].mappedTestSets ? testBedProfile[0].mappedTestSets : [];
        //   console.log("true")
        this.sub2 = this.testBedService
          .updateTestbedSettings(obj)
          .subscribe(
            (result) => {
              this.dataService.loading.next(false);
              this.dutButton = true
              if (result) {
                this.dataService.getTestBedData().next(result);
                this.snackBar.open('Testbed Edit Successfully', 'OK', {
                  duration: 5000,
                });
                
                // Only show reminder when status changes from inactive to active
                const statusChangedToActive = this.oldStatus === 'inactive' && obj.status === 'active';
                
                if (statusChangedToActive) {
                  setTimeout(() => {
                    this.dialog.open(ConfirmationDiaogComponent, {
                      width: '450px',
                      data: {
                        name: 'Reminder',
                        text: 'Testbed is marked as active. Kindly map the testbed in the designated lab partition.',
                        action: 'OK',
                        showSingleButton: true
                      },
                      panelClass: 'app-full-bleed-dialog'
                    });
                  }, 500);
                }
                
                this.dialogRef.close({ event: 'submit' });
              }
            },
            (error) => {
              this.dataService.loading.next(false);
              this.snackBar.open('Error Edit Testbed Element', 'Try Again', {
                duration: 5000,
              });
              this.dialogRef.close({ event: 'error' });
            }
          );
      }

    }

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
      const existingNode = this.oldNodes.filter(ele => {
        return ele.profileId === element['profileId'] && ele.nodeId === element['nodeId'];
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
          deviceId: existingNode.length > 0 ? new UntypedFormControl(existingNode[0].deviceId, Validators.required) :
            new UntypedFormControl(null, Validators.required),
          avaiDeviceArray: avilableControl,
          dut: existingNode.length > 0 ? existingNode[0].dut : false,
          tfw: existingNode.length > 0 ? existingNode[0].tfw : false,
          dyn: existingNode.length > 0 ? (existingNode[0].dyn || false) : false,
          pool: existingNode.length > 0 ? (existingNode[0].pool || false) : false,
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

  private _filter(value: string): any {
    const filterValue = value.toLowerCase();
    return this.allProfiles.filter(option => option.testBedProfileName.toLowerCase().includes(filterValue));
  }

  openedChange(e): void {
    // Set search textbox value as empty while opening selectbox
    this.searchTextboxControl.patchValue('');

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
    if (this.deviceSubscription) {
      this.deviceSubscription.unsubscribe();
    }
  }
  validateDut() {
    this.dutButton = false
    this.nodeForm.value.nodes.forEach((res) => {
      if (res.dut == true) {
        this.dutButton = true
      }
    })
    if (this.dynamicEnabled) {
      this.dutButton = true;
    }
  }
  validateTfw(): void {
    this.tfwButton = false;
    this.nodeForm.value.nodes.forEach((res, index) => {
      if (res.tfw === true) {
        this.tfwButton = true;
      } else {
        const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
        nodeControls.at(index).get('tfw')?.setValue(false);
      }
    });

    this.nodeForm.updateValueAndValidity();
  }

  onChangeTfw(i) {
    setTimeout(() => {
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      const newVal = !this.nodeForm.value.nodes[i].tfw;
      nodeControls.at(i).get('tfw').setValue(newVal);
      if (newVal) {
        nodeControls.at(i).get('dut').setValue(false);
        nodeControls.at(i).get('dyn').setValue(false);
        nodeControls.at(i).get('pool').setValue(false);
      }
      this.nodeForm.updateValueAndValidity();
      this.validateTfw();
      this.validateDut();
    }, 10)
  }

  onRadioChange(i) {
    setTimeout(() => {
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      const newVal = !this.nodeForm.value.nodes[i].dut;
      for (let j = 0; j < this.nodeForm.value.nodes.length; j++) {
        nodeControls.at(j).get('dut').setValue(false);
      }
      nodeControls.at(i).get('dut').setValue(newVal);
      if (newVal) {
        nodeControls.at(i).get('tfw').setValue(false);
        nodeControls.at(i).get('dyn').setValue(false);
        nodeControls.at(i).get('pool').setValue(false);
      }
      this.nodeForm.updateValueAndValidity();
      this.validateDut();
      this.validateTfw();
    }, 10)
  }
  // filtertestBedProfileName(event): void {
  //   const name = event.target.value.toLowerCase();
  //   if (name) {
  //     this.allProfiles = this.allProfiles.filter((el) => (el.testBedProfileName.toLowerCase()).includes(name));
  //   } else {
  //     this.allProfiles = this.allProfiles;
  //   }
  // }
  handleInput(event: KeyboardEvent): void {
    event.stopPropagation();

  }

  onDynamicChange() {
    this.dynamicEnabled = this.nodeForm.get('dynamic').value;
    const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
    for (let i = 0; i < nodeControls.length; i++) {
      const node = nodeControls.at(i) as UntypedFormGroup;
      if (this.dynamicEnabled) {
        node.get('dut').setValue(false);
        node.get('tfw').setValue(false);
      } else {
        node.get('dyn').setValue(false);
        node.get('pool').setValue(false);
        node.get('deviceId').setValidators(Validators.required);
        node.get('deviceId').updateValueAndValidity();
      }
    }
    // When dynamic is disabled, check if any DUT is enabled
    this.dutButton = this.nodeForm.value.nodes.some((n) => n.dut === true);
    this.tfwButton = false;
    this.nodeForm.updateValueAndValidity();
  }

  onChangeDyn(i) {
    setTimeout(() => {
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      const newVal = !this.nodeForm.value.nodes[i].dyn;
      if (newVal) {
        // Only one DYN allowed — turn off DYN on all other nodes
        for (let j = 0; j < nodeControls.length; j++) {
          if (j !== i && nodeControls.at(j).get('dyn').value) {
            nodeControls.at(j).get('dyn').setValue(false);
            nodeControls.at(j).get('deviceId').setValidators(Validators.required);
            nodeControls.at(j).get('deviceId').updateValueAndValidity();
          }
        }
      }
      nodeControls.at(i).get('dyn').setValue(newVal);
      if (newVal) {
        nodeControls.at(i).get('tfw').setValue(false);
        nodeControls.at(i).get('dut').setValue(false);
        nodeControls.at(i).get('pool').setValue(false);
        nodeControls.at(i).get('deviceId').setValue('');
        nodeControls.at(i).get('deviceId').clearValidators();
      } else if (!nodeControls.at(i).get('pool').value) {
        nodeControls.at(i).get('deviceId').setValidators(Validators.required);
      }
      nodeControls.at(i).get('deviceId').updateValueAndValidity();
      this.nodeForm.updateValueAndValidity();
    }, 10)
  }

  onChangePool(i) {
    setTimeout(() => {
      const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
      const newVal = !this.nodeForm.value.nodes[i].pool;
      if (newVal) {
        // Only one POOL allowed — turn off POOL on all other nodes
        for (let j = 0; j < nodeControls.length; j++) {
          if (j !== i && nodeControls.at(j).get('pool').value) {
            nodeControls.at(j).get('pool').setValue(false);
            nodeControls.at(j).get('deviceId').setValidators(Validators.required);
            nodeControls.at(j).get('deviceId').updateValueAndValidity();
          }
        }
      }
      nodeControls.at(i).get('pool').setValue(newVal);
      if (newVal) {
        nodeControls.at(i).get('tfw').setValue(false);
        nodeControls.at(i).get('dut').setValue(false);
        nodeControls.at(i).get('dyn').setValue(false);
        nodeControls.at(i).get('deviceId').setValue('');
        nodeControls.at(i).get('deviceId').clearValidators();
      } else if (!nodeControls.at(i).get('dyn').value) {
        nodeControls.at(i).get('deviceId').setValidators(Validators.required);
      }
      nodeControls.at(i).get('deviceId').updateValueAndValidity();
      this.nodeForm.updateValueAndValidity();
    }, 10)
  }

}
