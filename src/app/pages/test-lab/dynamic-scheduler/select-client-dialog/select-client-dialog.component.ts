import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import * as _ from 'lodash';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { MatSelect } from '@angular/material/select';
import { Observable, of } from 'rxjs';
import { startWith, map, catchError } from 'rxjs/operators';
 
@Component({
  selector: 'app-select-client-dialog',
  templateUrl: './select-client-dialog.component.html',
  styleUrls: ['./select-client-dialog.component.scss'],
})
export class SelectClientDialogComponent implements OnInit, OnDestroy {
  @ViewChild('clientSelect') clientSelect: MatSelect;
  @ViewChild('search') searchTextBox: ElementRef;
 
  allDevices = [];
  allTestbeds = [];
  clientDevices: any[] = [];
  selectedClients: any[] = [];
  allSelected = false;
  // When true, clients currently in use are shown disabled and cannot be selected.
  exclusiveClients = false;
  // Client device ids coupled to a busy DUT in an active schedule (same "in use"
  // definition used for DUTs), populated only when Exclusive Clients is enabled.
  inUseClientIds: Set<string> = new Set();
  // Guards one-time restore of the previous selection across live device refreshes.
  private initialized = false;
 
  selectFormControl = new UntypedFormControl([]);
  searchTextboxControl = new UntypedFormControl();
  filteredDevices: Observable<any[]>;
 
  private sub1;
  private sub2;
  private sub3;
 
  constructor(
    public dialogRef: MatDialogRef<SelectClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dataService: DataService,
    private snackBar: MatSnackBar,
    private testLabService: TestLabService,
    private cdr: ChangeDetectorRef,
  ) {
    this.exclusiveClients = !!(data && data.exclusiveClients);
    // Mirror the DUT "in use" logic for clients: a client coupled to a DUT that is
    // actively running (within a non-terminal schedule) is treated as in use.
    if (this.exclusiveClients) {
      this.sub3 = this.testLabService.getAllDynamicSchedules().pipe(
        catchError(() => of([]))
      ).subscribe((schedules: any) => {
        this.inUseClientIds = this.computeInUseClientIds(schedules);
        // Drop any clients that just became in-use from the current selection.
        this.reconcileSelectionWithDevices();
        this.cdr.detectChanges();
      });
    }
    this.sub1 = this.dataService.getAllDevices().subscribe((devices) => {
      if (devices) {
        this.allDevices = devices;
        this.loadClientDevices();
      }
    });
    this.sub2 = this.dataService.getTestBed().subscribe((testbeds) => {
      if (testbeds) {
        this.allTestbeds = testbeds;
        this.loadClientDevices();
      }
    });
  }
 
