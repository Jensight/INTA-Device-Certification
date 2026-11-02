import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { UserService } from 'src/app/@core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-tc-metrics',
  templateUrl: './tc-metrics.component.html',
  styleUrls: ['./tc-metrics.component.scss']
})
export class TcMetricsComponent implements OnInit, OnDestroy {
  allTestsuites: any[] = [];
  validTestsuites: any[] = [];
  filteredTestsuites: any[] = [];
  allTestcases: any[] = [];
  allTestbeds: any[] = [];
  allTestbedProfiles: any[] = [];
  allDevices: any[] = [];
  allSchedules: any[] = [];

  selectedTestsuiteId: string = '';
  selectedTestcases: any[] = [];

  availableModels: string[] = [];
  selectedModels: string[] = [];

  testsuiteSearch: string = '';
  modelSearch: string = '';
  filteredAvailableModels: string[] = [];

  /**
   * Per-cell checkbox state in the matrix.
   * Shape: { [testCaseKey]: { [modelName]: boolean } }
   * All cells default to true; user can toggle individually or by column.
   */
  cellState: { [tcKey: string]: { [model: string]: boolean } } = {};

  /**
   * Cached "column header" state — recomputed only when cell values change
   * (not on every change-detection cycle). Iterating every testcase per
   * column per CD was a major contributor to "Select All" lag.
   */
  columnAllChecked: { [model: string]: boolean } = {};
  columnIndeterminate: { [model: string]: boolean } = {};

  /** All device-model documents — used to resolve modelName -> modelId */
  allModels: any[] = [];

  /** Persisted modelTCMatrix loaded from settings; merged on every save */
  private existingModelTCMatrix: {
    [modelId: string]: {
      modelName: string;
      testSuites: { [suiteId: string]: { suiteName: string; tcIds: string[] } }
    }
  } = {};

  isSaving = false;

  /** True only for 'sysadmin'. Everyone else gets read-only access to the matrix. */
  isSysAdmin = false;

  private subs: any[] = [];

  constructor(
    private dataService: DataService,
    private testLabService: TestLabService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Read-only for non-sysadmin users; sysadmin has full edit access.
    const currentUser: any = this.dataService.getCurrentUser();
    this.isSysAdmin = !!(currentUser && currentUser.username === 'sysadmin');

    this.subs.push(
      this.dataService.getTestSuites().subscribe((ts: any[]) => {
        this.allTestsuites = ts || [];
       // this.recomputeValidTestsuites();
      })
    );
    this.subs.push(
      this.dataService.getTestCases().subscribe((tc: any[]) => {
        this.allTestcases = tc || [];
        if (this.selectedTestsuiteId) {
          this.refreshForSelectedTestsuite();
        }
      })
    );
    this.subs.push(
      this.dataService.getTestBed().subscribe((tb: any[]) => {
        this.allTestbeds = tb || [];
        // this.recomputeValidTestsuites();
        if (this.selectedTestsuiteId) {
          this.computeAvailableModels();
        }
      })
    );
    this.subs.push(
      this.dataService.getTestbedProfile().subscribe((profiles: any[]) => {
        this.allTestbedProfiles = profiles || [];
        // this.recomputeValidTestsuites();
      })
    );
    this.subs.push(
      this.dataService.getAllDevices().subscribe((dev: any[]) => {
        this.allDevices = dev || [];
        if (this.selectedTestsuiteId) {
          this.computeAvailableModels();
        }
      })
    );
    this.subs.push(
      this.dataService.getAllModels().subscribe((models: any[]) => {
        this.allModels = models || [];
      })
    );
    setTimeout(() => this.loadTestSuites(), 500); // Defer to ensure all data is loaded before filtering
    this.loadSchedules();
    this.loadExistingMatrix();
  }

  ngOnDestroy() {
    this.subs.forEach(s => s && s.unsubscribe && s.unsubscribe());
  }

