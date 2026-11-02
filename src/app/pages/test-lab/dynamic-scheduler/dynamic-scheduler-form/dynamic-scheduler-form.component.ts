import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelect } from '@angular/material/select';
import { UntypedFormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { startWith, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { UserService } from 'src/app/@core/services/user.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { NameFromIdPipe } from 'src/app/@shared/pipes/name-from-id.pipe';
import { SearchtestsuitePipe } from 'src/app/@shared/pipes/searchtestsuite.pipe';
import { TimeDifferencePipe } from 'src/app/@shared/pipes/time-diffrence.pipe';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TreeviewConfig, TreeviewItem, TreeviewComponent } from '@samotics/ngx-treeview';
import * as _ from 'lodash';
import { SelectNetworkElementDialogComponent } from '../select-network-element-dialog/select-network-element-dialog.component';
import { DynamicDeviceDetailsDialogComponent } from '../dynamic-device-details-dialog/dynamic-device-details-dialog.component';
import { SelectClientDialogComponent } from '../select-client-dialog/select-client-dialog.component';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-dynamic-scheduler-form',
  templateUrl: './dynamic-scheduler-form.component.html',
  styleUrls: ['./dynamic-scheduler-form.component.scss'],
  providers: [NameFromIdPipe, SearchtestsuitePipe, TimeDifferencePipe],
})
export class DynamicSchedulerFormComponent implements OnInit, OnDestroy {
  @Output() scheduled = new EventEmitter<void>();
  @ViewChild('treeViewCompT') treeView: TreeviewComponent;
  @ViewChild('profileSel') profileSel: MatSelect;
  @ViewChild('search') searchTextBox: ElementRef;

  // Testbed Profile selection
  allProfiles = [];
  allTestbed = [];
  dynamicTestbeds = [];
  selectedProfile: any = null;
  selectedTestbed: any = null;
  filteredTestbeds: Observable<any[]>;
  profileFormControl = new UntypedFormControl();
  searchTextboxControl = new UntypedFormControl();

  // Restrict testbeds to those allowed for the current user (User-TestBed Access Matrix)
  private restrictTestbedToUser: boolean = false;
  // When enabled, clients currently in use are excluded from applicable clients and
  // cannot be selected until they become available.
  exclusiveClients: boolean = false;
  private cmtsNetworkElementNodeId: string = '';
  cmtsNetworkElementName: string = '';
  showCmtsField: boolean = false;
  cmtsFirmwareVersion: string = '';
  cmtsDeviceName: string = '';
  private inUseClientIds: Set<string> = new Set();
  private settingsData: any = null;
  private matrixChangeSub: any;

  // Test data
  allModules = [];
  allTestsuite = [];
  allTestcase = [];
  allTestgroup = [];
  allNodes = [];
  allDevices = [];
  allAPI = [];
  allAPIGroup = [];
  allModels = [];
  testBedVariables = [];

  // Model-TC Matrix loaded from settings (for DUT hyperlink preview)
  modelTCMatrix: { [modelId: string]: { modelName: string; testSuites: { [suiteId: string]: { suiteName: string; tcIds: string[] } } } } = {};

  // DUT TC Matrix inline modal
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
  // Tracks which DUT is open in the modal and per-DUT {tcId, suiteId} selections
  private dutMatrixActiveDutId = '';
  private dutMatrixTcToSuiteMap: { [tcId: string]: string } = {};
  dutMatrixSelections: { [dutId: string]: Array<{ tcId: string; suiteId: string }> } = {};

  // Test selection
  selectedModule: any;
  selectedTestsuite: any;
  selectedTS: any = null;
  selectedTestcase = [];
  checkedTestsuite = [];
  checkedTestsuiteStatus = [];
  testSuites = [];
  testSets: any;
  search_test_suite: any = '';

