import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LabSettingComponent } from '../lab-setting/lab-setting.component';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { ApiService } from 'src/app/@core/services/api.service';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APIInventoryDeleteComponent } from 'src/app/@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-rack-view',
  templateUrl: './rack-view.component.html',
  styleUrls: ['./rack-view.component.scss']
})
export class RackViewComponent implements OnInit, OnDestroy {
  @Input() labsetupArray: any;
  allDevices:any = [];
  private selectTeam;
  public allModels;
  public sub1;
  public sub2;
  public sub3;
  public sub4;
  public sub5;
  public sub7: any;
  allAPI: any = [];
  colorstyle: any ={'color':''}
  //allModels: any =[];
  variableModel: any = [];
  constructor(private dialog: MatDialog,
      private dataService: DataService,
      private deviceInventoryService: DeviceInventoryService,
      private apiService: ApiService, private snackBar: MatSnackBar,
    ) { }

  ngOnInit(): void {
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectTeam = team;
      }
    });

    this.sub2 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
      }
    });

    this.sub4 = this.deviceInventoryService.getAllData().subscribe(data => {
      if (data) {
          this.dataService.getDeviceInventoryData().next(data);
      }
    });

    this.sub3 = this.dataService.getAllModels().subscribe(model => {
      if (model) {
        this.allModels = model;
      }
    });

    this.sub5 = this.dataService.getAllAPIGroup().subscribe(apiData => {
      if (apiData) {
        this.allAPI = apiData;
      } else {
         this.apiService.getAllData().subscribe((data:any)=>{
          if(data[data.length - 1] && data[data.length - 1].apiGroups){
            this.allAPI = data[data.length - 1].apiGroups;
            data.splice(data.length - 1, 1);
            this.dataService.getAllAPIGroup().next(this.allAPI);
          }
          
        })
      }
    }, err=>{
      //console.log(err);
    });

    setTimeout(() => {
      if(this.labsetupArray.length > 0){
        this.labsetupArray.forEach(el => {

          if(el.rowSettings.length > 0){
            el.rowSettings.forEach(ele => {
              if(ele.deviceDetails){

                ele.color = this.colorstyle;
                ele.loading = false;
                ele.loading1 = false;
                ele.loading2 = false;
              }
            });
          }
        });
      }

      this.sub7 = this.dataService.getDeviceVariableGroup().subscribe(proData => {
        if (proData) {
          //this.allAPI = apiData;
          this.variableModel = proData;
        }
      }, err=>{
        console.log(err);
      });
    }, 100);
  }

  addsettings(rack, self, col, selectedDevice?): any {
    let dialogRef = this.dialog.open(LabSettingComponent, {
      data: { models : this.allModels, selectDevice : selectedDevice, rackName: rack, selfName: self, columnName: col, team: this.selectTeam },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
 
      if(result && result.status == 'Paired'){
        const device = this.allDevices.find((x) => x._id === result.data._id);
        this.labsetupArray.forEach(el => {
          if(el.rackName == rack && el.selfName == self){
            el.rowSettings.forEach(ele => {
              if(ele.columnName == col){
                ele.available = false;
                ele.deviceDetails = device

              }
            });
          }
        });
      } else if(result && result.status == 'UnPaired'){
        this.labsetupArray.forEach(el => {
          if(el.rackName == rack && el.selfName == self){
            el.rowSettings.forEach(ele => {
              if(ele.columnName == col){
                ele.available = true;
                ele.deviceDetails = undefined

              }
            });
          }
        });
      }
    });
  }

  checkDeviceStatus(self, row, r, c){
    this.labsetupArray[r].rowSettings[c].loading = true;
    var a = _.find(this.allAPI, (api)=>api._id == row.deviceDetails.apiName);
    row.deviceDetails.checkstatus = (a.primaryURL.charAt(a.primaryURL.length - 1) === '/') ? a.primaryURL.slice(0, -1) : a.primaryURL;
    row.deviceDetails.port = 22;
    row.deviceDetails["Waiting time"] = 2
    row.deviceDetails.topicName = row.deviceDetails.deviceName;
    row.deviceDetails["API_ENDPOINT"] = "";
    this.dataService.getSettingsData().subscribe((settingsdata: any) => {
      // Read from LabSetUp[0] instead of dashboardConfig
      if (settingsdata && settingsdata.LabSetUp && settingsdata.LabSetUp.length) {
        let deviceName = settingsdata.LabSetUp[0].device_append_labsetup;
        let deviceInformation = this.allDevices.filter(element => element?.deviceName == deviceName);
        if (deviceName && deviceInformation && deviceInformation.length) {
          row.deviceDetails[deviceName] = {};
          row.deviceDetails[deviceName] = deviceInformation[0];
        }
      }
    }, (err: any) => {
    });
    this.deviceInventoryService.checkDeviceStatus(row.deviceDetails).subscribe((data:any)=>{
      this.labsetupArray[r].rowSettings[c].color = {'color': 'green'};
      this.labsetupArray[r].rowSettings[c].loading = false;
      /*this.labsetupArray.forEach(el => {
        if(self.selfName == el.selfName){
          el.rowSettings.forEach(ele => {
            if(row.columnName == ele.columnName){
              ele.color = {'color': 'green'};
              ele.loading = false;
            }
          });
        }
      });*/
    }, err=>{
      console.log(err)
      var er = '';
      if(err && err.error ) {
        if(err.error.err && err.error.err.message){
          er = err.error.err.message;
        } else if(err.error.err) {
          er = err.error.err;
        } else {
          er = err.error
        }
      } 
      this.snackBar.open("Error occured while checking device status", 'OK', {
        duration: 5000
      });
      this.labsetupArray[r].rowSettings[c].color = {'color': 'red'};
      this.labsetupArray[r].rowSettings[c].loading = false;
      /*this.labsetupArray.forEach(el => {
        if(self.selfName == el.selfName){
          el.rowSettings.forEach(ele => {
            if(row.columnName == ele.columnName){
              ele.color = {'color': 'red'};
              ele.loading = false;
            }
          });
        }
      });*/
    })

  }

  sub6:any;
  rebootConfiermation(self, row, r, c){
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: ' Device',
          text: "Are you sure you want to reboot " + row.deviceDetails.deviceName + " device",
          action: 'Reboot',
          buttexthide: true
      },
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub6 = dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.labsetupArray[r].rowSettings[c].loading1 = true;
          this.rebootDevice(self, row, r, c);
        }
    });
  }

  rebootDevice(self, row, r, c){
    //this.colorstyle = {'color': 'green'};
    var deviceDetails:any  = {}
    deviceDetails = row.deviceDetails;

    var a = _.find(this.allAPI, (api)=>api._id == row.deviceDetails.rebootApiName);
    var b = _.find(this.allModels, (model)=>model.modelName == row.deviceDetails.model);
    //console.log(this.variableModel);
    var d:any = [];
    if(b) {
      b.variableGroups.forEach(el=>{
        d.push(_.find(this.variableModel, (model)=>model._id == el.groupId));
      })
      //var d: any = {}
      b.variableGroups.forEach(ele => {
        d.forEach(elem=>{
          if(ele.groupId == elem._id){
            ele.variables.forEach(e=>{
              for (let i = 0; i < elem.variables.length; i++) {
                if(e.variableId == elem.variables[i]._id){
                  if(e.variableValue != undefined && e.variableValue != null){
                    deviceDetails[elem.variables[i].variableName] = e.variableValue;
                  }
                  break;
                }
              }
            })
          }
        })
      });
    }
    
    deviceDetails.rebootdevice = (a.primaryURL.charAt(a.primaryURL.length - 1) === '/') ? a.primaryURL.slice(0, -1) : a.primaryURL;
    deviceDetails.port = 22;
    deviceDetails["Waiting time"] = 2
    deviceDetails.topicName = row.deviceDetails.deviceName;
    deviceDetails["API_ENDPOINT"] = "";
    if(row.deviceDetails.Reboot){
      deviceDetails["OID"]=row.deviceDetails.Reboot
    }
    
    this.deviceInventoryService.rebootDevice(deviceDetails).subscribe((data:any)=>{
      this.labsetupArray[r].rowSettings[c].color = {'color': 'red'};
      this.labsetupArray[r].rowSettings[c].loading1 = false;
    }, err=>{
      console.log(err)
      var er = '';
      if(err && err.error ) {
        if(err.error.err && err.error.err.message){
          er = err.error.err.message;
        } else if(err.error.err) {
          er = err.error.err;
        } else {
          er = err.error
        }
      }
      this.snackBar.open(" Error occured while reboot device", 'OK', {
        duration: 5000
      });
      this.labsetupArray[r].rowSettings[c].loading1 = false;

    })
  }

  checkStatusForAllDevice(){
    this.labsetupArray.forEach((el:any, index)=>{
      el.rowSettings.forEach((ele:any, indexOf) => {
        if(ele.deviceDetails){
          //this.checkDeviceStatus(el.selfName, ele, index, indexOf);
          var self = el.selfName
          var row = ele
          var a = _.find(this.allAPI, (api)=>api._id == row.deviceDetails.apiName);
          console.log(a, "aaaa$$$");
          
          row.deviceDetails.checkstatus = (a.primaryURL.charAt(a.primaryURL.length - 1) === '/') ? a.primaryURL.slice(0, -1) : a.primaryURL;
          row.deviceDetails.port = 22;
          row.deviceDetails["Waiting time"] = 2
          row.deviceDetails.topicName = row.deviceDetails.deviceName;
          row.deviceDetails["API_ENDPOINT"] = "";
          ele.loading = true;
          this.deviceInventoryService.checkDeviceStatus(row.deviceDetails).subscribe((data:any)=>{
            ele.color = {'color': 'green'};
            ele.loading = false;
          }, err=>{
            console.log(err)
            var er = ele.deviceDetails.deviceName + ' ';
            if(err && err.error ) {
              if(err.error.err && err.error.err.message){
                er = err.error.err.message;
              } else if(err.error.err) {
                er = err.error.err;
              } else {
                er = err.error
              }
            } else {
              er = err;
            }
            this.snackBar.open(er, 'OK', {
              duration: 5000
            });
            ele.color = {'color': 'red'};
            ele.loading = false;
          })
        }
      });
    })
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
    if(this.sub5){
      this.sub5.unsubscribe();
    }
    if(this.sub6){
      this.sub6.unsubscribe();
    }
    if(this.sub7) {
      this.sub7.unsubscribe();
    }
  }

  updateDeviceDetails(self, row, r, c){
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: ' Device',
          text: "Are you sure you want to update " + row.deviceDetails.deviceName + " device",
          action: 'Update'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub6 = dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.labsetupArray[r].rowSettings[c].loading2 = true;
          this.updateDevice(self, row, r, c);
        }
    });
  }

  updateDevice(self, row, r, c){
    //this.labsetupArray[r].rowSettings[c].deviceDetails.loading2 = false;
    var a = _.find(this.allAPI, (api)=>api._id == row.deviceDetails.updateDevApiName);
    console.log(a);
    
    var deviceDetails = this.labsetupArray[r].rowSettings[c].deviceDetails;
    deviceDetails['GUI Config'] = false;
    deviceDetails.updateDeviceApiName = (a.primaryURL.charAt(a.primaryURL.length - 1) === '/') ? a.primaryURL.slice(0, -1) : a.primaryURL;
   // console.log(deviceDetails);
    this.deviceInventoryService.updateDeviceLabSetup(deviceDetails).subscribe((data:any)=>{
      //this.labsetupArray[r].rowSettings[c].deviceDetails.color = {'color': 'red'};
      this.labsetupArray[r].rowSettings[c].loading2 = false;
      this.snackBar.open('Device updated sucessfully' , 'OK', {
        duration: 5000
      });
    }, err=>{
      this.labsetupArray[r].rowSettings[c].loading2 = false;
      console.log(err);
      var er = '';
      if(err) {
        if(err.error.err && err.error.err.message){
          er = err.error.err.message;
        } else if(err.error.err) {
          er = err.error.err;
        } else if(err.error) {
          er = err.error;
        } else if(err.err){
          er = err.err;
        } else {
          er = err;
        }
      }
      this.snackBar.open("Error occured while update device from lab setup", 'OK', {
        duration: 5000
      });
      //this.labsetupArray[r].rowSettings[c].loading2 = false;
    })
  }
}
