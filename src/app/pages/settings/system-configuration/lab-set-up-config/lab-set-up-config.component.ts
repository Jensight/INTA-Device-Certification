import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { UserService } from '../../../../@core/services/user.service';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToolTipDisplayComponent } from '../../../../@shared/components/tooltip-component/tooltip.component';
import { AddLabSetUpComponent } from './add-lab-set-up/add-lab-set-up.component';
import * as _ from 'lodash';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBarRef, MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
// import { LabSetupService } from './lab-setup.service';


interface DTRdata {
  rackName: string;
  rackFor: string;
  shelf: string;
  shelfDetails: shelfDetails[];
}

interface shelfDetails {
  shelfName: any;
  column: any;
}

interface CTRdata {
  rackName: string;
  rackFor: string;
  NoChamber: string;
  chamberDetails: chamberDetails[];
}

interface chamberDetails {
  chamberName: any;
  column: any;
}


@Component({
  selector: 'app-lab-set-up-config',
  templateUrl: './lab-set-up-config.component.html',
  styleUrls: ['./lab-set-up-config.component.scss']
})
export class LabSetUpConfigComponent implements OnInit {

  @ViewChild('outerSort', { static: true }) sort: MatSort;
  @ViewChildren('innerSort') innerSort: QueryList<MatSort>;
  @ViewChildren('innerTables') innerTables: QueryList<MatTable<shelfDetails>>;
  mainDataSource: MatTableDataSource<DTRdata> = new MatTableDataSource<DTRdata>([]);
  ctrDataSource: MatTableDataSource<CTRdata> = new MatTableDataSource<CTRdata>([]);
  displayedColumns: string[] = ['rackName', 'rackFor', 'Shelf', 'teams', 'Actions'];
  ctrDisplayedColumns: string[] = ['rackName', 'rackFor', 'NoChamber', 'teams', 'Actions'];
  expandedRow: DTRdata | null = null;
  ctrExpandedRow: CTRdata | null = null;
  subTableColumns: string[] = ['shelfName', 'column'];
  ctrSubTableColumns: string[] = ['chamberName', 'column'];
  subTableData: any;
  private data;
  labSetUp: any;
  device: string;
  deleteUserValue:boolean=true;
  sub1: any;
  sub2: any;
  sub3: any;
  sub4: any;
  sub6: any;
  source: LocalDataSource = new LocalDataSource();
  selectedTeam: any;
  sub5: any;
  allDevices: any = [];
  labSetupForm: FormGroup;
  teams: any;
  dataServices: any;
  dashboard_config: any;
  dashboard_extra_config: any;
  deviceAppendLabSetup: any
  deviceAppendInput: any;
  showPairedTestbeds: boolean = false;
  showInactiveTestbeds: boolean = true;
  labSetUpConfigExists: boolean = false;
  selectedView = 'CTR';
  teamListNames: any[] = [];
  teamList: any;
  ctrTestBedCount = 2;
  existingRackNames: any[] = [];
  existingRackIds : any[] = [];
  loading: boolean = true;
   constructor(public dataService: DataService, public userService: UserService, 
    public snackBar: MatSnackBar, public dialog: MatDialog, private dInventoryService: DeviceInventoryService,
     private formBuilder: FormBuilder, private cd: ChangeDetectorRef,) {
      this.deleteUserValue=this.dataService.deleteActions();
      // this.snackBar = snackBar;
   }
  
