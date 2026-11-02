import { TestBedService } from './../../../@core/services/test-bed.service';
import { ReservationService } from './../../../@core/services/reservation.service';
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
import { DataService } from '../../../@core/services/data.service';
import { TreeviewConfig, TreeviewItem, TreeviewComponent } from '@samotics/ngx-treeview';
import * as _ from 'lodash';
import { NameFromIdPipe } from '../../../@shared/pipes/name-from-id.pipe';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TestBedConfigureComponent } from '../../test-bed/test-bed-configure/test-bed-configure.component';
import { DeviceDetailComponent } from './device-details/device-detail.component';
import { VariableValueDisplayComponent } from './variable-value-display/variable-value-display.component';
import { Router } from '@angular/router';
import { EditTestbedConfigComponent } from '../../test-bed/test-bed-view/edit-testbed-config/edit-testbed-config.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SearchtestbedpipePipe } from '../../../@shared/pipes/searchtestbedpipe.pipe';
import { UserService } from 'src/app/@core/services/user.service';
import { TimeDifferencePipe } from './../../../@shared/pipes/time-diffrence.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
@Component({
  selector: 'app-select-testcases',
  templateUrl: './select-testcases.component.html',
  styleUrls: ['./select-testcases.component.scss'],
  providers: [NameFromIdPipe, SearchtestbedpipePipe,TimeDifferencePipe],
})
export class SelectTestcasesComponent implements OnInit, OnDestroy, OnChanges {
  @Input('jobIndex') jobIndex;
  @Input('selectedTestbeds') alreadySelectedTBs = [];
  @Input('selectedDevices') alreadySelectedDevices = [];
  @Input('activeTab') activeTab = null;
  @Input('updateJira') jiraUpdate;
  @Output('isValid') valid: EventEmitter<any> = new EventEmitter();
  @ViewChild('treeViewComp')
  treeView: TreeviewComponent;
  loading = false;
  cpuGraph:boolean = false;
  selectedTestBed = null;
  selectedModule;
  allTestbed = [];
  selectedTestcase = [];
  allModules = [];
  allTestsuite = [];
  selectedTestsuite : any = [];
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
  totalTime=0
  // pre Execution and Post Execution
  allAPIUsedInRun = [];
  // jiraUpdate = false;
  jira = {'update': false, 'type': 'upate'}
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

  // animation Config
  // animationConfig = {
  //     animationType: ANIMATION_TYPES.wanderingCubes,
  //     backdropBackgroundColour: 'rgba(0,0,0,0.1)',
  //     backdropBorderRadius: '4px'
  // };

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
  @Input() jobId:number;
  private job_id:any
  telemetry_option_flag: boolean = false;
  telemetry_options:any = [{name:'SNMP', value:'SNMP'}, {name:'ACS', value:'TR069'}, {name:'SNMP & ACS', value:'Both'}];
  telemetry_time_option:any = [{name:'15', value:'15'}, {name:'20', value:'20'}, {name:'30', value:'30'}, {name:'45', value:'45'}]
  @ViewChild('myDialog') myDialog: MatDialogRef<any>;
  search_test_suite:any
  environment_type: any = [];
  selected_environment: any = '';
  enable_environment_type_selection: boolean = false;
  priority_flag2 : boolean = false;
  col1: any  = '20%';
  col2: any = '60%';
  testSetFilterDetails: any;
  testSets: any;
  disabledTestSet = false;
  enableTestSuites = false;
  @Input() panelClass: string | string[] | Set<string> | { [key: string]: any; } 
  tfwEnabledNodesString: any;
  showOnlyPairedTestbeds: boolean = false;

