import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { LabSettingComponent } from './lab-setting/lab-setting.component';
import * as _ from 'lodash';
import { UserService } from 'src/app/@core/services/user.service';

interface IselfSetting {
  rackName: string;
  selfName: string;
  rowSettings: IrowSetting[];
}
interface IrowSetting {
  columnName: string;
 // deviceDetails: any;
  available: boolean;
}

@Component({
  selector: 'app-lab-setup',
  templateUrl: './lab-setup.component.html',
  styleUrls: ['./lab-setup.component.scss']
})
export class LabSetupComponent implements OnInit, OnDestroy {

  public selectedDevice;
  private selectTeam;
  public allDevices;
  public selectedRack;
  public totalSelfs = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
  public totalRows = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  public labsetupArray: IselfSetting[] = [];
  public sub1;
  public sub2;
  public sub3;
  public sub4;
  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    public userService: UserService,
    private deviceInventoryService: DeviceInventoryService
  ) {
    this.sub1 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectTeam = team;
        this.getAllData();
      }
    });

    // this.sub2 = this.dataService.getAllDevices().subscribe((device) => {
    //   if (device) {
    //     this.allDevices = device;
    //   }
    // });
  }
  getAllData(): any {
    this.sub3 = this.deviceInventoryService.getAllData().subscribe(deviceData => {
      if (deviceData) {
        this.dataService.getDeviceInventoryData().next(deviceData);
      }
    });
  }

  private generateLabSetup(rackName): void {
    //console.log('inside generateLabSetup')
    this.dataService.loading.next(true);
    var rcda = this.rackData;
    this.labsetupArray = [];
    var design = [];
    this.rackData.forEach(ele => {
      if(ele.rackName.toUpperCase().replace(" ", "") == rackName){
        design = ele.design;
      }
    });
    rcda.forEach(rd=>{
      if(rd.rackName.toUpperCase().replace(" ", "") == rackName){
        //design = ele.design;
        //console.log('rd => ', rd.design )
        design = rd.design;
      }
    })

    //console.log('design => ', design);
    this.totalSelfs.forEach((selfName, index) => {
      const rowSettingItems: IrowSetting[] = [];
      this.totalRows.forEach((columnName, ind) => {
        const labId = rackName + '_' + selfName + '_' + columnName;
        const rowsetting: IrowSetting = {
          columnName,
          available: design[index][ind].available
        };
       
        rowSettingItems.push(rowsetting);
      });

      const selfSetting: IselfSetting = {
        rackName,
        selfName,
        rowSettings: rowSettingItems,
      };

      this.labsetupArray.push(selfSetting);
    });
    
    this.dataService.loading.next(false);
  }

  rackData:any = [];
  ngOnInit(): void {
    //console.log('inside ngOnInit');
    //  this.rackData = this.dataService.getLabSetUp();
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectTeam = team;
        this.getAllData();
      }
    });
   this.userService.getLabSetDetails().subscribe((labSetData:any)=>{
        if(labSetData){
          this.rackData = labSetData
        if (this.selectedRack !== '' && this.selectedRack != undefined) {
          this.generateLabSetup(this.selectedRack);
        } else {
          this.totalRows = [];
          this.totalSelfs = [];

          if(this.rackData[0].rackFor == 'Data'){
            for (let i = 1; i <= parseInt(this.rackData[0].Column); i++) {
              this.totalRows.push('C'+ i);
            }
            for (let j = 1; j <= parseInt(this.rackData[0].Shelf); j++) {
              this.totalSelfs.push('S'+ j); 
            }
          } else if(this.rackData[0].rackFor == "Chamber"){
            for (let j = 1; j <= parseInt(this.rackData[0].NoChamber); j++) {
              this.totalSelfs.push('CH'+ j); 
            }
            for (let i = 1; i <= parseInt(this.rackData[0].DUT); i++) {
              this.totalRows.push('DUT'+ i);  
            }
            for (let k = 1; k <= parseInt(this.rackData[0].Client); k++) {
              this.totalRows.push('Client'+ k);
            }
          }
          this.generateLabSetup(this.rackData[0].rackName);
        } 
      }
    });
  }

  selectRack(e): any {
    const rackName = e.tab.textLabel;
    var selectedRackObj = {}
    for (let i = 0; i < this.rackData.length; i++) {
      if(this.rackData[i].rackName == e.tab.textLabel){
        this.selectedRack  = this.rackData[i].rackName.toUpperCase().replace(" ", "");
        this.totalRows = [];
        this.totalSelfs = [];
        if(this.rackData[i].rackFor == 'Data'){
          for (let k = 1; k <= parseInt(this.rackData[i].Column); k++) {
            this.totalRows.push('C'+ k);
          }

          for (let j = 1; j <= parseInt(this.rackData[i].Shelf); j++) {
            this.totalSelfs.push('S'+ j); 
          }

        } else if(this.rackData[i].rackFor == "Chamber"){
          for (let j = 1; j <= parseInt(this.rackData[i].NoChamber); j++) {
            this.totalSelfs.push('CH'+ j); 
          }
          for (let l = 1; l <= parseInt(this.rackData[i].DUT); l++) {
            this.totalRows.push('DUT'+ l);
            
          }
          for (let k = 1; k <= parseInt(this.rackData[i].Client); k++) {
            this.totalRows.push('Client'+ k);
            
          }
        }
        break;
      }
    }
    /*if (rackName === 'Rack 1') {
      this.selectedRack = 'RACK1';
    } else if (rackName === 'Rack 2') {
      this.selectedRack = 'RACK2';
    } else if (rackName === 'Rack 3') {
      this.selectedRack = 'RACK3';
    } else {
      this.selectedRack = 'RACK4';
    }*/
    this.generateLabSetup(this.selectedRack);
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
  }
}