  ngOnInit(): void {
    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.dataService.getSettingsData().subscribe(data => {
            if (data) {
                this.teamList = data.teams;
                const temp = [];
                for (let i = 0; i < this.teamList.length; i++) {
                    temp.push({
                        name: this.teamList[i].name,
                        status: false
                    });
                }
                this.teamListNames = temp;
            }
        });
    this.loading = true;
    this.sub1 = this.userService.getAllusers().subscribe(
    settings => {
      if (settings) {
   console.log("settings 122",settings[0]);
        // Read config from LabSetUp with safe null checks
        if (settings[0].LabSetUp) {
          this.labSetUpConfigExists = true;
          this.deviceAppendLabSetup = settings[0].LabSetUp.device_append_labsetup || '';
          this.showPairedTestbeds = !!settings[0].LabSetUp.show_paired_testbeds;
          this.showInactiveTestbeds = !!settings[0].LabSetUp.show_inactive_testbeds;
        } else {
          this.labSetUpConfigExists = false;
        }
       this.userService.getLabSetDetails().subscribe((labSetData:any)=>{
        if(labSetData){
        this.data = labSetData;
        this.dataService.getSettingsData().next(settings[0]);
        console.log('labSetData => ', labSetData);
        this.existingRackNames = this.data.map(d => d.rackName.toUpperCase().replace(" ", ""));
        this.existingRackIds = this.data.map(d => d.rackId);
        console.log('existingRackNames => ', this.existingRackNames);
        this.filterdata();
        }
        this.loading = false;
      }, (error) => {
        this.loading = false;
      });

      }
    },
    error => {
      this.loading = false;
      // console.log(error);
    }
    );
    this.teams = [];
    this.userService.getAllusers().subscribe((data: any) => {
      //console.log(data);
      //console.log(data[0].teams)
      var dashboard_extra_config = [];
      if(data[0].dashboardConfig){
        this.dashboard_extra_config = data[0].dashboardConfig;
        dashboard_extra_config = data[0].dashboardConfig;
      }
    });

    this.sub5 = this.dataService.getAllDevices().subscribe((data:any)=>{
      this.allDevices = data;
    }, err =>{
      //console.log(err)
    })

  //Sort Data
  const sortData = this.dataService.getUserSort();
  if(sortData){
    this.source.setSort(sortData);
    }
      // this.getConfigData();
  }

  filterdata() {
    let filteredData = [];
    if (this.selectedView === 'CTR') {
      filteredData = this.data.filter(item => item.rackFor && item.rackFor === 'Chamber');
      filteredData = filteredData.map(item => ({
        ...item,
        rackName: item.rackName || item.name || '',
      }));
      console.log('filteredData @ 318 => ', filteredData);
      this.ctrDataSource = new MatTableDataSource(filteredData);
    } else if (this.selectedView === 'DTR') {
      filteredData = this.data.filter(item => item.rackFor && item.rackFor === 'Data');
      console.log('filteredData @ 322 => ', filteredData);
      this.mainDataSource = new MatTableDataSource(filteredData);
     // this.source.load(filteredData);
      // this.source.load(this.data);

    }


 }
  setSortData() {
    this.dataService.storeUserSort(this.source.getSort());
  }
 toggleRow(element: DTRdata) {
    this.expandedRow = this.expandedRow === element ? null : element;
    this.cd.detectChanges();
  }
  ctrToggleRow(element: CTRdata) {
    this.ctrExpandedRow = this.ctrExpandedRow === element ? null : element;
    this.cd.detectChanges();
  }
  /**
  * Edit User function to open edit user form
  * @param editEvent .
  */

  /**
   * Delete User function to remove user from backend
   * @param deleteEvent .
   */

