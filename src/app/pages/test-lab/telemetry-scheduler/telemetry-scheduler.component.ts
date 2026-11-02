import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import * as _ from 'lodash';
import { CPEInventoryService } from 'src/app/@core/services/cpe-inventory.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-telemetry-scheduler',
  templateUrl: './telemetry-scheduler.component.html',
  styleUrls: ['./telemetry-scheduler.component.scss']
})
export class TelemetrySchedulerComponent implements OnInit {

  allDevices: any = [];
  sub7: any;
  allModules: any = [];
  sub2: any;
  selectedDevice: any ;
  telemetry_options:any = [{name:'SNMP', value:'SNMP'}, {name:'ACS', value:'TR069'}, {name:'SNMP & ACS', value:'Both'}];
  telemetry_time_option:any = [{name:'15', value:'15'}, {name:'20', value:'20'}, {name:'30', value:'30'}, {name:'45', value:'45'}]
  stop_time_option: any = ["1","2","3", "5", "10", "12", "15", "20", "24"];
  show_err: boolean = false;
  constructor(public dataService: DataService, public teleCpeSheduler: CPEInventoryService, public dialog: MatDialog) { 
    this.sub2 = this.dataService.getAllModels().subscribe((modules) => {
      if (modules) {
        this.allModules = modules;
      }
    });
    this.sub7 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
      }
    });
  }

  selectedModel: any = {modelName:''};
  firmware_version: any = [];
  selectedFirmwareVer: any = '';
  deviceChanges(event){
    //console.log(event);
    this.show_err = false;
    this.firmware_version = [];
    this.selectedModel = _.find(this.allModules, {
      modelName : event.model 
    });

    if(this.selectedModel.dut && this.selectedModel.dut == true){
      if(this.selectedModel.firmware_version_N) {
        this.firmware_version.push(this.selectedModel.firmware_version_N)
      }
      if(this.selectedModel.firmware_version_N_1) {
        this.firmware_version.push(this.selectedModel.firmware_version_N_1)
      }
      if(this.selectedModel.firmware_version_N_2) {
        this.firmware_version.push(this.selectedModel.firmware_version_N_2)
      }
      if(this.selectedModel.firmware_version_N_min_1) {
        this.firmware_version.push(this.selectedModel.firmware_version_N_min_1)
      }
    }
  }

  selectedTeam:any = '';
  ngOnInit(): void {
    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
        this.getpollList();
      }
    });
  }

  snmp_time_interval: any = '15';
  acs_time_interval: any = '';
  polling_type:any = 'SNMP';
  telemetry_object: any = ['all'];
  total_duration: any ="1";
  telemetry_object_option: any = [{name:'All',value:'all'}, {name:'Free Memory',value:'FreeMemory'}, {name:'CPU Usage',value:'CPUUsage'}, {name:'MTA OperationalState',value:'MTA_OperationalState'},
    {name:'MTA Admin Enable',value:'MTA_Admin_Enable'},{name:'Ethernet 1 Status',value:'Ethernet_1_Status'},{name:'SSID 24Primary Status',value:'SSID_24Primary_Status'},{name:'SSID 5Primary Status',value:'SSID_5Primary_Status'},{name:'Docsis RX Powerlevel',value:'Docsis_RX_Powerlevel'}];

  polling_type_fu(){
    if(this.polling_type == 'Both'){
      this.snmp_time_interval = '15';
      this.acs_time_interval = '15';
    } else if(this.polling_type == 'SNMP') {
      this.snmp_time_interval = '15';
      this.acs_time_interval = '';
    } else if(this.polling_type == 'TR069'){
      this.acs_time_interval = '15';
      this.snmp_time_interval = '';
    }
  }

  selectedObject(){
    setTimeout(() => {
      if(this.telemetry_object[0] == 'all'){
        this.telemetry_object = ['all'];
      }
    }, 1);
  }

  telemetry: any = {};
  onRunClicked(){
    this.show_err = false;
    this.telemetry.deviceName = this.selectedDevice.deviceName
    this.telemetry.object_file = this.selectedModel.modelName
    this.telemetry.firmware = this.selectedFirmwareVer
    this.telemetry.polling_type = this.polling_type
    this.telemetry .snmp_time_interval= this.snmp_time_interval
    this.telemetry.acs_time_interval = this.acs_time_interval
    if(this.telemetry_object[0] == 'all'){
      this.telemetry.objects = 'all';
    } else {
      this.telemetry.objects = this.telemetry_object
    }
    
    if(this.selectedDevice["deviceIp"]){
      this.telemetry["deviceIp"] = this.selectedDevice["deviceIp"];
    } else if(this.selectedDevice.ipaddress){
      this.telemetry["deviceIp"] = this.selectedDevice.ipaddress;
    }

    if(this.selectedDevice["deviceMac"]){
      this.telemetry["deviceMac"] = this.selectedDevice["deviceMac"];
    } else if(this.selectedDevice.mac){
      this.telemetry["deviceMac"] = this.selectedDevice.mac;
    } else if(this.selectedDevice.mac_address){
      this.telemetry["deviceMac"] = this.selectedDevice.mac_address;
    }
    
    this.telemetry.total_duration = this.total_duration;
    this.telemetry.reg_id = this.genrateRegrassionName(this.selectedDevice.deviceName);
    //console.log(this.telemetry);
    if(this.telemetry["deviceMac"] && this.telemetry["deviceIp"]){
      this.teleCpeSheduler.startCpeTelemetry( this.telemetry).subscribe((data:any)=>{
        console.log(data);
        //this.show_err = false;
        this.getpollList();
      }, err=>{
        console.log(err);
      })
    } else {
      this.show_err = true;
    }
    
  }

  genrateRegrassionName(name){
    return name + '_' + new Date().toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
  }

  pollingList: any = [];
  getpollList(){
    this.pollingList = [];
    console.log('inside getpollList');
    console.log(this.pollingList.length)
    this.teleCpeSheduler.getPollingList().subscribe((data:any)=>{
      console.log(data);
      if(data.data){
        this.pollingList = data.data;
      }
    }, err=>{
      console.log(err);
    })
  }

  sub6
  confStopPolling(pl){
    console.log(pl);
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: ' Polling',
          text: "Are you sure you want to Stop " + pl + " Poll",
          action: 'Stop'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub6 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.stopPolling(pl);
      }
    });
  }

  stopPolling(pl){
    console.log('inside stopPolling')
    this.teleCpeSheduler.stopPolling({'reg_id':pl}).subscribe((data:any)=>{
      console.log(data);
      this.getpollList();
    }, err=>{
      console.log(err);
    })
  }

  ngOnDestroy() {
    if (this.sub6) {
      this.sub6.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
    if (this.sub7) {
      this.sub7.unsubscribe();
    }
  }

}
