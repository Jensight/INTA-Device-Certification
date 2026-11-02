import { Component, Inject, Input, OnInit } from '@angular/core';
import { ViewTargetComponent } from '../@shared/components/api-inventory-delete/view-target/view-target.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Cell } from 'angular2-smart-table';

@Component({
  selector: 'app-testbedlist-popup',
  templateUrl: './testbedlist-popup.component.html',
  styleUrls: ['./testbedlist-popup.component.scss']
})
export class TestbedlistPopupComponent implements OnInit {
  @Input() value: any;
  @Input() rowData: any;
  @Input() numberLimit: any;
  @Input() isTestSet: boolean;
  @Input() isTestBed: boolean;
  @Input() isTestSuite: boolean;
  @Input() isTestSets: boolean;
  @Input() isTestGroup: boolean;
  @Input() isApiGroup: boolean;
  @Input() isApi: boolean;
  @Input() isDevicesInDeviceprofile: boolean;
  @Input() isdevicesInDeviceModel: boolean;
  renderValue: string;

  constructor(
    private dialog: MatDialog,
    //  @Inject(MAT_DIALOG_DATA) 

  ) { }

  static componentInit(instance: TestbedlistPopupComponent, cell: Cell, numberLimit: any, context: string) {
    const row = cell.getRow().getData();
    instance.rowData = row;
    instance.numberLimit = numberLimit;
    instance.renderValue = cell.getValue();
    instance.resetFlags();
    switch (context) {
      case 'node':
        instance.isTestBed = true;
        break;
      case 'profile':
        instance.isTestSet = true;
        break;
      case 'module':
        instance.isTestSets = true;
        break;
      case 'testsuite':
        instance.isTestSuite = true;
        break;
      case 'testgroup':
        instance.isTestGroup = true;
        break;
      case 'isApiGroup':
        instance.isApiGroup = true;
        break;
      case 'isApi':
        instance.isApi = true;
        break;
      case 'deviceprofile':
        instance.isDevicesInDeviceprofile = true;
        break;
      case 'devicemodel':
        instance.isdevicesInDeviceModel = true;
        break;
      default:
        break;
    }
  }

  private resetFlags(): void {
    this.isTestBed = false;
    this.isTestSet = false;
    this.isTestSets = false;
    this.isTestSuite = false;
    this.isTestGroup = false;
    this.isApiGroup = false;
    this.isApi = false;
    this.isDevicesInDeviceprofile = false;
    this.isdevicesInDeviceModel = false;
  }
  ngOnInit(): void {
    // this.renderValue = this.value;
  }
  redirectTo(): void {
    if (!this.isTestSet && !this.isTestBed && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isTestSuite && !this.isTestSets && !this.isTestGroup && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "Testbed",
          targetFields: ["testBedName"],
          data: this.rowData['target']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });
    }
    else if (this.isTestSet && !this.isTestSuite && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isTestSets && !this.isTestGroup && !this.isTestBed && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "TestSet",
          targetFields: ["testSetName"],
          data: this.rowData['testsetTarget']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });
    }
    else if (this.isTestBed && !this.isTestSet && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isTestSuite && !this.isTestSets && !this.isTestGroup && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "TestBed",
          targetFields: ["testBedName"],
          data: this.rowData['testBedList']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });
    }
    if (this.isTestSuite && !this.isTestSets && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isTestGroup && !this.isTestBed && !this.isTestSet && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "TestCase",
          targetFields: ["tcId","testCaseName" ],
          data: this.rowData['testCaseNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (!this.isTestSuite && !this.isTestGroup && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && this.isTestSets && !this.isTestBed && !this.isTestSet && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "TestSuite",
          targetFields: ["testSuiteName"],
          data: this.rowData['testSuiteNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (this.isTestGroup && !this.isTestSuite && !this.isdevicesInDeviceModel && !this.isTestSets && !this.isDevicesInDeviceprofile && !this.isTestBed && !this.isTestSet && !this.isApiGroup && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "TestSuite",
          targetFields: ["testCaseName"],
          data: this.rowData['testCaseNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (this.isApiGroup && !this.isTestGroup && !this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isTestSuite && !this.isTestSets && !this.isTestBed && !this.isTestSet && !this.isApi) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "ApiGroup",
          targetFields: ["apiName"],
          data: this.rowData['apiNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (this.isApi && !this.isDevicesInDeviceprofile && !this.isdevicesInDeviceModel && !this.isApiGroup && !this.isTestGroup && !this.isTestSuite && !this.isTestSets && !this.isTestBed && !this.isTestSet) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "Api",
          targetFields: ["testCaseName"],
          data: this.rowData['testCaseNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (this.isDevicesInDeviceprofile && !this.isdevicesInDeviceModel && !this.isApi && !this.isApiGroup && !this.isTestGroup && !this.isTestSuite && !this.isTestSets && !this.isTestBed && !this.isTestSet) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "Device Profile",
          targetFields: ["deviceName"],
          data: this.rowData['deviceNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }
    else if (this.isdevicesInDeviceModel && !this.isDevicesInDeviceprofile && !this.isApi && !this.isApiGroup && !this.isTestGroup && !this.isTestSuite && !this.isTestSets && !this.isTestBed && !this.isTestSet) {
      this.dialog.open(ViewTargetComponent, {
        data: {
          targetName: "Device Model",
          targetFields: ["deviceName"],
          data: this.rowData['deviceNames']
        },

        width: '700px',
        autoFocus: false,
        panelClass: 'app-full-bleed-dialog'
      });

    }




  }

}
