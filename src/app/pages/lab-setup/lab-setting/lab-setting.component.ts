import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import * as _ from 'lodash';
import { ApiService } from 'src/app/@core/services/api.service';
import { UserService } from 'src/app/@core/services/user.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';

@Component({
  selector: 'app-lab-setting',
  templateUrl: './lab-setting.component.html',
  styleUrls: ['./lab-setting.component.scss']
})
export class LabSettingComponent implements OnInit, OnDestroy {
  public deviceSettingForm: UntypedFormGroup;
  searchTextboxControl = new UntypedFormControl();
  searchTextboxControl1 = new UntypedFormControl();
  searchTextboxControl2 = new UntypedFormControl();
  public deviceAvailability = [];
  public deviceAvailabilityCopy = [];
  public modelAvailability = [];
  public modelAvailabilityCopy = [];
  public selectedDevice = {};
  public deviceIndex = null;
  allAPI: any = [];
  allAPICopy: any = [];
  allAPICopyDevice: any = [];
  allAPICopyReboot: any = [];
  search_data: any = '';
  allDevices;
  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  selectTeam:any;
  constructor(public dialogRef: MatDialogRef<LabSettingComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private snackBar: MatSnackBar,
              private dataService: DataService,
              private deviceService: DeviceInventoryService,
              private apiService: ApiService,
              private userServices: UserService,
              private tcInventoryService: TestCaseInventoryService
  ) {
    if (data.models != null && data.models.length > 0) {
      this.modelAvailability =_.sortBy(data.models, 'modelName')
      this.modelAvailabilityCopy =_.sortBy(data.models, 'modelName');; 

      this.modelAvailabilityCopy.sort((a, b) => {
        if (a.modelName.toLowerCase() > b.modelName.toLowerCase()) {
          return 1;

        }
        if (a.modelName.toLowerCase() < b.modelName.toLowerCase()) {
          return -1;

        }

        return 0;
      });
    }
    if (data.selectDevice) {
      this.selectedDevice = data.selectDevice;
    }
  }