  ngOnInit() {
    this.filteredDevices = this.searchTextboxControl.valueChanges.pipe(
      startWith<string>(''),
      map(name => this._filter(name))
    );
  }
 
  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
  }
 
  private loadClientDevices() {
    if (!this.allDevices || this.allDevices.length === 0) return;
    const testbed = this.data.testbed;
    if (!testbed || !testbed.nodes) return;
 
    // Collect all device IDs that are already mapped to any testbed
    const mappedDeviceIds = new Set<string>();
    if (this.allTestbeds && this.allTestbeds.length > 0) {
      this.allTestbeds.forEach(tb => {
        if (tb.nodes && tb.nodes.length > 0) {
          tb.nodes.forEach(node => {
            if (node.deviceId) {
              mappedDeviceIds.add(node.deviceId);
            }
          });
        }
      });
    }
 
    // Get device profile IDs from pool-enabled nodes in the testbed
    const poolProfileIds = [...new Set(
      testbed.nodes.filter(n => n.pool).map(n => n.profileId)
    )];
 
    // device.profileId may be a single string (legacy single-profile devices)
    // or an array (devices added via the multi-profile form). Normalize to an
    // array of ids before checking for any overlap with poolProfileIds.
    const matchesPoolProfile = (d: any) => {
      const ids = Array.isArray(d.profileId) ? d.profileId : [d.profileId];
      return ids.some((id: string) => poolProfileIds.includes(id));
    };
 
    // Filter: devices under pool node profiles AND not mapped to any testbed
    this.clientDevices = this.allDevices.filter(d =>
      matchesPoolProfile(d) && !mappedDeviceIds.has(d._id)
    );
 
    if (!this.initialized) {
      // Restore previously selected clients once on first load.
      if (this.data.previousSelection && this.data.previousSelection.length > 0) {
        const prevIds = this.data.previousSelection;
        // Exclusive mode mirrors the DUT dialog: map over prevIds so the saved
        // selection order survives reopening.
        const preSelected: any[] = this.exclusiveClients
          ? prevIds
              .map((id: string) => this.clientDevices.find(d => d._id === id))
              .filter((d: any) => !!d && !this.isInUse(d))
          : this.clientDevices.filter(d => prevIds.includes(d._id) && !this.isInUse(d));
        // if (preSelected.length > 0) {
        //   this.selectedClients = [...preSelected];
        //   this.allSelected = this.selectedClients.length === this.selectableDevices.length;
        //   const value = this.allSelected ? ['selectAll', ...preSelected] : [...preSelected];
        //   this.selectFormControl.setValue(value);
        // }
        if (preSelected.length > 0) {
          this.selectedClients = [...preSelected];

          const selectableCount = this.selectableDevices.length;

          this.allSelected =
            selectableCount > 0 &&
            this.selectedClients.length === selectableCount;

          this.selectFormControl.setValue(
            this.allSelected
              ? ['selectAll', ...this.selectedClients]
              : [...this.selectedClients],
            { emitEvent: false }
          );
        }
      }
      this.initialized = true;
    } else {
      // On live refresh, keep the user's selection but drop any now in-use/unlisted.
      this.reconcileSelectionWithDevices();
    }
  }
 
  /** Remove clients from the current selection once they become in-use or disappear. */
  private reconcileSelectionWithDevices() {
    if (this.selectedClients.length === 0) return;
    const before = this.selectedClients.length;
    this.selectedClients = this.selectedClients.filter(c => {
      const fresh = this.clientDevices.find(d => d._id === c._id);
      return fresh && !this.isInUse(fresh);
    });
    if (this.selectedClients.length !== before) {
      this.allSelected = this.selectedClients.length === this.selectableDevices.length && this.selectableDevices.length > 0;
      const value = this.allSelected ? ['selectAll', ...this.selectedClients] : [...this.selectedClients];
      this.selectFormControl.setValue(value);
    }
  }
 
  /** A client is "in use" (locked/reserved) only when Exclusive Clients is enabled. */
  isInUse(device: any): boolean {
    if (!this.exclusiveClients || !device) { return false; }
    // In use if the device is reserved OR it is coupled to a DUT that is actively
    // running in a non-terminal dynamic schedule (same status source as DUTs).
    return device.available === false || this.inUseClientIds.has(String(device._id));
  }
 
  /**
   * Build the set of client device ids that are coupled to a DUT currently running
   * in a non-terminal dynamic schedule. Mirrors the DUT in-use detection so a
   * busy client reflects the same status as its paired DUT.
   */
  private computeInUseClientIds(schedules: any[]): Set<string> {
    const ids = new Set<string>();
    if (!schedules?.length) { return ids; }
    const activeDutStatuses = new Set(['inprogress', 'running', 'processing', 'scheduled', 'inqueue']);
    const terminalScheduleStatuses = new Set(['completed', 'stopped', 'cancelled', 'aborted', 'failed']);
    schedules.forEach((s: any) => {
      const status = (s.dynamicScheduleStatus || '').toLowerCase();
      if (terminalScheduleStatuses.has(status) || s.endTime) { return; }
      // A non-terminal (Scheduled / InProgress) schedule reserves ALL its selected
      // clients for the whole run, so mark them in-use immediately — even before a
      // DUT has claimed a specific client.
      (s.clients || []).forEach((c: any) => {
        if (c?.deviceId) { ids.add(String(c.deviceId)); }
      });
      (s.duts || []).forEach((d: any) => {
        if (d?.clientId && activeDutStatuses.has((d.runStatus || '').toLowerCase())) {
          ids.add(String(d.clientId));
        }
      });
    });
    return ids;
  }
 
  /** Devices that can actually be selected (excludes in-use ones when exclusive). */
  get selectableDevices(): any[] {
    return this.clientDevices.filter(d => !this.isInUse(d));
  }
 
  private _filter(value: string): any[] {
    if (!value) return this.clientDevices;
    const filterValue = value.toLowerCase();
    return this.clientDevices.filter(d =>
      d.deviceName.toLowerCase().includes(filterValue)
    );
  }
 
  // openedChange(e: boolean) {
  //   this.searchTextboxControl.setValue('');
  //   if (e && this.searchTextBox) {
  //     this.searchTextBox.nativeElement.focus();
  //   }
  // }
  openedChange(e: boolean) {
  this.searchTextboxControl.setValue('');

  if (e) {
    const selectableCount = this.selectableDevices.length;

    this.allSelected =
      selectableCount > 0 &&
      this.selectedClients.length === selectableCount;

    this.selectFormControl.setValue(
      this.allSelected
        ? ['selectAll', ...this.selectedClients]
        : [...this.selectedClients],
      { emitEvent: false }
    );
  }

  if (e && this.searchTextBox) {
    this.searchTextBox.nativeElement.focus();
  }
}
 
  handleInput(event: KeyboardEvent) {
    event.stopPropagation();
  }
 
  /**
   * mat-select re-sorts its value into option order, which loses the order the
   * user picked the clients in. Used only in exclusive mode, where this dialog
   * mirrors the DUT dialog and the pick order is sent to the backend.
   */
  private preserveSelectionOrder(raw: any[]): any[] {
    const rawIds = new Set(raw.map((d: any) => d._id));
    const ordered = this.selectedClients.filter((d: any) => rawIds.has(d._id));
    const orderedIds = new Set(ordered.map((d: any) => d._id));
    raw.forEach((d: any) => {
      if (!orderedIds.has(d._id)) {
        orderedIds.add(d._id);
        ordered.push(d);
      }
    });
    return ordered;
  }

  toggleSelectAll() {

    if (this.selectableDevices.length === 0) {
      return;
    }

    if (this.allSelected) {
      this.selectFormControl.setValue([]);
      this.selectedClients = [];
      this.allSelected = false;
    } else {
      const selectable = this.selectableDevices;
      const toSelect = this.exclusiveClients
        ? this.preserveSelectionOrder(selectable)
        : selectable;

      this.selectFormControl.setValue(['selectAll', ...toSelect]);
      this.selectedClients = [...toSelect];
      this.allSelected = true;
    }
  }

 
  selectionChange(event) {
    let selected = (this.selectFormControl.value || []).filter(v => v !== 'selectAll');
    // Never allow in-use clients into the selection.
    selected = selected.filter(d => !this.isInUse(d));
    if (this.exclusiveClients) {
      selected = this.preserveSelectionOrder(selected);
    }
    this.selectedClients = [...selected];
    this.allSelected = this.selectedClients.length === this.selectableDevices.length && this.selectableDevices.length > 0;
    // Sync the selectAll option in the form control
    if (this.allSelected && !this.selectFormControl.value.includes('selectAll')) {
      this.selectFormControl.setValue(['selectAll', ...this.selectedClients]);
    } else if (!this.allSelected && this.selectFormControl.value.includes('selectAll')) {
      this.selectFormControl.setValue([...this.selectedClients]);
    } else if (selected.length !== (this.selectFormControl.value || []).filter(v => v !== 'selectAll').length) {
      this.selectFormControl.setValue([...this.selectedClients]);
    }
  }
 
  removeDevice(device: any) {
    this.selectedClients = this.selectedClients.filter(d => d._id !== device._id);
    this.allSelected = this.selectedClients.length === this.selectableDevices.length;
    const value = this.allSelected ? ['selectAll', ...this.selectedClients] : [...this.selectedClients];
    this.selectFormControl.setValue(value);
  }
 
  onUpdate() {
    if (this.selectedClients.length === 0) {
      this.snackBar.open('Please select at least one client device.', 'OK', { duration: 3000 });
      return;
    }
    this.dialogRef.close({
      action: 'finish',
      selectedDevices: this.selectedClients.map(d => ({ _id: d._id, deviceName: d.deviceName })),
      selectedDeviceIds: this.selectedClients.map(d => d._id)
    });
  }
 
  get triggerDisplayText(): string {
    return this.selectedClients.map(d => d.deviceName).join(', ');
  }

  compareDevices = (a: any, b: any): boolean => {
    if (a === b) { return true; }
    return !!a && !!b && a._id === b._id;
  }

  /** Exclusive teams pick clients explicitly; otherwise the pool is just shown. */
  get dialogTitle(): string {
    return this.exclusiveClients ? 'Select Clients' : 'Available Clients';
  }
 
  onCancel() {
    this.dialogRef.close();
  }
}