  // Tree view
  showTree = false;
  lastShownIndex = -1;
  testSuiteOnCheckbox;
  items = [];
  config = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: false,
    maxHeight: 400,
  });
  showModal: boolean = false;

  // Job config
  rerunStaus = false;
  cpuGraph = false;
  automatedMail = false;
  updateJira = true;
  jiraUpdateType = 'update';
  executionIdUpdate = '';
  disableScheduleButton = false;

  /** Track whether we've already shown the unmapped-models popup for the current
   *  DUT selection so it doesn't keep re-opening on every change-detection cycle. */
  private unmappedPopupShown = false;

  // Flags
  selectedTeam: any;
  jira_option_flag: boolean = false;
  automated_mail_flag: boolean = false;
  jira_project_id_flag: boolean = false;
  telemetry_option_flag: boolean = false;
  telemetry_options: any = [{ name: 'SNMP', value: 'SNMP' }, { name: 'ACS', value: 'TR069' }, { name: 'SNMP & ACS', value: 'Both' }];
  telemetry_time_option: any = [{ name: '15', value: '15' }, { name: '20', value: '20' }, { name: '30', value: '30' }, { name: '45', value: '45' }];
  polling_type: any;
  snmp_time_interval: any;
  acs_time_interval: any;
  telemetory_object: any = [];
  telemetory_object_option: any = [
    { name: 'All', value: 'all' },
    { name: 'CPU', value: 'cpu' },
    { name: 'Memory', value: 'memory' },
    { name: 'Uptime', value: 'uptime' }
  ];
  totalTime: number = 0;
  environment_type: any = [];
  selected_environment: any = '';
  enable_environment_type_selection: boolean = false;
  priority_flag2: boolean = false;
  col1: any = '20%';
  col2: any = '60%';
  testSetFilterDetails: any;
  test_set_filter: boolean = false;
  testSetMapping: boolean;
  disabledTestSet = false;
  enableTestSuites = false;
  showMessage = false;
  sortFlag: any;
  sortFlag1: any;
  bufferTime: number = 0;

  // Test selection mode (radio buttons): 'modelTcMatrix' (default) | 'testSuite'
  selectionMode: string = 'modelTcMatrix';

  // Subscriptions
  private sub1; private sub2; private sub3; private sub4; private sub5;
  private sub6; private sub7; private sub8; private sub9; private sub10;
  private sub11; private sub12; private modelSubscription;

  // Polls device availability so Applicable Clients reflects in-use state live.
  private clientStatusPoll: any;

  constructor(
    public dataService: DataService,
    private nameFromId: NameFromIdPipe,
    private modal: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private testLabService: TestLabService,
    private userService: UserService,
    private deviceInventoryService: DeviceInventoryService,
    private timeDifference: TimeDifferencePipe,
  ) {
    // Subscribe to testbed profiles
    this.sub1 = this.dataService.getTestbedProfile().subscribe((profiles) => {
      if (profiles) {
        this.allProfiles = profiles;
      }
    });

    // Subscribe to testbeds and filter for dynamic-enabled ones
    this.sub12 = this.dataService.getTestBed().subscribe((testbeds) => {
      if (testbeds) {
        this.allTestbed = testbeds;
        this.filterDynamicTestbeds();
      }
    });

    this.sub2 = this.dataService.getTCModules().subscribe((modules) => {
      if (modules) {
        this.allModules = modules;
      }
    });

    this.sub3 = this.dataService.getTestGroup().subscribe((tcGroup) => {
      if (tcGroup) {
        this.allTestgroup = tcGroup;
      }
    });

    this.sub4 = this.dataService.getTestCases().subscribe((tc) => {
      if (tc) {
        this.allTestcase = tc;
      }
    });

    this.sub5 = this.dataService.getTestSuites().subscribe((ts) => {
      if (ts) {
        this.allTestsuite = ts;
        this.testSuites = this.allTestsuite;
      }
    });

    this.sub6 = this.dataService.getNodes().subscribe((nodes) => {
      if (nodes) {
        this.allNodes = nodes;
      }
    });

    this.sub7 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
        // Live-remove clients that just became in-use (Exclusive Clients mode).
        this.applyExclusiveInUseFilter();
        // Device FW may have just loaded/changed — refresh the CMTS FW display.
        this.resolveCmtsFirmwareVersion();
      }
    });

    this.sub8 = this.dataService.getTestbedVariables().subscribe((tbVar) => {
      if (tbVar) {
        this.testBedVariables = tbVar;
      }
    });

    this.sub9 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });

    this.sub10 = this.dataService.getAllAPI().subscribe((api) => {
      if (api) {
        this.allAPI = api;
      }
    });

    this.sub11 = this.dataService.getAllAPIGroup().subscribe((apiGroup) => {
      if (apiGroup) {
        this.allAPIGroup = apiGroup;
      }
    });

    this.modelSubscription = this.dataService.getAllModels().subscribe((models) => {
      if (models) {
        this.allModels = models;
      }
    });
  }

  ngOnInit() {
    this.dataService.fetchSystemConfig();
    this.startClientStatusPolling();
    this.refreshInUseClients();
    this.dataService.systemConfig.subscribe(config => {
      if (config && config.additional_time_for_reservation_value) {
        this.bufferTime = Number(config.additional_time_for_reservation_value) || 0;
      }
    });

    this.dataService.isJiraEnabled.subscribe((dt) => {
      if (dt) {
        this.jira_option_flag = true;
        this.jira_project_id_flag = true;
      } else {
        this.updateJira = false;
        this.jira_option_flag = false;
        this.jira_project_id_flag = false;
      }
    });

    this.userService.getAllusers().subscribe((data: any) => {
      // Cache settings blob for downstream filters (e.g. restrict testbeds to user)
      this.settingsData = data && data[0] ? data[0] : null;
      // Read regressionConfig team-specific flags
      if (data[0].regressionConfig && data[0].regressionConfig[0] && data[0].regressionConfig[0].teams) {
        const teamConfig = data[0].regressionConfig[0].teams.find((team: any) => team.name === this.selectedTeam);
        if (teamConfig) {
          this.restrictTestbedToUser = !!teamConfig.restrict_testbed_to_user;
          this.exclusiveClients = !!teamConfig.exclusive_clients;
          this.cmtsNetworkElementNodeId = teamConfig.cmts_network_element || '';
          console.log('Configured CMTS Node Id: 320', this.cmtsNetworkElementNodeId);
          this.resolveCmtsFirmwareVersion();
        }
      }
      // Re-apply dynamic testbed filter now that user-access restriction is known
      this.filterDynamicTestbeds();
      // Live-refresh whenever the User-TestBed Access Matrix is saved elsewhere
      if (!this.matrixChangeSub) {
        this.matrixChangeSub = this.dataService.onUserTestbedAccessMatrixChanged().subscribe((matrix: any) => {
          if (this.settingsData) { this.settingsData.userTestbedAccessMatrix = matrix; }
          this.filterDynamicTestbeds();
        });
      }
      // Load and normalise the persisted modelTCMatrix so we can validate that the
      // selected DUTs' models actually have test cases mapped before scheduling.
      this.loadModelTCMatrix(data);
      if (data[0].extraSystemConfig && data[0].extraSystemConfig[0]) {
        if (data[0].extraSystemConfig[0].automated_mail == true) {
          this.automated_mail_flag = true;
        }
        if (data[0].extraSystemConfig[0].cpe_telemetry == true) {
          this.telemetry_option_flag = true;
        }
      }
      if (data[0].dashboardConfig && data[0].dashboardConfig[0] && data[0].dashboardConfig[0].teams) {
        data[0].dashboardConfig[0].teams.forEach(el => {
          if (el.name == this.selectedTeam) {
            if (el.enable_environment_type_selection && el.enable_environment_type_selection == true) {
              this.enable_environment_type_selection = true;
              this.environment_type = el.environment_value_array;
            }
            if (el.enable_priority_two_For_TC_Re && el.enable_priority_two_For_TC_Re == true) {
              this.col1 = '15%';
              this.col2 = '50%';
              this.priority_flag2 = true;
            }
          }
        });
      }
      // Test set filter - read from extraSystemConfig like Scheduler
      if (data[0].extraSystemConfig && data[0].extraSystemConfig[0]) {
        this.testSetFilterDetails = (data[0].extraSystemConfig[0].teams || []).filter(team => {
          return (team.name === this.selectedTeam);
        });
        if (this.testSetFilterDetails && this.testSetFilterDetails.length > 0
          && this.testSetFilterDetails[0].test_set_filter && this.testSetFilterDetails[0].test_set_filter == true) {
          this.test_set_filter = true;
        } else {
          this.test_set_filter = false;
          this.enableTestSuites = true;
          this.testSuites = this.allTestsuite;
        }
      }
      // Load Model-TC Matrix for DUT hyperlink preview
      const settings = Array.isArray(data) ? data[0] : data;
      let raw = (settings && settings.modelTCMatrix) ? settings.modelTCMatrix : {};
      while (raw && !Array.isArray(raw) && raw.modelTCMatrix) { raw = raw.modelTCMatrix; }
      if (raw && !Array.isArray(raw) && typeof raw === 'object') { this.modelTCMatrix = raw; }
    });
  }

  ngOnDestroy() {
    if (this.sub1) this.sub1.unsubscribe();
    if (this.sub2) this.sub2.unsubscribe();
    if (this.sub3) this.sub3.unsubscribe();
    if (this.sub4) this.sub4.unsubscribe();
    if (this.sub5) this.sub5.unsubscribe();
    if (this.sub6) this.sub6.unsubscribe();
    if (this.sub7) this.sub7.unsubscribe();
    if (this.sub8) this.sub8.unsubscribe();
    if (this.sub9) this.sub9.unsubscribe();
    if (this.sub10) this.sub10.unsubscribe();
    if (this.sub11) this.sub11.unsubscribe();
    if (this.sub12) this.sub12.unsubscribe();
    if (this.modelSubscription) this.modelSubscription.unsubscribe();
    if (this.matrixChangeSub) this.matrixChangeSub.unsubscribe();
    if (this.clientStatusPoll) clearInterval(this.clientStatusPoll);
  }

  // --- Profile Selection ---

  /** Only show testbeds that have dynamic toggle enabled */
  private filterDynamicTestbeds() {
    if (!this.allTestbed) return;
    let filtered = this.allTestbed.filter(tb => tb.dynamic === true && tb.status === 'active');
    // Restrict to user's allowed testbeds when enabled (User-TestBed Access Matrix)
    if (this.restrictTestbedToUser && this.settingsData) {
      filtered = this.dataService.filterTestbedsByAccessMatrix(filtered, this.settingsData, this.selectedTeam);
    }
    this.dynamicTestbeds = filtered;
    this.filteredTestbeds = this.searchTextboxControl.valueChanges.pipe(
      startWith<string>(''),
      map(name => this._filterTestbeds(name))
    );
  }

  private _filterTestbeds(value: string): any[] {
    if (!value) return this.dynamicTestbeds;
    const filterValue = value.toLowerCase();
    return this.dynamicTestbeds.filter(tb =>
      tb.testBedName.toLowerCase().includes(filterValue)
    );
  }

  onProfileSelected(event) {
    this.selectedTestbed = event.value;
    // Look up the associated testbed profile
    this.selectedProfile = this.allProfiles.find(p => p._id === this.selectedTestbed.testBedProfileId) || null;
    this.selectedNodes = [];
    this.selectedDUTDevices = [];
    this.selectedDUTDeviceIds = [];
    this.selectedClientDevices = [];
    this.selectedClientDeviceIds = [];
    this.disableScheduleButton = false;

    // Auto-select all available clients (pool-enabled, unmapped devices)
    this.autoSelectClients();
    // Refresh coupled-client in-use state for the new testbed selection.
    this.refreshInUseClients();

    // Reset TestSet/TestSuite selections on profile change (like testbedChanges in Scheduler)
    this.testSets = [];
    this.selectedModule = undefined;
    this.selectedTestsuite = undefined;
    this.selectedTS = null;
    this.selectedTestcase = [];
    this.checkedTestsuite = [];
    this.enableTestSuites = false;
    this.disabledTestSet = false;

    if (this.test_set_filter) {
      this.search_test_suite = '';
      if (this.testSetFilterDetails && this.testSetFilterDetails.length > 0
        && this.testSetFilterDetails[0].is_TestBedProfile_TestSet_Mapped
        && this.testSetFilterDetails[0].is_TestBedProfile_TestSet_Mapped == true) {
        // Profile-based TestSet mapping
        this.testSets = [];
        this.enableTestSuites = false;
        const profile = this.selectedProfile;
        if (profile.mappedTestSets && profile.mappedTestSets.length > 0) {
          profile.mappedTestSets.forEach(ts => {
            const temp = this.allModules.filter(module => {
              return (module._id === ts);
            });
            this.disabledTestSet = temp && temp.length > 0 ? false : true;
            this.testSets.push(temp[0]);
          });
        } else {
          this.testSets = [];
          this.disabledTestSet = true;
        }
      } else {
        this.testSets = this.allModules;
        this.enableTestSuites = false;
      }
    } else {
      this.enableTestSuites = true;
      this.testSuites = this.allTestsuite;
    }

    this.resolveCmtsFirmwareVersion();
    this.isValidJob();
  }

  /**
   * Resolves the firmware version of the testbed's configured CMTS network element
   * (Settings > Regression Config > CMTS Network Element). Shows the field whenever
   * the selected testbed contains the configured CMTS node; finds that node's
   * assigned device and applies the Device-FW-first / CM-Firmware-fallback
   * convention used elsewhere, defaulting to 'NA' when no firmware is available.
   * Hides the field when the testbed has no matching CMTS node or nothing is configured.
   */
  private resolveCmtsFirmwareVersion(): void {
    this.showCmtsField = false;
    this.cmtsFirmwareVersion = '';
    this.cmtsNetworkElementName = '';
    this.cmtsDeviceName = '';
    if (!this.cmtsNetworkElementNodeId || !this.selectedTestbed || !Array.isArray(this.selectedTestbed.nodes)) {
      return;
    }
    console.log('Selected Testbed:', this.selectedTestbed);
    console.log('Testbed Nodes:', this.selectedTestbed.nodes);
    console.log('Configured CMTS Node Id:', this.cmtsNetworkElementNodeId);
    const cmtsNode = this.selectedTestbed.nodes.find((n: any) => n && String(n.nodeId) === String(this.cmtsNetworkElementNodeId));
    console.log('Matched Node:', cmtsNode);
    if (!cmtsNode) { return; }

    // The configured CMTS node exists in this testbed — show the field.
    this.showCmtsField = true;
    const nodeDoc = _.find(this.allNodes, (n: any) => n && String(n._id) === String(this.cmtsNetworkElementNodeId));
    this.cmtsNetworkElementName = (nodeDoc && nodeDoc.nodeName) || cmtsNode.nodeName || 'CMTS';

    const isBlank = (val: any) => {
      const str = (val === undefined || val === null) ? '' : String(val).trim();
      const up = str.toUpperCase();
      return str === '' || up === 'NA' || up === 'NULL' || up === 'NIL';
    };

    const device = this.allDevices.find(
      (d: any) =>
        String(d._id) === String(cmtsNode.deviceId)
    );
    this.cmtsDeviceName = device?.deviceName || '';
    console.log('Matched Device:', device);

    this.showCmtsField = true;
    this.cmtsFirmwareVersion = device?.deviceFWVersion || 'NA';
    console.log('CMTS Firmware Version:', this.cmtsFirmwareVersion);
    
    if (device && !isBlank(device.deviceFWVersion)) {
      this.cmtsFirmwareVersion = String(device.deviceFWVersion).trim();
    } else if (device && !isBlank(device['CM Firmware Version'])) {
      this.cmtsFirmwareVersion = String(device['CM Firmware Version']).trim();
    } else {
      this.cmtsFirmwareVersion = 'NA';
    }
  }

  openedChange(e: boolean) {
    this.searchTextboxControl.setValue('');
    if (e) {
      if (this.searchTextBox) {
        this.searchTextBox.nativeElement.focus();
      }
    }
  }

  handleInput(event: KeyboardEvent) {
    event.stopPropagation();
  }

  // --- Network Element ---

  selectedNodes: any[] = [];
  selectedDUTDevices: any[] = [];
  selectedDUTDeviceIds: string[] = [];
  selectedClientDevices: any[] = [];
  selectedClientDeviceIds: string[] = [];

  /** Teams with exclusive_clients pick clients explicitly; others just see the applicable pool. */
  get clientsLabel(): string {
    return this.exclusiveClients ? 'Select Clients' : 'Applicable Clients';
  }
  /** Source of truth: all pool-eligible applicable clients. The visible
   *  Applicable Clients list is derived from this minus any currently in-use,
   *  so freed clients reappear automatically (no page refresh needed). */
  allApplicableClients: any[] = [];

  onSelectNetworkElement() {
    if (!this.selectedTestbed) {
      this.snackBar.open('Please select a Testbed first.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.selectedProfile) {
      this.snackBar.open('Testbed Profile not found for the selected Testbed.', 'OK', { duration: 3000 });
      return;
    }
    const dialogRef = this.modal.open(SelectNetworkElementDialogComponent, {
      width: '500px',
      data: {
        profile: this.selectedProfile,
        testbed: this.selectedTestbed,
        previousSelection: this.selectedDUTDeviceIds,
        modelTCMatrix: this.modelTCMatrix,
        allModels: this.allModels,
        selectionMode: this.selectionMode
      },
      panelClass: 'dynamic-theme',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'finish') {
        this.selectedDUTDevices = result.selectedDevices;
        this.selectedDUTDeviceIds = result.selectedDeviceIds;
        // Selection changed — re-evaluate the unmapped popup gating
        this.unmappedPopupShown = false;
        this.notifyUnmappedModelsIfAny();
        this.isValidJob();
      }
    });
  }

  onSelectClients() {
    if (!this.selectedTestbed) {
      this.snackBar.open('Please select a Testbed first.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.selectedProfile) {
      this.snackBar.open('Testbed Profile not found for the selected Testbed.', 'OK', { duration: 3000 });
      return;
    }
    const dialogRef = this.modal.open(SelectClientDialogComponent, {
      width: '500px',
      data: {
        profile: this.selectedProfile,
        testbed: this.selectedTestbed,
        previousSelection: this.selectedClientDeviceIds,
        exclusiveClients: this.exclusiveClients
      },
      panelClass: 'dynamic-theme',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'finish') {
        this.allApplicableClients = result.selectedDevices || [];
        this.applyExclusiveInUseFilter();
      }
    });
  }

  autoSelectClients() {
    if (!this.selectedTestbed || !this.selectedTestbed.nodes) return;

    // Exclusive-client teams must pick clients explicitly — start with none selected.
    if (this.exclusiveClients) {
      this.allApplicableClients = [];
      this.selectedClientDevices = [];
      this.selectedClientDeviceIds = [];
      this.isValidJob();
      return;
    }

    // Collect all device IDs mapped to any testbed
    const mappedDeviceIds = new Set<string>();
    if (this.allTestbed && this.allTestbed.length > 0) {
      this.allTestbed.forEach(tb => {
        if (tb.nodes && tb.nodes.length > 0) {
          tb.nodes.forEach(node => {
            if (node.deviceId) {
              mappedDeviceIds.add(node.deviceId);
            }
          });
        }
      });
    }

    // Get profile IDs from pool-enabled nodes in the selected testbed
    const poolProfileIds = [...new Set(
      this.selectedTestbed.nodes.filter(n => n.pool).map(n => n.profileId)
    )];

    // device.profileId may be a string (legacy) or array (multi-profile form).
    // Normalize before checking for any overlap with poolProfileIds.
    const matchesPoolProfile = (d: any) => {
      const ids = Array.isArray(d.profileId) ? d.profileId : [d.profileId];
      return ids.some((id: string) => poolProfileIds.includes(id));
    };

    // Filter: devices under pool profiles AND not mapped to any testbed
    let availableClients = this.allDevices.filter(d =>
      matchesPoolProfile(d) && !mappedDeviceIds.has(d._id)
    );

    // Base (source of truth) = all pool-eligible clients; the visible list is derived
    // from this minus any currently in-use, so freed clients reappear automatically.
    this.allApplicableClients = availableClients.map(d => ({ _id: d._id, deviceName: d.deviceName }));
    this.applyExclusiveInUseFilter();
  }

  /**
   * Periodically refresh device availability so the Applicable Clients list reflects
   * in-use state without a page refresh. Only polls while Exclusive Clients is enabled
   * and a testbed is selected, to avoid unnecessary load.
   */
  private startClientStatusPolling() {
    this.clientStatusPoll = setInterval(() => {
      if (!this.exclusiveClients || !this.selectedTestbed) { return; }
      this.deviceInventoryService.getAllData().subscribe((data: any) => {
        if (data) {
          this.dataService.getDeviceInventoryData().next(data);
        }
      });
      // Keep the coupled-client in-use set fresh alongside device availability.
      this.refreshInUseClients();
    }, 10000);
  }

  /**
   * Refresh the set of client device ids coupled to a DUT that is actively running
   * in a non-terminal dynamic schedule (same "in use" source as DUTs), then re-apply
   * the Applicable Clients filter so busy clients are removed live.
   */
  private refreshInUseClients() {
    if (!this.exclusiveClients) { return; }
    this.testLabService.getAllDynamicSchedules().pipe(
      catchError(() => of([]))
    ).subscribe((schedules: any) => {
      this.inUseClientIds = this.computeInUseClientIds(schedules);
      this.applyExclusiveInUseFilter();
    });
  }

  /** Client device ids coupled to a busy DUT in a non-terminal dynamic schedule. */
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

  /**
   * Recompute the visible Applicable Clients list from the base eligible set
   * (allApplicableClients): drop any client currently in-use and re-add ones that
   * have been freed. Non-destructive so released clients reappear without a page
   * refresh. When Exclusive Clients is off, the full base list is shown as-is.
   */
  private applyExclusiveInUseFilter() {
    if (!this.selectedTestbed) { return; }
    const base = this.allApplicableClients || [];
    if (!this.exclusiveClients) {
      this.selectedClientDevices = [...base];
      this.selectedClientDeviceIds = base.map((c: any) => c._id);
      this.isValidJob();
      return;
    }
    const inUseIds = new Set(
      (this.allDevices || []).filter(d => d.available === false).map(d => d._id)
    );
    // Also treat clients coupled to a busy DUT in an active schedule as in-use.
    this.inUseClientIds.forEach(id => inUseIds.add(id));
    this.selectedClientDevices = base.filter((c: any) => !inUseIds.has(c._id));
    this.selectedClientDeviceIds = this.selectedClientDevices.map((c: any) => c._id);
    // Clients may have changed (including to/from 0), so re-evaluate the Schedule button.
    this.isValidJob();
  }

  // --- Network Element Category Display ---

  showCategoryDeviceDetails(category: string) {
    let filteredNodes = [];
    if (category === 'Static') {
      filteredNodes = this.selectedNodes.filter(n => !n.dyn);
    } else if (category === 'DUTs') {
      filteredNodes = this.selectedNodes.filter(n => n.dyn && n.dut);
    } else if (category === 'Clients') {
      filteredNodes = this.selectedNodes.filter(n => n.dyn && !n.dut);
    }
    this.modal.open(DynamicDeviceDetailsDialogComponent, {
      width: '900px',
      minHeight: '600px',
      data: {
        category: category,
        nodes: filteredNodes,
        allNodes: this.allNodes,
        allDevices: this.allDevices,
      },
    });
  }

  // --- Test Suite / Test Case Selection (same as select-testbeds) ---

  getTestSuitesOfModule(event) {
    if (event && event.value) {
      this.selectedModule = event.value;
    }
    this.test_set_filter ? '' : this.selectedModule = [];
    if (this.selectedModule) {
      this.selectedTestsuite = undefined;
      this.selectedTS = null;
      this.selectedTestcase = [];
      this.checkedTestsuite = [];
      this.enableTestSuites = this.selectedModule['_id'] ? true : false;
      this.search_test_suite = '';
      if (this.test_set_filter) {
        this.testSuites = _.filter(this.allTestsuite, {
          moduleId: this.selectedModule['_id'],
        });
        // Also include test suites where moduleId is an array containing the selected module
        for (let i = 0; i < this.allTestsuite.length; i++) {
          if (typeof this.allTestsuite[i].moduleId != 'string') {
            this.allTestsuite[i].moduleId.forEach(ele => {
              if (ele == this.selectedModule['_id']) {
                this.testSuites.push(this.allTestsuite[i]);
              }
            });
          }
        }
      } else {
        this.testSuites = this.allTestsuite;
      }
    }
  }

  addTestcaseFromTestsuite(event) {
    this.selectedTS = event['value'];
    this.selectedTestcase = [];
    this.checkedTestsuite = [];
    if (event['value']) {
      this.checkedTestsuite.push(this.selectedTS);
      this.selectedTS['testCases'].forEach((element) => {
        let id: any;
        if (element && typeof element === 'object' && element.constructor === Object) {
          id = element._id;
        } else if (element) {
          id = element;
        }
        const testcase = _.find(this.allTestcase, { _id: id });
        if (testcase) {
          this.selectedTestcase.push(testcase);
        }
      });
    } else {
      const index = this.checkedTestsuite.indexOf(this.selectedTS);
      if (index > -1) {
        this.checkedTestsuite.splice(index, 1);
        this.selectedTS['testCases'].forEach((element) => {
          const tcindex = _.findIndex(this.selectedTestcase, {
            _id: element['_id'],
            testSuiteId: element['testSuiteId'],
          });
          if (tcindex > -1) {
            this.selectedTestcase.splice(tcindex, 1);
          }
        });
      }
    }
    this.isValidJob();
  }

  calculateTime() {
    this.totalTime = 0;
    this.selectedTestcase.forEach((tc) => {
      this.totalTime += tc.autoExectime != null && tc.autoExectime > 0 ? tc.autoExectime : tc.manualExectime;
    });
    this.totalTime = this.timeDifference.transform(Math.ceil(this.totalTime * 60));
  }

  openTestSuiteSelectonModal() {
    this.showModal = true;
  }

  close() {
    this.showModal = false;
  }

  openedTestSuiteChange(e: boolean) {
    if (!e) {
      this.search_test_suite = '';
    }
  }

  loadTreeForTs(testSuite, status, index) {
    this.testSuiteOnCheckbox = testSuite;
    if (index === this.lastShownIndex) {
      this.lastShownIndex = -1;
      this.showTree = false;
      return;
    } else {
      this.lastShownIndex = index;
      this.showTree = true;
    }

    let updateTestCasesArr = [];
    testSuite.testCases.forEach((el: any) => {
      this.allTestcase.find(d => {
        if (el && typeof el === 'object' && el.constructor === Object) {
          (d._id == el._id) ? updateTestCasesArr.push(d) : '';
        } else {
          (d._id == el) ? updateTestCasesArr.push(d) : '';
        }
      });
    });
    testSuite.testCases = updateTestCasesArr;

    const testGroupbyId = _.chain(testSuite['testCases'])
      .groupBy('tcGroupId')
      .toPairs()
      .map(function (currentItem) {
        return _.zipObject(['tcGroupId', 'tc'], currentItem);
      })
      .value();
    this.items = [];
    testGroupbyId.forEach((element) => {
      const tcGroupId = element['tcGroupId'];
      let testGroupName = '';
      if (typeof tcGroupId === 'string') {
        testGroupName = this.nameFromId.transform(tcGroupId, this.allTestgroup, '_id', 'testGroupName');
      }
      const temp = {
        text: testGroupName,
        collapsed: true,
        value: 1,
        children: [],
      };
      if (Array.isArray(element['tc'])) {
        element['tc'].forEach((tc) => {
          const tcStatus = _.find(this.selectedTestcase, {
            _id: tc['_id'],
            tcGroupId: tc['tcGroupId'],
          }) ? true : false;

          temp['children'].push({
            text: tc['tcName'],
            value: tc,
            checked: tcStatus,
          });
        });
      }
      this.items.push(new TreeviewItem(temp));
    });
    this.checkedTestsuiteStatus[this.lastShownIndex] = this.checkStatus(testSuite);
    this.isValidJob();
  }

  updateSelectedTestCase(data) {
    let unselectedItem = [];
    if (this.treeView) {
      unselectedItem = this.treeView.selection.uncheckedItems.map((item) => item.value);
      if (unselectedItem.length > 0) {
        unselectedItem.forEach((tc) => {
          _.remove(this.selectedTestcase, {
            _id: tc['_id'],
            tcGroupId: tc['tcGroupId'],
          });
        });
      }
    }
    data.forEach((element) => {
      const index = _.findIndex(this.selectedTestcase, {
        _id: element['_id'],
        tcGroupId: element['tcGroupId'],
      });
      if (index > -1) {
        this.selectedTestcase[index] = element;
      } else {
        this.selectedTestcase.push(element);
      }
    });
    this.checkedTestsuiteStatus[this.lastShownIndex] = this.checkStatus(this.testSuiteOnCheckbox);
    this.isValidJob();
    this.calculateTime();
  }

  checkStatus(item) {
    let status = false;
    item?.['testCases'].forEach((element) => {
      const tc = _.findIndex(this.selectedTestcase, element);
      if (tc > -1) {
        status = true;
      }
    });
    return status;
  }

  deleteTestcaseFromFinalList(testcase) {
    _.remove(this.selectedTestcase, testcase);
    if (this.showTree) {
      const lastShown = this.lastShownIndex;
      this.lastShownIndex = -1;
      this.loadTreeForTs(this.testSuiteOnCheckbox, true, lastShown);
    }
    this.isValidJob();
    this.calculateTime();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedTestcase, event.previousIndex, event.currentIndex);
  }

  sortByTcId() {
    if (!this.sortFlag1 || this.sortFlag1 === 'Dess') {
      this.selectedTestcase = _.orderBy(this.selectedTestcase, ['tcId'], ['asc']);
      this.sortFlag1 = 'Acc';
    } else {
      this.selectedTestcase = _.orderBy(this.selectedTestcase, ['tcId'], ['desc']);
      this.sortFlag1 = 'Dess';
    }
  }

  sorttestcases() {
    if (!this.sortFlag || this.sortFlag === 'Dess') {
      this.selectedTestcase = _.orderBy(this.selectedTestcase, ['tcPrioritytwo'], ['asc']);
      this.sortFlag = 'Acc';
    } else {
      this.selectedTestcase = _.orderBy(this.selectedTestcase, ['tcPrioritytwo'], ['desc']);
      this.sortFlag = 'Dess';
    }
  }

  isValidJob() {
    const hasClients = (this.selectedClientDeviceIds || []).length > 0;
    if (this.selectionMode === 'modelTcMatrix') {
      // In Model - TC Matrix mode, test cases are resolved server-side from model mapping.
      // Require that every selected DUT's model has at least one TC mapped in the matrix.
      const unmapped = this.computeUnmappedModelsForSelectedDuts();
      this.disableScheduleButton = !!(this.selectedTestbed && this.selectedDUTDeviceIds.length > 0 && hasClients && unmapped.length === 0);
    } else {
      this.disableScheduleButton = !!(this.selectedTestbed && this.selectedDUTDeviceIds.length > 0 && hasClients && this.selectedTestcase.length > 0);
    }
  }

  onSelectionModeChange() {
    // Clear Test Suite Selection state when switching to Model - TC Matrix so the
    // previously chosen test suite / test cases aren't carried over (and don't
    // remain visible in the right-side summary panel in a disabled state).
    if (this.selectionMode === 'modelTcMatrix') {
      this.selectedModule = undefined;
      this.selectedTestsuite = undefined;
      this.selectedTS = null;
      this.selectedTestcase = [];
      this.checkedTestsuite = [];
      this.totalTime = 0;
      // Refresh matrix from server in case it was updated in another tab/session,
      // then validate the selected DUTs against it.
      this.userService.getAllusers().subscribe((data: any) => {
        this.loadModelTCMatrix(data);
        this.unmappedPopupShown = false;
        this.notifyUnmappedModelsIfAny();
        this.isValidJob();
      }, () => {
        this.notifyUnmappedModelsIfAny();
        this.isValidJob();
      });
    }
    // Re-evaluate Schedule button availability when toggling selection mode
    this.isValidJob();
  }

  /** Normalise & store modelTCMatrix from the user settings payload. */
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

  /** True when the matrix has at least one TC mapped for the given modelId. */
  private isModelMapped(modelId: string): boolean {
    if (!modelId) return false;
    const entry = this.modelTCMatrix[modelId];
    if (!entry || !entry.testSuites) return false;
    return Object.keys(entry.testSuites).some(suiteId => {
      const suite = entry.testSuites[suiteId];
      return suite && Array.isArray(suite.tcIds) && suite.tcIds.length > 0;
    });
  }

  /** Returns deduplicated list of selected DUTs' models that have no TC mapping. */
  private computeUnmappedModelsForSelectedDuts(): { modelId: string; modelName: string }[] {
    const seen = new Set<string>();
    const unmapped: { modelId: string; modelName: string }[] = [];
    (this.selectedDUTDeviceIds || []).forEach(devId => {
      const device: any = _.find(this.allDevices, { _id: devId });
      if (!device) return;
      const modelDoc: any = _.find(this.allModels, (m: any) => m && m.modelName === device.model);
      const modelId = modelDoc ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : '')) : '';
      const modelName = (modelDoc && modelDoc.modelName) || device.model || '(unknown)';
      const key = modelId || modelName;
      if (seen.has(key)) return;
      seen.add(key);
      if (!this.isModelMapped(modelId)) {
        unmapped.push({ modelId, modelName });
      }
    });
    return unmapped;
  }

  /** Open an info popup listing the models that need TC mapping in Model - TC Matrix. */
  private notifyUnmappedModelsIfAny() {
    if (this.selectionMode !== 'modelTcMatrix') return;
    if (!this.selectedDUTDeviceIds || this.selectedDUTDeviceIds.length === 0) return;
    const unmapped = this.computeUnmappedModelsForSelectedDuts();
    if (unmapped.length === 0) {
      this.unmappedPopupShown = false;
      return;
    }
    if (this.unmappedPopupShown) return;
    this.unmappedPopupShown = true;
    const modelList = unmapped.map(m => m.modelName).join(', ');
    const message =
      `Test cases are not configured for the following model(s): <b>${modelList}</b>.` +
      `<br/><br/>Please go to the <b>Model - TC Matrix</b> tab to configure test cases for these models before scheduling.`;
    this.modal.open(ConfirmationDiaogComponent, {
      width: '520px',
      data: {
        name: 'Model TC Mapping Required',
        text: message,
        action: 'Okay',
        showSingleButton: true,
        isHtml: true
      },
      panelClass: 'app-full-bleed-dialog'
    });
  }

  /** Returns true when the DUT's model has at least one test case mapped in the Model-TC Matrix */
  hasDutMatrix(dut: { _id: string; deviceName: string }): boolean {
    if (!dut || !this.allDevices || !this.allModels) return false;
    const device = this.allDevices.find(d => d._id === dut._id);
    if (!device) return false;
    const modelDoc = this.allModels.find((m: any) => m && m.modelName === device.model);
    if (!modelDoc) return false;
    const modelId = modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : '');
    if (!modelId) return false;
    const entry = this.modelTCMatrix[modelId];
    if (!entry || !entry.testSuites) return false;
    // Require at least one suite that actually has mapped tcIds
    const suiteIds = Object.keys(entry.testSuites);
    for (const sId of suiteIds) {
      const suite = entry.testSuites[sId];
      if (suite && Array.isArray(suite.tcIds) && suite.tcIds.length > 0) return true;
    }
    return false;
  }

  /** Builds ngx-treeview items for the DUT and opens the inline modal */
  openDutTcMatrixPreview(dut: { _id: string; deviceName: string }) {
    const device = this.allDevices.find(d => d._id === dut._id);
    console.log('[DUT Matrix] device:', device);
    if (!device) { console.warn('[DUT Matrix] device not found for', dut._id); return; }
    const modelDoc = this.allModels.find((m: any) => m && m.modelName === device.model);
    console.log('[DUT Matrix] modelDoc:', modelDoc, '| device.model:', device.model);
    if (!modelDoc) { console.warn('[DUT Matrix] no model doc found for model name:', device.model); return; }
    const modelId = modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : '');
    console.log('[DUT Matrix] modelId:', modelId, '| matrix keys:', Object.keys(this.modelTCMatrix));
    const matrixEntry = modelId && this.modelTCMatrix[modelId] ? this.modelTCMatrix[modelId] : null;
    if (!matrixEntry) {
      // No matrix entry — open modal with empty items so the "configure" message shows
      this.dutMatrixActiveDutId = dut._id;
      this.dutMatrixModalTitle = dut.deviceName;
      this.dutMatrixItems = [];
      this.showDutMatrixModal = true;
      return;
    }

    this.dutMatrixActiveDutId = dut._id;
    this.dutMatrixTcToSuiteMap = {};
    this.dutMatrixModalTitle = dut.deviceName;
    this.dutMatrixItems = [];

    // First open: pre-check all TCs that exist in the model-TC matrix
    if (!this.dutMatrixSelections[dut._id]) {
      this.dutMatrixSelections[dut._id] = [];
      Object.keys(matrixEntry.testSuites || {}).forEach(suiteId => {
        const tcIds: string[] = (matrixEntry.testSuites[suiteId] && matrixEntry.testSuites[suiteId].tcIds) ? matrixEntry.testSuites[suiteId].tcIds : [];
        const seenInSuite = new Set<string>();
        tcIds.forEach(tcId => {
          if (!seenInSuite.has(tcId)) {
            seenInSuite.add(tcId);
            this.dutMatrixSelections[dut._id].push({ tcId, suiteId });
          }
        });
      });
    }

    const savedSelection = this.dutMatrixSelections[dut._id] || [];
    // Track selection by a composite suiteId::tcId key so the SAME test case
    // mapped under multiple suites is checked/unchecked independently per suite.
    const selectedKeySet = new Set<string>(savedSelection.map(s => s.suiteId + '::' + s.tcId));

    // Only show suites/groups/TCs that are mapped for this model in the TC Matrix.
    // Anything not mapped is hidden completely.
    const matrixSuiteIds = Object.keys(matrixEntry.testSuites || {});
    matrixSuiteIds.forEach((suiteId: string) => {
      const matrixSuite = matrixEntry.testSuites[suiteId];
      const mappedTcIds: string[] = (matrixSuite && Array.isArray(matrixSuite.tcIds)) ? matrixSuite.tcIds : [];
      if (mappedTcIds.length === 0) return; // skip suites with no mapped TCs

      const suiteDoc: any = this.allTestsuite.find((s: any) => s && s._id === suiteId);
      const suiteName: string = (suiteDoc && suiteDoc.testSuiteName) || (matrixSuite && matrixSuite.suiteName) || suiteId;

      // Resolve only the TCs that are mapped in the matrix, preserving matrix-defined order
      const resolvedTCs: any[] = mappedTcIds
        .map(tcId => (this.allTestcase || []).find((tc: any) => tc && tc._id === tcId))
        .filter((tc: any) => !!tc);

      if (resolvedTCs.length === 0) return; // no resolvable TCs -> hide suite

      // Group only the mapped TCs by their test group
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

  /** Called when user checks/unchecks TCs in the DUT matrix treeview */
  onDutMatrixSelectionChange(selectedKeys: string[]) {
    const dutId = this.dutMatrixActiveDutId;
    // Enforce the minimum-one rule first; it may restore a test case if the
    // user unchecked everything, so persist the effective selection it returns.
    const effectiveKeys = this.enforceMinimumOneChecked(selectedKeys);
    const selectedSet = new Set<string>(effectiveKeys);
    // Re-sort selections back to matrix-defined order.
    // The treeview emits values in tree-traversal (group-by-group) order which would
    // scramble the execution sequence. Iterating tcIds from the saved matrix preserves
    // the exact row order shown in the Model-TC Matrix tab.
    const device = this.allDevices.find((d: any) => d._id === dutId);
    const modelDoc = device ? this.allModels.find((m: any) => m && m.modelName === device.model) : null;
    const modelId = modelDoc ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : '')) : '';
    const matrixEntry = modelId && this.modelTCMatrix[modelId] ? this.modelTCMatrix[modelId] : null;
    if (matrixEntry) {
      // Selection is keyed by suiteId::tcId, so a shared TC is tracked per suite.
      const ordered: Array<{ tcId: string; suiteId: string }> = [];
      Object.keys(matrixEntry.testSuites || {}).forEach(suiteId => {
        // Deduplicate within the same suite (guards against duplicate tcIds saved in matrix data).
        // Cross-suite duplicates are intentional — same TC runs once per suite context.
        const seenInSuite = new Set<string>();
        (matrixEntry.testSuites[suiteId].tcIds || []).forEach(tcId => {
          const key = suiteId + '::' + tcId;
          if (selectedSet.has(key) && !seenInSuite.has(tcId)) {
            seenInSuite.add(tcId);
            ordered.push({ tcId, suiteId }); // use loop suiteId, not the last-write-wins map
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

  /** Recursively recomputes each parent node's checked state from its children. */
  private bubbleParentChecked(items: TreeviewItem[]): void {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        this.bubbleParentChecked(item.children);
        item.correctChecked();
      }
    });
  }

  checkTelementory() {
    // Toggle handled by ngModel
  }

  polling_type_fu() {
    // Reset intervals when polling type changes
    this.snmp_time_interval = null;
    this.acs_time_interval = null;
  }

  selectedObject() {
    if (this.telemetory_object.includes('all')) {
      this.telemetory_object = ['all'];
    }
  }

  // --- Schedule ---

  scheduleNow() {
    if (!this.selectedTestbed) {
      this.snackBar.open('Please select a Testbed.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.selectedDUTDeviceIds || this.selectedDUTDeviceIds.length === 0) {
      this.snackBar.open('Please select DUT devices.', 'OK', { duration: 3000 });
      return;
    }
    const isModelTcMatrix = this.selectionMode === 'modelTcMatrix';
    if (!isModelTcMatrix && this.selectedTestcase.length === 0) {
      this.snackBar.open('Please select Test Cases.', 'OK', { duration: 3000 });
      return;
    }
    if (isModelTcMatrix) {
      const unmapped = this.computeUnmappedModelsForSelectedDuts();
      if (unmapped.length > 0) {
        // Re-show the popup and block scheduling
        this.unmappedPopupShown = false;
        this.notifyUnmappedModelsIfAny();
        return;
      }
    }

    if (this.updateJira) {
      this.validateJiraUser('SN');
    } else {
      this.validateExecutionId('SN');
    }
  }

  validateJiraUser(scheduleType) {
    if (this.dataService.getCurrentUser()['validJiraUser'] && this.dataService.getCurrentUser()['jiraReachable']) {
      this.validateExecutionId(scheduleType);
    } else if (this.dataService.getCurrentUser()['jiraReachable'] === true && this.dataService.getCurrentUser()['validJiraUser'] === false) {
      this.showConfirmationPopup('You are not a valid Jira DCC Project user, So Jira Test Execution update will not happen. Do you want to schedule regression ?', 'validateJiraUser', scheduleType);
    } else if (this.dataService.getCurrentUser()['jiraReachable'] === true && this.dataService.getCurrentUser()['activeJiraUser'] === false) {
      this.showConfirmationPopup('You are not an active Jira DCC Project user, So Jira Test Execution update will not happen. Do you want to schedule regression ?', 'validateJiraUser', scheduleType);
    } else if (this.dataService.getCurrentUser()['jiraReachable'] === false) {
      this.showConfirmationPopup('Jira Instance is not reachable, So Jira Test Execution update will not happen. Do you want to schedule regression ?', 'jiraReachable', scheduleType);
    }
  }

  validateExecutionId(scheduleType) {
    if (this.updateJira) {
      this.checkJiraTCs(scheduleType);
    } else {
      this.performScheduleNow();
    }
  }

  private checkJiraTCs(scheduleType) {
    const tempTcData = this.selectedTestcase.filter(element => element.jiraKey);
    const totalTcs = this.selectedTestcase.length;

    if (totalTcs > 0 && tempTcData.length === 0) {
      // All selected test cases have no Jira key
      this.updateJira = false;
      this.showConfirmationPopup(
        'The current scheduled regression got no automated Testcases which are part of Jira Test Cases, Do you want to continue scheduling regression without Jira update ?',
        'checkJiraTCs',
        scheduleType
      );
    } else if (tempTcData.length > 0 && tempTcData.length < totalTcs) {
      // Some test cases have no Jira key
      this.showConfirmationPopup(
        'The current scheduled regression got few automated Testcases which are not part of Jira Test Cases, Do you want to continue scheduling regression ?',
        'checkJiraTCs',
        scheduleType
      );
    } else if (tempTcData.length === totalTcs) {
      // All test cases are valid Jira TCs
      if (scheduleType === 'SN') {
        this.performScheduleNow();
      } else if (scheduleType === 'SL') {
        this.scheduleLater();
      }
    }
  }

  showConfirmationPopup(text, next, scheduleType): any {
    const dialogRef = this.modal.open(ConfirmationDiaogComponent, {
      width: '500px',
      data: {
        name: 'Schedule Regression',
        text: text,
        action: 'Continue',
        buttexthide: false
      },
      panelClass: 'app-full-bleed-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        if (next === 'validateJiraUser' || next === 'jiraReachable') {
          this.updateJira = false;
        }
        if (scheduleType === 'SN') {
          this.performScheduleNow();
        } else if (scheduleType === 'SL') {
          this.scheduleLater();
        }
      }
    });
  }

  private performScheduleNow() {
    this.dataService.loading.next(true);

    // Calculate time required and build onExecution array (same as scheduler)
    // In Model - TC Matrix mode: onExecution is empty; tc/suite ids are resolved server-side from model mapping
    const isModelTcMatrix = this.selectionMode === 'modelTcMatrix';
    let timeRequired = 0;
    const onExecution = [];
    if (!isModelTcMatrix) {
      const selectedTestcaseDup = _.cloneDeep(this.selectedTestcase);
      selectedTestcaseDup.forEach((tc) => {
        onExecution.push({ tcId: tc._id, suiteId: this.selectedTS['_id'] });
        timeRequired += tc.autoExectime != null && tc.autoExectime > 0 ? Number(tc.autoExectime) : Number(tc.manualExectime);
      });
    }

    // Build DUT devices payload with model name and client name
    const profileNodes = this.selectedProfile && this.selectedProfile.nodes ? this.selectedProfile.nodes : [];
    const poolNodes = this.selectedTestbed.nodes ? this.selectedTestbed.nodes.filter(n => n.pool) : [];

    const duts = this.selectedDUTDeviceIds.map(devId => {
      const device = _.find(this.allDevices, { _id: devId });
      // device.profileId may be a string (legacy) or array (multi-profile form).
      const deviceProfileIds = device
        ? (Array.isArray(device.profileId) ? device.profileId : [device.profileId])
        : [];
      const matchedNode = profileNodes.find(n => deviceProfileIds.includes(n.profileId));
      // Device FW first; use CM Firmware only when Device FW is absent.
      const deviceFwDs = device ? device.deviceFWVersion : undefined;
      const deviceFwDsStr = (deviceFwDs === undefined || deviceFwDs === null || deviceFwDs === 'NA') ? '' : String(deviceFwDs).trim();
      const cmFw = device ? device['CM Firmware Version'] : '';
      const cmFwStr = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim();
      const fwVersion = device
        ? ((deviceFwDsStr !== '')
            ? deviceFwDs
            : (cmFwStr !== '' ? cmFw : 'NA'))
        : '';
      // device.model holds the modelName (string). Resolve modelId by looking up the model document.
      const modelDoc = device
        ? _.find(this.allModels, (m: any) => m && m.modelName === device.model)
        : null;
      const modelId = modelDoc
        ? (modelDoc.modelId || (modelDoc._id != null ? modelDoc._id.toString() : ''))
        : '';
      const currentUser = this.dataService.getCurrentUser().username;
      // Build onExecution for this DUT from selections (or full matrix if not previewed)
      const dutOnExecution = [];
      if (isModelTcMatrix && modelId && this.modelTCMatrix[modelId]) {
        if (this.dutMatrixSelections[devId]) {
          // Use user's checkbox selections from the modal
          this.dutMatrixSelections[devId].forEach(s => dutOnExecution.push({ tcId: s.tcId, suiteId: s.suiteId }));
        } else {
          // DUT was never opened — default to all TCs in matrix
          const testSuites = this.modelTCMatrix[modelId].testSuites || {};
          Object.keys(testSuites).forEach(suiteId => {
            const seenInSuite = new Set<string>();
            (testSuites[suiteId].tcIds || []).forEach(tcId => {
              if (!seenInSuite.has(tcId)) {
                seenInSuite.add(tcId);
                dutOnExecution.push({ tcId, suiteId });
              }
            });
          });
        }
      }

      return {
        deviceId: devId,
        deviceName: device ? device.deviceName : '',
        modelName: device ? device.model : '',
        modelId: modelId,
        userId: currentUser,
        fwVersion: fwVersion,
        nodeId: matchedNode ? matchedNode.nodeId : '',
        run_id: null,
        runStatus: 'inqueue',
        onExecution: dutOnExecution
      };
    });

    // Build clients payload
    const clients = this.selectedClientDeviceIds.map(devId => {
      const device = _.find(this.allDevices, { _id: devId });
      // device.profileId may be a string (legacy) or array (multi-profile form).
      const deviceProfileIds = device
        ? (Array.isArray(device.profileId) ? device.profileId : [device.profileId])
        : [];
      const matchedNode = poolNodes.find(n => deviceProfileIds.includes(n.profileId));
      return {
        deviceId: devId,
        deviceName: device ? device.deviceName : '',
        nodeId: matchedNode ? matchedNode.nodeId : ''
      };
    });

    // Determine module name (only applicable in Test Suite Selection mode)
    let selectedModuleDet = null;
    if (!isModelTcMatrix && this.test_set_filter && this.selectedTS) {
      const selectedTS_converted = this.selectedTS['moduleId'].toString();
      selectedModuleDet = _.find(this.allModules, function (o) { return selectedTS_converted.includes(o._id); });
    }

    const payload: any = {
      run_id: null,
      tagName: '',
      startTime: new Date().toISOString(),
      job: [{
        timeRequired: timeRequired,
        job_id: null,
        schedulerType: 'SN',
        modelName: this.selectedTestbed.modelName || '',
        testbed: this.selectedTestbed['_id'],
        testBedName: this.selectedTestbed['testBedName'],
        cmtsFirmwareVersion: this.cmtsFirmwareVersion || 'NA',
        cmtsDeviceName: this.cmtsDeviceName || null,
        reRunOnFail: this.rerunStaus ? 'Y' : 'N',
        jira: {
          update: this.updateJira,
          type: this.jiraUpdateType,
          ueId: this.executionIdUpdate
        },
        module: selectedModuleDet ? selectedModuleDet['moduleName'] : '',
        onExecution: onExecution
      }],
      // Top-level flag: when true, the backend resolves test cases per DUT via settings.modelTCMatrix
      useModelTCMatrix: isModelTcMatrix,
      // Dynamic scheduler specific fields
      dynamicTestbedId: this.selectedTestbed['_id'],
      dynamicTestbedName: this.selectedTestbed['testBedName'],
      dynamicTestbedProfileId: this.selectedProfile ? this.selectedProfile['_id'] : this.selectedTestbed['testBedProfileId'],
      dynamicTestbedProfileName: this.selectedProfile ? this.selectedProfile['testBedProfileName'] : '',
      duts: duts,
      clients: clients,
      dynamicScheduleStartTime: new Date().toISOString()
    };

    this.sub12 = this.testLabService.saveDynamicSchedule(payload).subscribe(
      data => {
        console.log('Dynamic Schedule response:', data);
        this.dataService.loading.next(false);
        if (data && data['status']) {
          this.snackBar.open(
            'Dynamic Schedule created: ' + data['dynamicSchedulerRequestId'],
            'OK',
            { duration: 5000 }
          );
          this.resetForm();
          this.scheduled.emit();
        } else {
          console.log('Dynamic Schedule response missing status:', data);
          this.snackBar.open('Dynamic Schedule created successfully.', 'OK', { duration: 5000 });
          this.resetForm();
          this.scheduled.emit();
        }
      },
      err => {
        console.log('Dynamic Schedule error:', err);
        this.dataService.loading.next(false);
        this.snackBar.open(
          (err && err.error && (err.error.message || err.error.errorDetail)) || 'Dynamic Scheduling Failed.',
          'Try Again',
          { duration: 5000 }
        );
      }
    );
  }

  resetForm() {
    // Testbed selection
    this.selectedTestbed = null;
    this.selectedProfile = null;

    // DUT & client selection
    this.selectedDUTDeviceIds = [];
    this.selectedClientDeviceIds = [];
    this.selectedDUTDevices = [];
    this.selectedClientDevices = [];
    this.allApplicableClients = [];

    // Test selection
    this.selectedModule = undefined;
    this.selectedTestsuite = undefined;
    this.selectedTS = null;
    this.selectedTestcase = [];
    this.checkedTestsuite = [];
    this.checkedTestsuiteStatus = [];
    this.testSuites = [];
    this.testSets = [];
    this.search_test_suite = '';

    // Tree view / modal
    this.showTree = false;
    this.showModal = false;
    this.items = [];
    this.lastShownIndex = -1;

    // Clear DUT matrix selections so next schedule starts fresh
    this.dutMatrixSelections = {};
    this.dutMatrixActiveDutId = '';
    this.showDutMatrixModal = false;
    this.dutMatrixItems = [];

    // Job config
    this.rerunStaus = false;
    this.cpuGraph = false;
    this.automatedMail = false;
    this.updateJira = true;
    this.jiraUpdateType = 'update';
    this.executionIdUpdate = '';
    this.disableScheduleButton = false;

    // Totals
    this.totalTime = 0;

    // Clear the bound form controls so the testbed dropdown no longer shows
    // the previously selected option with a tick mark when the user revisits
    // the Scheduler tab after a successful schedule.
    if (this.profileFormControl) {
      this.profileFormControl.reset(null, { emitEvent: false });
    }
    if (this.searchTextboxControl) {
      this.searchTextboxControl.setValue('', { emitEvent: false });
    }

    // Re-show the full list of dynamic testbeds in the dropdown
    if (this.allTestbed && this.allTestbed.length) {
      this.filterDynamicTestbeds();
    }
  }

  scheduleLater() {
    // Placeholder for Schedule Later functionality
    this.snackBar.open('Schedule Later functionality coming soon.', 'OK', { duration: 3000 });
  }

  private buildJobData(scheduleStatus: string) {
    let timeRequired = 0;
    const selectedTestcaseDup = _.cloneDeep(this.selectedTestcase);
    let tcId = [];

    this.selectedTestcase.forEach((tc) => {
      tc['testSuiteId'] = this.selectedTS['_id'];
      tc['testSuiteName'] = this.selectedTS['testSuiteName'];
    });

    let selectedTS_converted = this.selectedTS['moduleId'].toString();
    let selectedModuleDet = _.find(this.allModules, function (o) { return selectedTS_converted.includes(o._id); });

    selectedTestcaseDup.forEach((tc) => {
      let tcObj = { tcId: tc._id, suiteId: this.selectedTS['_id'] };
      tcId.push(tcObj);
      timeRequired += tc.autoExectime != null && tc.autoExectime > 0 ? tc.autoExectime : tc.manualExectime;
      tc['testSuiteId'] = this.selectedTS['_id'];
      tc['testSuiteName'] = this.selectedTS['testSuiteName'];
      delete tc.tcCreator;
      delete tc.tcEditor;
      delete tc.createdAt;
      delete tc.updatedAt;
    });

    const jobData: any = {};
    jobData['timeRequired'] = timeRequired;
    jobData['job_id'] = null;
    jobData['schedulerType'] = scheduleStatus;
    jobData['testbed'] = this.selectedTestbed['_id'];
    jobData['reRunOnFail'] = this.rerunStaus ? 'Y' : 'N';
    jobData['jira'] = { update: this.updateJira, type: 'update' };
    jobData['numOfIteration'] = 1;
    jobData['testBedName'] = this.selectedTestbed['testBedName'];
    jobData['module'] = selectedModuleDet ? selectedModuleDet['moduleName'] : '';
    jobData['regressionType'] = this.selectedTestsuite?.['testCases']?.length === selectedTestcaseDup.length ? 'full' : 'partial';
    jobData['onExecution'] = tcId;
    jobData['telementry'] = this.cpuGraph;
    if (this.enable_environment_type_selection) {
      jobData['environment_type'] = this.selected_environment;
    }
    if (this.cpuGraph) {
      if (this.telemetory_object.length === 0) {
        this.telemetory_object = ['all'];
      }
      jobData['cpe_telementory'] = {
        polling_type: this.polling_type,
        snmp_time_interval: this.snmp_time_interval,
        acs_time_interval: this.acs_time_interval,
        object: this.telemetory_object
      };
    }
    return jobData;
  }
}
