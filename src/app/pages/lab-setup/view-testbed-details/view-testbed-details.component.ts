import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import * as nodeIcons from '../nodeIcons';
import { ApiService } from 'src/app/@core/services/api.service';
import { ConfigureTestbedApiComponent } from '../configure-testbed-api/configure-testbed-api.component';
// import { ChunkPipe } from 'src/app/@shared/pipes/chunk.pipe';

const EXCLUDED_DEVICE_KEYS: string[] = [
  '_id',
  'profileName',
  'profileId',
  'available',
  'createdAt',
  'updatedAt',
  'continueRegFlg',
  'showContent',
  'checkstatus',
  'port',
  'Waiting time',
  'topicName',
  'API_ENDPOINT',
  'pingApi',
  'sshApi',
  'statusApi'
];

@Component({
  selector: 'app-view-testbed-details',
  templateUrl: './view-testbed-details.component.html',
  styleUrls: ['./view-testbed-details.component.scss'],
  // providers: [ChunkPipe]
})
export class ViewTestbedDetailsComponent implements OnInit {

  testbedDetails: any;
  allModels = [];
  sub1: any;
  selectTeam: any;
  sub2: any;
  allDevices = [];
  sub4: any;
  sub3: any;
  networkelements = [];
  testbedData: any[];
  deviceDetailsArray: any[];
  showDeviceDetails = false;
  deviceDetails: any;
  allAPI: any = [];
  sub5: any;
  apiGroupsFetched = false;
  constructor(public dialogRef: MatDialogRef<ViewTestbedDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private apiService: ApiService,
    private dataService: DataService, private deviceInventoryService: DeviceInventoryService,
    private dialog: MatDialog, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    console.log('Data received in dialog:', this.data);
    console.log('Node Icons:', nodeIcons);
    this.testbedDetails = this.data.element.testbed;
    console.log('Testbed Details:', this.testbedDetails);
    this.apiService.getTestBed().subscribe(
      (testbedlist: any) => {
        if (testbedlist && Array.isArray(testbedlist)) {
          this.testbedData = testbedlist;
          console.log('Fetched Testbed List:', this.testbedData);
          this.dataService.getTestBed().next(testbedlist);
          this.testbedDetails.nodes = this.testbedDetails.nodes.map((node: any) => {
            console.log('Mapping node:', node);
            const nodeName = this.testbedData.find((n: any) => n._id == node.nodeId)?.nodeName || 'Unknown';
            return {
              ...node,
              nodeName: nodeName
            };
          });
          // removing the nodes which do not have deviceDetails
          this.testbedDetails.nodes = this.testbedDetails.nodes.filter((node: any) => node.deviceDetails !== null
            && node.deviceDetails !== undefined);
          // removing the nodes whose nodeName is Browser or Framework Server
          this.testbedDetails.nodes = this.testbedDetails.nodes.filter((node: any) => node.nodeName !== 'Browser'
            && node.nodeName !== 'Framework Server');
          console.log('Testbed Nodes with Icons:', this.testbedDetails.nodes);
        }
      });
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectTeam = team;
      }
    });

    this.sub2 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
        console.log('All Devices in ViewTestbedDetails:', this.allDevices);

        this.testbedDetails.nodes = this.testbedDetails.nodes.map((node: any) => {
          const deviceDetails = this.allDevices.find(dev => dev._id === node.deviceId);
          return {
            ...node,
            deviceDetails: deviceDetails ? deviceDetails : null,
            //iconClass: nodeIcons[nodeName] || 'fa fa-question-circle' // Default icon if type not found
          };
        });
        console.log('Testbed Nodes with Device Details:', this.testbedDetails.nodes);
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

    // Load API groups (used to resolve a device's status-check URL on refresh).
    this.sub5 = this.dataService.getAllAPIGroup().subscribe(apiData => {
      if (apiData && apiData.length) {
        this.allAPI = apiData;
        return;
      }
      // Fetch only once when nothing is cached yet. Guard with a flag so a
      // response that has no apiGroups can't re-emit an empty value into the
      // same BehaviorSubject and trigger an endless /api/alldata loop.
      if (this.apiGroupsFetched) {
        return;
      }
      this.apiGroupsFetched = true;
      this.apiService.getAllData().subscribe((data: any) => {
        const apiGroups = (data && data.length) ? data[data.length - 1].apiGroups : [];
        this.allAPI = Array.isArray(apiGroups) ? apiGroups : [];
        // Only publish to the shared subject when there is real data, so an
        // empty result never re-triggers this subscription.
        if (this.allAPI.length) {
          this.dataService.getAllAPIGroup().next(this.allAPI);
        }
      });
    });
  }

  /**
   * Open the API configuration dialog for a single device. Reuses the same
   * API Group / API dropdowns; the selection is prefilled from and saved to
   * the LabSetup design cell, keyed per device.
   */
  configureDevice(node: any): void {
    const dialogRef = this.dialog.open(ConfigureTestbedApiComponent, {
      width: '750px',
      disableClose: false,
      data: {
        element: this.data.element,
        rackData: this.data.rackData,
        rackId: this.data.rackId,
        selfName: this.data.selfName,
        columnName: this.data.columnName,
        device: node
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Configure device API result => ', result);
      }
    });
  }

  /**
   * Refresh a single device's status/availability from the backend using the
   * same status-check flow as the rack view.
   */
  refreshDevice(node: any): void {
    const deviceDetails = node.deviceDetails;
    if (!deviceDetails) {
      this.snackBar.open('No device details available to refresh.', 'OK', { duration: 4000 });
      return;
    }
    node.refreshing = true;
    const api = this.allAPI.find((a: any) => a._id == deviceDetails.apiName);
    if (api && api.primaryURL) {
      deviceDetails.checkstatus = api.primaryURL.charAt(api.primaryURL.length - 1) === '/'
        ? api.primaryURL.slice(0, -1) : api.primaryURL;
    }
    deviceDetails.port = 22;
    deviceDetails['Waiting time'] = 2;
    deviceDetails.topicName = deviceDetails.deviceName;
    deviceDetails['API_ENDPOINT'] = '';
    this.dataService.getSettingsData().subscribe((settingsdata: any) => {
      if (settingsdata && settingsdata.LabSetUp && settingsdata.LabSetUp.length) {
        const deviceName = settingsdata.LabSetUp[0].device_append_labsetup;
        const deviceInformation = this.allDevices.filter((el: any) => el && el.deviceName == deviceName);
        if (deviceName && deviceInformation && deviceInformation.length) {
          deviceDetails[deviceName] = deviceInformation[0];
        }
      }
    }, () => { });
    this.deviceInventoryService.checkDeviceStatus(deviceDetails).subscribe(() => {
      node.refreshing = false;
      node.deviceDetails.available = true;
      this.snackBar.open('Device is available.', 'OK', { duration: 3000 });
    }, (err: any) => {
      node.refreshing = false;
      node.deviceDetails.available = false;
      let msg = 'Error occurred while checking device status';
      if (err && err.error && err.error.err && err.error.err.message) {
        msg = err.error.err.message;
      }
      this.snackBar.open(msg, 'OK', { duration: 5000 });
    });
  }

  getIconClass(node: any): string {
    const name = node?.nodeName?.replace(/ /g, '');
    return (nodeIcons as any)[name] || 'fa fa-question-circle';
  }

  displayDeviceDetails() {
    console.log('Device Details:', this.testbedDetails.nodes);
    this.deviceDetails = this.testbedDetails.nodes.map((node: any) => node.deviceDetails);
    this.deviceDetails = this.deviceDetails.map((device: any) => {
      return {
        ...device,
        showContent: false
      };
    });
    this.showDeviceDetails = true;
  }
  closeDeviceDetails() {
    this.deviceDetails = null;
    this.showDeviceDetails = false;
  }

  onClose() {
    this.dialogRef.close();
  }

  getDeviceKeys(device: any): string[] {
    return Object.keys(device || {}).filter(key => {
      if (EXCLUDED_DEVICE_KEYS.includes(key)) return false;
      const val = device[key];
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      const str = val.toString().toLowerCase();
      return str !== '' && str !== 'nil' && str !== 'na';
    });
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
    if (this.sub5) {
      this.sub5.unsubscribe();
    }
  }

}


