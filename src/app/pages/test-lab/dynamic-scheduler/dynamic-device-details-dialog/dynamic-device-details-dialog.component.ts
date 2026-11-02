import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'lodash';

const EXCLUDED_DEVICE_KEYS: string[] = [
  '_id',
  'profileName',
  'profileId',
  'available',
  'createdAt',
  'updatedAt',
  'continueRegFlg',
  'showContent',
  '__v'
];

@Component({
  selector: 'app-dynamic-device-details-dialog',
  templateUrl: './dynamic-device-details-dialog.component.html',
  styleUrls: ['./dynamic-device-details-dialog.component.scss'],
})
export class DynamicDeviceDetailsDialogComponent implements OnInit {
  category: string = '';
  deviceList: any[] = [];

  allNodes: any[] = [];
  allDevices: any[] = [];
  nodes: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<DynamicDeviceDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.category = data.category || '';
    this.nodes = data.nodes || [];
    this.allNodes = data.allNodes || [];
    this.allDevices = data.allDevices || [];
  }

  ngOnInit() {
    this.buildDeviceList();
  }

  private buildDeviceList() {
    this.deviceList = [];
    this.nodes.forEach((node) => {
      const nodeObj = _.find(this.allNodes, { _id: node.nodeId });
      const neName = nodeObj ? nodeObj.nodeName : node.nodeId;

      // For dynamic nodes with assignedDevices, show each assigned device as a separate entry
      if (node.dyn && node.assignedDevices && node.assignedDevices.length > 0) {
        node.assignedDevices.forEach((devId: string) => {
          const device = _.find(this.allDevices, { _id: devId });
          this.deviceList.push({
            neName: neName,
            device: device || null,
            showContent: false,
          });
        });
      } else {
        // Static node: find device by deviceId first, then fall back to profileId match
        let device = null;
        if (node.deviceId) {
          device = _.find(this.allDevices, { _id: node.deviceId });
        }
        if (!device && node.profileId) {
          device = _.find(this.allDevices, { profileId: node.profileId });
        }
        this.deviceList.push({
          neName: neName,
          device: device || null,
          showContent: false,
        });
      }
    });
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

  formatValue(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  }

  onClose() {
    this.dialogRef.close();
  }
}