  // Cached raw testbed list + settings so we can reactively re-run the filter
  // chain when the User-TestBed Access Matrix changes (no page refresh needed).
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
    private timeDifference: TimeDifferencePipe,
    private userService: UserService,
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
        this.testSets = modules;
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
   * Get Test Suits Of Module function
   */
  getTestSuitesOfModule() {
    this.test_set_filter? '' : this.selectedModule = []; 
    if (this.selectedModule) {
      this.selectedTestsuite = [];
      this.selectedTestcase = [];
      this.checkedTestsuite = [];
      this.enableTestSuites = this.selectedModule['_id'] ? true : false ;
      this.search_test_suite = '';
      if (this.test_set_filter) {
        this.selectedTestsuite = _.filter(this.allTestsuite, {
          moduleId: this.selectedModule['_id'],
        });
        const tempList = [];
        this.dataService.getTestSuites().forEach((element) => {
          const tc = _.findIndex(this.selectedTestsuite, element);
          if(tc > -1){
            tempList.push(element);
          }
        });
        this.selectedTestsuite = tempList;
        for (let i = 0; i < this.allTestsuite.length; i++) {
          if (typeof this.allTestsuite[i].moduleId != 'string') {
            this.allTestsuite[i].moduleId.forEach(ele => {
              if (ele == this.selectedModule['_id']) {
                this.selectedTestsuite.push(this.allTestsuite[i]);
              }
            });
          }
        }
      } else {
        this.selectedTestsuite =  this.allTestsuite;
       
      }
      //console.log("selectedTestsuite >>>",this.selectedTestsuite);
      for (let index = 0; index < this.selectedTestsuite.length; index++) {
        const element = this.selectedTestsuite[index];
        for (let j = 0; j < element['testCases'].length; j++) {
          const element2 = element['testCases'][j];
         
          let testcase = _.find(this.allTestcase, { _id: element2 });
         
          if (testcase) {
            testcase = { ...testcase };
            testcase['testSuiteId'] = element['_id'];
            testcase['testSuiteName'] = element['testSuiteName'];
            this.selectedTestsuite[index]['testCases'][j] = testcase;
          }
        }
      }
      this.checkedTestsuiteStatus = _.fill(
        Array(this.selectedTestsuite.length),
        false
      );
    }
  }

  /**
   * Add Testcase from Testsuite function
   * @param event .
   * @param testsuite .
   */

  addTestcaseFromTestsuite(event, testsuite) {
    this.sortFlag = '';
    this.sortFlag1 = '';
    if (event['checked']) {
      
      this.checkedTestsuite.push(testsuite);
      testsuite['testCases'].forEach((element) => {
        const tcindex = _.findIndex(this.selectedTestcase, {
          _id: element['_id'],
          tcGroupId: element['tcGroupId'],
          testSuiteId: element['_id'],
        });
        if (tcindex < 0) {
          this.selectedTestcase.push(element);
        }
      });
    } else {
      const index = this.checkedTestsuite.indexOf(testsuite);
      if (index > -1) {
        this.checkedTestsuite.splice(index, 1);
      }
      testsuite['testCases'].forEach((element) => {
        const tcindex = _.findIndex(this.selectedTestcase, {
          _id: element['_id'],
          testSuiteId: element['testSuiteId'],
        });
        if (tcindex > -1) {
          this.selectedTestcase.splice(tcindex, 1);
        }
      });
    }
    this.isValidJob();
    this.checkTestbedStatus();
  }

  calculateTime(){
    this.dataService.loading.next(true);
    this.totalTime=0
    this.selectedTestcase.forEach((tc) => {
      this.totalTime += tc.autoExectime != null && tc.autoExectime > 0 ? tc.autoExectime : tc.manualExectime;
    });
    
    this.totalTime=this.timeDifference.transform(Math.ceil(this.totalTime*60))
    this.dataService.loading.next(false);
  }

  /**
   * Select / Unselect All Testcases function
   * @param event .
   */