  deleteUserConfirmation(deleteEventOrRow: any) {
    const row = deleteEventOrRow && deleteEventOrRow.data ? deleteEventOrRow.data : deleteEventOrRow;
    if (!row) { return; }
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
        name: 'Lab Set Up',
        text: 'Deleting will remove the ' + (row.rackName || '') + '. Set Up and release all linked device.',
        action: 'Delete'
      },
      panelClass: 'app-full-bleed-dialog'
    });

    this.sub3 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        if (Array.isArray(row.design)) {
          for (let i = 0; i < row.design.length; i++) {
            const designRow = row.design[i] || [];
            for (let j = 0; j < designRow.length; j++) {
              const cell = designRow[j];
              if (cell && cell.available === false) {
                const device = _.find(this.allDevices, { _id: cell.deviceId });
                if (device) {
                  device.columnName = '';
                  device.selfName = '';
                  device.rackName = '';
                  device.labIndex = '';
                  device.apiName = '';
                  device.labModelName = '';
                  device.rebootApiName = '';
                  device.updateDevApiName = '';
                  this.dInventoryService.pairDevice(device).subscribe(() => {
                    this.dataService.loading.next(false);
                  }, () => {
                    this.dataService.loading.next(false);
                  });
                }
              }
            }
          }
        }
        this.deleteRack(row);
      }
    });
  }


  editRack(editEvent): void {
    console.log('editEvent', editEvent);
    const rowData = editEvent;
    const dialogRef = this.dialog.open(AddLabSetUpComponent, {
      width: '400px',
      data: { data: rowData, existingRackNames: this.existingRackNames, existingRackIds: this.existingRackIds  },
    });
    this.sub2 = dialogRef.afterClosed().subscribe(result => {
      this.userService.getLabSetDetails().subscribe((labSetData: any) => {
        if (labSetData) {
          this.data = labSetData;
          console.log('labSetData => ', labSetData);
          this.filterdata();
        }
      });
    });
  }
  
  deleteRack(deleteEventOrRow: any) {
    const row = deleteEventOrRow && deleteEventOrRow.data ? deleteEventOrRow.data : deleteEventOrRow;
    if (!row) { return; }
    this.loading = true;
    this.sub4 = this.userService.deleteLabSetup(row).subscribe((resp: any) => {
      if (resp) {
      this.data = resp;
        this.existingRackNames = this.data.map(d => d.rackName.toUpperCase().replace(" ", ""));
        this.existingRackIds = this.data.map(d => d.rackId);
        this.filterdata();
      }
    }, (error) => {
      this.loading = false;
    });
  }


  addRack(){
    var ctrCount = this.data.filter(item => item.rackFor && item.rackFor === 'Chamber').length;
    var dtrCount = this.data.filter(item => item.rackFor && item.rackFor === 'Data').length;
    const dialogRef = this.dialog.open(AddLabSetUpComponent, {
      width: '400px',
      data: {existingRackNames: this.existingRackNames, existingRackIds: this.existingRackIds, ctrCount: ctrCount, dtrCount: dtrCount }
  });
  this.sub2 = dialogRef.afterClosed().subscribe(result => {
     // this.data = this.dataService.getLabSetUp();
     this.userService.getLabSetDetails().subscribe((labSetData:any)=>{
      if(labSetData){
      this.data = labSetData;
      // this.source.load(this.data);
      this.filterdata();
      }
    });
  });
  }
  saveDeviceAppend(){
    let snackRef: MatSnackBarRef<any>;
    // Save config to LabSetUp in settings
    const configData = {
      device_append_labsetup: this.deviceAppendLabSetup,
      show_paired_testbeds: !!this.showPairedTestbeds,
      show_inactive_testbeds: !!this.showInactiveTestbeds
    };
    
    // Use add if config doesn't exist, otherwise update
    const apiCall = this.labSetUpConfigExists 
      ? this.userService.updateLabSetUpConfig(configData) 
      : this.userService.addLabSetUpConfig(configData);
    
    apiCall.subscribe((data:any)=>{
      this.labSetUpConfigExists = true; // After successful add, set to true for future updates
      snackRef = this.snackBar.open('Lab Setup Config Updated Successfully', 'ok', {
          duration: 5000
        });
        this.dataService.getSettingsData().next(data[0]);
      }, err =>{
        snackRef = this.snackBar.open('Something Went Wrong, unable to update', 'ok', {
          duration: 5000
        });
    })
  }
   setView(view: string) {
    this.selectedView = view;
    this.filterdata();
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
    if (this.sub5) {
      this.sub5.unsubscribe();
    }
    if (this.sub6) {
      this.sub6.unsubscribe();
    }
  }
  }

}
