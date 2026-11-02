import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import * as _ from 'lodash';
import { DataService } from 'src/app/@core/services/data.service';
import { TestSuiteSelectionComponent } from '../test-suite-selection/test-suite-selection.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalDataSource } from 'angular2-smart-table';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { UserService } from 'src/app/@core/services/user.service';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { Observable, Observer, of } from 'rxjs';
import { UnSaveChangesGuard } from 'src/app/@core/guards/unSaveChanges.guard';


const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
@Component({
  selector: 'app-auto-trigger-regression',
  templateUrl: './auto-trigger-regression.component.html',
  styleUrls: ['./auto-trigger-regression.component.scss']
})
export class AutoTriggerRegressionComponent implements OnInit, OnDestroy, UnSaveChangesGuard {
  allTestbed: any;
  private _rawTestbeds: any[] = [];
  private _settingsData: any = null;
  private _restrictTestbedToUser: boolean = false;
  private _matrixChangeSub: any;
  testBedList = [];
  tempTestBedList = [];
  settings = {
    actions: {
      add: false,
      edit: false,
      delete: false,
      custom: [],
      width: '100px',
      position: 'right',
      class: 'text-center'
    },
    columns: {

      TestBed: {
        title: 'TestBed',
        width: '400px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent
      },
      TestSuites: {
        title: 'TestSuites',
        width: '500px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent
      },

      DUTName : {
        title: 'DUTName',
        type: 'html',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        
      },
    FW_Community : {
      title: 'FW_Community',
      type: 'custom',
      width: '200px',
      class: 'text-center',
      renderComponent: ToolTipDisplayComponent,
      componentInitFunction: ToolTipDisplayComponent.componentInit,
    }
    }
  };
  source: LocalDataSource;
  data = [];
  allTestsuite: any;
  allDevices: any;
  path: any;
  selectedTeam: any;
  testSetFilter = false;
  hasUnSavedData = false;
  autoRegressionDbData: any;
  showOnlyPairedTestbeds: boolean;
  constructor(private dataService: DataService, private testLabService: TestLabService,
              private dialog: MatDialog, public snackBar: MatSnackBar, private userService: UserService) {

  }