  selectOrDeselectAllTs(event) {
    this.sortFlag = '';
    this.sortFlag1 = '';
    let testCases;
    this.dataService.loading.next(true);
    if (event['checked']) {
      this.checkedTestsuiteStatus = _.fill(this.checkedTestsuiteStatus, true);
      this.selectedTestcase = [];
      this.checkedTestsuite = this.selectedTestsuite;
      testCases = [... this.selectedTestsuite.map(ts => ts.testCases)];
      const temp = testCases.reduce((accumulator, value) => accumulator.concat(value), []);
      this.selectedTestcase = temp;
      // console.log('selected Test case:', new Set(temp), this.selectedTestcase, this.checkedTestsuite);
      this.dataService.loading.next(false);
    } else if (!event['checked']) {
      this.checkedTestsuiteStatus = _.fill(this.checkedTestsuiteStatus, false);
      this.checkedTestsuite = [];
      this.selectedTestcase = [];
    }
    this.isValidJob();
    this.checkTestbedStatus();
  }

  /**
   * Update Function for selected test cases 
   * @param data .
   */

   showModal: boolean = false;
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
            testSuiteId: tc['testSuiteId'],
          });
        });
      }
    }
    data.forEach((element) => {
      const index = _.findIndex(this.selectedTestcase, {
        _id: element['_id'],
        tcGroupId: element['tcGroupId'],
        testSuiteId: element['testSuiteId'],
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
    if (index === this.lastShownIndex && this.test_suite_popup == false) {
      
      this.lastShownIndex = -1;
      this.showTree = false;
      return;
    } else {
      this.lastShownIndex = index;
      if(this.test_suite_popup == true){
        this.showModal = true;
        this.showTree = false;
      } else {
        this.showTree = true;
        this.showModal = false;
      }
      
    }
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
          testSuiteId: tc['testSuiteId'],
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
   * Edit Device Function to open edit device form
   */

   editDevices() {
    if(this.clone_flag == true) {
      this.testbedService.configureTestbed.next(this.selectedTestBed);
      let dialogRef=this.modal.open(EditTestbedConfigComponent, {
        width: '450px',
        data: {
          selectedTeam: this.selectedTeam,
          selectedTestbed: this.selectedTestBed,
          request:'selectTc'
        },
      });
      dialogRef.beforeClosed().subscribe(result => {
        if (result.event === 'clone'){
          this.selectedTestbedDuplicate = null;
          this.selectedTestBed = null;
          this.selectedTestBed = this.allTestbed[0];
          this.testbedChanges(this.allTestbed[0])
        }
      });
    } else {
      this.testbedService.configureTestbed.next(this.selectedTestBed);
      let dialogRef=this.modal.open(EditTestbedConfigComponent, {
        width: '450px',
        data: {
          selectedTeam: this.selectedTeam,
          selectedTestbed: this.selectedTestBed,
          request:''
        },
      });
      dialogRef.beforeClosed().subscribe(result => {
      if (result.event === 'submit'){
          this.selectedTestbedDuplicate = null;
          this.selectedTestBed = null;
        }
      });
    }
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
    this.selectedTestsuite.forEach((ts, index) => {
      this.checkedTestsuiteStatus[index] = this.checkStatus(ts);
    });
    this.isValidJob();
    this.checkTestbedStatus();
  }

  /**
   * Function invoked after run button clicked
   * @param scheduleStatus .
   */
  onRunClicked(scheduleStatus) {
    
    let timeRequired = 0;
    this.preExecutionArray = [];
    this.postExecutionArray = [];
    // this.dataService.loading.next(true);
    this.allAPIUsedInRun = [];
    let tcId=[]
    this.selectedTestcaseDup = _.cloneDeep(this.selectedTestcase);
    
    // Filter out comment steps from test cases before execution
    this.selectedTestcaseDup.forEach(tc => {
      if (tc.testSteps && tc.testSteps.length > 0) {
        // Remove comment steps - they should not be executed
        tc.testSteps = tc.testSteps.filter(step => step.isComment !== true);
        console.log('Test Case after filtering comments:', tc.tcId, 'Steps:', tc.testSteps.length);
      }
    });
    
    this.selectedTestcaseDup.forEach((tc) => {
      delete tc.tcCreator
      delete tc.tcEditor
      delete tc.createdAt
      delete tc.updatedAt
      let tcObj={tcId:tc._id,suiteId:tc.testSuiteId}
      tcId.push(tcObj)
      timeRequired += tc.autoExectime!=null && tc.autoExectime > 0?Number(tc.autoExectime):Number(tc.manualExectime);
      tc['tcGroup'] = this.nameFromId.transform(
        tc['tcGroupId'],
        this.allTestgroup,
        '_id',
        'testGroupName'
      );
    });
    const jobData = { };

    jobData['timeRequired'] = timeRequired;
    jobData['job_id'] =null
    // jobData['teamName'] = this.selectedTeam;
    // jobData['totalTC'] = this.selectedTestcaseDup.length;
    jobData['schedulerType'] = scheduleStatus;
    // jobData['passTC'] = 0;
    // jobData['failTC'] = 0;
    // jobData['norunTC'] = this.selectedTestcaseDup.length;
    // jobData['dutId']= this.selectedTestBed.dutId
    jobData['modelName'] = this.selectedTestBed.modelName
    jobData['testbed'] = this.selectedTestBed._id
    jobData['testBedName'] = this.selectedTestBed.testBedName;
    jobData['reRunOnFail'] = this.rerunStaus ? 'Y' : 'N';
    jobData['jira'] = this.jira;
    jobData['jira']['update'] = this.jiraUpdate;
    // console.log('jira update', this.jiraUpdate);
    jobData['jira']['type'] = 'update';
    jobData['numOfIteration'] = this.noIterations;
    // jobData['updateALM'] = 'N';
    jobData['module'] = this.test_set_filter ? this.selectedModule['moduleName'] : "";
    jobData['regressionType'] =this.checkedTestsuiteStatus.indexOf(false) === -1 ? 'full' : 'partial';
    // jobData['preExecution'] = this.preExecutionArray;
    // jobData['postExecution'] = this.postExecutionArray;
    jobData['onExecution'] = tcId;
    const deviceData = _.find(this.allDevices, { _id: this.selectedTestBed?.dutId });
    /** Adding ONT Model to job data for XGSPON test bed */
    if(this.selectedTestBed?.testBedName.indexOf('XGSPON') !== -1 && deviceData){
      jobData['ontModel'] = deviceData['ONT Model (if XGSPON)'];
    }
    if (this.firmware_version === "") {
      if (deviceData) {
        // Device FW first; use CM Firmware only when Device FW is absent.
        const deviceFwTc = deviceData['deviceFWVersion'];
        const deviceFwTcStr = (deviceFwTc === undefined || deviceFwTc === null || deviceFwTc === 'NA') ? '' : String(deviceFwTc).trim();
        const cmFw = deviceData['CM Firmware Version'];
        const cmFwStr = (cmFw === undefined || cmFw === null) ? '' : String(cmFw).trim();
        jobData['firmwareVersion'] = (deviceFwTcStr !== '') ? deviceFwTc : (cmFwStr !== '' ? cmFw : 'NA');
      }
    } else {
      jobData['firmwareVersion'] = this.firmware_version;
    }
    
  const tfwEnabledNodes = this.selectedTestBed.nodes.filter(node => node.tfw === true);
  jobData['trackFW'] = [];
  jobData['endPointFWs'] = [];
  if(tfwEnabledNodes && tfwEnabledNodes.length > 0){
  const deviceNames = tfwEnabledNodes.map(node => {
    const device = _.find(this.allDevices, { _id: node.deviceId });
    return device?.deviceName;
  });
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
  
  console.log('endPointFWs', jobData['endPointFWs']);
  console.log('trackFW', jobData['trackFW']);
    
    if(this.enable_environment_type_selection == true){
      jobData['environment_type']=this.selected_environment;
    }
    jobData['telementry'] = this.cpuGraph;
    if(this.cpuGraph == true){
      if(this.telemetory_object.length == 0){
        this.telemetory_object = ['all'];
      }
      jobData['cpe_telementory'] = {polling_type:this.polling_type, snmp_time_interval:this.snmp_time_interval, 
        acs_time_interval:this.acs_time_interval, object:this.telemetory_object}
    }
  return jobData
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
      if (res) {
        const dataVal = {

          deviceIds: [res.data]
        }

        this.sub14 = this.reservationService
          .unlockTestbed(dataVal)
          .subscribe((data: any) => {
            if (data) {
              this.selectedTestbedDuplicate.nodes.forEach((node: any) => {
                if (node.profileId != null && node.deviceId == res.data) {
                  node.available = true;
                  this.isValidJob();
                }
              });
              this.sub12 = this.reservationService
                .getTestbedStatus( this.selectedTestBed._id)
                .subscribe((data: any) => {
                  if (data) {
                    this.testbedDevices = data;

                    this.selectedTestbedDuplicate = _.cloneDeep(this.selectedTestBed);
                    this.selectedTestbedDuplicate.nodes.forEach((node: any) => {
                      if (node.profileId != null && node.deviceId != null) {
                        node.available = _.find(this.testbedDevices, {
                          _id: node.deviceId,
                        }).available;
                      }
                    });




                  }
                });
            }
          });
      }


    });
  }

  /**
   * Show variable detail function
   */

  showVariableDetail() {
    this.modal.open(VariableValueDisplayComponent, {
      minWidth: '600px',
      data: _.cloneDeep(this.selectedTestBed),
    });
  }

  test_suite_popup: boolean = false;
  test_set_filter: boolean = false;
  
  show_popup: boolean = false;
  ngOnInit() {
    // Live-refresh when the User-TestBed Access Matrix is saved elsewhere
    this._matrixChangeSub = this.dataService.onUserTestbedAccessMatrixChanged().subscribe((matrix: any) => {
      if (this._settingsData) { this._settingsData.userTestbedAccessMatrix = matrix; }
      this.rebuildAllTestbed();
    });
    this.userService.getAllusers().subscribe((data:any)=>{
      this._settingsData = data && data[0] ? data[0] : null;
      // Read showOnlyPairedTestbeds + restrict_testbed_to_user from regressionConfig (team-specific)
      if (this._settingsData && this._settingsData.regressionConfig && this._settingsData.regressionConfig[0] && this._settingsData.regressionConfig[0].teams) {
        const teamConfig = this._settingsData.regressionConfig[0].teams.find((team: any) => team.name === this.selectedTeam);
        if (teamConfig) {
          this.showOnlyPairedTestbeds = !!teamConfig.show_only_paired_testbeds;
          this._restrictTestbedToUser = !!teamConfig.restrict_testbed_to_user;
        }
      }
      this.rebuildAllTestbed();
      if(data[0].extraSystemConfig && data[0].extraSystemConfig[0]){
        if(data[0].extraSystemConfig[0].cpe_telemetry == true){
          this.telemetry_option_flag = true;
        }
        if(data[0].extraSystemConfig[0].test_suite_popup && data[0].extraSystemConfig[0].test_suite_popup == true){
          this.test_suite_popup = true;
        }
        this.testSetFilterDetails = data[0].extraSystemConfig[0].teams.filter(team => {
          return (team.name === this.selectedTeam);
        });
        if (this.testSetFilterDetails && this.testSetFilterDetails.length > 0
          && this.testSetFilterDetails[0].test_set_filter && this.testSetFilterDetails[0].test_set_filter == true){
          this.test_set_filter = true;
        }else{
          this.dataService.getTestSuites().subscribe((ts) => {
            if (ts) {
              this.selectedTestsuite = ts;
              this.dataService.getTestCases().subscribe((tc) => {
                if (tc) {
                  this.allTestcase = tc;
                  this.getTestSuitesOfModule();
                }
              });
            }
          });
          this.selectedModule = this.allModules;
        }
      }
      if(data[0].dashboardConfig && data[0].dashboardConfig[0] && data[0].dashboardConfig[0].teams){
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
    });
   
    this.checkTestbedStatus();
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
   * Function invoked when testbed changes
   * @param tb .
   */

   firmware: any = [];
   firmware_version: any;
   model_name:any;
  testbedChanges(tb) {
    console.log("testbedChanges>>>>", tb);
    this.testSets = [];
    this.selectedModule = [];
    this.selectedTestsuite = [];
    this.selectedTestcase = [];
    this.checkedTestsuite = [];
    this.checkedTestsuiteStatus = [];
    this.totalTime = 0;
    this.enableTestSuites = false;
    console.log("selectedModule>>>>", this.selectedModule);
    if ( this.test_set_filter) {
      this.search_test_suite = '';
    if (this.testSetFilterDetails[0].is_TestBedProfile_TestSet_Mapped &&
      this.testSetFilterDetails[0].is_TestBedProfile_TestSet_Mapped == true ){
        this.testSets = [];
        this.enableTestSuites = false;
        console.log("testbed  mapped testset>>>>",tb.mappedTestSets);
        if(tb.mappedTestSets && tb.mappedTestSets.length > 0){
          tb.mappedTestSets.forEach(ts => {
            const temp = this.allModules.filter(module => {
              return (module._id === ts);
            });
            console.log("temp>>>>", temp,temp.length  );
            this.disabledTestSet = temp && temp.length > 0 ? false : true;
            console.log("this.disabledTestSet>>>>", this.disabledTestSet);
            this.testSets.push(temp[0]);
          });
        }else{
          console.log("testbed not having mapped testset>>>>",tb.mappedTestSets);
          this.testSets = [];
          this.disabledTestSet = true;
          // this.enableTestSuites = true;
        }     
       
    } else {
      this.testSets = this.allModules;
      this.enableTestSuites = false;
    }
   } else {
    this.enableTestSuites = true;
    this.selectedTestsuite = this.allTestsuite;
   }

    this.firmware = [];
    this.firmware_version = '';
    this.model_name = '';
    this.search_test_bed = '';
    this.dataService.setSelectedTestbed(tb);
    var obj: any;
    tb.nodes.forEach(ele => {
      if(ele.dut == true){
        obj = ele;
      }
    });
    this.sub12 = this.reservationService
      .getTestbedStatus( tb._id)
      .subscribe((data: any) => {
        if (data) {
          this.testbedDevices = data;

          this.selectedTestbedDuplicate = _.cloneDeep(this.selectedTestBed);
            this.selectedTestbedDuplicate.nodes.forEach((node: any) => {
              if(node.profileId != null && node.deviceId != null){
                node.available = _.find(this.testbedDevices, {
                  _id: node.deviceId,
                }).available;
              }
            });
            if(obj && obj.deviceId){
              var testbed = _.find(this.testbedDevices, (dev)=>dev._id == obj.deviceId);
              //this.testbedDevices.forEach(ele=>{
                //if(ele._id == obj.deviceId) {
                  this.dataService.getAllModels().subscribe(models => {
                    if(models){
                      models.forEach(el => {
                        if(el && el.modelName == testbed?.model && el.dut == true) {
                          this.model_name = el.modelName;
                         
                          if(el.firmware_version_N_1){
                            this.firmware.push({name:'Firmware version (N+1)', version:el.firmware_version_N_1})
                            this.firmware_version = el.firmware_version_N_1;
                          }

                          if(el.firmware_version_N_2){
                            this.firmware.push({name:'Firmware version (N+2)', version:el.firmware_version_N_2})
                          }

                          if(el.firmware_version_N){
                            this.firmware.push({name:'Firmware version (N)', version:el.firmware_version_N})
                          }

                          if(el.firmware_version_N_min_1){
                            this.firmware.push({name:'Firmware version (N-1)',version:el.firmware_version_N_min_1})
                          }
                        } else if(el.modelName == testbed.model){
                          this.model_name = el.modelName;
                        }
                      });
                    }
                  })
                //}
              //})
            }
          
        //  console.log(this.selectedTestbedDuplicate);
          
          this.isValidJob();
          this.checkTestbedStatus();
        }
      });
    
  }

  /**
   * Testbed Status check function
   */

  clone_flag: boolean = false;

  /**
   * Re-apply the testbed filter chain (inactive/dynamic exclusion, show-only-paired,
   * restrict-testbed-to-user) from the cached raw list. Called on load and whenever
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
    // Drop any previously-selected testbeds that are no longer allowed
    if (this.selectedTestBed && this.selectedTestBed.length) {
      const visibleIds = new Set(this.allTestbed.map((t: any) => t && t._id ? String(t._id) : ''));
      this.selectedTestBed = this.selectedTestBed.filter((t: any) => visibleIds.has(String(t && t._id)));
    }
  }

  checkTestbedStatus() {
    this.selectedTestBed = this.selectedTestBed;
    this.clone_flag = false;
    const selectedTB = [...this.alreadySelectedTBs];
    selectedTB.splice(this.jobIndex, 1);
    let selectedDevices = [...this.alreadySelectedDevices];
    this.testbedDevices.forEach(ele => {
      if(ele.shareDevice && ele.shareDevice == true){
        if(this.alreadySelectedDevices[this.jobIndex] && this.alreadySelectedDevices[this.jobIndex] != null){
          for (let i = 0; i < this.alreadySelectedDevices[this.jobIndex].length; i++) {
            if(ele._id == this.alreadySelectedDevices[this.jobIndex][i]) {
              this.alreadySelectedDevices[this.jobIndex].splice(i, 1);
            }
          }
        }
      }
    });
    setTimeout(() => {
      selectedDevices.splice(this.jobIndex, 1);
      selectedDevices = selectedDevices.reduce((arr, vals) => {
        if (vals != null) {
          arr = [...arr, ...vals];
        } else {
          arr = [...arr, null];
        }
        return arr;
      }, []);
    
    for (let index = 0; index < this.allTestbed.length; index++) {
      const tb = this.allTestbed[index];
      const tbDevices = tb.nodes.map((d) => d.deviceId);
      var commonDevices = _.intersectionWith(
        tbDevices,
        selectedDevices,
        _.isEqual
      );

      if (_.find(selectedTB, { _id: tb._id })) {
        this.testbedStatus[index] = true;
        if(this.selectedTestbedDuplicate && this.selectedTestbedDuplicate.nodes) {
          this.selectedTestbedDuplicate.nodes.forEach(el=>{
            selectedDevices.forEach(element => {
              if(el.deviceId == element){
                el['available'] = false;
                this.clone_flag = true;
              }
            });
            
          })
        }
      } else if (commonDevices.length > 0) {
        this.testbedStatus[index] = true;
        if(this.selectedTestbedDuplicate && this.selectedTestbedDuplicate.nodes){
          this.selectedTestbedDuplicate.nodes.forEach(el=>{
            selectedDevices.forEach(element => {
              if(el.deviceId == element){
                el['available'] = false;
                this.clone_flag = true;
              }
            });
          })
        }
      } else {
        this.testbedStatus[index] = false;
      }
    }
    }, 1);
    
  }

  /**
   * Function to check weather job is valid or not
   */

  isValidJob() {
    if (this.selectedTestBed && this.selectedTestcase.length >= 1) {
      this.valid.emit({
        index: this.jobIndex,
        valid: true,
        testbed: this.selectedTestBed
      });
    } else {
      this.valid.emit({
        index: this.jobIndex,
        valid: false,
        testbed: this.selectedTestBed
      });
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedTestcase, event.previousIndex, event.currentIndex);
  }

  firmwareChanges(event) {
    this.firmware_version = event;
  }

  snmp_time_interval: any = '';
  acs_time_interval: any = '';
  polling_type:any = '';
  telemetory_object: any = [];
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

  close(){
    this.showModal = false;
  }

  sortFlag:any = '';
  sorttestcases() {
    this.sortFlag1 = '';
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
      this.selectedTestcase.reverse();
    }
  }

  sortFlag1:any = '';
  sortByTcId() {
    this.sortFlag = '';
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