  private loadExistingMatrix() {
    this.userService.getAllusers().subscribe(
      (data: any) => {
        const settings = Array.isArray(data) ? data[0] : data;
        let raw = (settings && settings.modelTCMatrix) ? settings.modelTCMatrix : {};

        // Unwrap extra nesting if backend stored the whole payload object
        // e.g. { modelTCMatrix: { modelTCMatrix: ... } }
        while (raw && !Array.isArray(raw) && raw.modelTCMatrix) {
          raw = raw.modelTCMatrix;
        }

        // Handle old flat format: { suiteId: [tcIds] } (no modelName/testSuites wrapper)
        if (Array.isArray(raw)) {
          // Very old array format: [{ modelId, testSuites }] — skip, treat as empty
          this.existingModelTCMatrix = {};
        } else {
          // Normalise each model entry
          const normalised: any = {};
          Object.keys(raw).forEach(modelId => {
            const entry = raw[modelId];
            if (!entry || typeof entry !== 'object') return;
            if (entry.testSuites) {
              // Already in new format
              normalised[modelId] = entry;
            } else {
              // Old flat format: { suiteId: [tcIds] } — convert
              const testSuites: any = {};
              Object.keys(entry).forEach(suiteId => {
                const tcIds = entry[suiteId];
                testSuites[suiteId] = { suiteName: '', tcIds: Array.isArray(tcIds) ? tcIds : [] };
              });
              normalised[modelId] = { modelName: '', testSuites };
            }
          });
          this.existingModelTCMatrix = normalised;
        }

        // Re-populate checkboxes now that saved data is available
        if (this.selectedTestcases.length > 0 && this.selectedModels.length > 0) {
          this.cellState = {};
          this.rebuildCellState();
        }
      },
      () => { this.existingModelTCMatrix = {}; }
    );
  }

