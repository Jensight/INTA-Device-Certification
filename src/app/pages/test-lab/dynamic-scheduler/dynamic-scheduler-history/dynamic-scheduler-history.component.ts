import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectNetworkElementDialogComponent } from '../select-network-element-dialog/select-network-element-dialog.component';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ViewTargetComponent } from 'src/app/@shared/components/api-inventory-delete/view-target/view-target.component';
import { StopOptionsComponent } from 'src/app/pages/regression/regression-detail/regression-detail-tab/stop-options/stop-options.component';

@Component({
  selector: 'app-dynamic-scheduler-history',
  templateUrl: './dynamic-scheduler-history.component.html',
  styleUrls: ['./dynamic-scheduler-history.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DynamicSchedulerHistoryComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['dynamicRegressionTagName', 'userId', 'dynamicScheduleStatus', 'dutCount', 'clientCount', 'createdAt', 'actions'];
  filterColumns: string[] = ['filter-dynamicRegressionTagName', 'filter-userId', 'filter-dynamicScheduleStatus', 'filter-dutCount', 'filter-clientCount', 'filter-createdAt', 'filter-actions'];
  dataSource = new MatTableDataSource<any>([]);
  loading = false;
  expandedRow: any = null;
  uniqueUsers: string[] = [];
  innerDataSource = new MatTableDataSource<any>([]);
  columnFilters: { [key: string]: string } = {};
  private sub: any;
  private teamSub: any;
  // Cached metadata used to color unmapped DUTs in the "Add DUTs" dialog,
  // mirroring the coloring behaviour of the main dynamic-scheduler form.
  private allModels: any[] = [];
  private modelTCMatrix: any = {};
  private selectedTeam: any;
  private settingsData: any = null;
  private exclusiveClients = false;

  @ViewChild('paginator', { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('innerPaginator', { static: false }) innerPaginator: MatPaginator;

  constructor(private testLabService: TestLabService, private router: Router,
              private dataService: DataService, private modal: MatDialog,
              private snackBar: MatSnackBar, private userService: UserService) {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);
      return Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        const filterVal = filters[key].toLowerCase();
        if (key === 'createdAt') {
          const formatted = new Date(data[key]).toLocaleString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
          }).toLowerCase();
          return formatted.includes(filterVal);
        }
        const cellVal = (data[key] || '').toString().toLowerCase();
        return cellVal.includes(filterVal);
      });
    };
  }

  ngOnInit() {
    this.loadHistory();
    // Team must be known before settings are parsed (regressionConfig is per team)
    this.teamSub = this.dataService.selectedTeam.subscribe((team: any) => {
      if (team) {
        this.selectedTeam = team;
        this.readRegressionConfig(this.settingsData);
      }
    });
    // Preload models + modelTCMatrix so the "Add DUTs" dialog can highlight
    // unmapped devices exactly the way the main dynamic-scheduler form does.
    this.dataService.getAllModels().subscribe((models: any) => {
      if (models) { this.allModels = models; }
    });
    this.userService.getAllusers().subscribe((data: any) => {
      this.settingsData = data && data[0] ? data[0] : null;
      this.readRegressionConfig(this.settingsData);
      this.loadModelTCMatrix(data);
    });
  }

  /** Reads the team-specific regressionConfig flags from the settings blob. */
  private readRegressionConfig(settings: any) {
    console.log("settings inside readRegressionConfig:", settings);
    console.log("selectedTeam inside readRegressionConfig:", this.selectedTeam);
    if (!settings || !this.selectedTeam) { return; }
    const regressionConfig = settings.regressionConfig;
    if (!regressionConfig || !regressionConfig[0] || !regressionConfig[0].teams) { return; }
    const teamConfig = regressionConfig[0].teams.find((team: any) => team.name === this.selectedTeam);
    if (teamConfig) {
      this.exclusiveClients = !!teamConfig.exclusive_clients;
    }
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.teamSub) this.teamSub.unsubscribe();
  }

  loadHistory() {
    this.loading = true;
    this.sub = this.testLabService.getAllDynamicSchedules().subscribe(
      (data: any) => {
        const records = (data || []).map((item: any) => {
          const duts = item.duts || [];
          return {
            ...item,
            completedCount: duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'completed').length,
            inProgressCount: duts.filter((d: any) => ['inprogress', 'running', 'processing'].includes((d.runStatus || '').toLowerCase())).length,
            inQueueCount: duts.filter((d: any) => ['inqueue', 'scheduled'].includes((d.runStatus || '').toLowerCase())).length,
            // 'stopped' = user-stop of an in-progress DUT; 'aborted' now has its own badge;
            // 'cancelled' is a separate, user-initiated cancel of an in-queue DUT.
            stoppedCount: duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'stopped').length,
            abortedCount: duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'aborted').length,
            cancelledCount: duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'cancelled').length,
            clientCountVal: (item.clients || []).length
          };
        });
        // Sort by createdAt descending
        records.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.dataSource.data = records;
        // Re-apply any active column filters so the filtered view persists across reloads
        this.dataSource.filter = JSON.stringify(this.columnFilters);
        this.uniqueUsers = [...new Set(records.map((r: any) => r.userId).filter(Boolean))] as string[];
        this.loading = false;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
      },
      (error) => {
        console.error('Error loading dynamic scheduler history:', error);
        this.dataSource.data = [];
        this.loading = false;
      }
    );
  }

  onRefresh() {
    this.expandedRow = null;
    // Preserve user-applied column filters across refreshes so the typed
    // search text (e.g. "Scheduled") remains visible in the filter inputs.
    this.loadHistory();
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'status-completed';
    if (s === 'IN PROGRESS' || s === 'INPROGRESS' || s === 'RUNNING') return 'status-inprogress';
    if (s === 'SCHEDULED') return 'status-scheduled';
    if (s === 'ABORTED') return 'status-aborted';
    if (s === 'STOPPED' || s === 'CANCELLED') return 'status-stopped';
    return '';
  }

  toggleRow(row: any) {
    this.expandedRow = this.expandedRow === row ? null : row;
    if (this.expandedRow) {
      const clients = row.clients || [];
      const jobs = row.job || [];
      const moduleName = jobs[0] && jobs[0].module ? '_' + jobs[0].module.split(' ').join('_').split('_')[0] : '';
      const dutsWithClient = (row.duts || []).map((dut: any, index: number) => {
        const matchedClient = dut.clientId
          ? clients.find((c: any) => c.deviceId === dut.clientId)
          : null;
        // Compute the per-DUT regression tag name (matches backend & regression list format)
        const devName = (dut.deviceName || '').replace(/\s+/g, '_');
        const devFw = dut.fwVersion ? '_' + dut.fwVersion : '_NA';
        const computedTagName = dut.tagName || (devName + devFw + moduleName + '_DYN');
        return { ...dut, clientName: matchedClient ? matchedClient.deviceName : '', tagName: computedTagName };
      });
      this.innerDataSource.data = dutsWithClient;
      setTimeout(() => {
        if (this.innerPaginator) {
          this.innerDataSource.paginator = this.innerPaginator;
        }
      });
    }
  }

  getDutStatusClass(status: string): string {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'status-completed';
    if (s === 'INQUEUE') return 'status-inqueue';
    if (s === 'INPROGRESS' || s === 'IN PROGRESS') return 'status-inprogress';
    if (s === 'FAILED') return 'status-failed';
    if (s === 'ABORTED') return 'status-aborted';
    if (s === 'STOPPED' || s === 'CANCELLED') return 'status-stopped';
    return '';
  }

  /** Regression Tag Name link — only navigable if the DUT actually ran (has a run_id
   *  and is not cancelled). Cancelled / not-executed DUTs never produced a regression
   *  record, so the tag name is displayed as plain text. */
  isDutRegressionNavigable(dut: any): boolean {
    if (!dut) return false;
    const status = (dut.runStatus || '').toString().toUpperCase().replace(/\s+/g, '');
    if (status === 'CANCELLED' || status === 'NOTEXECUTED' || status === 'INQUEUE' || status === 'SCHEDULED') return false;
    return !!(dut.run_id || dut.runId || dut.regressionRunId);
  }

  navigateToRegression(dut: any) {
    // Guard against navigating for cancelled/in-queue/not-executed DUTs.
    // Those never produced a regression record, and a tag-name prefix match
    // would otherwise resolve to an unrelated past regression with the same tag.
    if (!this.isDutRegressionNavigable(dut)) return;

    // Support different field names the backend may use for the regression run identifier
    const dutRunId = dut.run_id || dut.runId || dut.regressionRunId;
    const dutTagName = dut.tagName;
    if (!dutRunId && !dutTagName) return;

    const matchReg = (list: any[]): any => {
      if (dutRunId) {
        const exact = list.find((r: any) => r.run_id === dutRunId);
        if (exact) return exact;
      }
      // Fallback: tagName prefix match — only valid when the DUT actually has a
      // run_id (otherwise we might match an unrelated past regression with the
      // same tag prefix and mislead the user).
      if (dutRunId && dutTagName) {
        return list.find((r: any) => r.run_id && r.run_id.startsWith(dutTagName));
      }
      return null;
    };

    this.testLabService.getRegressionInitialData().subscribe((data: any) => {
      const reg = matchReg(data || []);
      if (reg && reg._id) {
        this.router.navigate(['/pages/regression/detail', reg._id], { state: { fromScreen: 'dynamicHistory' } });
        return;
      }
      // Not found in first 100 — widen search to the last 90 days
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      this.testLabService.getRegressionData(start, end, 'All').subscribe((allData: any) => {
        const reg2 = matchReg(allData || []);
        if (reg2 && reg2._id) {
          this.router.navigate(['/pages/regression/detail', reg2._id], { state: { fromScreen: 'dynamicHistory' } });
        } else {
          this.snackBar.open('Regression details not found.', 'Close', { duration: 3000 });
        }
      });
    });
  }

  /** DUT Name link — opens the per-DUT regression's HTML logs in a new tab. */
  isDutHtmlLogEnabled(dut: any): boolean {
    if (!dut) return false;
    const status = (dut.runStatus || '').toString().toUpperCase().replace(/\s+/g, '');
    // Only enable when a regression has actually executed for this DUT.
    if (!(dut.run_id || dut.runId || dut.regressionRunId)) return false;
    return status === 'COMPLETED' || status === 'STOPPED' || status === 'ABORTED'
      || status === 'FAILED' || status === 'PARTIAL' || status === 'INPROGRESS' || status === 'RUNNING';
  }

  openDutHtmlLogs(dut: any) {
    if (!this.isDutHtmlLogEnabled(dut)) return;

    const dutRunId = dut.run_id || dut.runId || dut.regressionRunId;
    const dutTagName = dut.tagName;

    const matchReg = (list: any[]): any => {
      if (dutRunId) {
        const exact = list.find((r: any) => r.run_id === dutRunId);
        if (exact) return exact;
      }
      if (dutTagName) {
        return list.find((r: any) => r.run_id && r.run_id.startsWith(dutTagName));
      }
      return null;
    };

    const openLogs = (reg: any) => {
      const resolvedRunId = reg.run_id || dutRunId;
      // If the initial-data payload already contains the first job id, use it directly.
      const firstJobId = reg.firstJobId
        || (Array.isArray(reg.job) && reg.job[0] && reg.job[0].job_id)
        || null;
      if (firstJobId) {
        this.testLabService.viewHTMLLogsForJob(firstJobId, resolvedRunId);
        return;
      }
      // Otherwise fetch the full regression document to obtain the first job id.
      this.testLabService.getRegression(reg._id).subscribe(
        (regData: any) => {
          if (regData && Array.isArray(regData.job) && regData.job[0] && regData.job[0].job_id) {
            this.testLabService.viewHTMLLogsForJob(regData.job[0].job_id, resolvedRunId);
          } else {
            this.snackBar.open('No job found for this DUT regression.', 'Close', { duration: 3000 });
          }
        },
        () => this.snackBar.open('Failed to load regression for HTML logs.', 'Close', { duration: 3000 })
      );
    };

    this.testLabService.getRegressionInitialData().subscribe((data: any) => {
      const reg = matchReg(data || []);
      if (reg && reg._id) { openLogs(reg); return; }
      // Fallback: widen search to the last 90 days
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      this.testLabService.getRegressionData(start, end, 'All').subscribe((allData: any) => {
        const reg2 = matchReg(allData || []);
        if (reg2 && reg2._id) {
          openLogs(reg2);
        } else {
          this.snackBar.open('HTML logs not available for this DUT.', 'Close', { duration: 3000 });
        }
      });
    });
  }

  applyColumnFilter(column: string, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value.trim();
    this.columnFilters[column] = value;
    this.dataSource.filter = JSON.stringify(this.columnFilters);
  }

  isInProgress(row: any): boolean {
    if (!row || !row.dynamicScheduleStatus) return false;
    const s = row.dynamicScheduleStatus.toString().toUpperCase().replace(/\s+/g, '');
    return s === 'INPROGRESS' || s === 'RUNNING';
  }

  isActionEnabled(row: any): boolean {
    if (!row || !row.dynamicScheduleStatus) return false;
    const s = row.dynamicScheduleStatus.toString().toUpperCase().replace(/\s+/g, '');
    return s === 'INPROGRESS' || s === 'RUNNING' || s === 'SCHEDULED';
  }

  isDutActionEnabled(dut: any): boolean {
    if (!dut || !dut.runStatus) return false;
    const s = dut.runStatus.toString().toUpperCase().replace(/\s+/g, '');
    // Enabled for actively executing DUTs (Stop action) and in-queue DUTs (Cancel action).
    // PROCESSING is an intermediate/transitional state and must not be actionable.
    return s === 'INPROGRESS' || s === 'INQUEUE' ;
  }

  /** Returns 'cancel' for in-queue DUTs, 'stop' for in-progress DUTs, '' otherwise. */
  getDutActionType(dut: any): 'cancel' | 'stop' | '' {
    if (!dut || !dut.runStatus) return '';
    const s = dut.runStatus.toString().toUpperCase().replace(/\s+/g, '');
    if (s === 'INQUEUE') return 'cancel';
    if (s === 'INPROGRESS') return 'stop';
    return '';
  }

  /** Tooltip text for the per-DUT X action icon. */
  getDutActionTooltip(dut: any): string {
    const a = this.getDutActionType(dut);
    if (a === 'cancel') return 'Cancel this DUT';
    if (a === 'stop') return 'Stop this DUT regression';
    return '';
  }

  onStopSingleDut(row: any, dut: any) {
    if (!this.isDutActionEnabled(dut)) return;
    const actionType = this.getDutActionType(dut);
    if (!actionType) return;

    const isCancel = actionType === 'cancel';
    const isStop = actionType === 'stop';

    if (isStop) {
      // INPROGRESS DUT — let the user pick immediate vs graceful stop, same as the regression detail page
      this.stopSingleDutPopUp(row, dut);
      return;
    }

    const dialogRef = this.modal.open(ConfirmationDiaogComponent, {
      width: '420px',
      data: {
        action: 'Cancel',
        name: 'DUT Regression',
        text: `Are you sure you want to cancel DUT "${dut.deviceName}"? It will not be executed.`,
        cancelButtonText: 'Keep',
        confirmButtonText: 'Cancel'
      },
      panelClass: 'dynamic-theme',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      if (isCancel) {
        // INQUEUE DUT — cancel via dynamic scheduler API (no regression record exists yet)
        this.testLabService.cancelDynamicSchedule(row._id, dut.deviceId).subscribe(
          (resp: any) => {
            if (resp && resp.status) {
              this.snackBar.open(`DUT "${dut.deviceName}" cancelled successfully.`, 'OK', { duration: 4000 });
              this.loadHistory();
            } else {
              this.snackBar.open(resp && resp.message ? resp.message : 'Failed to cancel DUT.', 'OK', { duration: 3000 });
            }
          },
          (err: any) => {
            const msg = (err && err.error && err.error.message) || 'Failed to cancel DUT.';
            this.snackBar.open(msg, 'OK', { duration: 3000 });
          }
        );
      }
    });
  }

  /** Mirrors stopRegressionPopUp() from regression-detail-tab: lets the user choose
   *  stopImmediately vs stopGracefully before stopping this DUT's regression. */
  private stopSingleDutPopUp(row: any, dut: any) {
    const dialogRefAdd = this.modal.open(StopOptionsComponent, {
      data: {
        name: 'stopGracefully'
      },
      minHeight: 100,
      minWidth: 500,
      autoFocus: false,
    });

    dialogRefAdd.afterClosed().subscribe((result) => {
      const stopOption = result?.data;
      if (!stopOption) return;
      this.stopInProgressDut(dut, stopOption);
    });
  }

  private stopInProgressDut(dut: any, stopOption: string = 'stopImmediately') {
    const dutRunId = dut.run_id ;
    const jobId = dut.job_id ;
    if (!dutRunId || !jobId) {
      this.snackBar.open('Cannot stop DUT regression: missing run_id or job_id.', 'OK', { duration: 3000 });
      return;
    }
      this.testLabService.stopRegression(dutRunId, stopOption, 1, jobId).subscribe(
        (result: any) => {
          if (result && result['status']) {
            this.snackBar.open(result['message'] || `DUT "${dut.deviceName}" stopped successfully.`, 'OK', { duration: 4000 });
          } else {
            this.snackBar.open(`DUT "${dut.deviceName}" stop request sent.`, 'OK', { duration: 4000 });
          }
          setTimeout(() => this.loadHistory(), 1500);
        },
        (err: any) => {
          const msg = (err && err.error && err.error.message) || 'Failed to stop DUT regression.';
          this.snackBar.open(msg, 'OK', { duration: 3000 });
        }
      );
  }

  onAddDuts(row: any) {
    if (!this.isActionEnabled(row)) return;

    this.dataService.getTestBed().pipe(take(1)).subscribe((testbeds: any) => {
      const testbed = (testbeds || []).find((tb: any) => tb._id === row.dynamicTestbedId);
      if (!testbed) {
        this.snackBar.open('Testbed not found for this regression.', 'OK', { duration: 3000 });
        return;
      }

      const existingIds = (row.duts || []).map((d: any) => d.deviceId).filter(Boolean);

      // Mirror the main dynamic-scheduler form: when the regression was created
      // in Model-TC Matrix mode, pass the matrix + model list so the dialog can
      // colour devices whose model has no TC mapping.
      const selectionMode = row.useModelTCMatrix ? 'modelTcMatrix' : 'testSuite';
      // Test Suite mode has no per-DUT mapping — every DUT shares the same test
      // cases (row.job[0].onExecution), so pass it for the read-only DUT preview.
      const jobOnExecution = (row.job && row.job[0] && row.job[0].onExecution) || [];

      const dialogRef = this.modal.open(SelectNetworkElementDialogComponent, {
        width: '500px',
        data: {
          testbed: testbed,
          previousSelection: existingIds,
          lockedDeviceIds: existingIds,
          modelTCMatrix: this.modelTCMatrix || {},
          allModels: this.allModels || [],
          selectionMode: selectionMode,
          jobOnExecution: jobOnExecution,
          enableDutMatrixLinks: true
        },
        panelClass: 'dynamic-theme',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (!result || result.action !== 'finish') return;

        const lockedSet = new Set<string>(existingIds);
        const newDevices = (result.selectedDevices || []).filter((d: any) => !lockedSet.has(d._id));

        if (newDevices.length === 0) {
          this.snackBar.open('No new DUTs were added.', 'OK', { duration: 3000 });
          return;
        }

        const isMatrixSchedule = !!row.useModelTCMatrix;
        // Compute the module-name suffix used in each DUT's regression tag name,
        // mirroring the backend (job[0].module → first token).
        const moduleName = row.job && row.job[0] && row.job[0].module
          ? '_' + row.job[0].module.split(' ').join('_').split('_')[0]
          : '';
        const newDuts = newDevices.map((d: any) => this.buildDutPayload(d, testbed, isMatrixSchedule, moduleName));

        // Non-matrix schedules don't rely on Model - TC Matrix mapping, so add directly.
        if (!isMatrixSchedule) {
          this.submitAddDuts(row, newDuts);
          return;
        }

        // Model - TC Matrix mode: validate mappings in the UI and prompt the user
        // before hitting the backend (backend now just persists what we send).
        this.confirmMatrixDutsAndAdd(row, newDuts);
      });
    });
  }

  /**
   * Build a single DUT payload object for the "Add DUTs" request. For Model - TC
   * Matrix schedules it also resolves the model's mapped test cases into onExecution.
   * Also computes the per-DUT regression tag name so the backend only has to persist it.
   */
  private buildDutPayload(d: any, testbed: any, isMatrixSchedule: boolean, moduleName: string) {
    const profileNodes = testbed.nodes || [];
    // d.profileId may be a string (legacy) or array (multi-profile form).
    const deviceProfileIds = Array.isArray(d.profileId) ? d.profileId : [d.profileId];
    const matchedNode = profileNodes.find((n: any) => deviceProfileIds.includes(n.profileId));
    // Device FW first; use CM Firmware only when Device FW is absent.
    const deviceFwDh = d.deviceFWVersion;
    const deviceFwDhStr = (deviceFwDh === undefined || deviceFwDh === null || deviceFwDh === 'NA') ? '' : String(deviceFwDh).trim();
    const cmFw = d.cmFirmwareVersion;
    const cmFwStr = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim();
    const fwVersion = (deviceFwDhStr !== '') ? deviceFwDh : (cmFwStr !== '' ? cmFw : 'NA');
    // Resolve modelId from the model list so we can look up the
    // Model - TC Matrix mapping for this DUT (mirrors the main scheduler form).
    const modelDoc = (this.allModels || []).find((m: any) => m && m.modelName === d.model);
    const modelId = modelDoc
      ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : ''))
      : '';

    // Build onExecution from the Model - TC Matrix (all mapped TCs for this model).
    // If the user opened the DUT's TC preview and unchecked some TCs, honour that
    // custom selection instead of the full matrix.
    const onExecution: any[] = [];
    if (isMatrixSchedule && Array.isArray(d.customOnExecution)) {
      d.customOnExecution.forEach((item: any) => {
        if (item && item.tcId) onExecution.push({ tcId: item.tcId, suiteId: item.suiteId });
      });
    } else if (isMatrixSchedule && modelId && this.modelTCMatrix[modelId]) {
      const testSuites = this.modelTCMatrix[modelId].testSuites || {};
      Object.keys(testSuites).forEach(suiteId => {
        const seenInSuite = new Set<string>();
        (testSuites[suiteId].tcIds || []).forEach((tcId: string) => {
          if (!seenInSuite.has(tcId)) {
            seenInSuite.add(tcId);
            onExecution.push({ tcId, suiteId });
          }
        });
      });
    }

    // Per-DUT regression tag: deviceName_fwVersion_moduleName_DYN (matches backend format).
    const devName = (d.deviceName || '').replace(/\s+/g, '_');
    const devFw = fwVersion ? '_' + fwVersion : '_NA';
    const tagName = devName + devFw + moduleName + '_DYN';
     const currentUser = this.dataService.getCurrentUser().username;
    return {
      deviceId: d._id,
      deviceName: d.deviceName,
      modelName: d.model || '',
      modelId: modelId,
      fwVersion: fwVersion,
      userId: currentUser,
      nodeId: matchedNode ? matchedNode.nodeId : '',
      tagName: tagName,
      onExecution: onExecution
    };
  }

  /**
   * Splits the selected DUTs into mapped (have Model - TC Matrix test cases) and
   * unmapped, then shows the appropriate confirmation popup:
   *  - All mapped        → info popup, OK adds all DUTs.
   *  - Mixed             → warning popup, Proceed adds only the mapped DUTs.
   *  - All unmapped      → blocking popup, user must map them first.
   */
  private confirmMatrixDutsAndAdd(row: any, newDuts: any[]) {
    const mapped = newDuts.filter((d: any) => Array.isArray(d.onExecution) && d.onExecution.length > 0);
    const unmapped = newDuts.filter((d: any) => !Array.isArray(d.onExecution) || d.onExecution.length === 0);
    const mappedNames = mapped.map((d: any) => d.deviceName || d.deviceId).join(', ');
    const unmappedNames = unmapped.map((d: any) => d.deviceName || d.deviceId).join(', ');

    // Case 3 — every selected DUT is unmapped: block and ask the user to map first.
    if (mapped.length === 0) {
      this.modal.open(ConfirmationDiaogComponent, {
        width: '600px',
        data: {
          name: 'DUTs Not Mapped',
          text: `The selected DUT(s) are not mapped to the <b>Model - TC Matrix</b>: <b>${unmappedNames}</b>.` +
                `<br/><br/>Please map them in the <b>Model - TC Matrix</b> tab first to proceed further.`,
          action: 'OK',
          showSingleButton: true,
          isHtml: true
        },
        panelClass: 'app-full-bleed-dialog'
      });
      return;
    }

    // Case 1 — every selected DUT is mapped: add directly, no confirmation needed.
    if (unmapped.length === 0) {
      this.submitAddDuts(row, mapped);
      return;
    }

    // Case 2 — mixed: some mapped, some not. Proceed adds only the mapped DUTs.
    const mixedRef = this.modal.open(ConfirmationDiaogComponent, {
      width: '620px',
      data: {
        name: 'Some DUTs Not Mapped',
        text: `The following DUT(s) are mapped to the <b>Model - TC Matrix</b> and will be added to the regression: <b>${mappedNames}</b>.` +
              `<br/><br/>The following DUT(s) are not mapped to the <b>Model - TC Matrix</b> and need to be added there first: <b>${unmappedNames}</b>.` +
              `<br/><br/>Click Proceed to add only the mapped DUT(s), or Cancel to go back.`,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Proceed',
        isHtml: true
      },
      panelClass: 'app-full-bleed-dialog'
    });
    mixedRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.submitAddDuts(row, mapped);
    });
  }

  /** Sends the finalised DUT list to the backend and refreshes the history table. */
  private submitAddDuts(row: any, duts: any[]) {
    if (!duts || duts.length === 0) return;
    this.testLabService.addDutsToDynamicSchedule(row._id, { duts }).subscribe(
      (resp: any) => {
        if (resp && resp.status) {
          this.snackBar.open(
            `${resp.addedCount || duts.length} DUT(s) added. They will run as clients become free.`,
            'OK', { duration: 4000 });
          this.loadHistory();
        } else {
          this.snackBar.open(resp && resp.message ? resp.message : 'Failed to add DUTs.', 'OK', { duration: 4000 });
        }
      },
      (err: any) => {
        const msg = (err && err.error && err.error.message) || 'Failed to add DUTs.';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      }
    );
  }

  /**
   * Normalise & cache the modelTCMatrix from the user settings payload so the
   * "Add DUTs" dialog can flag models that have no TC mapping. Structure is
   * kept identical to the main dynamic-scheduler form's loader.
   */
  private loadModelTCMatrix(data: any) {
    try {
      const settings = Array.isArray(data) ? data[0] : data;
      let raw = (settings && settings.modelTCMatrix) ? settings.modelTCMatrix : {};
      while (raw && !Array.isArray(raw) && raw.modelTCMatrix) {
        raw = raw.modelTCMatrix;
      }
      if (Array.isArray(raw)) {
        this.modelTCMatrix = {};
        return;
      }
      const normalised: any = {};
      Object.keys(raw || {}).forEach(modelId => {
        const entry = raw[modelId];
        if (!entry || typeof entry !== 'object') return;
        if (entry.testSuites) {
          normalised[modelId] = entry;
        } else {
          const testSuites: any = {};
          Object.keys(entry).forEach(suiteId => {
            const tcIds = entry[suiteId];
            testSuites[suiteId] = { suiteName: '', tcIds: Array.isArray(tcIds) ? tcIds : [] };
          });
          normalised[modelId] = { modelName: '', testSuites };
        }
      });
      this.modelTCMatrix = normalised;
    } catch (e) {
      this.modelTCMatrix = {};
    }
  }

  onShowClients(row: any, event: Event) {
    event.stopPropagation();
    const clients = row.clients || [];
    // Build a set of client IDs currently in-use across ALL dynamic regressions.
    // A client is considered "In Use" only when its parent regression is still
    // active (not completed/stopped/cancelled) AND the DUT consuming it is in an
    // active run state.
    const activeDutStatuses = ['inprogress', 'running', 'processing', 'scheduled', 'inqueue'];
    const terminalScheduleStatuses = ['completed', 'stopped', 'cancelled', 'aborted', 'failed'];
    const globallyInUseClientIds = new Set<string>();
    (this.dataSource.data || []).forEach((reg: any) => {
      const schedStatus = (reg.dynamicScheduleStatus || '').toLowerCase();
      if (terminalScheduleStatuses.includes(schedStatus)) return;
      // A non-terminal (Scheduled / InProgress) schedule reserves ALL its selected
      // clients for the whole run, so mark them in-use immediately.
      (reg.clients || []).forEach((c: any) => {
        if (c && c.deviceId) { globallyInUseClientIds.add(c.deviceId); }
      });
      (reg.duts || []).forEach((d: any) => {
        if (d && d.clientId && activeDutStatuses.includes((d.runStatus || '').toLowerCase())) {
          globallyInUseClientIds.add(d.clientId);
        }
      });
    });
    const tableRows = clients.map((c: any) => {
      const inUse = globallyInUseClientIds.has(c.deviceId);
      return {
        clientName: c.deviceName || c.deviceId,
        status: inUse ? 'In Use' : 'Available'
      };
    });

    // Exclusive-client teams reserve every client up front, so the In Use /
    // Available status is meaningless there and the column is hidden.
    const targetFields = this.exclusiveClients ? ['clientName'] : ['clientName', 'status'];

    this.modal.open(ViewTargetComponent, {
      width: '700px',
      data: {
        targetName: 'Client Details',
        targetFields: targetFields,
        data: tableRows
      },
      autoFocus: false,
      panelClass: 'app-full-bleed-dialog'
    });
  }

  onCancelSchedule(row: any) {
    if (!this.isActionEnabled(row)) return;

    const dialogRef = this.modal.open(ConfirmationDiaogComponent, {
      width: '420px',
      data: {
        action: 'Cancel',
        name: 'Dynamic Regression',
        text: 'Are you sure you want to cancel this regression? In-progress DUTs will be stopped immediately and in-queue DUTs will not be executed.',
        cancelButtonText: 'Keep',
        confirmButtonText: 'Cancel'
      },
      panelClass: 'dynamic-theme',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      // Let the user pick immediate vs graceful stop, same as stopRegressionPopUp()
      const dialogRefAdd = this.modal.open(StopOptionsComponent, {
        data: {
          name: 'stopGracefully'
        },
        minHeight: 100,
        minWidth: 500,
        autoFocus: false,
      });

      dialogRefAdd.afterClosed().subscribe((result) => {
        const stopOption = result?.data;
        if (!stopOption) return;

        this.testLabService.stopAllDynamicSchedule(row.duts || [], row.dynamicRegressionTagName, stopOption).subscribe(
        (resp: any) => {
          if (resp && resp.status) {
            const msg = `Dynamic Regression stopped. Stopped ${resp.stoppedInProgress || 0} in-progress and ${resp.stoppedInQueue || 0} in-queue DUT(s).`;
            this.snackBar.open(msg, 'OK', { duration: 5000 });

            // Optimistically update DUT statuses in local data immediately so
            // the user sees the correct final states without waiting for the backend
            // to fully commit the changes.
            const duts: any[] = row.duts || [];
            duts.forEach((d: any) => {
              const s = (d.runStatus || '').toString().toUpperCase().replace(/\s+/g, '');
              if (s === 'INPROGRESS') {
                d.runStatus = 'stopped';
              } else if (s === 'INQUEUE' || s === 'PROCESSING') {
                d.runStatus = 'cancelled';
              }
            });
            row.dynamicScheduleStatus = 'stopped';
            // Recompute badge counts
            row.inProgressCount = 0;
            row.inQueueCount = 0;
            row.stoppedCount = duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'stopped').length;
            row.abortedCount = duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'aborted').length;
            row.cancelledCount = duts.filter((d: any) => (d.runStatus || '').toLowerCase() === 'cancelled').length;

            // If this row is currently expanded, refresh the inner table immediately
            if (this.expandedRow && this.expandedRow._id === row._id) {
              this.innerDataSource.data = [...this.innerDataSource.data.map((d: any) => {
                const s = (d.runStatus || '').toString().toUpperCase().replace(/\s+/g, '');
                if (s === 'INPROGRESS' || s === 'RUNNING') {
                  return { ...d, runStatus: 'stopped' };
                } else if (s === 'INQUEUE' || s === 'SCHEDULED' || s === 'PROCESSING') {
                  return { ...d, runStatus: 'cancelled' };
                }
                return d;
              })];
            }

            // Trigger Angular change detection for the outer table
            this.dataSource.data = [...this.dataSource.data];
          } else {
            this.snackBar.open(resp && resp.message ? resp.message : 'Failed to stop.', 'OK', { duration: 3000 });
          }
        },
        (err: any) => {
          const msg = (err && err.error && err.error.message) || 'Failed to stop.';
          this.snackBar.open(msg, 'OK', { duration: 3000 });
        }
      );
      });
    });
  }
}
