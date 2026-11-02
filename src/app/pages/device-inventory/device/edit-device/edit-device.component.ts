import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { DataService } from '../../../../@core/services/data.service';
import { UntypedFormGroup, UntypedFormControl, Validators, FormArray } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';

import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../@core/services/api.service';
import { UserService } from 'src/app/@core/services/user.service';
import { Console } from 'console';
@Component({
    selector: 'app-edit-device',
    templateUrl: './edit-device.component.html',
    styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public selectedDevice;
    public allModels = [];
    public allVendors = [];
    public allProfiles = [];
    public allDevices = [];
    private vendorSubscription;
    private deviceSubscription;
    private modelSubscription;
    private allProfileNames = [];
    public deviceForm: UntypedFormGroup;
    public selectedProfile;
    public selectedProfiles: any[] = [];
    public modelProfiles: any[] = [];
    public filteredModelProfiles: any[] = [];
    public selectedModel;
    public allDeviceNames = [];
    actionType ="edit"
    requiredAPIs=[];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    macArray =[]
    sub7;
    sub8;
    allAPI;
    // duplicateClone :boolean = false;
    duplicateAPIs;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/device-inventory/',
            label: 'DeviceInventory'
        },
        {
            link: '#/pages/device-inventory/device',
            label: 'Device'
        },
        {
            link: '#/pages/device-inventory/device/edit',
            label: 'Edit Device'
        },
        
       
    ];
    lbSetUp: any = [];
    sub9;
    allAPIGroup: any = [];
    constructor(
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute,
        private apiService:ApiService,
        private userServices: UserService
    ) {
        this.sub4=this.dataService.selectedTeam.subscribe(team => {
            if(team){
                this.selectedTeam = team;
            }
        });
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        this.sub5=this.dInventoryService.selectedDevice.subscribe(device => {
            if (device) {
                this.actionType = device.action
         
                if(device.action == "Clone") {                
                    device.data['deviceMac'] =null;
                    device.data['deviceIp'] = null;
                    device.data['deviceFWVersion'] = null;
                    device.data['CM IP Address'] = null;
                    device.data['CM MAC Address'] = null;
                    device.data['deviceName']=  device.data['deviceName']+'-cloned';
                    device.data['rackName'] ="";
                    device.data['columnName'] ="";
                    device.data['selfName'] ="";
                    device.data['apiName'] ="";
                    device.data['rebootApiName'] ="";
                    device.data['labIndex'] ="";
                    device.data['labModelName'] ="";
                    this.selectedDevice = device.data;
                } else {
                    this.selectedDevice = device.data;
                };
                this.loadVendors()
                this.loadData()
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
            
        }); 
        this.sub6 = this.apiService.getAllData().subscribe(data => {
            if (data) {
               
                this.dataService.getAPIData().next(data);
            }
        });
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        this.sub7 = this.dataService.getAllAPI().subscribe(apiData => {
            if (apiData) {
                this.allAPI = apiData;
                this.duplicateAPIs=_.clone(this.allAPI)
                this.loadAPI()
            } 
        });

        this.lbSetUp = this.dataService.getLabSetUp();
        
        this.sub9 = this.dataService.getAllAPIGroup().subscribe(apiData => {
            if (apiData) {
              this.allAPIGroup = apiData;
            }
          });
          this.dataService.getAllDevices().subscribe(device=>{
            if(device){
              this.macArray =[]
            device.forEach((res)=>{
             this.macArray.push(res.deviceMac)
      
           } ) 
            }
          })
    }

    /**
     * loads all suppliers available to the team
     */

    loadVendors(){
        if (this.vendorSubscription) {
            this.vendorSubscription.unsubscribe();
        }
        this.vendorSubscription = this.dataService.getAllVendors().subscribe(vendors => {
            if (vendors) {
                this.allVendors = [...vendors];
                //this.allVendors.push('vAUTO')                
                
            }
        });
        this.loadDevices();
    }

    /**
     * Loads all available devices based on vendor.
     * After the loadProfile function is called
     */

    loadDevices() {
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
        }
        this.deviceSubscription = this.dataService.getAllDevices().subscribe(devices => {
            if (devices) {
                this.allDevices = devices;
                this.allDevices.forEach(device => {
                    this.allDeviceNames.push(device.deviceName);
                });
               
            }
            this.loadProfile();
        });
    }

    /**
     * Loads all available profiles
     * After the loadModels
     */

    loadProfile() {
        this.sub1 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
                this.allProfileNames = [];
                this.allProfiles.forEach(profile => {
                    this.allProfileNames.push(profile.profileName);
                });
                
            }
            this.loadModels();
        });
    }

    /**
     * Calls to get all models
     */

    loadModels() {
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
        }
        this.modelSubscription = this.dataService.getAllModels().subscribe(models => {
            if (models) {
                this.allModels = models;
            }
        });
       
    }

    ngOnInit() {
          
        if (this.deviceForm.get("deviceMac").hasError("pattern") || this.deviceForm.get('deviceIp').hasError('pattern') 
            || this.deviceForm.get('deviceName').hasError('required') || this.deviceForm.get('deviceFWVersion').hasError('required')

        ) {

            this.deviceForm.get("deviceMac").markAsTouched();
            this.deviceForm.get("deviceIp").markAsTouched();
            this.deviceForm.get("deviceFWVersion").markAsTouched();
            this.deviceForm.get("deviceName").markAsTouched();
           

        }
       
setTimeout(() => {
    for(const [key, value] of Object.entries(this.deviceForm.value)){
        if (this.deviceForm.get(key).hasError("pattern") || this.deviceForm.get(key).hasError('pattern') 
            || this.deviceForm.get(key).hasError('required')
        ) {
            
            this.deviceForm.get(key).markAsTouched();
        }
    }
    
   
    if(!this.deviceForm.valid){

        return
  
      } 
}, 100);
    }

    /**
     * Used to load all API lists.
     */

    loadAPI() {
        this.requiredAPIs=[]
        for(var i=0;i<this.duplicateAPIs.length;i++){
            if(this.duplicateAPIs[i]['Type']=='Reserve'){
                        this.requiredAPIs.push(this.duplicateAPIs[i]);
            }
        }
    }

    /**
     * Called to initialize the device edit form with all available validations and display the stored value
     * receive api call.
     */

    loadData(){
        this.deviceForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedDevice._id, Validators.required),
            deviceName: new UntypedFormControl(this.selectedDevice.deviceName, [Validators.required, Validators.pattern('^[^_]*$')]),
            deviceMac: new UntypedFormControl(this.selectedDevice.deviceMac || null, [Validators.required, Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$')]),
            deviceIp: new UntypedFormControl(this.selectedDevice.deviceIp || null, [Validators.required, Validators.pattern('^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$')]),
            deviceFWVersion: new UntypedFormControl(this.selectedDevice.deviceFWVersion || "NA", Validators.required),
            vendor: new UntypedFormControl({ value: this.selectedDevice.vendor, disabled: true }, Validators.required),
            model: new UntypedFormControl({ value: this.selectedDevice.model, disabled: true }, Validators.required),
            profileName: new UntypedFormControl(
                {
                    value: this.selectedDevice.profileName ? (Array.isArray(this.selectedDevice.profileName) ? this.selectedDevice.profileName[0] : this.selectedDevice.profileName) : '',
                    disabled: true
                },
                Validators.required
            ),
            profileId: new UntypedFormControl(this.selectedDevice.profileId),
            available: new UntypedFormControl(null),
            reservedBy: new UntypedFormControl(this.selectedDevice.reservedBy || null),
            reservedTill: new UntypedFormControl(this.selectedDevice.reservedTill || null),
            reservedAt: new UntypedFormControl(this.selectedDevice.reservedAt || null),
            reservedFor: new UntypedFormControl(this.selectedDevice.reservedFor || null),
            session: new UntypedFormControl(this.selectedDevice.session || null),
            rackName:new UntypedFormControl(this.selectedDevice.rackName || null),
            labModelName: new UntypedFormControl(this.selectedDevice.labModelName || null),
            apiName: new UntypedFormControl(this.selectedDevice.apiName || null),
            rebootApiName: new UntypedFormControl(this.selectedDevice.rebootApiName || null),
            selfName : new UntypedFormControl(this.selectedDevice.selfName || null),
            columnName : new UntypedFormControl(this.selectedDevice.columnName || null),
            labIndex: new UntypedFormControl(this.selectedDevice.labIndex || null),
            updateDevApiName:new UntypedFormControl(this.selectedDevice.updateDevApiName|| null)
        });
        if(this.selectedDevice['reservedAPI']){
            this.deviceForm.addControl('reservedAPI', new UntypedFormControl(this.selectedDevice['reservedAPI']));
        }
        else{
            this.deviceForm.addControl('reservedAPI', new UntypedFormControl([]));
        }
    
        if (this.selectedDevice.available) {
            this.deviceForm.get('available').setValue(this.selectedDevice.available);
        } else if (this.selectedDevice.available === false) {
            this.deviceForm.get('available').setValue(this.selectedDevice.available);
        } else {
            this.deviceForm.get('available').setValue(null);
        }
        this.loadForm();
        //let a = this.deviceForm.getRawValue()
        this.sub2 = this.deviceForm.get('deviceName').valueChanges.subscribe(value => {
            // this.duplicateClone = false;
            const hasUnderscore = value && value.includes('_');
            if (
                this.allDeviceNames.indexOf(value) !== -1 && this.selectedTeam['deviceName'] !==value
                // this.allDeviceNames.indexOf(value) !== -1 &&
                // this.deviceForm.get('deviceName').value !== this.selectedDevice.deviceName
            ) {
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
        this.deviceForm.get('deviceMac').valueChanges.subscribe(value=>{
            if(this.macArray.indexOf(value) !== -1 && this.selectedDevice.deviceMac != value ){
                this.deviceForm.get('deviceMac').setErrors({ duplicate: true });
            }
        })

        // if(this.actionType === 'Clone' && (this.deviceForm.get('deviceName').value.indexOf(this.deviceForm.get('deviceName').value) !== -1 && this.deviceForm.get('deviceName').value == this.selectedDevice.deviceName)){
        //     this.deviceForm.get('deviceName').setErrors({ duplicate: true });
        //     this.duplicateClone = true;
        // }
    }

    /**
     * Called to initialize the device edit form with all available validations
     */

    loadForm() {
        this.selectedModel = _.filter(this.allModels, model => {
            return model.modelName === this.deviceForm.get('model').value;
        })[0];

        // Get profiles associated with the selected model
        const modelProfileNames = Array.isArray(this.selectedModel.profileName)
            ? this.selectedModel.profileName
            : (this.selectedModel.profileName ? [this.selectedModel.profileName] : []);
        this.modelProfiles = this.allProfiles.filter(p => modelProfileNames.includes(p.profileName));
        this.filteredModelProfiles = [...this.modelProfiles];

        // Try to match existing profile, otherwise auto-select if only one
        const currentProfileName = this.deviceForm.get('profileName').value;
        const matchingProfile = this.modelProfiles.find(p => p.profileName === currentProfileName);
        if (matchingProfile) {
            this.selectedProfile = matchingProfile;
            this.selectedProfiles = [matchingProfile];
        } else if (this.modelProfiles.length === 1) {
            this.selectedProfile = this.modelProfiles[0];
            this.selectedProfiles = [this.modelProfiles[0]];
            this.deviceForm.get('profileName').setValue(this.modelProfiles[0].profileName);
            this.deviceForm.get('profileId').setValue([this.modelProfiles[0]._id]);
        } else {
            this.selectedProfile = null;
            this.selectedProfiles = [];
        }

        if (this.selectedProfile) {
            this.deviceForm.get('profileId').setValue([this.selectedProfile._id]);
            this.selectedProfile.labels.forEach(element => {
            if (element.type === 'text') {
                if (element.textType === 'ip') {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], [
                            Validators.required,
                            Validators.pattern(
                                '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
                            )
                        ])
                    );
                } else if (element.textType === 'mac') {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], [
                            Validators.required,
                            Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$')
                        ])
                    );
                } else {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
                    );
                }
            }
            this.deviceForm.addControl(
                element.name,
                new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
            );
        });
        }
    }

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
                // Re-add label controls for the new profile
                this.selectedProfile.labels.forEach(element => {
                    if (element.type === 'text') {
                        if (element.textType === 'ip') {
                            this.deviceForm.addControl(
                                element.name,
                                new UntypedFormControl(this.selectedDevice[element.name], [
                                    Validators.required,
                                    Validators.pattern(
                                        '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
                                    )
                                ])
                            );
                        } else if (element.textType === 'mac') {
                            this.deviceForm.addControl(
                                element.name,
                                new UntypedFormControl(this.selectedDevice[element.name], [
                                    Validators.required,
                                    Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$')
                                ])
                            );
                        } else {
                            this.deviceForm.addControl(
                                element.name,
                                new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
                            );
                        }
                    }
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
                    );
                });
            }
        } else {
            this.selectedProfile = null;
            this.selectedProfiles = [];
            this.deviceForm.get('profileName').setValue('');
            this.deviceForm.get('profileId').setValue([]);
        }
    }

    filterModelProfiles(searchText: string) {
        if (!searchText) {
            this.filteredModelProfiles = [...this.modelProfiles];
        } else {
            const lower = searchText.toLowerCase();
            this.filteredModelProfiles = this.modelProfiles.filter(p => p.profileName.toLowerCase().includes(lower));
        }
    }

    /**
     * Called after hitting update function to save all values ??for backend via API call
     */

    editDevice() {
        if(this.actionType =="Clone"){
            let validTC = false;
            const deviceName = this.deviceForm.get('deviceName').value;
            if (this.allDeviceNames.indexOf(deviceName) !== -1 && this.selectedTeam['deviceName'] !== deviceName) {
                this.deviceForm.get('deviceName').setValue(deviceName);
                this.deviceForm.get('deviceName').markAsTouched();
                this.dataService.loading.next(false);
                validTC = false;
            } else {
                validTC = true
            }
        if(validTC){
            if(!this.deviceForm.value.labIndex && this.deviceForm.value.rackName && this.deviceForm.value.selfName && this.deviceForm.value.columnName && this.deviceForm.value.apiName && this.deviceForm.value.rebootApiName) {
                let lb = this.deviceForm.value.rackName.toUpperCase().replace(" ", "") + '_' + this.deviceForm.value.selfName + '_' + this.deviceForm.value.columnName
                let md = this.selectedDevice.model;
                this.deviceForm.patchValue({
                    labModelName: this.selectedDevice.model,
                    labIndex: lb
                })
            } else if(!this.deviceForm.value.labIndex) {
                this.deviceForm.patchValue({
                    rackName: '',
                    selfName: '',
                    columnName: '',
                    apiName: '',
                    rebootApiName:'',
                    labIndex:'',
                    labModelName:'',
                    updateDevApiName:''
                })
            }
          let cloneData = this.deviceForm.getRawValue()
          delete cloneData._id
          // Wrap profileName as array for backend consistency
          if (cloneData.profileName && !Array.isArray(cloneData.profileName)) {
              cloneData.profileName = [cloneData.profileName];
          }
        setTimeout(() => {
       //  console.log("cloneData>>>",cloneData);
                this.dataService.loading.next(true);
                this.sub3 = this.dInventoryService.addDevice(cloneData).subscribe(
                    data => {
                        this.dataService.loading.next(false);
                        if (data) {
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
                           
                            this.userServices.updateLabSetConf(this.labSetUpSelect).subscribe((data: any)=>{
                                this.dataService.getSettingsData().next(data[0]);
                            }, err=>{
                                console.log(err)
                            })
                            this.dataService.getDeviceInventoryData().next(data);
                            this.snackBar.open('Device Cloned Succesfully.', 'Ok', {
                                duration: 5000
                            });
                            this.router.navigate(['../'], { relativeTo: this.r });
                        } else {
                            this.snackBar.open('Error Cloning Device.', 'Try Again', {
                                duration: 5000
                            });
                        }
                    },
                    error => {
                        this.dataService.loading.next(false);
                        this.snackBar.open('Error Cloning Device.', 'Try Again', {
                            duration: 5000
                        });
                    }
                );
           
        }, 1);
    }
 
 
        }
        else{
            if(!this.deviceForm.value.labIndex && this.deviceForm.value.rackName && this.deviceForm.value.selfName && this.deviceForm.value.columnName && this.deviceForm.value.apiName && this.deviceForm.value.rebootApiName) {
                var lb = this.deviceForm.value.rackName.toUpperCase().replace(" ", "") + '_' + this.deviceForm.value.selfName + '_' + this.deviceForm.value.columnName
                var md = this.selectedDevice.model;
                this.deviceForm.patchValue({
                    labModelName: this.selectedDevice.model,
                    labIndex: lb
                })
            } else if(!this.deviceForm.value.labIndex) {
                this.deviceForm.patchValue({
                    rackName: '',
                    selfName: '',
                    columnName: '',
                    apiName: '',
                    rebootApiName:'',
                    labIndex:'',
                    labModelName:'',
                    updateDevApiName:''
                })
            }
            setTimeout(() => {
                const editData = this.deviceForm.getRawValue();
                // Wrap profileName as array for backend consistency
                if (editData.profileName && !Array.isArray(editData.profileName)) {
                    editData.profileName = [editData.profileName];
                }
                if (!_.isEqual(editData, this.selectedDevice)) {
                    this.dataService.loading.next(true);
                    this.sub3 = this.dInventoryService.editDevice(editData).subscribe(
                        data => {
                            this.dataService.loading.next(false);
                            if (data) {
                                if(!this.selectedDevice.labIndex && this.deviceForm.value.rackName && this.deviceForm.value.selfName && this.deviceForm.value.columnName) {
                                    for (let j = 0; j < this.labSetUpSelect.design.length; j++) {
                                        for(let k = 0; k < this.labSetUpSelect.design[j].length; k++){
                                            if(this.labSetUpSelect.design[j][k].shelf == this.deviceForm.value.selfName){
                                                if(this.deviceForm.value.columnName == this.labSetUpSelect.design[j][k].coloum) {
                                                    this.labSetUpSelect.design[j][k].available = false;
                                                    this.labSetUpSelect.design[j][k].deviceId = this.selectedDevice._id;
                                                    this.labSetUpSelect.design[j][k].teamName = this.selectedTeam;
                                                    this.userServices.updateLabSetConf(this.labSetUpSelect).subscribe((data: any)=>{
                                                        this.dataService.getSettingsData().next(data[0]);
                                                    }, err=>{
                                                        console.log(err)
                                                    })
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                this.dataService.getDeviceInventoryData().next(data);
                                this.snackBar.open('Device Edited Succesfully.', 'Ok', {
                                    duration: 5000
                                });
                                this.router.navigate(['../'], { relativeTo: this.r });
                            } else {
                                this.snackBar.open('Error Editing Device.', 'Try Again', {
                                    duration: 5000
                                });
                            }
                        },
                        error => {
                            this.dataService.loading.next(false);
                            this.snackBar.open('Error Editing Device.', 'Try Again', {
                                duration: 5000
                            });
                        }
                    );
                } else {
                    this.snackBar.open('No Changes Found', 'OK', {
                        duration: 4000
                    });
                }
            }, 1);
        }
       
        
    }



    ngOnDestroy() {
        if (this.vendorSubscription) {
            this.vendorSubscription.unsubscribe();
        }
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
        }
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
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
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
       
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }

    }

    columnArray: any = [];
    shelfArray: any = [];
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
        if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
            !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
            !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
            this.deviceForm.setErrors({ invalid: true });
            }
    }

    sub10;
    unpairedDevice(columnName, selfName, rackName){
        const temp = this.selectedDevice;
        temp.columnName = '';
        temp.selfName = '';
        temp.rackName = '';
        temp.labIndex = '';
        temp.apiName = '';
        temp.labModelName = '';
        temp.updateDevApiName='';
        temp.rebootApiName='';

        for (let i = 0; i < this.lbSetUp.length; i++) {
            if(this.lbSetUp[i].rackName.toUpperCase().replace(' ','') == rackName){
                this.labSetUpSelect = this.lbSetUp[i]
                for (let j = 0; j < this.labSetUpSelect.design.length; j++) {
                    for(let k = 0; k < this.labSetUpSelect.design[j].length; k++){
                        if(this.labSetUpSelect.design[j][k].shelf == selfName && this.labSetUpSelect.design[j][k].coloum == columnName){
                            this.labSetUpSelect.design[j][k].available = true;
                            this.labSetUpSelect.design[j][k].deviceId = '';
                            this.labSetUpSelect.design[j][k].teamName = '';
                            break;
                        }
                    }
                    
                }
                break
            }
        }
        // console.log(JSON.stringify(temp));
        this.sub10 = this.dInventoryService.pairDevice(temp).subscribe(
        result => {
          this.dataService.loading.next(false);
          if (result) {
            if(this.labSetUpSelect){
                this.userServices.updateLabSetConf(this.labSetUpSelect).subscribe((data: any)=>{
                    this.dataService.getSettingsData().next(data[0]);
                }, err=>{
                    console.log(err)
                })
            }
            this.dataService.getDeviceInventoryData().next(result);
            this.snackBar.open('Device UnPaired Sucessfully', 'OK', {
              duration: 5000
            });
            this.router.navigate(['../'], { relativeTo: this.r });
            //this.snackBar.close();
          }
        },
        error => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error UnDevice Paired', 'Try Again', {
            duration: 5000
          });
          this.router.navigate(['../'], { relativeTo: this.r });
          //this.dialogRef.close();
        }
      );
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
        if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
            !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
            !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
            this.deviceForm.setErrors({ invalid: true });
            }
    }
        columnSelection(event) {
            if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
            !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
            !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
            this.deviceForm.setErrors({ invalid: true });
            }
          }
          apiAvailDevice(event) {
            if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
            !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
            !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
            this.deviceForm.setErrors({ invalid: true });
            }
          
          }
          apiRebootDevice(event) {
            if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
            !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
            !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
            this.deviceForm.setErrors({ invalid: true });
            }
          
          
          }
          //  rebootApiName(event) {
          //     if (this.deviceForm.get('rackName').value && (!this.deviceForm.get('selfName').value ||
          //     !this.deviceForm.get('columnName').value || !this.deviceForm.get('apiName').value ||
          
          //     !this.deviceForm.get('updateDevApiName').value || !this.deviceForm.get('rebootApiName').value)) {
          
          //     this.deviceForm.setErrors({ invalid: true });
          //     }
          // }
        
    
}
