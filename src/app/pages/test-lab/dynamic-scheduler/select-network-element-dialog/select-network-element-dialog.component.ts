import { Component, OnInit, Inject, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import {
  UntypedFormControl,
} from '@angular/forms';
import * as _ from 'lodash';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { NameFromIdPipe } from 'src/app/@shared/pipes/name-from-id.pipe';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { Observable, of } from 'rxjs';
import { startWith, map, catchError } from 'rxjs/operators';
import { TreeviewConfig, TreeviewItem } from '@samotics/ngx-treeview';
import { TestLabService } from 'src/app/@core/services/test-lab.service';

@Component({
  selector: 'app-select-network-element-dialog',
  templateUrl: './select-network-element-dialog.component.html',
  styleUrls: ['./select-network-element-dialog.component.scss'],
  providers: [NameFromIdPipe],
})
export class SelectNetworkElementDialogComponent implements OnInit, OnDestroy {
  @ViewChild('dutSelect') dutSelect: MatSelect;
  @ViewChild('search') searchTextBox: ElementRef;

  allDevices = [];
  allTestbeds = [];
  dutDevices: any[] = [];
  selectedDUTs: any[] = [];
  allSelected = false;
  private initialized = false;
  lockedIds: Set<string> = new Set();
  inUseIds: Set<string> = new Set();

  selectFormControl = new UntypedFormControl([]);
  searchTextboxControl = new UntypedFormControl();
  filteredDevices: Observable<any[]>;

  // Test data used to render the read-only Model - TC Matrix preview for a DUT
  allTestsuite: any[] = [];
  allTestcase: any[] = [];
  allTestgroup: any[] = [];

  // DUT TC-matrix preview modal state (mirrors the dynamic-scheduler form)
  showDutMatrixModal = false;
  dutMatrixModalTitle = '';
  dutMatrixItems: TreeviewItem[] = [];
  dutMatrixConfig = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: false,
    maxHeight: 400,
  });
  // Tracks which DUT is open in the modal and the per-DUT {tcId, suiteId} selection.
  // Only DUTs the user actually opened + edited get an entry here; DUTs left
  // untouched fall back to the full Model - TC Matrix mapping.
  private dutMatrixActiveDutId = '';
  private dutMatrixTcToSuiteMap: { [tcId: string]: string } = {};
  dutMatrixSelections: { [dutId: string]: Array<{ tcId: string; suiteId: string }> } = {};

  private sub1;
  private sub2;
  private sub3;
  private sub4;
  private sub5;
  private sub6;

  constructor(
    public dialogRef: MatDialogRef<SelectNetworkElementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dataService: DataService,
    private nameFromId: NameFromIdPipe,
    private snackBar: MatSnackBar,
    private testLabService: TestLabService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sub3 = this.testLabService.getAllDynamicSchedules().pipe(
      catchError(() => of([]))
    ).subscribe((schedules: any) => {
      if (!schedules || !schedules.length) return;

      // Only schedules actively running — use a whitelist, not a blacklist,
      // to avoid picking up old abandoned "Scheduled" records in the DB
      const activeScheduleStatuses = ['inprogress'];

      // DUT runStatus values that mean the device is actively occupied
      const busyDutStatuses = ['inprogress', 'inqueue', 'processing'];

      const ids = new Set<string>();

      const activeSchedules = schedules.filter((s: any) => {
        const status = (s.dynamicScheduleStatus || '').toLowerCase();
        // Must be InProgress / Scheduled AND must not have an endTime (endTime means it finished)
        return (status === 'inprogress' || status === 'scheduled') && !s.endTime;
      });

      console.log('[SelectDUTs] Total schedules:', schedules.length);
      console.log('[SelectDUTs] Active (InProgress) schedules:', activeSchedules.length);
      console.log('[SelectDUTs] Active schedule statuses:', activeSchedules.map((s: any) => ({
        tag: s.dynamicRegressionTagName,
        status: s.dynamicScheduleStatus,
        endTime: s.endTime,
        duts: (s.duts || []).map((d: any) => ({ deviceId: d.deviceId, runStatus: d.runStatus }))
      })));

      activeSchedules.forEach((s: any) => {
        (s.duts || []).forEach((d: any) => {
          if (d.deviceId && busyDutStatuses.includes((d.runStatus || '').toLowerCase())) {
            ids.add(String(d.deviceId));
          }
        });
      });

      console.log('[SelectDUTs] inUseIds:', Array.from(ids));
      this.inUseIds = ids;
      this.cdr.detectChanges();
    });

    this.sub1 = this.dataService.getAllDevices().subscribe((devices) => {
      if (devices) {
        this.allDevices = devices;
        this.loadDutDevices();
      }
    });

    this.sub2 = this.dataService.getTestBed().subscribe((testbeds) => {
      if (testbeds) {
        this.allTestbeds = testbeds;
        this.loadDutDevices();
      }
    });

    // Preload test hierarchy so the DUT link can render the TC-matrix preview
    this.sub4 = this.dataService.getTestGroup().subscribe((tcGroup) => {
      if (tcGroup) { this.allTestgroup = tcGroup; }
    });
    this.sub5 = this.dataService.getTestCases().subscribe((tc) => {
      if (tc) { this.allTestcase = tc; }
    });
    this.sub6 = this.dataService.getTestSuites().subscribe((ts) => {
      if (ts) { this.allTestsuite = ts; }
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
    if (this.sub4) this.sub4.unsubscribe();
    if (this.sub5) this.sub5.unsubscribe();
    if (this.sub6) this.sub6.unsubscribe();
  }

private loadDutDevices() {

  if (!this.allDevices || this.allDevices.length === 0) {
    return;
  }

  const testbed = this.data.testbed;

  if (!testbed || !testbed.nodes) {
    return;
  }

  this.lockedIds = new Set<string>(
    this.data.lockedDeviceIds || []
  );

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

  const dynProfileIds = [
    ...new Set(
      testbed.nodes
        .filter(n => n.dyn)
        .map(n => n.profileId)
    )
  ];

  const matchesDynProfile = (d: any) => {

    const ids = Array.isArray(d.profileId)
      ? d.profileId
      : [d.profileId];

    return ids.some((id: string) =>
      dynProfileIds.includes(id)
    );
  };

  this.dutDevices = this.allDevices.filter(
    d =>
      this.lockedIds.has(d._id) ||
      (
        matchesDynProfile(d) &&
        !mappedDeviceIds.has(d._id)
      )
  );

  /**
   * First load only:
   * Restore previous selection once.
   */
  if (!this.initialized) {

    if (this.lockedIds.size > 0) {

      const lockedDevices =
        this.dutDevices.filter(
          d => this.lockedIds.has(d._id)
        );

      this.selectedDUTs = [...lockedDevices];
    }

    if (
      this.data.previousSelection &&
      this.data.previousSelection.length > 0
    ) {

      const prevIds =
        this.data.previousSelection;

      const preSelected: any[] =
        prevIds
          .map((id: string) =>
            this.dutDevices.find(
              d => d._id === id
            )
          )
          .filter(Boolean);

      if (preSelected.length > 0) {

        const merged = [
          ...this.selectedDUTs
        ];

        preSelected.forEach((d: any) => {

          if (
            !merged.some(
              m => m._id === d._id
            )
          ) {
            merged.push(d);
          }

        });

        this.selectedDUTs = merged;
      }
    }

    this.initialized = true;

  } else {

    /**
     * Subsequent refreshes:
     * Never re-apply previousSelection.
     * Preserve current user selections.
     */
    this.reconcileSelection();

    return;
  }

  const selectable = this.selectableDevices;

  const selectedSelectableIds = new Set(
    this.selectedDUTs
      .filter(
        d =>
          !this.lockedIds.has(d._id) &&
          !this.isInUse(d)
      )
      .map(d => d._id)
  );

  this.allSelected =
    selectable.length > 0 &&
    selectable.every(
      d => selectedSelectableIds.has(d._id)
    );

  const value = this.allSelected
    ? ['selectAll', ...this.selectedDUTs]
    : [...this.selectedDUTs];

  this.selectFormControl.setValue(
    value,
    { emitEvent: false }
  );
  console.log(
  '[loadDutDevices]',
  'initialized=', this.initialized,
  'selectedDUTs=', this.selectedDUTs.length
);
}

  private _filter(value: string): any[] {
    if (!value) return this.dutDevices;
    const filterValue = value.toLowerCase();
    return this.dutDevices.filter(d =>
      d.deviceName.toLowerCase().includes(filterValue)
    );
  }

  openedChange(e: boolean) {

    this.searchTextboxControl.setValue('');

    if (e) {

      const selectable = this.selectableDevices;

      const selectedSelectableIds = new Set(
        this.selectedDUTs
          .filter(d => !this.isLocked(d) && !this.isInUse(d))
          .map(d => d._id)
      );

      this.allSelected =
        selectable.length > 0 &&
        selectable.every(d => selectedSelectableIds.has(d._id));
    }

    if (e && this.searchTextBox) {
      this.searchTextBox.nativeElement.focus();
    }
  }

  handleInput(event: KeyboardEvent) {
    event.stopPropagation();
  }

  /** Devices that can actually be selected — not locked and not in-use */
  get selectableDevices(): any[] {
    return this.dutDevices.filter(d => !this.isLocked(d) && !this.isInUse(d));
  }

  toggleSelectAll() {

  if (this.selectableDevices.length === 0) {
    return;
  }

  if (this.allSelected) {

    const lockedDevices =
      this.dutDevices.filter(
        d => this.lockedIds.has(d._id)
      );

    this.selectedDUTs = [...lockedDevices];
    this.allSelected = false;

    const value =
      lockedDevices.length > 0
        ? [...lockedDevices]
        : [];

    this.selectFormControl.setValue(
      value,
      { emitEvent: false }
    );

  } else {

    const selectable =
      this.selectableDevices;

    const lockedDevices =
      this.dutDevices.filter(
        d => this.lockedIds.has(d._id)
      );

    const toSelect =
      this.preserveSelectionOrder([
        ...lockedDevices,
        ...selectable
      ]);

    this.selectFormControl.setValue(
      ['selectAll', ...toSelect],
      { emitEvent: false }
    );

    this.selectedDUTs = [...toSelect];
    this.allSelected = true;
  }
}

  /**
   * mat-select re-sorts its value into option order, which loses the order the
   * user picked the DUTs in. Re-apply the previous selection order and append
   * newly picked devices at the end so the click order is retained.
   */
  private preserveSelectionOrder(raw: any[]): any[] {
    const rawIds = new Set(raw.map((d: any) => d._id));
    const ordered = this.selectedDUTs.filter((d: any) => rawIds.has(d._id));
    const orderedIds = new Set(ordered.map((d: any) => d._id));
    raw.forEach((d: any) => {
      if (!orderedIds.has(d._id)) {
        orderedIds.add(d._id);
        ordered.push(d);
      }
    });
    return ordered;
  }
  private reconcileSelection(): void {

  const currentIds = new Set(
    this.dutDevices.map(d => d._id)
  );

  this.selectedDUTs = this.selectedDUTs.filter(
    d => currentIds.has(d._id)
  );

  const selectable = this.selectableDevices;

  const selectedSelectableIds = new Set(
    this.selectedDUTs
      .filter(d => !this.isLocked(d))
      .map(d => d._id)
  );

  this.allSelected =
    selectable.length > 0 &&
    selectable.every(d => selectedSelectableIds.has(d._id));

  this.selectFormControl.setValue(
    this.allSelected
      ? ['selectAll', ...this.selectedDUTs]
      : [...this.selectedDUTs],
    { emitEvent: false }
  );
  console.log(
  '[reconcileSelection]',
  this.selectedDUTs.length
);
}

  selectionChange(event) {
    // Filter out 'selectAll' sentinel and in-use devices (shouldn't be selectable but guard anyway)
    const rawSelected = (this.selectFormControl.value || []).filter(
      (v: any) => v !== 'selectAll' && !this.isInUse(v)
    );
    const selected = this.preserveSelectionOrder(rawSelected);
    // Force-keep any locked DUTs that the user tried to deselect, restoring
    // them at the position they held in the current selection order
    if (this.lockedIds.size > 0) {
      const stillSelectedIds = new Set(selected.map((d: any) => d._id));
      const prevIndex = new Map<string, number>(this.selectedDUTs.map((d: any, i: number) => [d._id, i] as [string, number]));
      const lockedDevices = this.dutDevices.filter(d => this.lockedIds.has(d._id));
      lockedDevices.forEach(d => {
        if (!stillSelectedIds.has(d._id)) {
          const idx = prevIndex.has(d._id) ? (prevIndex.get(d._id) as number) : selected.length;
          selected.splice(Math.min(idx, selected.length), 0, d);
        }
      });
    }
    this.selectedDUTs = [...selected];
    // allSelected means all selectable (non-locked, non-in-use) devices are chosen
    const selectable = this.selectableDevices;
    const selectedSelectableIds = new Set(selected.filter((d: any) => !this.isLocked(d)).map((d: any) => d._id));
    this.allSelected = selectable.length > 0 && selectable.every((d: any) => selectedSelectableIds.has(d._id));
    // if (this.allSelected && !this.selectFormControl.value.includes('selectAll')) {
    //   this.selectFormControl.setValue(['selectAll', ...this.selectedDUTs]);
    // } else if (!this.allSelected && this.selectFormControl.value.includes('selectAll')) {
    //   this.selectFormControl.setValue([...this.selectedDUTs]);
    // }
    const currentValue = this.selectFormControl.value || [];

    if (this.allSelected && !currentValue.includes('selectAll')) {
      this.selectFormControl.setValue(
        ['selectAll', ...this.selectedDUTs],
        { emitEvent: false }
      );
    }
    else if (!this.allSelected && currentValue.includes('selectAll')) {
      this.selectFormControl.setValue(
        [...this.selectedDUTs],
        { emitEvent: false }
      );
    }
  }

  isLocked(device: any): boolean {
    return !!device && this.lockedIds.has(device._id);
  }

  isInUse(device: any): boolean {
    return !!device && !this.isLocked(device) && this.inUseIds.has(String(device._id));
  }

  /** Returns true when selection mode is modelTcMatrix AND the device's model has no TC mapping. */
  isUnmapped(device: any): boolean {
    if (!device || this.data.selectionMode !== 'modelTcMatrix') return false;
    const modelTCMatrix = this.data.modelTCMatrix || {};
    const allModels: any[] = this.data.allModels || [];
    const modelDoc = allModels.find((m: any) => m && m.modelName === device.model);
    const modelId = modelDoc
      ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : ''))
      : '';
    if (!modelId) return true;
    const entry = modelTCMatrix[modelId];
    if (!entry || !entry.testSuites) return true;
    return !Object.keys(entry.testSuites).some((suiteId: string) => {
      const suite = entry.testSuites[suiteId];
      return suite && Array.isArray(suite.tcIds) && suite.tcIds.length > 0;
    });
  }

  /** True when in Model - TC Matrix mode and the device's model has mapped TCs. */
  hasDutMatrix(device: any): boolean {
    return this.data.selectionMode === 'modelTcMatrix' && !this.isUnmapped(device);
  }

  /** Resolves the modelId for a device from the injected model list. */
  private resolveModelId(device: any): string {
    const allModels: any[] = this.data.allModels || [];
    const modelDoc = allModels.find((m: any) => m && m.modelName === device.model);
    return modelDoc
      ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : ''))
      : '';
  }

  /**
   * Builds a read-only ngx-treeview of the DUT's mapped test cases (grouped by
   * suite -> group -> testcase) and opens the inline preview modal. Mirrors the
   * dynamic-scheduler form's openDutTcMatrixPreview so both screens look alike.
   * In Test Suite Selection mode (no per-DUT mapping), falls back to the
   * schedule's shared, read-only test case list (data.jobOnExecution).
   */
  openDutTcMatrixPreview(device: any) {
    this.dutMatrixActiveDutId = device._id;
    this.dutMatrixModalTitle = device.deviceName;
    this.dutMatrixItems = [];
    this.dutMatrixTcToSuiteMap = {};

    if (this.data.selectionMode !== 'modelTcMatrix') {
      this.buildReadOnlyTestSuitePreview();
      this.showDutMatrixModal = true;
      return;
    }

    const modelTCMatrix = this.data.modelTCMatrix || {};
    const modelId = this.resolveModelId(device);
    const matrixEntry = modelId && modelTCMatrix[modelId] ? modelTCMatrix[modelId] : null;

    if (!matrixEntry) {
      // No mapping — open with empty items so the "configure" message shows
      this.showDutMatrixModal = true;
      return;
    }

    // First open for this DUT: pre-check every TC that exists in the matrix.
    if (!this.dutMatrixSelections[device._id]) {
      this.dutMatrixSelections[device._id] = [];
      Object.keys(matrixEntry.testSuites || {}).forEach(suiteId => {
        const tcIds: string[] = (matrixEntry.testSuites[suiteId] && matrixEntry.testSuites[suiteId].tcIds) ? matrixEntry.testSuites[suiteId].tcIds : [];
        const seenInSuite = new Set<string>();
        tcIds.forEach(tcId => {
          if (!seenInSuite.has(tcId)) {
            seenInSuite.add(tcId);
            this.dutMatrixSelections[device._id].push({ tcId, suiteId });
          }
        });
      });
    }

    const savedSelection = this.dutMatrixSelections[device._id] || [];
    // Track selection by a composite suiteId::tcId key so the SAME test case
    // mapped under multiple suites is checked/unchecked independently per suite.
    const selectedKeySet = new Set<string>(savedSelection.map(s => s.suiteId + '::' + s.tcId));

    Object.keys(matrixEntry.testSuites || {}).forEach((suiteId: string) => {
      const matrixSuite = matrixEntry.testSuites[suiteId];
      const mappedTcIds: string[] = (matrixSuite && Array.isArray(matrixSuite.tcIds)) ? matrixSuite.tcIds : [];
      if (mappedTcIds.length === 0) return;

      const suiteDoc: any = this.allTestsuite.find((s: any) => s && s._id === suiteId);
      const suiteName: string = (suiteDoc && suiteDoc.testSuiteName) || (matrixSuite && matrixSuite.suiteName) || suiteId;

      const resolvedTCs: any[] = mappedTcIds
        .map(tcId => (this.allTestcase || []).find((tc: any) => tc && tc._id === tcId))
        .filter((tc: any) => !!tc);
      if (resolvedTCs.length === 0) return;

      const groupMap: { [gId: string]: any[] } = {};
      resolvedTCs.forEach(tc => {
        const gId = tc.tcGroupId || 'ungrouped';
        if (!groupMap[gId]) groupMap[gId] = [];
        groupMap[gId].push(tc);
      });

      const groupItems = Object.keys(groupMap).map(gId => {
        const groupDoc = this.allTestgroup.find((g: any) => g._id === gId);
        const groupName = groupDoc ? (groupDoc as any).testGroupName : (gId === 'ungrouped' ? 'Ungrouped' : gId);
        const tcItems = groupMap[gId].map(tc => {
          const key = suiteId + '::' + tc._id;
          this.dutMatrixTcToSuiteMap[key] = suiteId;
          return new TreeviewItem({ text: tc.tcName, value: key, checked: selectedKeySet.has(key) });
        });
        return new TreeviewItem({ text: groupName, value: gId, collapsed: true, checked: false, children: tcItems });
      });

      this.dutMatrixItems.push(new TreeviewItem({ text: suiteName, value: suiteId, collapsed: true, checked: false, children: groupItems }));
    });

    // Leaves already carry the correct checked state; only bubble parent states.
    this.bubbleParentChecked(this.dutMatrixItems);
    // At least one test case must remain selected: disable the last checked leaf.
    this.enforceMinimumOneChecked();

    this.showDutMatrixModal = true;
  }

  /**
   * Test Suite Selection mode has no per-DUT mapping — every DUT runs the same
   * test cases (data.jobOnExecution, {tcId, suiteId} pairs shared by the whole
   * schedule). Builds the same suite -> group -> testcase tree, fully checked
   * and disabled (view-only; there is nothing per-DUT to customize here).
   */
  private buildReadOnlyTestSuitePreview(): void {
    const onExecution: Array<{ tcId: string; suiteId: string }> = this.data.jobOnExecution || [];
    if (onExecution.length === 0) { return; }

    const tcIdsBySuite: { [suiteId: string]: string[] } = {};
    onExecution.forEach(e => {
      if (!e || !e.suiteId || !e.tcId) return;
      if (!tcIdsBySuite[e.suiteId]) { tcIdsBySuite[e.suiteId] = []; }
      tcIdsBySuite[e.suiteId].push(e.tcId);
    });

    Object.keys(tcIdsBySuite).forEach((suiteId: string) => {
      const suiteDoc: any = this.allTestsuite.find((s: any) => s && s._id === suiteId);
      const suiteName: string = (suiteDoc && suiteDoc.testSuiteName) || suiteId;

      const resolvedTCs: any[] = tcIdsBySuite[suiteId]
        .map(tcId => (this.allTestcase || []).find((tc: any) => tc && tc._id === tcId))
        .filter((tc: any) => !!tc);
      if (resolvedTCs.length === 0) return;

      const groupMap: { [gId: string]: any[] } = {};
      resolvedTCs.forEach(tc => {
        const gId = tc.tcGroupId || 'ungrouped';
        if (!groupMap[gId]) groupMap[gId] = [];
        groupMap[gId].push(tc);
      });

      const groupItems = Object.keys(groupMap).map(gId => {
        const groupDoc = this.allTestgroup.find((g: any) => g._id === gId);
        const groupName = groupDoc ? (groupDoc as any).testGroupName : (gId === 'ungrouped' ? 'Ungrouped' : gId);
        const tcItems = groupMap[gId].map(tc =>
          new TreeviewItem({ text: tc.tcName, value: tc._id, checked: true, disabled: true }));
        return new TreeviewItem({ text: groupName, value: gId, collapsed: true, checked: true, disabled: true, children: tcItems });
      });

      this.dutMatrixItems.push(new TreeviewItem({ text: suiteName, value: suiteId, collapsed: true, checked: true, disabled: true, children: groupItems }));
    });
  }

  /**
   * Enforces that at least one test case stays selected for the DUT.
   * Unchecking a parent testsuite/testgroup can clear several test cases at
   * once, so whenever the selection would become empty we restore one test
   * case (preferring one from the previous selection). When exactly one leaf
   * remains checked, only that single test case checkbox is disabled so it
   * cannot be removed; every other test case stays enabled and selectable.
   * Returns the effective set of selected leaf keys after enforcement.
   */
  private enforceMinimumOneChecked(selectedKeys?: string[]): string[] {
    const leaves: TreeviewItem[] = [];
    const collect = (items: TreeviewItem[]) => {
      (items || []).forEach(it => {
        if (it.children && it.children.length > 0) { collect(it.children); }
        else { leaves.push(it); }
      });
    };
    collect(this.dutMatrixItems);

    const selectedSet = new Set<string>(
      selectedKeys ? selectedKeys : leaves.filter(l => l.checked === true).map(l => l.value)
    );
    let checkedLeaves = leaves.filter(l => selectedSet.has(l.value));

    // If every test case got unchecked (e.g. user unchecked all suites), restore one.
    if (checkedLeaves.length === 0 && leaves.length > 0) {
      const dutId = this.dutMatrixActiveDutId;
      const prev = (dutId && this.dutMatrixSelections[dutId]) ? this.dutMatrixSelections[dutId] : [];
      let restore: TreeviewItem | undefined;
      if (prev.length > 0) {
        const prevKey = prev[0].suiteId + '::' + prev[0].tcId;
        restore = leaves.find(l => l.value === prevKey);
      }
      if (!restore) { restore = leaves[0]; }
      selectedSet.add(restore.value);
      checkedLeaves = [restore];
    }

    const lockLast = checkedLeaves.length === 1 ? checkedLeaves[0] : null;
    // Sync every leaf's checked state with the effective selection (covers restore).
    // Only the single remaining test case is disabled; all other test cases stay
    // enabled so the user can freely add more. Parent group/suite checkboxes are
    // NOT disabled (ngx-treeview cascades a parent's disabled state onto its
    // children, which would block selecting the other test cases); unchecking a
    // parent is instead safely handled by the restore-on-empty logic above.
    leaves.forEach(l => {
      l.checked = selectedSet.has(l.value);
      l.disabled = lockLast ? (l === lockLast) : false;
    });
    // Recompute parent checked states from the (possibly restored) leaves.
    this.bubbleParentChecked(this.dutMatrixItems);

    return Array.from(selectedSet);
  }

  /** Recursively recomputes each parent node's checked state from its children. */
  private bubbleParentChecked(items: TreeviewItem[]): void {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        this.bubbleParentChecked(item.children);
        item.correctChecked();
      }
    });
  }

  /** Persists the user's checked TCs (in matrix order) for the active DUT.
   *  No-op in Test Suite mode: that preview is read-only (shared across all DUTs). */
  onDutMatrixSelectionChange(selectedKeys: string[]) {
    if (this.data.selectionMode !== 'modelTcMatrix') return;
    const dutId = this.dutMatrixActiveDutId;
    if (!dutId) return;

    // Enforce the minimum-one rule first; it may restore a test case if the
    // user unchecked everything, so persist the effective selection it returns.
    const effectiveKeys = this.enforceMinimumOneChecked(selectedKeys);
    const selectedSet = new Set<string>(effectiveKeys);

    const device = this.selectedDUTs.find((d: any) => d._id === dutId);
    const modelTCMatrix = this.data.modelTCMatrix || {};
    const modelId = device ? this.resolveModelId(device) : '';
    const matrixEntry = modelId && modelTCMatrix[modelId] ? modelTCMatrix[modelId] : null;

    if (matrixEntry) {
      // Re-order back to matrix-defined order so execution sequence is preserved.
      // Selection is keyed by suiteId::tcId, so a shared TC is tracked per suite.
      const ordered: Array<{ tcId: string; suiteId: string }> = [];
      Object.keys(matrixEntry.testSuites || {}).forEach(suiteId => {
        const seenInSuite = new Set<string>();
        (matrixEntry.testSuites[suiteId].tcIds || []).forEach((tcId: string) => {
          const key = suiteId + '::' + tcId;
          if (selectedSet.has(key) && !seenInSuite.has(tcId)) {
            seenInSuite.add(tcId);
            ordered.push({ tcId, suiteId });
          }
        });
      });
      this.dutMatrixSelections[dutId] = ordered;
    } else {
      this.dutMatrixSelections[dutId] = Array.from(selectedSet).map(key => {
        const sep = key.indexOf('::');
        return sep >= 0
          ? { suiteId: key.slice(0, sep), tcId: key.slice(sep + 2) }
          : { suiteId: this.dutMatrixTcToSuiteMap[key] || '', tcId: key };
      });
    }
  }

  closeDutMatrixModal() {
    this.showDutMatrixModal = false;
  }

  removeDevice(device: any) {

    if (this.isLocked(device)) {
      return;
    }

    this.selectedDUTs =
      this.selectedDUTs.filter(
        d => d._id !== device._id
      );

    const selectable = this.selectableDevices;

    const selectedSelectableIds = new Set(
      this.selectedDUTs
        .filter(d => !this.isLocked(d) && !this.isInUse(d))
        .map(d => d._id)
    );

    this.allSelected =
      selectable.length > 0 &&
      selectable.every(d => selectedSelectableIds.has(d._id));

    this.selectFormControl.setValue(
      this.allSelected
        ? ['selectAll', ...this.selectedDUTs]
        : [...this.selectedDUTs],
      { emitEvent: false }
    );

    this.cdr.detectChanges();
  }

  onUpdate() {
    if (this.selectedDUTs.length === 0) {
      this.snackBar.open('Please select at least one DUT device.', 'OK', { duration: 3000 });
      return;
    }
    this.dialogRef.close({
      action: 'finish',
      selectedDevices: this.selectedDUTs.map(d => ({
        _id: d._id,
        deviceName: d.deviceName,
        profileId: d.profileId,
        model: d.model,
        deviceFWVersion: d.deviceFWVersion,
        firmwareVersion: d['firmwareVersion'],
        cmFirmwareVersion: d['CM Firmware Version'],
        // Only DUTs the user opened + edited in the preview carry a custom
        // selection; others stay undefined so the caller uses the full matrix.
        customOnExecution: this.dutMatrixSelections[d._id]
      })),
      selectedDeviceIds: this.selectedDUTs.map(d => d._id),
      lockedDeviceIds: Array.from(this.lockedIds)
    });
  }

  get triggerDisplayText(): string {
    return this.selectedDUTs.map(d => d.deviceName).join(', ');
  }
  compareDuts = (a: any, b: any): boolean => {
    if (a === b) { return true; }
    return !!a && !!b && a._id === b._id;
  }

  onCancel() {
    this.dialogRef.close();
  }
}
