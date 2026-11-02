import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/@core/services/api.service';
import { UserService } from 'src/app/@core/services/user.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';

// Transient keys the refresh action may attach to a device object; they must
// not be persisted onto the device document.
const TRANSIENT_DEVICE_KEYS = ['checkstatus', 'port', 'Waiting time', 'topicName', 'API_ENDPOINT'];

@Component({
  selector: 'app-configure-testbed-api',
  templateUrl: './configure-testbed-api.component.html',
  styleUrls: ['./configure-testbed-api.component.scss']
})
export class ConfigureTestbedApiComponent implements OnInit {
  apiGroups: any[] = [];
  allApis: any[] = [];
  loading = false;
  saving = false;

  config = {
    ping: { group: null, api: null },
    ssh: { group: null, api: null },
    status: { group: null, api: null }
  };

  // Search terms for the group / API dropdown filters (per row).
  groupSearch = { ping: '', ssh: '', status: '' };
  apiSearch = { ping: '', ssh: '', status: '' };

  constructor(
    public dialogRef: MatDialogRef<ConfigureTestbedApiComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private userService: UserService,
    private deviceInventoryService: DeviceInventoryService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.apiService.getAllData().subscribe((data: any) => {
      const list = Array.isArray(data) ? data : [];

      // Extract API groups: container objects hold an `apiGroups` array
      const groupContainer = list.find(item => Array.isArray(item.apiGroups));
      this.apiGroups = groupContainer ? groupContainer.apiGroups : [];

      // Extract APIs: objects that have apiGroupId, apiName and arguments
      this.allApis = list.filter(item =>
        item.apiGroupId !== undefined &&
        item.apiName !== undefined &&
        item.arguments !== undefined
      );
      this.loading = false;
      this.prefillExistingSelection();
    }, () => {
      this.loading = false;
    });
  }

  /**
   * Pre-fill dropdowns from the previously saved selection. When a device is
   * supplied, the selection is read from the device document; otherwise from
   * the legacy LabSetup design cell.
   */
  private prefillExistingSelection(): void {
    const source = this.getDeviceDoc() || this.getDesignSlot();
    if (!source) {
      return;
    }
    ['ping', 'ssh', 'status'].forEach((type: string) => {
      const saved = source[type + 'Api'];
      if (saved) {
        const group = this.apiGroups.find(g => g._id === saved.apiGroupId);
        const api = this.allApis.find(a => a._id === saved.apiId);
        this.config[type].group = group || null;
        this.config[type].api = api || null;
      }
    });
  }

  /** The device document being configured (null for legacy slot-level). */
  private getDeviceDoc(): any {
    const d = this.data && this.data.device;
    return (d && d.deviceDetails) ? d.deviceDetails : null;
  }

  getApisForGroup(group: any): any[] {
    if (!group) {
      return [];
    }
    return this.allApis.filter(api => api.apiGroupId === group._id);
  }

  /** Groups filtered by the row's search term. */
  getFilteredGroups(type: string): any[] {
    const term = (this.groupSearch[type] || '').toLowerCase().trim();
    if (!term) {
      return this.apiGroups;
    }
    return this.apiGroups.filter(g => (g.name || '').toLowerCase().includes(term));
  }

  /** APIs for the row's selected group, filtered by the row's search term. */
  getFilteredApis(type: string): any[] {
    const apis = this.getApisForGroup(this.config[type].group);
    const term = (this.apiSearch[type] || '').toLowerCase().trim();
    if (!term) {
      return apis;
    }
    return apis.filter(a => (a.apiName || '').toLowerCase().includes(term));
  }

  /** Reset a dropdown's search term when its panel closes. */
  onGroupPanelToggle(type: string, opened: boolean): void {
    if (!opened) {
      this.groupSearch[type] = '';
    }
  }

  onApiPanelToggle(type: string, opened: boolean): void {
    if (!opened) {
      this.apiSearch[type] = '';
    }
  }

  onGroupChange(type: string): void {
    this.config[type].api = null;
    this.apiSearch[type] = '';
  }

  /**
   * Locate the matching object inside the rack's design array (by shelf/column).
   */
  private getDesignSlot(): any {
    const rackData = this.data && this.data.rackData;
    if (!rackData || !Array.isArray(rackData.design)) {
      return null;
    }
    for (let j = 0; j < rackData.design.length; j++) {
      for (let k = 0; k < rackData.design[j].length; k++) {
        const cell = rackData.design[j][k];
        if (cell.shelf === this.data.selfName && cell.coloum === this.data.columnName) {
          return cell;
        }
      }
    }
    return null;
  }

  private buildSelection(sel: any): any {
    return {
      apiGroupId: sel.group ? sel.group._id : null,
      apiGroupName: sel.group ? sel.group.name : null,
      apiId: sel.api ? sel.api._id : null,
      apiName: sel.api ? sel.api.apiName : null
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const selection = {
      pingApi: this.buildSelection(this.config.ping),
      sshApi: this.buildSelection(this.config.ssh),
      statusApi: this.buildSelection(this.config.status)
    };

    const deviceDoc = this.getDeviceDoc();
    if (deviceDoc) {
      this.saveToDevice(deviceDoc, selection);
    } else {
      this.saveToLabSetup(selection);
    }
  }

  /** Persist the selection onto the device document (device collection). */
  private saveToDevice(deviceDoc: any, selection: any): void {
    // Build a clean copy of the device doc without transient refresh keys.
    const payload: any = { ...deviceDoc };
    TRANSIENT_DEVICE_KEYS.forEach(key => delete payload[key]);
    payload.pingApi = selection.pingApi;
    payload.sshApi = selection.sshApi;
    payload.statusApi = selection.statusApi;

    this.saving = true;
    this.deviceInventoryService.editDevice(payload).subscribe(
      () => {
        this.saving = false;
        // Reflect on the in-memory device so the dialog re-opens prefilled.
        deviceDoc.pingApi = selection.pingApi;
        deviceDoc.sshApi = selection.sshApi;
        deviceDoc.statusApi = selection.statusApi;
        this.snackBar.open('Device API configuration saved successfully.', 'OK', { duration: 4000 });
        this.dialogRef.close({
          element: this.data && this.data.element,
          device: this.data && this.data.device,
          ping: selection.pingApi,
          ssh: selection.sshApi,
          status: selection.statusApi
        });
      },
      (error: any) => {
        this.saving = false;
        console.error('Error saving device API configuration:', error);
        this.snackBar.open('Error saving configuration. Try again.', 'Try Again', { duration: 4000 });
      }
    );
  }

  /** Legacy fallback: persist on the LabSetup design cell (no device supplied). */
  private saveToLabSetup(selection: any): void {
    const rackData = this.data && this.data.rackData;
    const slot = this.getDesignSlot();

    if (!rackData || !slot) {
      this.snackBar.open('Unable to locate the testbed slot to save.', 'OK', { duration: 4000 });
      return;
    }

    slot.pingApi = selection.pingApi;
    slot.sshApi = selection.sshApi;
    slot.statusApi = selection.statusApi;

    this.saving = true;
    this.userService.updateLabSetConf(rackData).subscribe(
      () => {
        this.saving = false;
        this.snackBar.open('Testbed API configuration saved successfully.', 'OK', { duration: 4000 });
        this.dialogRef.close({
          element: this.data && this.data.element,
          ping: selection.pingApi,
          ssh: selection.sshApi,
          status: selection.statusApi
        });
      },
      (error) => {
        this.saving = false;
        console.error('Error saving testbed API configuration:', error);
        this.snackBar.open('Error saving configuration. Try again.', 'Try Again', { duration: 4000 });
      }
    );
  }
}
