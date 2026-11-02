import { TestBedService } from '../../../../@core/services/test-bed.service';
import { ReservationService } from '../../../../@core/services/reservation.service';
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { DataService } from '../../../../@core/services/data.service';
import { TreeviewConfig, TreeviewItem, TreeviewComponent } from '@samotics/ngx-treeview';
import * as _ from 'lodash';
import { NameFromIdPipe } from '../../../../@shared/pipes/name-from-id.pipe';
import { MatDialog } from '@angular/material/dialog';
import { TestBedConfigureComponent } from '../../../test-bed/test-bed-configure/test-bed-configure.component';
import { Router } from '@angular/router';
import { EditTestbedConfigComponent } from '../../../test-bed/test-bed-view/edit-testbed-config/edit-testbed-config.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SearchtestbedpipePipe } from '../../../../@shared/pipes/searchtestbedpipe.pipe';
import { DeviceDetailComponent } from '../../select-testcases/device-details/device-detail.component';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { SearchtestsuitePipe } from 'src/app/@shared/pipes/searchtestsuite.pipe';
import { UserService } from 'src/app/@core/services/user.service';
import { TimeDifferencePipe } from '../../../../@shared/pipes/time-diffrence.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'app-select-testbeds',
  templateUrl: './select-testbeds.component.html',
  styleUrls: ['./select-testbeds.component.scss'],
  providers: [NameFromIdPipe, SearchtestsuitePipe,TimeDifferencePipe],
})
export class SelectTestbedsComponent implements OnInit {
  @Input('jobIndex') jobIndex;
  @Input('selectedTestbeds') alreadySelectedTBs = [];
  @Input('selectedDevices') alreadySelectedDevices = [];
  @Input('activeTab') activeTab = null;
  @Input('jiraUpdate') jiraUpdate ;
  @Output('isValid') valid: EventEmitter<any> = new EventEmitter();
  @ViewChild('treeViewCompT')
  treeView: TreeviewComponent;
  @ViewChild('mySel') testBedSel: MatSelect;
  loading = false;
  dutTelemetry = false;
  selectedTestBed = [];
  selectedModule;
  allTestbed = [];
  selectedTestcase = [];
  allModules = [];
  allTestsuite = [];
  selectedTestsuite = [];
  allTestcase = [];
  allTestgroup = [];
  allNodes = [];
  allDevices = [];
  testBedVariables = [];
  selectedTeam;
  rerunStaus = false;
  noIterations = 1;
  allAPI = [];
  allAPIGroup = [];
  postExecutionArray = [];
  preExecutionArray = [];
  tempRunId = 1;
  selectedTestcaseDup = [];
  selectedTestbedDuplicate: any = {};
  testbedDevices = [];
  selectedTestBedsList = [];
  selectedTS:any=null;
  search_test_suite: any = '';
  @ViewChild('search') searchTextBox: ElementRef;
  filteredOptions: Observable<any[]>;

  selectFormControl = new UntypedFormControl();
  searchTextboxControl = new UntypedFormControl();
  // When true, resetting the search box (on dropdown open/close) must not trigger
  // the testbed rebuild in _filter (which would clear the selected test cases).
  private suppressTestbedRebuild = false;
  // Snapshot of the testbed selection taken when the dropdown opens, used to
  // detect whether the selection actually changed by the time it closes.
  private _tbSnapshotOnOpen: any[] = [];
  // Snapshot of the selected test cases (and dependent state) taken when the
  // dropdown opens, used to restore them when a testbed is only removed.
  private _testcaseSnapshotOnOpen: any[] = [];
  private _tsSnapshotOnOpen: any = null;
  private _testsuiteSnapshotOnOpen: any[] = [];
  private _totalTimeSnapshotOnOpen: any = 0;
  allAPIUsedInRun = [];

  // checkbox Functionality
  checkedTestsuite = [];
  checkedTestsuiteStatus = [];
  selectedTestcaseId = [];
  items = [];

  // tree view Functionaity;
  showTree = false;
  lastShownIndex = -1;
  testSuiteOnCheckbox;

