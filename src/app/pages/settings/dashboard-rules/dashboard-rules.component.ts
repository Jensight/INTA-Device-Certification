import { ChangeDetectorRef, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service'
import { AddDeviceTypeComponent } from '../add-device-type/add-device-type.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';


interface deviceTypeData {
  DeviceType: string;
  Status: string;
  vendorArray: vendorData[];
  ModelType: string;
  ONTModelPosition : string;
}

interface vendorData {
  Vendor: string;
  DUT: string;
  TFW: string;
}

@Component({
  selector: 'app-dashboard-rules',
  templateUrl: './dashboard-rules.component.html',
  styleUrls: ['./dashboard-rules.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DashboardRulesComponent implements OnInit {

  @ViewChild('outerSort', { static: true }) sort: MatSort;
  @ViewChildren('innerSort') innerSort: QueryList<MatSort>;
  @ViewChildren('innerTables') innerTables: QueryList<MatTable<vendorData>>;
  mainDataSource: MatTableDataSource<deviceTypeData[]>;
  displayedColumns: string[] = ['DeviceType', 'ModelType', 'Status', 'Actions'];
  expandedRow: deviceTypeData | null = null;
  subTableColumns: string[] = ['Vendor', 'DUT', 'TFW'];
  subTableData: any;
  data = [];
  settingsData: any;
  dashboardRulesConfig: any;
  selectedTeam: string;
  constructor(private dataService: DataService, private dialog: MatDialog, private testcaseInventoryService: TestCaseInventoryService,
    private cd: ChangeDetectorRef, private userService: UserService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    // Subscribe to selected team
    this.dataService.selectedTeam.subscribe((team: string) => {
      if (team) {
        this.selectedTeam = team;
        // Load team-specific configuration when team changes
        this.loadTeamSpecificConfig();
      }
    });

    this.dataService.getSettingsData().subscribe((settingsdata: any) => {
      if (!settingsdata) {
        this.userService.getAllusers().subscribe((data: any) => {
          this.dataService.saveSettingData(data[0]);
          settingsdata = data;
          this.settingsData = data;
          this.loadTeamSpecificConfig();
        });
      } else {
        const temp = [];
        temp.push(settingsdata);
        this.settingsData = temp;
        this.loadTeamSpecificConfig();
      }
    });
  }

  loadTeamSpecificConfig() {
    if (this.selectedTeam && this.settingsData && this.settingsData[0].dashboardRulesConfig) {
      // Find the configuration for the current team
      this.dashboardRulesConfig = this.settingsData[0].dashboardRulesConfig.find(
        config => config.teamName === this.selectedTeam
      );

      if (this.dashboardRulesConfig) {
        // Load existing configuration for this team
        this.data = this.dashboardRulesConfig.DeviceTypeList || [];
        this.mainDataSource = new MatTableDataSource(this.data);
      } else {
        // No configuration exists for this team, initialize empty
        this.data = [];
        this.mainDataSource = new MatTableDataSource(this.data);
        this.dashboardRulesConfig = null;
      }
    }
  }

  toggleRow(element: deviceTypeData) {
    this.expandedRow = this.expandedRow === element ? null : element;
    this.cd.detectChanges();
  }

  deleteDeviceType(editRecordData) {
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '500px',
      data: {
        name: 'Delete Device Type',
        text:
          "Device Type will be deleted and this action can't be reversed. Are you sure you want to proceed?",
        action: 'Delete'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const index = this.data.findIndex(object => object.DeviceType === editRecordData.DeviceType);
        if (index > -1) {
          this.data.splice(index, 1);
          this.mainDataSource = new MatTableDataSource(this.data);
          this.cd.detectChanges();
          this.save();
        }
      }
    });
  }

  addDeviceType(editRecordData) {
    // this.data[index].edit = true;
    const dialogRef = this.dialog.open(AddDeviceTypeComponent, {
      width: '850px',
      data: { recordData: editRecordData, existingDeviceTypes: this.data?.map((item) => item.DeviceType) },
      panelClass: 'dynamic-theme',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.event === 'create') {
        // Add device type to current team's data
        this.data.push(result.data);
        this.mainDataSource = new MatTableDataSource(this.data);
        this.cd.detectChanges();
        this.save();
      } else if (result && result.event === 'update') {
        const index = this.data.findIndex(object => object.DeviceType === editRecordData.DeviceType);
        this.data[index].DeviceType = result.data.DeviceType;
        this.data[index].Status = result.data.Status;
        this.data[index].ModelType = result.data.ModelType;
        this.data[index].vendorArray = result.data.vendorArray;
        this.data[index].ONTModelPosition = result.data.ONTModelPosition;
        this.mainDataSource = new MatTableDataSource(this.data);
        this.cd.detectChanges();
        this.save();
      }
    });
  }

  onCustom(event): void {
    if (event.action === 'Delete') {
      this.deleteRecordConfirmation(event);
    } else if (event.action === 'Edit') {
      this.editRecord(event);
    }
  }
  deleteRecordConfirmation(event) {

  }

  editRecord(event) {

  }

  save() {
    let snackRef: MatSnackBarRef<any>;

    if (!this.settingsData || !this.settingsData[0]) {
      snackRef = this.snackBar.open('Settings data not available', '', {
        duration: 5000
      });
      return;
    }

    // Initialize dashboardRulesConfig array if it doesn't exist
    if (!this.settingsData[0].dashboardRulesConfig) {
      this.settingsData[0].dashboardRulesConfig = [];
    }

    // Find existing configuration for current team
    const existingConfigIndex = this.settingsData[0].dashboardRulesConfig.findIndex(
      config => config.teamName === this.selectedTeam
    );

    if (existingConfigIndex !== -1) {
      // Update existing team configuration
      const existingConfig = this.settingsData[0].dashboardRulesConfig[existingConfigIndex];
      const configToUpdate = {
        _id: existingConfig._id,
        teamName: this.selectedTeam,
        DeviceTypeList: this.data,
        updatedAt: new Date()
      };

      // Call update method with the specific configuration
      this.userService.updateDashboardRules(configToUpdate).subscribe((data: any) => {
        snackRef = this.snackBar.open('System Config updated Successfully', '', {
          duration: 5000
        });
        // Update local settings data
        this.settingsData = data;
        // To Update settings data, which will also reflect to dashboard
        this.dataService.saveSettingData(data[0]);
        this.dataService.setSettingsData(data[0]);
        // Reload team-specific config
        this.loadTeamSpecificConfig();
      }, err => {
        snackRef = this.snackBar.open('Something Went Wrong, unable to update', '', {
          duration: 5000
        });
      });
    } else {
      // Create new team configuration
      const newConfig = {
        teamName: this.selectedTeam,
        DeviceTypeList: this.data,
        createdAt: new Date()
      };

      // Call add method with the new configuration
      this.userService.addDashboardRules(newConfig).subscribe((data: any) => {
        snackRef = this.snackBar.open('System Config added Successfully', '', {
          duration: 5000
        });
        // Update local settings data
        this.settingsData = data;
        // To Update settings data, which will also reflect to dashboard
        this.dataService.saveSettingData(data[0]);
        this.dataService.setSettingsData(data[0]);
        // Reload team-specific config
        this.loadTeamSpecificConfig();
      }, err => {
        snackRef = this.snackBar.open('Something Went Wrong, unable to add', '', {
          duration: 5000
        });
      });
    }
  }

}
