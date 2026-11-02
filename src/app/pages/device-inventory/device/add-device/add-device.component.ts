import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ApiService } from '../../../../@core/services/api.service';
import { UserService } from 'src/app/@core/services/user.service';
import { LabSetUpConfigComponent } from 'src/app/pages/settings/system-configuration/lab-set-up-config/lab-set-up-config.component';
@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss'],
})
export class AddDeviceComponent implements OnInit, OnDestroy {
  public allModels = [];
  public allVendors = [];
  public allProfiles = [];
  public allDevices = [];
  public allDeviceNames = [];
  private vendorSubscription;
  private teamSubscription;
  private deviceSubscription;
  private modelSubscription;
  public profileSubscription;
  formSubscription;
  selectedTeam = null;
  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  sub7;
  allAPI;
  allAPIData;
  deviceData;
  private allProfileNames = [];
  public deviceForm: UntypedFormGroup;
  public selectedProfile;
  public selectedModel;
  public modelProfiles: any[] = [];
  public filteredModelProfiles: any[] = [];
  public allVariableGroup: any[] = [];
  public requiredVariables: any[] = [];
  public requiredFormGroup: UntypedFormGroup;
  public selectedProfiles: any[] = [];
  public allSelectedLabels: any[] = [];
  duplicateAPIs;
  requiredAPIs = [];
  lbSetUp: any = [];
  shelfArray: any = [];
  columnArray: any = [];
  macArray =[];
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard',
    },
    {
      link: '#/pages/device-inventory/',
      label: 'DeviceInventory',
    },
    {
      link: '#/pages/device-inventory/device',
      label: 'Device',
    },
    {
      link: '#/pages/device-inventory/device/add',
      label: 'Add Device',
    },
  ];
  sub8;
  allAPIGroup: any = [];
  constructor(
    private dataService: DataService,
    private dInventoryService: DeviceInventoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private apiService: ApiService,
    private userServices: UserService
  ) {
    this.teamSubscription = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.loadVendor();
      }
    });
    this.sub6 = this.apiService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getAPIData().next(data);
        }
      });
    this.sub5 = this.dataService.getAllAPI().subscribe((apiData) => {
      if (apiData) {
        this.allAPI = apiData;
        this.duplicateAPIs = _.clone(this.allAPI);
        this.loadAPI();
      }
    });
    this.sub8 = this.dataService.getAllAPIGroup().subscribe(apiData => {
        if (apiData) {
          this.allAPIGroup = apiData;
        }
        this.dataService.getAllDevices().subscribe(device=>{
          if(device){
            this.macArray =[]
          device.forEach((res)=>{
           this.macArray.push(res.deviceMac)
    
         } ) 
          }
        })
     
    });

    this.dataService.getDeviceVariableGroup().subscribe(data => {
      if (data) {
        this.allVariableGroup = data;
      }
    });
  }
  /**
   * Used to load all API lists.
   */
  loadAPI() {
    this.requiredAPIs = [];
    for (var i = 0; i < this.duplicateAPIs.length; i++) {
      if (this.duplicateAPIs[i]['Type'] == 'Reserve') {
        this.requiredAPIs.push(this.duplicateAPIs[i]);
      }
    }
  }
  /**
   * loads all suppliers available to the team
   */
  loadVendor() {
    this.vendorSubscription = this.dataService
      .getAllVendors()
      .subscribe((vendors) => {
        if (vendors) {
           this.allVendors = _.sortBy([...vendors]);
          //this.allVendors.push('vAUTO');
          this.loadDevices();
        } else {
          this.sub2 = this.dInventoryService
            .getAllData()
            .subscribe((data) => {
              if (data) {
                this.dataService.getDeviceInventoryData().next(data);
              }
            });
        }
      });
  }

  /**
   * Loads all available devices based on vendor.
   * After the loadProfile function is called
   */

  loadDevices() {
    this.deviceSubscription = this.dataService
      .getAllDevices()
      .subscribe((devices) => {
        if (devices) {
          this.allDevices = devices;
          this.allDevices.forEach((device) => {
            this.allDeviceNames.push(device.deviceName);
          });
          this.loadProfile();
        }
      });
  }

  /**
   * Loads all available profiles
   * After the loadModels
   */

  loadProfile() {
    this.profileSubscription = this.dataService
      .getAllProfiles()
      .subscribe((profiles) => {
        if (profiles) {
          this.allProfiles = profiles;
          this.allProfileNames = [];
          this.allProfiles.forEach((profile) => {
            this.allProfileNames.push(profile.profileName);
          });
          this.loadModels();
        }
      });
  }

  /**
   * Calls to get all models
   */

  loadModels() {
    this.modelSubscription = this.dataService
      .getAllModels()
      .subscribe((models) => {
        if (models) {
          this.allModels = models;
        }
      });
  }

  ngOnInit() {
    this.deviceForm = new UntypedFormGroup({
      deviceName: new UntypedFormControl(null, [Validators.required, Validators.pattern('^[^_]*$')]),
      deviceMac: new UntypedFormControl(null, Validators.required),
      deviceIp: new UntypedFormControl(null, Validators.required),
      deviceFWVersion: new UntypedFormControl('NA', Validators.required),
      vendor: new UntypedFormControl(null, Validators.required),
      model: new UntypedFormControl(null, Validators.required),
      profileName: new UntypedFormControl('', Validators.required),
      profileId: new UntypedFormControl([], Validators.required),
      available: new UntypedFormControl(true),
      reservedBy: new UntypedFormControl(null),
      reservedTill: new UntypedFormControl(null),
      reservedAt: new UntypedFormControl(null),
      reservedFor: new UntypedFormArray([]),
      rackName:new UntypedFormControl(null),
      labModelName: new UntypedFormControl(null),
      apiName: new UntypedFormControl(null),
      rebootApiName: new UntypedFormControl(null),
      selfName : new UntypedFormControl(null),
      columnName : new UntypedFormControl(null),
      updateDevApiName: new UntypedFormControl(null)
    });
    this.deviceForm.addControl(
      'reservedAPI',
      new UntypedFormControl([], Validators.required)
    );
    
     
      this.lbSetUp = this.dataService.getLabSetUp();
  }

  /**
   * Called to initialize the add device form with all available validations
   */

  loadForm() {
    this.selectedProfile = null;
    this.selectedProfiles = [];
    this.modelProfiles = [];
    this.filteredModelProfiles = [];
    this.requiredVariables = [];
    this.requiredFormGroup = null;
    this.allSelectedLabels = [];
    const deviceName = this.deviceForm.get('deviceName').value;
    const deviceMac = this.deviceForm.get('deviceMac').value;
    const deviceIp = this.deviceForm.get('deviceIp').value;
    const deviceFWVersion = this.deviceForm.get('deviceFWVersion').value;
    const vendor = this.deviceForm.get('vendor').value;
    const model = this.deviceForm.get('model').value;
    this.deviceForm = new UntypedFormGroup({
      deviceName: new UntypedFormControl(deviceName, [Validators.required, Validators.pattern('^[^_]*$')]),
      deviceMac: new UntypedFormControl(deviceMac, [Validators.required, Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$')]),
      deviceIp: new UntypedFormControl(deviceIp, [Validators.required, Validators.pattern('^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$')]),
      deviceFWVersion: new UntypedFormControl(deviceFWVersion, Validators.required),
      vendor: new UntypedFormControl(vendor, Validators.required),
      model: new UntypedFormControl(model, Validators.required),
      profileName: new UntypedFormControl('', Validators.required),
      profileId: new UntypedFormControl([], Validators.required),
      available: new UntypedFormControl(true),
      reservedBy: new UntypedFormControl(null),
      reservedTill: new UntypedFormControl(null),
      reservedAt: new UntypedFormControl(null),
      rackName:new UntypedFormControl(null),
      labModelName: new UntypedFormControl(null),
      apiName: new UntypedFormControl(null),
      rebootApiName: new UntypedFormControl(null),
      selfName : new UntypedFormControl(null),
      columnName : new UntypedFormControl(null),
      labIndex: new UntypedFormControl(null),
      updateDevApiName: new UntypedFormControl(null)
    });
    this.deviceForm.addControl('reservedAPI', new UntypedFormControl([]));
    this.selectedModel = _.filter(this.allModels, (model) => {
      return model.modelName === this.deviceForm.get('model').value;
    })[0];

    // Get profiles associated with the selected model
    const modelProfileNames = Array.isArray(this.selectedModel.profileName)
      ? this.selectedModel.profileName
      : (this.selectedModel.profileName ? [this.selectedModel.profileName] : []);
    this.modelProfiles = this.allProfiles.filter(p => modelProfileNames.includes(p.profileName));
    this.filteredModelProfiles = [...this.modelProfiles];

    // If only one profile, auto-select it
    if (this.modelProfiles.length === 1) {
      this.selectedProfile = this.modelProfiles[0];
      this.selectedProfiles = [this.modelProfiles[0]];
      this.deviceForm.get('profileName').setValue(this.modelProfiles[0].profileName);
      this.deviceForm.get('profileId').setValue([this.modelProfiles[0]._id]);
      this.loadProfileLabels();
    } else {
      this.selectedProfile = null;
      this.selectedProfiles = [];
    }

    this.formSubscription = this.deviceForm
      .get('deviceName')
      .valueChanges.subscribe((value) => {
        console.log("changes",value)
        const hasUnderscore = value && value.includes('_');
        if (this.allDeviceNames.indexOf(value) !== -1) {
          const errors: any = { duplicate: true };
          if (hasUnderscore) errors.pattern = true;
          this.deviceForm.get('deviceName').setErrors(errors);
        } else if (hasUnderscore) {
          this.deviceForm.get('deviceName').setErrors({ pattern: true });
        } else if (this.deviceForm.get('deviceName').hasError('required')) {
          this.deviceForm.get('deviceName').setErrors(null);
          this.deviceForm.get('deviceName').setErrors({ required: true });
        } else {
          this.deviceForm.get('deviceName').setErrors(null);
        }
      });
      this.deviceForm.get('deviceMac').valueChanges.subscribe((val)=>{
   
        if(this.macArray.indexOf(val) !==-1){
          this.deviceForm.get('deviceMac').setErrors({ duplicate: true });
        }
      })
  }

  /**
   * After clicking the Add device button, all data will be sent to the backend.
   * success and failed response called based on api response.
   */

  /**
   * Called when user selects a profile from the Device Profile dropdown
   */
  onProfileSelection(selectedProfileName: string) {
    if (selectedProfileName) {
      const selectedProfileObj = this.allProfiles.find(p => p.profileName === selectedProfileName);
      if (selectedProfileObj) {
        this.selectedProfile = selectedProfileObj;
        this.selectedProfiles = [selectedProfileObj];
        this.deviceForm.get('profileId').setValue([selectedProfileObj._id]);
        this.loadProfileLabels();
        this.loadVariablesForProfiles();
      }
    } else {
      this.selectedProfile = null;
      this.selectedProfiles = [];
      this.deviceForm.get('profileName').setValue('');
      this.deviceForm.get('profileId').setValue([]);
      this.requiredFormGroup = null;
      this.requiredVariables = [];
      // Remove old label controls
      this.allSelectedLabels.forEach(label => {
        if (this.deviceForm.contains(label.name)) {
          this.deviceForm.removeControl(label.name);
        }
      });
      this.allSelectedLabels = [];
    }
  }

  /**
   * Load profile labels into the form for all selected profiles
   */
  loadProfileLabels() {
    // Remove old label controls
    this.allSelectedLabels.forEach(label => {
      if (this.deviceForm.contains(label.name)) {
        this.deviceForm.removeControl(label.name);
      }
    });
    this.allSelectedLabels = [];

    if (!this.selectedProfiles || this.selectedProfiles.length === 0) return;

    this.selectedProfiles.forEach(profile => {
      if (!profile.labels) return;
      profile.labels.forEach((element) => {
        // Skip if a control with this name already exists (duplicate across profiles)
        if (this.deviceForm.contains(element.name)) return;
        this.allSelectedLabels.push(element);
        if (element.type === 'text') {
          if (element.textType === 'ip') {
            this.deviceForm.addControl(
              element.name,
              new UntypedFormControl(element.value, [
                Validators.required,
                Validators.pattern(
                  '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
                ),
              ])
            );
          } else if (element.textType === 'mac') {
            this.deviceForm.addControl(
              element.name,
              new UntypedFormControl(element.value, [
                Validators.required,
                Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$'),
              ])
            );
          } else {
            this.deviceForm.addControl(element.name, new UntypedFormControl(element.value));
          }
        } else {
          this.deviceForm.addControl(element.name, new UntypedFormControl(element.value));
        }
      });
    });
  }

  /**
   * Filter model profiles in the dropdown search
   */
  filterModelProfiles(searchText: string) {
    if (!searchText) {
      this.filteredModelProfiles = [...this.modelProfiles];
    } else {
      const lower = searchText.toLowerCase();
      this.filteredModelProfiles = this.modelProfiles.filter(p => p.profileName.toLowerCase().includes(lower));
    }
  }

  loadVariablesForProfiles() {
    const variableValueArray = new UntypedFormArray([]);
    let allVariables = [];
    for (const profile of this.selectedProfiles) {
      if (profile.variableGroups && profile.variableGroups.length > 0) {
        const profileVars = this.allVariableGroup.filter(a => {
          return profile.variableGroups.indexOf(a._id) > -1;
        }).map(v => ({ ...v, profileId: profile._id, profileName: profile.profileName, collapsed: true }));
        allVariables = allVariables.concat(profileVars);
      }
    }
    for (let index = 0; index < allVariables.length; index++) {
      const element = allVariables[index];
      const varFormArray = new UntypedFormArray([]);
      const varArray = element['variables'];
      for (let j = 0; j < varArray.length; j++) {
        const variable = varArray[j];
        const tempGrp = new UntypedFormGroup({
          variableId: new UntypedFormControl(variable._id),
          variableValue: new UntypedFormControl(null)
        });
        varFormArray.push(tempGrp);
      }
      const vrGroup = new UntypedFormGroup({
        profileId: new UntypedFormControl(element['profileId']),
        groupId: new UntypedFormControl(element['_id']),
        variables: varFormArray
      });
      variableValueArray.push(vrGroup);
    }
    this.requiredFormGroup = new UntypedFormGroup({ variableGroups: variableValueArray });
    this.requiredVariables = allVariables;
  }

    addDevice() {
        if(this.deviceForm.value.rackName && this.deviceForm.value.selfName && this.deviceForm.value.columnName && this.deviceForm.value.apiName && this.deviceForm.value.rebootApiName) {
            let lb = this.deviceForm.value.rackName.toUpperCase().replace(" ", "") + '_' + this.deviceForm.value.selfName + '_' + this.deviceForm.value.columnName
            let md = this.deviceForm.value.model;
            this.deviceForm.patchValue({
                labModelName: md,
                labIndex: lb
            })
        } else {
            this.deviceForm.patchValue({
                rackName: '',
                selfName:'',
                columnName:'',
                apiName:'',
                rebootApiName:'',
                labIndex:'',
                labModelName:'',
                updateDevApiName:''
            })
        }
        setTimeout(() => {
            this.dataService.loading.next(true);
            // Wrap profileName as array for backend consistency
            const deviceData = { ...this.deviceForm.value };
            if (deviceData.profileName && !Array.isArray(deviceData.profileName)) {
                deviceData.profileName = [deviceData.profileName];
            }
            this.sub1 = this.dInventoryService.addDevice( deviceData).subscribe(
                data => {
                    
                    if(this.deviceForm.value.rackName && this.deviceForm.value.selfName && this.deviceForm.value.columnName) {
                        for (let j = 0; j < this.labSetUpSelect.design.length; j++) {
                            for(let k = 0; k < this.labSetUpSelect.design[j].length; k++){
                                if(this.labSetUpSelect.design[j][k].shelf == this.deviceForm.value.selfName ){
                                    if(this.deviceForm.value.columnName == this.labSetUpSelect.design[j][k].coloum){
                                        this.labSetUpSelect.design[j][k].available = false;
                                        this.labSetUpSelect.design[j][k].deviceId = data[0]._id;
                                        this.labSetUpSelect.design[j][k].teamName = this.selectedTeam;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    this.dataService.loading.next(false);
                    if (data) {
                        // this.userServices.updateLabSetConf(this.labSetUpSelect).subscribe((data: any)=>{
                        //    console.log('Lab Set Up Updated', data);
                        //     this.dataService.getSettingsData().next(data[0]);
                        // }, err=>{
                        //     console.log(err)
                        // })
                        this.dataService.getDeviceInventoryData().next(data);
                       // console.log('Device Inventory Data Updated', data);
                        this.snackBar.open('Device Added Succesfully.', 'Ok', {
                            duration: 5000
                        });
                        this.router.navigateByUrl('pages/device-inventory/device');

                    } else {
                        this.snackBar.open('Error Adding Device.', 'Try Again', {
                            duration: 5000
                        });
                    }
                },
                error => {
                    //console.log(error);
                    this.dataService.loading.next(false);
                    this.snackBar.open('Error Adding Device.', 'Try Again', {
                        duration: 5000
                    });
                }
            );
        }, 1);
        
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
    if (this.vendorSubscription) {
      this.vendorSubscription.unsubscribe();
    }
    if (this.teamSubscription) {
      this.teamSubscription.unsubscribe();
    }
    if (this.deviceSubscription) {
      this.deviceSubscription.unsubscribe();
    }
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
        if(this.sub8){
            this.sub8.unsubscribe();
        }
    }

    labSetUpSelect: any;
    rackSelected(event){
        for (let i = 0; i < this.lbSetUp.length; i++) {
            if(this.lbSetUp[i].rackName == event.value){
                this.labSetUpSelect = this.lbSetUp[i]
                this.columnArray = [];
                this.shelfArray = [];
                this.deviceForm.patchValue({
                    selfName:'',
                    columnName:''
                })
                if(this.lbSetUp[i].rackFor == 'Data'){
                    for (let k = 1; k <= parseInt(this.lbSetUp[i].Column); k++) {
                      this.columnArray.push({name:'C'+ k, available:false});
                    }
                    for (let j = 1; j <= parseInt(this.lbSetUp[i].Shelf); j++) {
                      this.shelfArray.push('S'+ j); 
                    }
          
                } else if(this.lbSetUp[i].rackFor == "Chamber"){
                    for (let j = 1; j <= parseInt(this.lbSetUp[i].NoChamber); j++) {
                      this.shelfArray.push('CH'+ j); 
                    }
                    for (let l = 1; l <= parseInt(this.lbSetUp[i].DUT); l++) {
                      this.columnArray.push({name:'DUT'+ l, available:false});
                      
                    }
                    for (let k = 1; k <= parseInt(this.lbSetUp[i].Client); k++) {
                      this.columnArray.push({name:'Client'+ k, available:false});
                    }
                }
                break;
            }
        }
    }

    ShelfSelection(event) {
        this.deviceForm.patchValue({
            columnName:''
        })
        for (let j = 0; j < this.labSetUpSelect.design.length; j++) {
            for(let k = 0; k < this.labSetUpSelect.design[j].length; k++){
                if(this.labSetUpSelect.design[j][k].shelf == this.deviceForm.value.selfName){
                    for (let i = 0; i < this.columnArray.length; i++) {
                        if(this.columnArray[i].name == this.labSetUpSelect.design[j][k].coloum){
                            if(this.labSetUpSelect.design[j][k].available == false && this.labSetUpSelect.design[j][k].deviceId){
                                this.columnArray[i].available = this.labSetUpSelect.design[j][k].available;
                                break;
                            } else {
                                this.columnArray[i].available = true;
                                break;
                            }
                            
                        }
                    }
                }
            }
        }
    }

}