  /**
   * Builds and saves the modelTCMatrix payload.
   *
   * Format persisted:
   * modelTCMatrix: Array of { modelId, testSuites: { [suiteId]: tcId[] } }
   *
   * For each selected model column in the current view, collect the checked
   * TC IDs for the current test suite and merge with any previously-saved
   * data for other test suites on that same model.
   */
  saveMatrix() {
    // Guard: non-sysadmin users have read-only access.
    if (!this.isSysAdmin) {
      this.snackBar.open('Only sysadmin can update the Model - TC Matrix.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.selectedTestsuiteId || this.selectedModels.length === 0) {
      this.snackBar.open('Please select a test suite and at least one model.', 'OK', { duration: 3000 });
      return;
    }

    const currentSuite = this.allTestsuites.find(ts => ts._id === this.selectedTestsuiteId);
    const suiteName = (currentSuite && currentSuite.testSuiteName) || '';

    // Deep-copy ALL existing data so no other suite / model data is lost
    const matrixMap: any = {};
    Object.keys(this.existingModelTCMatrix || {}).forEach(existingModelId => {
      const entry = this.existingModelTCMatrix[existingModelId];
      if (entry && typeof entry === 'object') {
        matrixMap[existingModelId] = {
          modelName: entry.modelName || '',
          testSuites: { ...(entry.testSuites || {}) }
        };
      }
    });

    // Overwrite only the current suite for currently selected models
    this.selectedModels.forEach((modelName: string) => {
      const modelDoc = this.allModels.find(m => m.modelName === modelName);
      const modelId = (modelDoc && (modelDoc.modelId || (modelDoc._id && modelDoc._id.toString()))) || modelName;

      if (!matrixMap[modelId]) matrixMap[modelId] = { modelName, testSuites: {} };
      // Keep modelName up to date
      matrixMap[modelId].modelName = modelName;

      const checkedTcIds: string[] = [];
      this.selectedTestcases.forEach((tc: any) => {
        if (this.isCellChecked(tc, modelName)) {
          checkedTcIds.push((tc._id || tc.tcId || tc.jiraKey || '').toString());
        }
      });
      matrixMap[modelId].testSuites[this.selectedTestsuiteId] = { suiteName, tcIds: checkedTcIds };
    });

    this.isSaving = true;
    this.userService.updateModelTCMatrix(matrixMap).subscribe(
      () => {
        this.isSaving = false;
        this.existingModelTCMatrix = matrixMap;
        this.snackBar.open('Model TC Matrix saved successfully.', 'OK', { duration: 3000 });
      },
      () => {
        this.isSaving = false;
        this.snackBar.open('Error saving Model TC Matrix.', 'Try Again', { duration: 3000 });
      }
    );
  }

  private loadSchedules() {
    this.subs.push(
      this.testLabService.getAllDynamicSchedules().subscribe(
        (data: any) => {
          this.allSchedules = Array.isArray(data) ? data : [];
          if (this.selectedTestsuiteId) {
            this.computeAvailableModels();
          }
        },
        () => {
          this.allSchedules = [];
        }
      )
    );
  }

  // ------------------------------------------------------------------
  // Generic id / dyn-node helpers (shared by the two filtering flows)
  // ------------------------------------------------------------------

  private isDynEnabled(node: any): boolean {
    if (!node) return false;
    const v = node.dyn;
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  /** Convert a single id or an array of ids into a Set of stringified ids. */
  private toIdSet(value: any): Set<string> {
    const set = new Set<string>();
    if (value == null) return set;
    if (Array.isArray(value)) {
      value.forEach(v => { if (v) set.add(v.toString()); });
    } else {
      set.add(value.toString());
    }
    return set;
  }

  /** True when a single-or-array id value intersects the given set. */
  private idIntersectsSet(value: any, set: Set<string>): boolean {
    if (!value || set.size === 0) return false;
    if (Array.isArray(value)) {
      return value.some(v => v && set.has(v.toString()));
    }
    return set.has(value.toString());
  }

  /**
   * Walk every dyn-enabled node belonging to a profile that satisfies
   * `profileMatches(profileId)`. Combines the two storage locations:
   *   - canonical: testbed-PROFILE.nodes[]
   *   - fallback : testbed.nodes[] (looked up via testBedProfileId)
   */
  private forEachDynNode(
    profileMatches: (profileId: string) => boolean,
    visit: (node: any, profileId: string) => void
  ): void {
    this.allTestbedProfiles.forEach((profile: any) => {
      if (!profile || !profile._id) return;
      const pid = profile._id.toString();
      if (!profileMatches(pid)) return;
      (profile.nodes || []).forEach((node: any) => {
        if (this.isDynEnabled(node)) visit(node, pid);
      });
    });
    this.allTestbeds.forEach((tb: any) => {
      if (!tb || !tb.testBedProfileId) return;
      const pid = tb.testBedProfileId.toString();
      if (!profileMatches(pid)) return;
      (tb.nodes || []).forEach((node: any) => {
        if (this.isDynEnabled(node)) visit(node, pid);
      });
    });
  }

  /** Generic case-insensitive substring filter. */
  private filterByName<T>(list: T[], search: string, key: (item: T) => string): T[] {
    const lower = (search || '').toLowerCase();
    if (!lower) return [...list];
    return list.filter(item => (key(item) || '').toLowerCase().includes(lower));
  }

  /** Replace the valid-testsuite list and re-apply the current search filter. */
  private setValidTestsuites(list: any[]) {
    this.validTestsuites = list;
    this.filterTestsuites(this.testsuiteSearch);
  }

  /** Replace the available-model list and reset its visible (filtered) copy. */
  private setAvailableModels(list: string[]) {
    this.availableModels = list;
    this.filteredAvailableModels = [...list];
  }

  // ------------------------------------------------------------------
  // Filter flows
  // ------------------------------------------------------------------

  /**
   * Reverse-flow filter for the Test Suite dropdown:
   *   testbed profiles that have at least one dyn-enabled node
   *     -> their mappedTestSets[]
   *       -> testsuites whose moduleId is in that set
   *
   * Note: dyn-enabled `nodes[]` live on the testbed PROFILE document; we
   * additionally probe linked testbeds as a fallback.
   */
  private recomputeValidTestsuites() {
    if (!this.allTestsuites.length || !this.allTestbedProfiles.length) {
      this.setValidTestsuites([]);
      return;
    }

    // 1) Profile IDs that have at least one dyn-enabled node
    const dynProfileIds = new Set<string>();
    this.forEachDynNode(() => true, (_node, profileId) => {
      dynProfileIds.add(profileId);
    });
    if (dynProfileIds.size === 0) {
      this.setValidTestsuites([]);
      return;
    }

    // 2) Union of mappedTestSets across those profiles
    const mappedTestSetIds = new Set<string>();
    this.allTestbedProfiles.forEach((profile: any) => {
      if (!profile || !profile._id) return;
      if (!dynProfileIds.has(profile._id.toString())) return;
      (profile.mappedTestSets || []).forEach((tsId: any) => {
        if (tsId) mappedTestSetIds.add(tsId.toString());
      });
    });
    if (mappedTestSetIds.size === 0) {
      this.setValidTestsuites([]);
      return;
    }

    // 3) Testsuites whose moduleId intersects mappedTestSetIds
    this.setValidTestsuites(
      this.allTestsuites.filter((ts: any) =>
        this.idIntersectsSet(ts && ts.moduleId, mappedTestSetIds)
      )
    );

    // If the previously-selected suite is no longer valid, clear selection
    if (this.selectedTestsuiteId
      && !this.validTestsuites.some(ts => ts._id === this.selectedTestsuiteId)) {
      this.selectedTestsuiteId = '';
      this.selectedTestcases = [];
      this.selectedModels = [];
      this.setAvailableModels([]);
    }
  }

  /**
   * Build the list of available models for the multi-select dropdown.
   *
   *   testsuite.moduleId
   *     -> testbed profiles whose mappedTestSets contains that moduleId
   *       -> dyn-enabled nodes on that profile (or the linked testbed)
   *         -> node.profileId (DUT device profile)
   *           -> devices with that profileId
   *             -> unique device.model values
   *
   * `device.model` matches `model.modelName` in the models collection;
   * devices do not carry `modelName` directly (a `dev.modelName` fallback
   * is kept for legacy data).
   */
  private computeAvailableModels() {
    if (!this.selectedTestsuiteId
      || !this.allTestbedProfiles.length
      || !this.allDevices.length) {
      this.setAvailableModels([]);
      return;
    }

    const suite = this.allTestsuites.find(ts => ts._id === this.selectedTestsuiteId);
    if (!suite || !suite.moduleId) {
      this.setAvailableModels([]);
      return;
    }

    // 1) Suite's testset ids (single string or array)
    const suiteTestSetIds = this.toIdSet(suite.moduleId);

    // 2) Profile ids whose mappedTestSets intersect the suite's testsets
    const matchingProfileIds = new Set<string>();
    this.allTestbedProfiles.forEach((profile: any) => {
      if (!profile || !profile._id) return;
      if (this.idIntersectsSet(profile.mappedTestSets, suiteTestSetIds)) {
        matchingProfileIds.add(profile._id.toString());
      }
    });
    if (matchingProfileIds.size === 0) {
      this.setAvailableModels([]);
      return;
    }

    // 3) Dyn-node profileIds within those matching profiles
    const dynNodeProfileIds = new Set<string>();
    this.forEachDynNode(
      pid => matchingProfileIds.has(pid),
      node => {
        if (node && node.profileId) dynNodeProfileIds.add(node.profileId.toString());
      }
    );
    if (dynNodeProfileIds.size === 0) {
      this.setAvailableModels([]);
      return;
    }

    // 4) Devices with those profileIds -> unique model values
    const modelSet = new Set<string>();
    this.allDevices.forEach((dev: any) => {
      if (!dev || !this.idIntersectsSet(dev.profileId, dynNodeProfileIds)) return;
      const modelValue = dev.model || dev.modelName;
      if (modelValue) modelSet.add(modelValue);
    });

    this.setAvailableModels(Array.from(modelSet).sort());
    this.selectedModels = this.selectedModels.filter(m => modelSet.has(m));
    this.rebuildCellState();
  }

  // ------------------------------------------------------------------
  // Search filters & selection handlers (called from template)
  // ------------------------------------------------------------------

  filterTestsuites(text: string) {
    this.testsuiteSearch = text || '';
    this.filteredTestsuites = this.filterByName(
      this.validTestsuites, this.testsuiteSearch, ts => ts.testSuiteName
    );
  }

  filterModels(text: string) {
    this.modelSearch = text || '';
    this.filteredAvailableModels = this.filterByName(
      this.availableModels, this.modelSearch, m => m
    );
  }

  onTestsuiteSelected(testsuiteId: string) {
    this.selectedTestsuiteId = testsuiteId;
    this.selectedModels = [];
    this.cellState = {};
    this.refreshForSelectedTestsuite();
  }

  private refreshForSelectedTestsuite() {
    const testsuite = this.allTestsuites.find(ts => ts._id === this.selectedTestsuiteId);
    if (!testsuite || !testsuite.testCases) {
      this.selectedTestcases = [];
    } else {
      this.selectedTestcases = testsuite.testCases
        .map((tcRef: any) => {
          const tcId = typeof tcRef === 'object' ? tcRef._id : tcRef;
          return this.allTestcases.find(tc => tc._id === tcId);
        })
        .filter((tc: any) => !!tc);
    }
    this.computeAvailableModels();
  }

  // ------------------------------------------------------------------
  // Cell state helpers (matrix checkboxes)
  // ------------------------------------------------------------------

  private tcKey(tc: any): string {
    if (!tc) return '';
    return (tc._id || tc.tcId || tc.jiraKey || tc.tcName || '').toString();
  }

  /**
   * Recreate the per-cell state map for the current testcases x models grid.
   * Preserves existing toggles where the row+column still exist; new cells
   * default to true (checked). Also rebuilds the column-state cache.
   */
  private rebuildCellState() {
    const next: { [tcKey: string]: { [model: string]: boolean } } = {};
    (this.selectedTestcases || []).forEach((tc: any) => {
      const k = this.tcKey(tc);
      if (!k) return;
      const prevRow = this.cellState[k] || {};
      next[k] = {};
      (this.selectedModels || []).forEach((m: string) => {
        if (prevRow[m] !== undefined) {
          // User has already toggled this cell in the current session — keep it
          next[k][m] = prevRow[m];
        } else {
          // Fresh cell — check saved matrix from DB
          const modelDoc = this.allModels.find(md => md.modelName === m);
          const modelId = (modelDoc && (modelDoc.modelId || (modelDoc._id && modelDoc._id.toString()))) || m;
          const savedEntry = this.existingModelTCMatrix[modelId];
          const savedSuiteData = savedEntry && savedEntry.testSuites && savedEntry.testSuites[this.selectedTestsuiteId];
          const savedTcIds: string[] = (savedSuiteData && savedSuiteData.tcIds) || [];
          const tcId = (tc._id || tc.tcId || tc.jiraKey || '').toString();
          next[k][m] = savedTcIds.includes(tcId);
        }
      });
    });
    this.cellState = next;
    this.recomputeAllColumnStates();
  }

  /** Refresh the cached header state for every selected model. */
  private recomputeAllColumnStates() {
    const all: { [model: string]: boolean } = {};
    const indet: { [model: string]: boolean } = {};
    (this.selectedModels || []).forEach(m => {
      const [a, i] = this.computeColumnState(m);
      all[m] = a;
      indet[m] = i;
    });
    this.columnAllChecked = all;
    this.columnIndeterminate = indet;
  }

  /** Refresh the cached header state for a single model. */
  private recomputeColumnState(model: string) {
    const [a, i] = this.computeColumnState(model);
    // Reassign objects so OnPush-style consumers / change detection still see the diff.
    this.columnAllChecked = { ...this.columnAllChecked, [model]: a };
    this.columnIndeterminate = { ...this.columnIndeterminate, [model]: i };
  }

  /** [allChecked, indeterminate] for the given model column. */
  private computeColumnState(model: string): [boolean, boolean] {
    const rows = this.selectedTestcases || [];
    if (rows.length === 0) return [false, false];
    let checked = 0;
    for (const tc of rows) {
      if (this.isCellChecked(tc, model)) checked++;
    }
    const all = checked === rows.length;
    const indeterminate = checked > 0 && checked < rows.length;
    return [all, indeterminate];
  }

  isCellChecked(tc: any, model: string): boolean {
    const k = this.tcKey(tc);
    return !!(this.cellState[k] && this.cellState[k][model]);
  }

  toggleCell(tc: any, model: string, checked: boolean) {
    if (!this.isSysAdmin) return;
    const k = this.tcKey(tc);
    if (!this.cellState[k]) this.cellState[k] = {};
    this.cellState[k][model] = !!checked;
    this.recomputeColumnState(model);
  }

  /** Toggle all rows in a model column on/off. */
  toggleColumn(model: string, checked: boolean) {
    if (!this.isSysAdmin) return;
    (this.selectedTestcases || []).forEach((tc: any) => {
      const k = this.tcKey(tc);
      if (!this.cellState[k]) this.cellState[k] = {};
      this.cellState[k][model] = !!checked;
    });
    this.recomputeColumnState(model);
  }

  // ------------------------------------------------------------------
  // trackBy helpers — keep *ngFor stable so Angular doesn't destroy and
  // recreate every cell/option on each model-list change.
  // ------------------------------------------------------------------

  trackByModel = (_: number, m: string) => m;
  trackByTestcase = (_: number, tc: any) => this.tcKey(tc) || _;
  trackByTestsuiteId = (_: number, ts: any) => (ts && ts._id) || _;

  // ------------------------------------------------------------------
  // Models dropdown - Select All
  // ------------------------------------------------------------------

  /** True when every available model is currently selected. */
  get isAllModelsSelected(): boolean {
    return this.availableModels.length > 0
      && this.selectedModels.length === this.availableModels.length;
  }

  /** True when some (but not all) models are selected. */
  get isSomeModelsSelected(): boolean {
    return this.selectedModels.length > 0
      && this.selectedModels.length < this.availableModels.length;
  }

  /** Toggle the "Select All" option in the Models dropdown. */
  toggleSelectAllModels() {
    this.selectedModels = this.isAllModelsSelected ? [] : [...this.availableModels];
    this.rebuildCellState();
  }

  /** Called when the user changes individual model selections. */
  onModelsSelectionChange() {
    this.rebuildCellState();
  }
private loadTestSuites() {
  console.log('Inside load test suites All Testbeds:', this.allTestbeds, 'All Testbed Profiles:', this.allTestbedProfiles, 'All Testsuites:', this.allTestsuites);
  // filter from all test beds which is having dynamic attribute and it is true and get the profile id from that 
  let dynamicprofiles : any[] = [];
  this.allTestbeds.forEach((tb: any) => {
    if (!tb || !tb.testBedProfileId) return; 
    if(tb.dynamic){
      const profileId = tb.testBedProfileId.toString();
      dynamicprofiles.push(profileId);
    }
  });
  console.log('Dynamicprofiles:', dynamicprofiles);
  // filter the test bed profiles which is having profile id in dynamicprofiles and get the mapped test sets from that
  let mappedTestSetIds = new Set<string>();
  this.allTestbedProfiles.forEach((profile: any) => {
    if (!profile || !profile._id) return;
    if (dynamicprofiles.includes(profile._id.toString())) {
      (profile.mappedTestSets || []).forEach((tsId: string) => mappedTestSetIds.add(tsId));
    }
  });
  console.log('Mapped Test Set IDs:', Array.from(mappedTestSetIds));
  // filter the test suites which is having module id in mappedTestSetIds
  let filteredTestsuites = this.allTestsuites.filter((ts: any) =>
    this.idIntersectsSet(ts && ts.moduleId, mappedTestSetIds)
  );
  console.log('Filtered Test Suites:', filteredTestsuites);
  this.setValidTestsuites(filteredTestsuites);
}

}