  ngOnInit(): void {
    this.sub6 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectTeam = team;
      }
    });
    this.sub5 = this.dataService.getAllAPIGroup().subscribe(apiData => {
      if (apiData) {
        this.allAPI = _.sortBy(apiData, 'name');
        this.allAPICopy = _.sortBy(apiData, 'name');
        this.allAPICopyDevice = _.sortBy(apiData, 'name');
        this.allAPICopyReboot = _.sortBy(apiData, 'name');
        this.allAPICopyDevice.sort((a, b) => {
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;

          }
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;

          }

          return 0;
        });
        this.allAPICopyReboot.sort((a, b) => {
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;

          }
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;

          }

          return 0;
        });
        this.allAPICopy.sort((a, b) => {
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;

          }
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;

          }

          return 0;
        });

        this.allAPI.sort((a, b) => {
          if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1;

          }
          if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1;

          }

          return 0;
        });


        console.log("appapis>>>",this.allAPI);
      } else {
         this.apiService.getAllData().subscribe((data:any)=>{
          if(data[data.length - 1] && data[data.length - 1].apiGroups){
            this.allAPI = (data[data.length - 1].apiGroups);
            this.allAPICopy = (data[data.length - 1].apiGroups);
            this.allAPICopyDevice = (data[data.length - 1].apiGroups);
            this.allAPICopyReboot = (data[data.length - 1].apiGroups);
            data.splice(data.length - 1, 1);
            this.dataService.getAllAPIGroup().next(this.allAPI);
            this.dataService.getAllAPIGroup().next(this.allAPICopy);
            this.dataService.getAllAPIGroup().next(this.allAPICopyDevice);
            this.dataService.getAllAPIGroup().next(this.allAPICopyReboot);
            this.allAPI.sort((a, b) => {
              if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
    
              }
              if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
    
              }
    
              return 0;
            });
            this.allAPICopy.sort((a, b) => {
              if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
    
              }
              if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
    
              }
    
              return 0;
            });
            this.allAPICopyDevice.sort((a, b) => {
              if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
    
              }
              if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
    
              }
    
              return 0;
            });
            this.allAPICopyReboot.sort((a, b) => {
              if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1;
    
              }
              if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
    
              }
    
              return 0;
            });

          }
          
        })
      }
    }, err=>{
      console.log(err);
    });

    this.sub2 = this.dataService.getAllDevices().subscribe(device => {
      if (device) {
        this.allDevices = device;
      }
    });

    this.deviceSettingForm = new UntypedFormGroup({
      labModelName: new UntypedFormControl(null, Validators.required),
      deviceName: new UntypedFormControl(null, Validators.required),
      apiName: new UntypedFormControl(null, Validators.required),
      updateDevApiName: new UntypedFormControl(null, Validators.required),
      rebootApiName: new UntypedFormControl(null, Validators.required),
      selfName : new UntypedFormControl(null),
      columnName : new UntypedFormControl(null)
    });
    if (!_.isEmpty(this.data.selectDevice)) {
      this.deviceIndex = this.data.selectDevice;
      this.deviceSettingForm.patchValue({
        labModelName : this.data.selectDevice.labModelName,
        deviceName: this.data.selectDevice._id,
        selfName: this.data.selectDevice.selfName,
        apiName: this.data.selectDevice.apiName,
        updateDevApiName: this.data.selectDevice.updateDevApiName,
        rebootApiName: this.data.selectDevice.rebootApiName,
        columnName: this.data.selectDevice.columnName
      });
      this.deviceSettingForm.get('labModelName').disable();
      this.deviceSettingForm.get('deviceName').disable();
    } else {
      this.deviceSettingForm.patchValue({
        selfName: this.data.selfName,
        columnName: this.data.columnName
      });
    }
    //console.log("this.data.selectDevice._id",this.data.selectDevice._id);
    if(this.data.selectDevice && this.data.selectDevice._id){
      const allDeviceByModule = _.filter(this.allDevices, (device) => device.model === this.data.selectDevice.labModelName);
      const alldevice = (this.deviceIndex ? allDeviceByModule : allDeviceByModule.filter((x) => {
        return x.labIndex === '' || !x.hasOwnProperty('labIndex');
      })) ;
      // this.deviceAvailability = alldevice;
      // console.log("alldevices", alldevice);
      this.deviceAvailability = _.sortBy(alldevice, 'deviceName');
      this.deviceAvailabilityCopy = _.sortBy(alldevice, 'deviceName');

      
    }

    this.deviceSettingForm.controls.labModelName.valueChanges.subscribe((value) => {
      const allDeviceByModule = _.filter(this.allDevices, (device) => device.model === value);
      const alldevice = (this.deviceIndex ? allDeviceByModule : allDeviceByModule.filter((x) => {
        return x.labIndex === '' || !x.hasOwnProperty('labIndex');
      })) ;
      this.deviceAvailability = _.sortBy(alldevice, 'deviceName');  
      this.deviceAvailabilityCopy = _.sortBy(alldevice, 'deviceName');  
    });

  }
  pairingDevice(modeOfPress): any {
    var systemSet: any = this.dataService.getSettingsData();
    var labSetUp = systemSet._value.LabSetUp
    const rackName = this.data.rackName;
    this.dataService.loading.next(true);
    if (modeOfPress === 'U'){
      var unPaDev = this.data;
      const temp = (this.deviceIndex);
      temp.columnName = '';
      temp.selfName = '';
      temp.rackName = '';
      temp.labIndex = '';
      temp.apiName = '';
      temp.rebootApiName = '';
      temp.updateDevApiName = '';
      var labsetUpTemp = {};
      for (let i = 0; i < labSetUp.length; i++) {
        if(labSetUp[i].rackName.toUpperCase().replace(' ','') == rackName) {
          for (let j = 0; j < labSetUp[i].design.length; j++) {
            for(let k = 0; k < labSetUp[i].design[j].length; k++){
              if(labSetUp[i].design[j][k].shelf == unPaDev.selfName && labSetUp[i].design[j][k].coloum == unPaDev.columnName){
                labSetUp[i].design[j][k].available = true;
                labSetUp[i].design[j][k].deviceId = '';
                labSetUp[i].design[j][k].teamName = '';
                labsetUpTemp = labSetUp[i];
                
                break;
              }
            }
          }
          break;
        }
      }

    
      this.sub4 = this.deviceService.pairDevice( temp).subscribe(
        result => {
          this.dataService.loading.next(false);
          if (result) {
           
            this.dataService.getDeviceInventoryData().next(result);
            this.snackBar.open('Device UnPaired Sucessfully', 'OK', {
              duration: 5000
            });
            this.dialogRef.close({status:'UnPaired'});
            this.userServices.updateLabSetConf(labsetUpTemp).subscribe((data: any)=>{
              this.dataService.getSettingsData().next(data[0]);
            }, err=>{
              console.log(err)
            })
          }
        },
        error => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error UnDevice Paired', 'Try Again', {
            duration: 5000
          });
          this.dialogRef.close();
        }
      );

    }else{

      const labIndex = rackName + '_' +
      this.deviceSettingForm.get('selfName').value + '_' + this.deviceSettingForm.get('columnName').value;

      const temp = this.deviceSettingForm.getRawValue();
      temp._id = this.deviceSettingForm.get('deviceName').value;
      delete temp.deviceName;
      temp.rackName = rackName;
      temp.labIndex = labIndex;

      var labsetUpTemp = {};
      for (let i = 0; i < labSetUp.length; i++) {
        if(labSetUp[i].rackName.toUpperCase().replace(' ','') == rackName) {
          for (let j = 0; j < labSetUp[i].design.length; j++) {
            for(let k = 0; k < labSetUp[i].design[j].length; k++){
              if(labSetUp[i].design[j][k].shelf == temp.selfName && labSetUp[i].design[j][k].coloum == temp.columnName){
                labSetUp[i].design[j][k].available = false;
                labSetUp[i].design[j][k].deviceId = temp._id;
                labSetUp[i].design[j][k].teamName = this.selectTeam;
                labsetUpTemp = labSetUp[i];
                
                break;
              }
            }
          }
          break;
        }
      }

      this.sub4 = this.deviceService.pairDevice( temp).subscribe(
        result => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getDeviceInventoryData().next(result);
            this.snackBar.open('Device Paired Sucessfully', 'OK', {
              duration: 5000
            });
            
            setTimeout(() => {
              this.userServices.updateLabSetConf(labsetUpTemp).subscribe((data: any)=>{
                this.dataService.getSettingsData().next(data[0]);
              }, err=>{
                console.log(err)
              })
            }, 10);
            this.dialogRef.close({status:'Paired', data:temp});
          }
        },
        error => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Device Paired', 'Try Again', {
            duration: 5000
          });
          this.dialogRef.close();
        }
      );
    }
  }
  cancel(): any {
    this.dialogRef.close();
  }

  updateDeviceApi(){
    var systemSet: any = this.dataService.getSettingsData();
    var labSetUp = systemSet._value.LabSetUp
    const rackName = this.data.rackName;
    this.dataService.loading.next(true);
    const labIndex = rackName + '_' +
      this.deviceSettingForm.get('selfName').value + '_' + this.deviceSettingForm.get('columnName').value;

      const temp = this.deviceSettingForm.getRawValue();
      temp._id = this.deviceSettingForm.get('deviceName').value;
      delete temp.deviceName;
      temp.rackName = rackName;
      temp.labIndex = labIndex;

      var labsetUpTemp = {};
      for (let i = 0; i < labSetUp.length; i++) {
        if(labSetUp[i].rackName.toUpperCase().replace(' ','') == rackName) {
          for (let j = 0; j < labSetUp[i].design.length; j++) {
            for(let k = 0; k < labSetUp[i].design[j].length; k++){
              if(labSetUp[i].design[j][k].shelf == temp.selfName && labSetUp[i].design[j][k].coloum == temp.columnName){
                labSetUp[i].design[j][k].available = false;
                labSetUp[i].design[j][k].deviceId = temp._id;
                labSetUp[i].design[j][k].teamName = this.selectTeam;
                labsetUpTemp = labSetUp[i];
                
                break;
              }
            }
          }
          break;
        }
      }

      this.deviceService.pairDevice( temp).subscribe(
        result => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getDeviceInventoryData().next(result);
            this.snackBar.open('Device Updated Sucessfully', 'OK', {
              duration: 5000
            });
            
            setTimeout(() => {
              this.userServices.updateLabSetConf(labsetUpTemp).subscribe((data: any)=>{
                this.dataService.getSettingsData().next(data[0]);
              }, err=>{
                console.log(err)
              })
            }, 10);
            this.dialogRef.close({status:'Paired', data:temp});
          }
        },
        error => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Update Device', 'Try Again', {
            duration: 5000
          });
          this.dialogRef.close();
        }
      );
  }

  filterDeviceAvlOption(ev) {
    // console.log('---------------');
    // console.log('value', ev.target.value);
    // console.log(this.deviceAvailabilityCopy);
    // console.log(this.deviceAvailability);
    let name = ev.target.value.toLowerCase()
    if(Boolean(name)) {
      this.deviceAvailabilityCopy = this.deviceAvailability.filter((el) => (el.deviceName.toLowerCase()).includes(name));
    } else {
      this.deviceAvailabilityCopy = this.deviceAvailability
    }
    // console.log(this.deviceAvailabilityCopy);
  }
  filterModelAvlOption(ev) {
    let name = ev.target.value.toLowerCase()
    if (Boolean(name)) {
      this.modelAvailabilityCopy = this.modelAvailability.filter((el) => (el.modelName.toLowerCase()).includes(name));
    } else {
      this.modelAvailabilityCopy = this.modelAvailability
    }
  }

  filterApiForDeviceAvlOption(ev ){
    let name = ev.target.value.toLowerCase()
    if (Boolean(name)) {
      this.allAPICopy = this.allAPI.filter((el) => (el.name.toLowerCase()).includes(name));
    } else {
      this.allAPICopy = this.allAPI
    }
  }
 
  filterApiForUpdateDevice(ev ){
    let name = ev.target.value.toLowerCase()
    if (Boolean(name)) {
      this.allAPICopyDevice = this.allAPI.filter((el) => (el.name.toLowerCase()).includes(name));
    } else {
      this.allAPICopyDevice = this.allAPI
    }

  }
  filterApiForRebootDevice(ev ){
    let name = ev.target.value.toLowerCase()
    if (Boolean(name)) {
      this.allAPICopyReboot = this.allAPI.filter((el) => (el.name.toLowerCase()).includes(name));
    } else {
      this.allAPICopyReboot = this.allAPI
    }

  }
  clearFilter(): void {
    this.searchTextboxControl.patchValue('');
    this.searchTextboxControl1.patchValue('');
    this.searchTextboxControl2.patchValue('');
    this.allAPICopy = this.allAPI;
    this.allAPICopyDevice = this.allAPI;
    this.allAPICopyReboot = this.allAPI; 
  }

  ngOnDestroy(): any {
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

    if(this.sub5) {
      this.sub5.unsubscribe();
    }
  }

}