  updateTestSuites(event): void {
    console.log('event ', event);
  }
  ngOnInit(): void {
    this.dataService.loading.next(true);
    this.settings.actions.custom.push( {
      name: 'Edit',
      title: '<i class="fa fa-pencil" title="edit"></i>'
     },
     {
      name: 'Delete',
      title: '<i class="fa fa-trash-o" title="delete"></i>',
      confirmDelete: true
    }
   );
    this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.testLabService.getAutoRegressionDataFromDB().subscribe( dt => {
          console.log('auto regression data', dt);
          this.autoRegressionDbData = dt;
          if (this.autoRegressionDbData && this.autoRegressionDbData['autoRegressionData']) {
            this.data = this.autoRegressionDbData['autoRegressionData'];
            this.source = new LocalDataSource(this.data);
          }
        });
      }
    });
    this.userService.getAllusers().subscribe(data => {
      this._settingsData = data && data[0] ? data[0] : null;
      // Read showOnlyPairedTestbeds + restrict_testbed_to_user from regressionConfig (team-specific)
      if (this._settingsData && this._settingsData.regressionConfig && this._settingsData.regressionConfig[0] && this._settingsData.regressionConfig[0].teams) {
        const teamConfig = this._settingsData.regressionConfig[0].teams.find((team: any) => team.name === this.selectedTeam);
        if (teamConfig) {
          this.showOnlyPairedTestbeds = !!teamConfig.show_only_paired_testbeds;
          this._restrictTestbedToUser = !!teamConfig.restrict_testbed_to_user;
        }
      }
      this.rebuildAllTestbed();
      
      const testSetFilterDetails = data[0].extraSystemConfig[0].teams.filter(team => {
        return (team.name === this.selectedTeam);
      });

      if (testSetFilterDetails && testSetFilterDetails.length > 0) {
        const filterDetails = testSetFilterDetails[0];
        if (filterDetails.test_set_filter === true && filterDetails.is_TestBedProfile_TestSet_Mapped === true) {
          this.testSetFilter = true;
        }
      } 
    });
    this.testBedList = [];
    this.dataService.getTestBed().subscribe(tb => {
      if (tb) {
        this._rawTestbeds = _.cloneDeep(tb);
        this.rebuildAllTestbed();
      }
    });
    // Live-refresh when the User-TestBed Access Matrix is saved elsewhere
    this._matrixChangeSub = this.dataService.onUserTestbedAccessMatrixChanged().subscribe((matrix: any) => {
      if (this._settingsData) { this._settingsData.userTestbedAccessMatrix = matrix; }
      this.rebuildAllTestbed();
    });
    this.dataService.getTestSuites().subscribe((ts) => {
      if (ts) {
        this.allTestsuite = ts;
      }
    });
    this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
      }
    });
    // if (this.testBedList && this.allTestsuite && this.allDevices) {
    this.dataService.loading.next(false);
    // }
  }

  ngOnDestroy(): void {
    if (this._matrixChangeSub) { this._matrixChangeSub.unsubscribe(); }
  }

  /**
   * Re-apply the User-TestBed Access Matrix filter to the cached raw testbed list.
   * Called on load and whenever the matrix broadcasts an update.
   */
  private rebuildAllTestbed(): void {
    if (!this._rawTestbeds) return;
    let filtered = _.cloneDeep(this._rawTestbeds);
    if (this._restrictTestbedToUser && this._settingsData) {
      filtered = this.dataService.filterTestbedsByAccessMatrix(filtered, this._settingsData, this.selectedTeam);
    }
    this.allTestbed = filtered;
  }

  addTestBed(editRecordData, index): void {
    const dialogRef = this.dialog.open(TestSuiteSelectionComponent, {
      width: '450px',
      data: {testBeds: this.tempTestBedList, testBedDetails: this.allTestbed, testSetFilter: this.testSetFilter,
        allTestsuites: this.allTestsuite, allDevices: this.allDevices, existingRecords: this.data, editRecordData,
        showOnlyPairedTestbeds: this.showOnlyPairedTestbeds},
      panelClass: 'dynamic-theme',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.event === 'create'){
        this.data.push(result.data);
        this.source = new LocalDataSource(this.data);
        console.log('this.data @ 169', this.data);
        this.hasUnSavedData = true;
      } else if (result && result.event === 'update') {
        this.data[index].TestBed = result.data.TestBed;
        this.data[index].TestSuites = result.data.TestSuites;
        this.data[index].DUTName = result.data.DUTName;
        this.data[index].FW_Community = result.data.FW_Community;
        this.data[index].TestBedId = result.data.TestBedId;
        this.data[index].TestSuiteId = result.data.TestSuiteId;
        this.data[index].DUTId = result.data.DUTId;
        this.source = new LocalDataSource(this.data);
        this.hasUnSavedData = true;
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

  editRecord(editEvent): void {
    const index = this.data.findIndex(object => {
      return object.TestBed === editEvent.data.TestBed;
    });
    this.addTestBed(editEvent.data, index);
  }

  deleteRecordConfirmation(deleteEvent): void {
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: ' Record',
          text: 'Are you sure you want to delete ',
          action: 'Delete'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.deleteRow(deleteEvent);
        }
    });
  }

  deleteRow(deleteEvent): void {
    this.data = this.data.filter(obj =>  {
      return obj.TestBed !== deleteEvent.data.TestBed;
    });
    this.hasUnSavedData = true;
    this.source = new LocalDataSource(this.data);
  }

    save(): void {
      this.testLabService.saveAutoRegression(this.data).subscribe( (response: any) => {
        if (response && response['status'] && response['status'] === true) {
          this.hasUnSavedData = false;
          this.snackBar.open('Auto Regression Raw data saved Successfully', 'Ok', {
            duration: 5000
          });
        }
      },
      (error: any) => {
        if (error && error.error && error.error.errorDetail) {
          if (error.error.errorDetail.includes('EBUSY: resource busy or locked')) {
            this.snackBar.open('Please close the Raw data Excel', 'Try Again', {
              duration: 5000
            });
          } else {
            this.snackBar.open('Error while saving data', 'Try Again', {
              duration: 5000
            });
          }
        }
      }
      );
  }

  download(): void {
    const jsonData = JSON.parse(JSON.stringify(this.data));
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('sheet1');
    const headerRow =  worksheet.addRow(['TestBed', 'TestSuites', 'DUTName', 'FW_Community'
    ]);

    headerRow.eachCell(cell => {
      cell.font = {bold: true };
    });
    this.data.forEach(element => {
      worksheet.addRow([
         element.TestBed,
         element.TestSuites,
         element.DUTName,
         element.FW_Community
     ]);
   });
    workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
    const blob = new Blob([data], { type: EXCEL_TYPE });
    fs.saveAs(blob, `auto_regression_raw_data.xlsx`);
});

}

canDeactivate(): Observable<boolean> | boolean {
  if (this.hasUnSavedData) {
    return new Observable((observer: Observer<boolean>) => {
      const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
        width: '400px',
        data: {
          name: ' the Page',
          text: 'You have unsaved changes. Do you want to save and leave this page? ',
          action: 'Leave'
        },
        panelClass: 'app-full-bleed-dialog'
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.hasUnSavedData = false;
          observer.next(true);
          observer.complete();
        } else {
          observer.next(false);
          observer.complete();
        }
    });
  });
  } else {
    return of(true);
  }
}

}
