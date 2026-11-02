import { Component, OnInit, Inject, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormArray,
  UntypedFormBuilder,
  FormGroupName,
  FormControlName,
} from '@angular/forms';
import * as _ from 'lodash';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { UserService } from '../../../../@core/services/user.service';
import { NameFromIdPipe } from 'src/app/@shared/pipes/name-from-id.pipe';
import { CM_PROFILE } from 'src/app/models/config';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-add-testbed-config',
  templateUrl: './add-testbed-config.component.html',
  styleUrls: ['./add-testbed-config.component.scss'],
  providers: [NameFromIdPipe],
})


export class AddTestbedConfigComponent implements OnInit, OnDestroy {
  public nodeForm: UntypedFormGroup;
  public allProfiles;
  public deviceProfiles;
  public availableDevice;
  // subscriptions
  dInventoryServiceSubscription;
  dataSubscription;
  dataSubscription1;
  testbedSubscription;
  deviceSubscription;
  allTestBedNames = [];

  public allNode = [];
  sub1;
  sub2;
  modelDevice;
  dutButton = true
  tfwButton = false
  dynamicEnabled = false
  showDynamicToggle = false;
  // "Restrict Test Bed to User" config for this team — controls Restrict toggle visibility + seeding.
  restrictTestbedToUser = false;
  // Restrict toggle value chosen at Add time (UI-only, not stored on the testbed doc).
  restrictTestbed = false;
  // tslint:disable-next-line:typedef
  getFormValid() {
    this.nodeForm.updateValueAndValidity();
    return this.nodeForm.invalid;
  }
  constructor(
    public dInventoryService: DeviceInventoryService,
    public dialogRef: MatDialogRef<AddTestbedConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
    public dataService: DataService,
    public testBedService: TestBedService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private nameFromId: NameFromIdPipe,
    private dialog: MatDialog
  ) {
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
          this.allProfiles = profiles
        }
      });
    this.dataService
      .getTestBed()
      .subscribe((testbedData) => {
        if (testbedData) {
          testbedData.forEach(testbed => {
            this.allTestBedNames.push(testbed.testBedName);
          });
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
          this.modelDevice = data;
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
    const mappingDevice = nodeArrayForm.at(i).get('avaiDeviceArray') as UntypedFormArray;
    if (!mappingDevice) {
      return [];
    }
    return mappingDevice.value;
  }

  ngOnInit() {
    this.nodeForm = new UntypedFormGroup({
      testBedName: new UntypedFormControl(null, Validators.required),
      testBedProfileId: new UntypedFormControl(null, Validators.required),
      nodes: new UntypedFormArray([]),
      variables: new UntypedFormArray([]),
      status: new UntypedFormControl('active', Validators.required),
      dynamic: new UntypedFormControl(false)
    });

    // Check if Dynamic Scheduler is enabled for this team
    const teamRegConfig = this.dataService.getMultiDeleteRegData(this.selectedTeam);
    this.showDynamicToggle = teamRegConfig && teamRegConfig.show_dynamic_scheduler ? true : false;
    this.restrictTestbedToUser = !!(teamRegConfig && teamRegConfig.restrict_testbed_to_user);

    this.sub1 = this.nodeForm
      .get('testBedName')
      .valueChanges.subscribe((value) => {
        if (this.allTestBedNames.indexOf(value) !== -1) {
          this.nodeForm.get('testBedName').setErrors({ duplicate: true });
        } else if (this.nodeForm.get('testBedName').hasError('required')) {
          this.nodeForm.get('testBedName').setErrors(null);
          this.nodeForm.get('testBedName').setErrors({ required: true });
        } else {
          this.nodeForm.get('testBedName').setErrors(null);
        }
      });

  }
  onRestrictChange(event) {
    this.restrictTestbed = !!(event && event.target && event.target.checked);
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
    this.dutButton = true;
    this.tfwButton = false;
    this.nodeForm.updateValueAndValidity();
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
  /**
   * Add Node Function will save data to database
   */

  addNode() {
    const originalNodes = _.cloneDeep(this.nodeForm.get('nodes').value);
    this.dataService.loading.next(true);
    const nodeControls = this.nodeForm.get('nodes') as UntypedFormArray;
    for (let index = 0; index < nodeControls.length; index++) {
      const xxx = nodeControls.at(index) as UntypedFormGroup;
      xxx.removeControl('profileName');
      xxx.removeControl('nodeName');
      xxx.removeControl('avaiDeviceArray');
    }
    let obj = _.cloneDeep(this.nodeForm.value)
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

    })
    obj.status = this.nodeForm.get('status').value;

    obj.nodes = nodeControls.value
    // Clean node fields based on dynamic toggle
    if (!this.dynamicEnabled) {
      obj.nodes = obj.nodes.map(node => {
        const { dyn, pool, ...rest } = node;
        return rest;
      });
    }
    this.validateDut()
    this.validateTfw()
    this.nodeForm.updateValueAndValidity();
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
    } else {
      this.dataService.loading.next(false);
      let testBedProfile = this.allProfiles.filter(element => element._id == obj.testBedProfileId);
      obj["mappedTestSets"] = testBedProfile.length && testBedProfile[0].mappedTestSets ? testBedProfile[0].mappedTestSets : [];
      this.sub2 = this.testBedService
        .addTestBed(obj)
        .subscribe(
          (result) => {
            this.dataService.loading.next(false);
            if (result) {
              this.dataService.getTestBedData().next(result);
              this.snackBar.open('Testbed Added Successfully', 'OK', {
                duration: 5000,
              });

              // Seed the User-TestBed Access Matrix for the newly created testbed
              // (only relevant when "Restrict Test Bed to User" is enabled for the team).
              this.seedAccessForNewTestbed(result, obj);

              if (!obj.dynamic) {
                let reminderText = 'Testbed is added successfully. Kindly map the testbed in the designated lab partition.';
                if (this.restrictTestbedToUser) {
                  reminderText += ' Since testbed to user restriction config is enabled, ensure that mapping is proper.';
                }
                setTimeout(() => {
                  this.dialog.open(ConfirmationDiaogComponent, {
                    width: '450px',
                    data: {
                      name: 'Reminder',
                      text: reminderText,
                      action: 'OK',
                      showSingleButton: true
                    },
                    panelClass: 'app-full-bleed-dialog'
                  });
                }, 500);
              }
              
              this.dialogRef.close();
            }
          },
          (error) => {
            this.dataService.loading.next(false);
            this.snackBar.open('Error Adding Testbed Element', 'Try Again', {
              duration: 5000,
            });
            this.dialogRef.close();
          }
        );
    }



  }

  /**
   * Seed the User-TestBed Access Matrix for a testbed that was just created.
   * Front-end only: builds the updated matrix in the browser and persists it via
   * the existing updateUserTestbedAccessMatrix endpoint (no dedicated backend API).
   * Only runs when "Restrict Test Bed to User" is enabled for the team. Access is
   * granted per the Restrict flag:
   *   - Restrict OFF -> all active non-Guest users (snapshot at creation time)
   *   - Restrict ON  -> creator + SysAdmin(s) only
   */
  seedAccessForNewTestbed(testbedList, obj) {
    if (!this.restrictTestbedToUser) {
      return;
    }
    const list = Array.isArray(testbedList) ? testbedList : [];
    const created = list.find((t) => t && t.testBedName === obj.testBedName);
    if (!created || !created._id) {
      return;
    }
    const testbedId = String(created._id);
    const teamName = this.selectedTeam;
    const currentUser = this.dataService.getCurrentUser();
    const creator = currentUser && currentUser.username ? currentUser.username : '';

    // Fetch the settings blob (users + existing matrix) and rebuild it client-side.
    this.userService.getAllusers().subscribe(
      (data: any) => {
        const settings = Array.isArray(data) ? data[0] : data;
        const rawUsers = (settings && Array.isArray(settings.users)) ? settings.users : [];

        // Decide which usernames receive access to the new testbed.
        let targetUsernames = [];
        if (this.restrictTestbed) {
          const admins = rawUsers
            .filter((u) => u && u.role === 'admin')
            .map((u) => (u.username || u.userName || u.name) || '')
            .filter((n) => !!n);
          if (creator) { targetUsernames.push(creator); }
          admins.forEach((n) => targetUsernames.push(n));
        } else {
          targetUsernames = rawUsers
            .filter((u) => {
              const uname = (u && (u.username || u.userName || u.name)) || '';
              return u && u.status !== 'in-active' && uname.toLowerCase() !== 'guest';
            })
            .map((u) => (u.username || u.userName || u.name) || '')
            .filter((n) => !!n);
        }
        targetUsernames = Array.from(new Set(targetUsernames));

        // Normalise the existing matrix so nothing already saved is lost.
        const raw = (settings && settings.userTestbedAccessMatrix) ? settings.userTestbedAccessMatrix : {};
        const matrixMap: any = {};
        Object.keys(raw || {}).forEach((uname) => {
          const entry = raw[uname];
          if (!entry || typeof entry !== 'object') { return; }
          const teamsArr = [];
          if (Array.isArray(entry.teams)) {
            entry.teams.forEach((t) => {
              if (t && t.teamName) {
                teamsArr.push({ teamName: t.teamName, testbedIds: Array.isArray(t.testbedIds) ? [...t.testbedIds] : [] });
              }
            });
          } else if (entry.teams && typeof entry.teams === 'object') {
            Object.keys(entry.teams).forEach((tn) => {
              const t = entry.teams[tn];
              if (t && typeof t === 'object') {
                teamsArr.push({ teamName: t.teamName || tn, testbedIds: Array.isArray(t.testbedIds) ? [...t.testbedIds] : [] });
              }
            });
          } else if (Array.isArray(entry.testbedIds)) {
            teamsArr.push({ teamName, testbedIds: [...entry.testbedIds] });
          }
          matrixMap[uname] = { username: entry.username || uname, teams: teamsArr };
        });

        // Add the new testbed id to each target user's slice for this team.
        targetUsernames.forEach((uname) => {
          if (!uname) { return; }
          if (!matrixMap[uname]) { matrixMap[uname] = { username: uname, teams: [] }; }
          let slice = matrixMap[uname].teams.find((t) => t && t.teamName === teamName);
          if (!slice) {
            slice = { teamName, testbedIds: [] };
            matrixMap[uname].teams.push(slice);
          }
          if (slice.testbedIds.map((id) => String(id)).indexOf(testbedId) === -1) {
            slice.testbedIds.push(testbedId);
          }
        });

        this.userService.updateUserTestbedAccessMatrix(matrixMap).subscribe(
          () => {
            this.dataService.notifyUserTestbedAccessMatrixChanged(matrixMap);
          },
          () => { }
        );
      },
      () => { }
    );
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
      const ava = this.availableDevice.filter(device => {
        const ids = Array.isArray(device.profileId) ? device.profileId : [device.profileId];
        return ids.includes(element['profileId']);
      });
      const avilableControl = new UntypedFormArray([]);
      if (ava !== undefined) {
        ava.forEach((x) => {
          avilableControl.push(this.fb.group({
            _id: x._id,
            deviceName: x.deviceName,
          }));
        });
      }
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

          dut: this.nameFromId.transform(
            element['profileId'],
            this.deviceProfiles,
            '_id',
            'profileName'
          ) == CM_PROFILE ? true : false,
          tfw: false,
          dyn: false,
          pool: false,
          deviceId: new UntypedFormControl('', Validators.required),
          avaiDeviceArray: avilableControl
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
    this.dialogRef.close();
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