  // Tree View Config
  config = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: false,
    maxHeight: 400,
  });
  showModal: boolean = false;
  // animation Config
  // animationConfig = {
  //     animationType: ANIMATION_TYPES.wanderingCubes,
  //     backdropBackgroundColour: 'rgba(0,0,0,0.1)',
  //     backdropBorderRadius: '4px'
  // };
  jira = {'update': false, 'type': 'upate'}

  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  sub7;
  sub8;
  sub9;
  sub10;
  sub11;
  sub12;
  sub13;
  sub14;
  modelSubscription;
  allModels = [];
  i = 0;
  className = ['success', 'primary', 'info', 'warning', 'danger'];
  testbedStatus = [];
  search_test_bed: any = '';
  sel_test_bd: any;
  telemetry_option_flag: boolean = false;
  telemetry_options:any = [{name:'SNMP', value:'SNMP'}, {name:'ACS', value:'TR069'}, {name:'SNMP & ACS', value:'Both'}];
  telemetry_time_option:any = [{name:'15', value:'15'}, {name:'20', value:'20'}, {name:'30', value:'30'}, {name:'45', value:'45'}]
  totalTime: number=0;
  maxSelected: Boolean = false;
  environment_type: any = [];
  selected_environment: any = '';
  enable_environment_type_selection: boolean = false;
  priority_flag2 : boolean = false;
  col1: any  = '20%';
  col2: any = '60%';
  testSetFilterDetails: any;
  test_set_filter: boolean;
  testSetMapping: boolean;
  enableTestSuites = true;
  showMessage = false;
  testSuites = [];
  testSets: any;
  commonTestSuites = [];
  showCommonTestSuites = false;
  tfwEnabledNodesString: any;
  showOnlyPairedTestbeds: boolean = false;

  // Raw testbed list from DataService (pre-filter) + cached settings so we can
  // recompute the visible list reactively when the User-TestBed Access Matrix
  // changes without a full page refresh.
  private _rawTestbeds: any[] = [];
  private _settingsData: any = null;
  private _restrictTestbedToUser: boolean = false;
  private _matrixChangeSub: any;
  constructor(
    public dataService: DataService,
    private nameFromId: NameFromIdPipe,
    private modal: MatDialog,
    private reservationService: ReservationService,
    private testbedService: TestBedService,
    private router: Router,
    private userService: UserService,
    private timeDifference: TimeDifferencePipe,
  ) {
    this.sub1 = this.dataService.getTestBed().subscribe((tb) => {
      if (tb) {
        this._rawTestbeds = tb;
        this.rebuildAllTestbed();
      }
    });
    this.sub2 = this.dataService.getTCModules().subscribe((modules) => {
      if (modules) {
        this.allModules = modules;
       // this.testSets = modules;
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

    this.modelSubscription = this.dataService
      .getAllModels()
      .subscribe((models) => {
        if (models) {
          this.allModels = models;
        }
      });

    
  }

  ngOnChanges(changes: SimpleChanges) {
    this.checkTestbedStatus();
  }

  /**
   * Add Testcase from Testsuite function
   * @param event .
   * @param testsuite .
   */

  addTestcaseFromTestsuite(event) {
    this.selectedTS = event['value'];
    // let testsuite = event['value'];


    this.selectedTestcase = [];
    this.checkedTestsuite = [];
    if (event['value']) {
      this.checkedTestsuite.push(this.selectedTS);
      this.selectedTS['testCases'].forEach((element) => {
        let id: any;
        if (element && typeof element === 'object' && element.constructor === Object){
          id = element._id;
        }else if (element){
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
    this.checkTestbedStatus();
  }

  calculateTime(){
    this.totalTime=0
    this.selectedTestcase.forEach((tc)=>{
      this.totalTime+= tc.autoExectime!=null && tc.autoExectime > 0? tc.autoExectime : tc.manualExectime;
    })
    
    this.totalTime=this.timeDifference.transform(Math.ceil(this.totalTime*60))
  }

  /**
   * Select / Unselect All Testcases function
   * @param event .
   */

  selectOrDeselectAllTs(event) {
    if (event['checked']) {
      this.checkedTestsuiteStatus = _.fill(this.checkedTestsuiteStatus, true);
      this.selectedTestcase = [];
      this.selectedTestsuite.forEach((testsuite) => {
        this.checkedTestsuite.push(testsuite);
        this.selectedTestcase = [
          ...this.selectedTestcase,
          ...testsuite['testCases'],
        ];
      });
    } else if (!event['checked']) {
      this.checkedTestsuiteStatus = _.fill(this.checkedTestsuiteStatus, false);
      this.checkedTestsuite = [];
      this.selectedTestcase = [];
    }
    this.isValidJob();
    this.checkTestbedStatus();
  }

  openTestSuiteSelectonModal() {
    this.showModal = true;
  }

  /**
   * Update Function for selected test cases 
   * @param data .
   */

  updateSelectedTestCase(data) {
    let unselectedItem = [];
    if (this.treeView) {
      unselectedItem = this.treeView.selection.uncheckedItems.map(
        (item) => item.value
      );
      if (unselectedItem.length > 0) {
        unselectedItem.forEach((tc) => {
          _.remove(this.selectedTestcase, {
            _id: tc['_id'],
            tcGroupId: tc['tcGroupId'],
            // testSuiteId: tc['testSuiteId'],
          });
        });
      }
    }
    data.forEach((element) => {
      const index = _.findIndex(this.selectedTestcase, {
        _id: element['_id'],
        tcGroupId: element['tcGroupId'],
        // testSuiteId: element['testSuiteId'],
      });
      if (index > -1) {
        this.selectedTestcase[index] = element;
      } else {
        this.selectedTestcase.push(element);
      }
    });
    this.checkedTestsuiteStatus[this.lastShownIndex] = this.checkStatus(
      this.testSuiteOnCheckbox
    );
    this.isValidJob();
    this.checkTestbedStatus();
    this.calculateTime();
  }

  /**
   * Loads Tree for testcase
   * @param testSuite .
   * @param status .
   * @param index .
   */

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
    
    // to re-create testCases Array
    let updateTestCasesArr = [];
    testSuite.testCases.forEach((el: any) => {
      this.allTestcase.find(d => {
        if(el && typeof el === 'object' && el.constructor === Object) {
          (d._id == el._id)?  updateTestCasesArr.push(d): '';
        } else {
          (d._id == el)?  updateTestCasesArr.push(d): '';
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
      // const testGroupName = this.nameFromId.transform(
      //   element['tcGroupId'],
      //   this.allTestgroup,
      //   '_id',
      //   'testGroupName'
      // );
      const tcGroupId = element['tcGroupId'];
      let testGroupName = '';
      if (typeof tcGroupId === 'string') {
        testGroupName = this.nameFromId.transform(
          tcGroupId,
          this.allTestgroup,
          '_id',
          'testGroupName'
        );
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
          // testSuiteId: tc['testSuiteId'],
        })
          ? true
          : false;

        temp['children'].push({
          text: tc['tcName'],
          value: tc,
          checked: tcStatus,
        });
      });
    }
      this.items.push(new TreeviewItem(temp));
    });
    this.checkedTestsuiteStatus[this.lastShownIndex] = this.checkStatus(
      testSuite
    );
    this.isValidJob();
    this.checkTestbedStatus();
  }

  /**
   * Status Check function for testcases
   * @param item .
   */

  checkStatus(item) {
    let status = false;
    item?.['testCases'].forEach((element) => {
      const tc = _.findIndex(this.selectedTestcase, element);
      if (tc > -1) {
        status = true;
      }
    });
    return status;
    this.isValidJob();
  }



  /**
   * Delete Function for delete testcase from final list
   * @param testcase .
   */

  deleteTestcaseFromFinalList(testcase) {
    _.remove(this.selectedTestcase, testcase);
    if (this.showTree) {
      const lastShown = this.lastShownIndex;
      this.lastShownIndex = -1;
      this.loadTreeForTs(this.testSuiteOnCheckbox, true, lastShown);
    }
    // this.selectedTestsuite.forEach((ts, index) => {
    //   this.checkedTestsuiteStatus[index] = this.checkStatus(ts);
    // });
    this.isValidJob();
    this.checkTestbedStatus();
  }



  /**
   * Function invoked after run button clicked
   * @param scheduleStatus .
   */

  onRunClicked(scheduleStatus,selectedTB) {
    console.log("clicked onRunClicked with status>>>", scheduleStatus,selectedTB);
    
    let timeRequired = 0;
    //this.selectedTestBed = selectedTB;
    this.preExecutionArray = [];
    this.postExecutionArray = [];
    // this.dataService.loading.next(true);
    this.allAPIUsedInRun = [];
    let tcId=[]
    //console.log("onRunClickedwith status this.selectedTS>>>", this.selectedTS);
    //console.log("this.selectedTestcase>>>",this.selectedTestcase);
    this.selectedTestcaseDup = _.cloneDeep(this.selectedTestcase);
    this.selectedTestcase.forEach((tc) => {
     
      tc['testSuiteId'] = this.selectedTS['_id'];
      tc['testSuiteName'] = this.selectedTS['testSuiteName'];
    });
    let selectedTS_converted=this.selectedTS['moduleId'].toString();
    let selectedModuleDet = _.find(this.allModules, function (o) { return selectedTS_converted.includes(o._id) });// if testsuite has multiple testset, will consider first
    console.log("selectedModuleDet>>>",selectedModuleDet);

    this.selectedTestcaseDup.forEach((tc) => {
      let tcObj={tcId:tc._id,suiteId:this.selectedTS['_id']}
      tcId.push(tcObj)
     // console.log("tc.autoExectime in qs====>", timeRequired, tc.autoExectime, tc.manualExectime);
      timeRequired += tc.autoExectime!=null && tc.autoExectime > 0? tc.autoExectime : tc.manualExectime;
      tc['testSuiteId'] = this.selectedTS['_id'];
      tc['testSuiteName'] = this.selectedTS['testSuiteName'];

      delete tc.tcCreator
      delete tc.tcEditor
      delete tc.createdAt
      delete tc.updatedAt

      
    });
   

    const jobData = { };
    const deviceData = _.find(this.allDevices, { _id: selectedTB["dutId"] });
    // Device FW first; use CM Firmware only when Device FW is absent.
    const deviceFwTb = deviceData['deviceFWVersion'];
    const deviceFwTbStr = (deviceFwTb === undefined || deviceFwTb === null || deviceFwTb === 'NA') ? '' : String(deviceFwTb).trim();
    const cmFw = deviceData['CM Firmware Version'];
    const cmFwStr = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim();
    jobData['firmwareVersion'] = (deviceFwTbStr !== '') ? deviceFwTb : (cmFwStr !== '' ? cmFw : 'NA');
    if(selectedTB?.testBedName.indexOf('XGSPON') !== -1 && deviceData){
      jobData['ontModel'] = deviceData['ONT Model (if XGSPON)'];
    }
    const tfwEnabledNodes = selectedTB.nodes.filter(node => node.tfw === true);   
    jobData['trackFW'] = [];
    jobData['endPointFWs'] = [];   
      const deviceNames = tfwEnabledNodes.map(node => {
        const device = _.find(this.allDevices, { _id: node.deviceId });
        return device.deviceName;
      });
      if(tfwEnabledNodes && tfwEnabledNodes.length > 0){
      tfwEnabledNodes.forEach(node => {
        const device = _.find(this.allDevices, { _id: node.deviceId });
        if (device) {
          jobData['endPointFWs'].push({
            device: device.deviceName ,
            model: device.model,
            fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
          });
          jobData['trackFW'].push(device.deviceFWVersion ? device.deviceFWVersion : 'NA');
        }
      });
      }
    // jobData['trackFW'] = [];
    // jobData['endPointFWs'] = [];

    // const tfwDeviceData = _.find(this.allDevices, { _id: selectedTB.tfwId });
    // if (tfwDeviceData) {
    //   jobData['trackFW'].push(tfwDeviceData['deviceFWVersion']);
    //   jobData['endPointFWs'].push({device: tfwDeviceData['deviceName'] , fw: tfwDeviceData['deviceFWVersion']});

    // }

    jobData['timeRequired'] = timeRequired;
    jobData['job_id'] = null;

    // jobData['teamName'] = this.selectedTeam;
    // jobData['totalTC'] = this.selectedTestcaseDup.length;
    jobData['schedulerType'] = scheduleStatus;
    // jobData['passTC'] = 0;
    // jobData['failTC'] = 0;
    // jobData['norunTC'] = this.selectedTestcaseDup.length;
    jobData['testbed'] = selectedTB['_id'];
    jobData['reRunOnFail'] = this.rerunStaus ? 'Y' : 'N';
     jobData['jira'] = this.jira;
    jobData['jira']['update'] = this.jiraUpdate;
    jobData['jira']['type'] = 'update';
    console.log('jira update', jobData['jira'], this.jiraUpdate);
    jobData['numOfIteration'] = this.noIterations;
    // jobData['updateALM'] = 'N';
    // jobData['dutId']= this.selectedTestBed['dutId'];
    jobData['modelName'] = selectedTB['modelName'];
    jobData['testBedName'] = selectedTB['testBedName'];
    jobData['module'] = selectedModuleDet['moduleName'];
    jobData['regressionType'] =this.selectedTestsuite['testCases'].length==this.selectedTestcaseDup.length ? 'full' : 'partial';
    // jobData['preExecution'] = this.preExecutionArray;
    // jobData['postExecution'] = this.postExecutionArray;
    jobData['onExecution'] = tcId
    jobData['telementry'] = this.cpuGraph;
    // jobData['errorCodes']={}
    if(this.enable_environment_type_selection == true){
      jobData['environment_type']=this.selected_environment;
    }
    if(this.cpuGraph == true){
      if(this.telemetory_object.length == 0){
        this.telemetory_object = ['all'];
      }
      jobData['cpe_telementory'] = {
        polling_type: this.polling_type, snmp_time_interval: this.snmp_time_interval,
        acs_time_interval: this.acs_time_interval, object: this.telemetory_object
      }
    }
    return jobData;
  }

  /**
   * Show Device Detail function
   * @param node .
   */

  showDeviceDetail(node) {
    const deviceRef = this.modal.open(DeviceDetailComponent, {
      minWidth: '700px',
      minHeight: '400px',
      data: _.cloneDeep(node),
    });
    deviceRef.afterClosed().subscribe(res => {
      // received data from dialog-component

      const dataVal = {
        deviceIds: [res.data]
      }

      this.sub14 = this.reservationService
        .unlockTestbed( dataVal)
        .subscribe((data: any) => {
          if (data) {
            this.selectedTestbedDuplicate.nodes.forEach((node: any) => {
              if (node.profileId != null && node.deviceId == res.data) {
                node.available = true;
              }
            });
          }
        });
    });
  }


  ngOnInit() {
    // Live-refresh: whenever the User-TestBed Access Matrix is saved from the
    // Test Bed screen, re-apply our filter chain immediately.
    this._matrixChangeSub = this.dataService.onUserTestbedAccessMatrixChanged().subscribe((matrix: any) => {
      if (this._settingsData) {
        this._settingsData.userTestbedAccessMatrix = matrix;
      }
      this.rebuildAllTestbed();
    });
    this.userService.getAllusers().subscribe((data:any)=>{
      // Cache full settings blob so we can re-run access-matrix filtering later
      this._settingsData = data && data[0] ? data[0] : null;
      // Read regressionConfig (team-specific) — showOnlyPairedTestbeds + restrict_testbed_to_user
      if (this._settingsData && this._settingsData.regressionConfig && this._settingsData.regressionConfig[0] && this._settingsData.regressionConfig[0].teams) {
        const teamConfig = this._settingsData.regressionConfig[0].teams.find((team: any) => team.name === this.selectedTeam);
        if (teamConfig) {
          this.showOnlyPairedTestbeds = !!teamConfig.show_only_paired_testbeds;
          this._restrictTestbedToUser = !!teamConfig.restrict_testbed_to_user;
        }
      }
      // Re-run the full filter chain now that flags + settings are known
      this.rebuildAllTestbed();
      if (data[0].extraSystemConfig && data[0].extraSystemConfig[0]){
        if(data[0].extraSystemConfig[0].cpe_telemetry == true){
          this.telemetry_option_flag = true;
        }
      }
      if (data[0].dashboardConfig && data[0].dashboardConfig[0] && data[0].dashboardConfig[0].teams){
        data[0].dashboardConfig[0].teams.forEach(el => {
          if(el.name == this.selectedTeam){
            if(el.enable_environment_type_selection){
              if(el.enable_environment_type_selection == true){
                this.enable_environment_type_selection = true;
                this.environment_type = el.environment_value_array;
              }
            }
            if(el.enable_priority_two_For_TC_Re&& el.enable_priority_two_For_TC_Re == true){
              //console.log('inside If if(ele.name == this.selectedTeam)')
              this.col1 = '15%';
              this.col2 = '50%';
              this.priority_flag2 = true;
            } 
          }
        });
      }
      this.testSetFilterDetails = data[0].extraSystemConfig[0].teams.filter(team => {
        return (team.name === this.selectedTeam);
      });
      if (this.testSetFilterDetails && this.testSetFilterDetails.length > 0
        && this.testSetFilterDetails[0].test_set_filter && this.testSetFilterDetails[0].test_set_filter == true){
        this.test_set_filter = true;
        if (this.testSetFilterDetails[0]?.is_TestBedProfile_TestSet_Mapped
        && this.testSetFilterDetails[0]?.is_TestBedProfile_TestSet_Mapped == true){
          this.testSetMapping = true;
        }
      }
    });
    this.checkTestbedStatus();

  }

  /**
   * Used to filter data based on search input 
   */
  private _filter(name: string): String[] {
    const filterValue = name.toLowerCase();
    // Set selected values to retain the selected checkbox state.
    // Skip this rebuild while the panel is merely opening (see openedChange) so
    // that simply clicking the dropdown never clears the selected test cases.
    if (!this.suppressTestbedRebuild) {
      this.setSelectedValues();
      this.selectFormControl.patchValue(this.selectedTestBed);
    }
    let filteredList = this.allTestbed.filter(option => {
      if (option.testBedName.toLowerCase().includes(filterValue.toLocaleLowerCase())) {
        return true
      }
    });
    
    return filteredList;
  }

  /**
   * Re-apply the full testbed filter chain (inactive/dynamic exclusion,
   * show-only-paired, restrict-testbed-to-user) from the cached raw list.
   * Called on initial load, when regressionConfig flags are read, and whenever
   * the User-TestBed Access Matrix broadcasts an update.
   */
  private rebuildAllTestbed(): void {
    if (!this._rawTestbeds) return;
    let filtered = this._rawTestbeds.filter((testbed: any) => testbed.status !== 'inactive');
    filtered = filtered.filter((testbed: any) => !testbed.dynamic);
    // When the User-TestBed Access Matrix is authoritative, it wins over the
    // paired-only display filter so every testbed sysadmin checked for this user
    // shows up. Otherwise apply the paired-only preference as before.
    if (this._restrictTestbedToUser && this._settingsData) {
      filtered = this.dataService.filterTestbedsByAccessMatrix(filtered, this._settingsData, this.selectedTeam);
    } else if (this.showOnlyPairedTestbeds) {
      filtered = filtered.filter((testbed: any) => testbed.labIndex && testbed.labIndex !== '' && testbed.labIndex !== 'NA');
    }
    this.allTestbed = filtered;
    this.checkTestbedStatus();
    this.allTestbed.map((e: any) => e['disabled'] = false);
    this.filteredOptions = this.searchTextboxControl.valueChanges
      .pipe(
        startWith<string>(''),
        map(name => this._filter(name))
      );
    // Drop any previously-selected testbeds that are no longer allowed
    if (this.selectedTestBed && this.selectedTestBed.length) {
      const visibleIds = new Set(this.allTestbed.map((t: any) => t && t._id ? String(t._id) : ''));
      this.selectedTestBed = this.selectedTestBed.filter((t: any) => visibleIds.has(String(t && t._id)));
    }
  }

  ngOnDestroy() {
    if (this._matrixChangeSub) {
      this._matrixChangeSub.unsubscribe();
    }
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
    if (this.sub6) {
      this.sub6.unsubscribe();
    }
    if (this.sub7) {
      this.sub7.unsubscribe();
    }
    if (this.sub8) {
      this.sub8.unsubscribe();
    }
    if (this.sub9) {
      this.sub9.unsubscribe();
    }
    if (this.sub10) {
      this.sub10.unsubscribe();
    }
    if (this.sub11) {
      this.sub11.unsubscribe();
    }
    if (this.sub12) {
      this.sub12.unsubscribe();
    }

    if (this.sub13) {
      this.sub13.unsubscribe();
    }
    if (this.sub14) {
      this.sub14.unsubscribe();
    }
  }

  /**
 * Remove from selected values based on uncheck
 */
  selectionChange(event) {
    if (event.isUserInput && event.source.selected == false) {
      let index = this.selectedTestBed.indexOf(event.source.value);
      this.selectedTestBed.splice(index, 1);
    }
    console.log("this.selectedTestBed>>>>>>", this.selectedTestBed);
    //this.setSelectedValues();
    this.isValidJob();

    // To restict selection of testbeds maximum upto 10 only
    this.selectFormControl.valueChanges.subscribe(res => {
      if(event.source.selected && res.length >= 10) {
        this.maxSelected = true;
        this.allTestbed.map((e: any) => {
          if (this.selectFormControl.value.find(a => a._id == e._id)) {
            e.disabled = false;
          } else {
            e.disabled = true;
          }
        });
      } else if (!event.source.selected && res.length < 10) {
        this.allTestbed.map(e => e['disabled'] = false);
        this.maxSelected = false;
      }
    });
    
  }

  /**
 * Set selected values to retain the state 
 */
  setSelectedValues() {
    let istestbedChanged = false;
    if (this.selectFormControl.value && this.selectFormControl.value.length > 0) {
      istestbedChanged = this.selectFormControl.value.length === this.selectedTestBed.length ? false : true;
      this.selectFormControl.value.forEach((e) => {

        if (this.selectedTestBed.indexOf(e) == -1) {
          this.selectedTestBed.push(e);
          istestbedChanged = true;
        }
      });
      this.testbedChanges(this.selectedTestBed, istestbedChanged);
    }else {
      this.testSets = [];
      this.testSuites = [];
      this.selectedModule = null;
      this.selectedTestBed = [];
      this.selectedTestBedsList = [];
      this.enableTestSuites = false;
      this.showMessage = false;
      this.selectedTestsuite = [];
      this.selectedTestcase = [];
      this.selectedTS = null;
      this.totalTime = 0;
      this.isValidJob();
    }
   
  }
  /**
   * Function invoked when testbed changes
   * @param tbs .
   */

  testbedChanges(tbs, istestbedChanged) {
    this.search_test_suite = '';
    this.selectedTestBedsList = [];
    const tempMap = new Map();
    this.testSets = [];
    console.log("testbedChanges this.selectFormControl.value >>>>>", this.selectFormControl.value);
    if (tbs && tbs.length > 0) {
      if (this.testSetMapping) {
        const temp = tbs.filter(testBed => {
          return (testBed.mappedTestSets && testBed.mappedTestSets.length > 0);
        });
        this.enableTestSuites = temp.length === tbs.length ? true : false;
        this.showMessage = temp.length === tbs.length ? false : true;
        if (this.showMessage) {
        this.selectedTestcase = [];
        this.testSuites = [];
        this.selectedModule = null;
        this.selectedTestsuite = [];
        this.totalTime = 0;
        this.selectedTS = null;
        }
      } else {
        this.testSuites = this.allTestsuite;
        this.enableTestSuites = true;
      }
      tbs = tbs;
      tbs.forEach((tb) => {
        // this.selectedTestBed.push(tb);
        tb.avaliableFlag = true;
        //this.search_test_bed = '';
        this.dataService.setSelectedTestbed(tb);
        this.sub12 = this.reservationService
          .getTestbedStatus( tb._id)
          .subscribe((data: any) => {
            if (data) {
              this.testbedDevices = data;
              this.selectedTestbedDuplicate = _.cloneDeep(tb);
              this.selectedTestbedDuplicate.nodes.forEach((node: any) => {
                if (node.profileId != null && node.deviceId != null) {
                  node.available = _.find(this.testbedDevices, {
                    _id: node.deviceId,
                  }).available;

                  // Make testbed available false if configured device is not available
                  if (node.available === false) {
                    this.selectedTestbedDuplicate.avaliableFlag = false;
                  }
                }

              });
              //this.checkTestbedStatus();
              this.selectedTestBedsList.push(this.selectedTestbedDuplicate);
              this.isValidJob();

            }
          });

      });
      console.log("this.selectedTestBedsList>>>>",this.selectedTestBedsList);
    }else {
      console.log('inside else');
      this.selectedTestBedsList = [];
      this.testSets = [];
      this.selectedModule = null;
      this.testSuites = [];
      this.enableTestSuites = true;
      this.selectedTS = null;
    }
    tbs.forEach((tb) => {
    if (this.testSetMapping && this.enableTestSuites) {
      this.testSets = [];
      let tempUniqTestSuites = [];
      console.log('test sets before', this.testSets);
      tb.mappedTestSets.forEach(ts => {
        const temp = this.allModules.filter(module => {
          return (module._id === ts);
        });
        tempUniqTestSuites = [...tempUniqTestSuites, ...temp];
        tempUniqTestSuites = [...new Set(tempUniqTestSuites)];
        tempMap.set(tb._id, tempUniqTestSuites);
      });
    }else if (this.testSetMapping) {
      this.testSets = [];
    } else if (this.test_set_filter){
      this.testSets = this.allModules;
    }
    });
    if (tempMap.size > 0) {
      const testSetsList = [];
      tempMap.forEach((value, key) => {
        testSetsList.push(value);
      });
      const commontestSets = testSetsList.reduce((a, b) => a.filter(c => b.includes(c)));
      this.testSets = commontestSets;
      if (istestbedChanged) {
        this.testSuites = [];
        this.selectedModule = null;
        this.selectedTestsuite = [];
        this.selectedTestcase = [];
        this.totalTime = 0;
        this.selectedTS = null;
      }
      if (commontestSets && commontestSets.length === 0) {
        this.selectedTestcase = [];
        let tempTestSets = new Set();
        this.commonTestSuites = [];
        testSetsList.forEach(ele => {
          ele.forEach(testSet => tempTestSets.add(testSet));
        });
        const testSetIds = Array.from<any>(tempTestSets).map(ele => ele._id);
        this.allTestsuite.forEach(testSuite => {
          const result = testSetIds.every(val => testSuite.moduleId.indexOf(val) >= 0);
          if(result){
            this.commonTestSuites.push(testSuite);
          }
        });
        if(this.commonTestSuites.length > 0){
          this.showCommonTestSuites = true;
          this.testSets = Array.from(tempTestSets);
        } else {
          this.enableTestSuites = false;
          this.showMessage = true;
        }
      }
    }
  }
  getTestSuitesOfModule(event): void {
    this.selectedTestsuite = [];
    this.testSuites = [];
    this.totalTime = 0;
    this.selectedTestcase = [];
    this.selectedTS = null;
    if(this.showCommonTestSuites){
      this.testSuites = this.commonTestSuites;
    } else{
      const temp = this.allTestsuite.filter(testSuite => {
        return (testSuite.moduleId.includes(event.value._id));
       });
       this.testSuites = [...temp];
    }

    this.isValidJob();
  }
  deleteTestBedFromSelectedList(testbed) {
    _.remove(this.selectedTestBedsList, testbed);
    _.remove(this.selectedTestBed, { _id: testbed._id });
  //  this.selectedTestBed = this.selectedTestBedsList;
    this.testBedSel.options.forEach((item: MatOption) => {
      if (testbed['_id'] === item.value['_id']) {
        item.deselect();
 
      }
    });

   this.selectFormControl.patchValue(this.selectedTestBed);
    this.isValidJob();

  }

  /**
   * Testbed Status check function
   */

  checkTestbedStatus() {
    // const selectedTB = [...this.alreadySelectedTBs];
    // selectedTB.splice(this.jobIndex, 1);
    // let selectedDevices = [...this.alreadySelectedDevices];
    // selectedDevices.splice(this.jobIndex, 1);
    // selectedDevices = selectedDevices.reduce((arr, vals) => {
    //   if (vals != null) {
    //     arr = [...arr, ...vals];
    //   } else {
    //     arr = [...arr, null];
    //   }
    //   return arr;
    // }, []);

    // for (let index = 0; index < this.allTestbed.length; index++) {
    //   const tb = this.allTestbed[index];
    //   const removeNodeNull = tb.nodes.filter((e) => e.elementType === true);
    //   const tbDevices = removeNodeNull.map((d) => d.deviceId);
    //   var commonDevices = _.intersectionWith(
    //     tbDevices,
    //     selectedDevices,
    //     _.isEqual
    //   );
    //   //  console.log(JSON.stringify(commonDevices));
    //   if (_.find(selectedTB, { _id: tb._id })) {
    //     this.testbedStatus[index] = true;
    //   } else if (commonDevices.length > 0) {
    //     this.testbedStatus[index] = true;
    //   } else {
    //     this.testbedStatus[index] = false;
    //   }
    // }
  }

  /**
   * Function to check weather job is valid or not
   */

  isValidJob() {
    console.log("selectedTestBedsList in isvalid>>>>>", this.selectedTestBedsList);
    if (this.selectedTestBed && this.selectedTestcase.length >= 1 &&  this.selectedTestBedsList.length >= 1 ) {
      if (this.selectedTestBedsList.findIndex((item) => item.avaliableFlag === false) < 0) {
        this.valid.emit({
          index: this.jobIndex,
          valid: true,
          scheduleLater : true,
          testbed: this.selectedTestBed,
        });
      } else {
      this.valid.emit({
        index: this.jobIndex,
        valid: false,
        scheduleLater : true,
        testbed: this.selectedTestBed,
      });
    }
    }else {
      this.valid.emit({
        index: this.jobIndex,
        valid: false,
        scheduleLater : false,
        testbed: this.selectedTestBed,
      });
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedTestcase, event.previousIndex, event.currentIndex);
  }

  openedChange(e) {
    if (e === true) {
      // Panel opening: remember the current selection so we can tell on close
      // whether the user actually added/removed a testbed. Suppress the rebuild
      // that resetting the search box would otherwise trigger.
      this._tbSnapshotOnOpen = (this.selectFormControl.value || []).slice();
      this._testcaseSnapshotOnOpen = this.selectedTestcase;
      this._tsSnapshotOnOpen = this.selectedTS;
      this._testsuiteSnapshotOnOpen = this.selectedTestsuite;
      this._totalTimeSnapshotOnOpen = this.totalTime;
      this.suppressTestbedRebuild = true;
      this.searchTextboxControl.patchValue('');
      this.suppressTestbedRebuild = false;
      this.searchTextBox.nativeElement.focus();
      return;
    }

    // Panel closing: only run the testbed rebuild when the selection actually
    // changed. Merely opening and closing the dropdown (no add/remove) must
    // never clear the already-selected test cases.
    const current = this.selectFormControl.value || [];
    const snapshot = this._tbSnapshotOnOpen || [];
    const added = current.some((tb) => snapshot.indexOf(tb) === -1);
    const removed = snapshot.some((tb) => current.indexOf(tb) === -1);
    const changed = added || removed;

    if (changed) {
      // Real add/remove: run the normal rebuild so existing functionality
      // (availability refresh, test-set/suite recompute) applies exactly as before.
      this.suppressTestbedRebuild = false;
      this.searchTextboxControl.patchValue('');
      // When testbeds were ONLY removed (nothing added), keep the already-selected
      // test cases ONLY IF the remaining testbeds still support the selected test
      // suite. If the removal invalidated the suite (TestSet/TestSuite dropdowns
      // cleared -> showMessage / no common test sets), leave the test cases cleared.
      const snapTs = this._tsSnapshotOnOpen;
      const suiteModuleIds = snapTs
        ? (Array.isArray(snapTs.moduleId) ? snapTs.moduleId : [snapTs.moduleId])
        : [];
      const suiteStillValid =
        this.enableTestSuites && !this.showMessage &&
        !!snapTs && Array.isArray(this.testSets) && this.testSets.length > 0 &&
        this.testSets.every((m: any) => suiteModuleIds.indexOf(m._id) >= 0);
      if (
        removed && !added && suiteStillValid &&
        (!this.selectedTestcase || this.selectedTestcase.length === 0) &&
        this._testcaseSnapshotOnOpen && this._testcaseSnapshotOnOpen.length > 0
      ) {
        this.selectedTestcase = this._testcaseSnapshotOnOpen;
        this.selectedTS = this._tsSnapshotOnOpen;
        this.selectedTestsuite = this._testsuiteSnapshotOnOpen;
        this.totalTime = this._totalTimeSnapshotOnOpen;
        this.isValidJob();
      }
    } else {
      // No change: just reset the search box without rebuilding, preserving the
      // selected test cases.
      this.suppressTestbedRebuild = true;
      this.searchTextboxControl.patchValue('');
      this.suppressTestbedRebuild = false;
    }
  }
  openedTestSuiteChange(e) {
    this.search_test_suite = '';
  }

  snmp_time_interval: any = '';
  acs_time_interval: any = '';
  polling_type:any = '';
  telemetory_object: any = [];
  cpuGraph: boolean = false;
  telemetory_object_option: any = [{name:'All',value:'all'}, {name:'Free Memory',value:'FreeMemory'}, {name:'CPU Usage',value:'CPUUsage'}, {name:'MTA OperationalState',value:'MTA_OperationalState'},
    {name:'MTA Admin Enable',value:'MTA_Admin_Enable'},{name:'Ethernet 1 Status',value:'Ethernet_1_Status'},{name:'SSID 24Primary Status',value:'SSID_24Primary_Status'},{name:'SSID 5Primary Status',value:'SSID_5Primary_Status'},{name:'Docsis RX Powerlevel',value:'Docsis_RX_Powerlevel'}]
  checkTelementory(){
    setTimeout(() => {
      if(this.cpuGraph == true){
        this.polling_type='SNMP';
        this.snmp_time_interval='15';
        this.telemetory_object = ['all'];
      } else {
        this.polling_type='';
        this.snmp_time_interval='';
        this.acs_time_interval = '';
        this.telemetory_object = [];
      }
    }, 1);
  }

  polling_type_fu(){
    if(this.polling_type == 'Both'){
      this.snmp_time_interval = '15';
      this.acs_time_interval = '15';
    } else if(this.polling_type == 'SNMP') {
      this.snmp_time_interval = '15';
      this.acs_time_interval = '';
    } else if(this.polling_type == 'TR069'){
      this.acs_time_interval = '15';
      this.snmp_time_interval = '';
    }
  }

  selectedObject(){
    setTimeout(() => {
      if(this.telemetory_object[0] == 'all'){
        this.telemetory_object = ['all'];
      }
    }, 1);
  }

  close() {
    this.showModal = false;
  }

  sortFlag:any = '';
  sorttestcases(){
    this.sortFlag1 == '';
    if(this.sortFlag == '' || this.sortFlag == 'Dess'){
      this.sortFlag = 'Acc';
      this.selectedTestcase.sort((a, b) => {
        if (a.tcPrioritytwo > b.tcPrioritytwo) {
          return 1;
        }
        if (a.tcPrioritytwo < b.tcPrioritytwo) {
          return -1;
        }
        return 0;
      });
    } else if(this.sortFlag == 'Acc'){
      this.sortFlag = 'Dess';
      //console.log('inside else if')
      this.selectedTestcase.reverse();
    }    
  }

  sortFlag1:any = '';
  sortByTcId(){
    this.sortFlag == '';
    if(this.sortFlag1 == '' || this.sortFlag1 == 'Dess'){
      this.sortFlag1 = 'Acc';
      this.selectedTestcase.sort((a, b) => {
        if (parseInt(a.tcId.split('-')[1]) > parseInt(b.tcId.split('-')[1])) {
          return 1;
        }
        if (parseInt(a.tcId.split('-')[1]) < parseInt(b.tcId.split('-')[1])) {
          return -1;
        }
        return 0;
      });
    } else if(this.sortFlag1 == 'Acc'){
      this.sortFlag1 = 'Dess';
      this.selectedTestcase.reverse();
    }   
  }
  handleInput(event: KeyboardEvent): void{
    event.stopPropagation();
 }

}
