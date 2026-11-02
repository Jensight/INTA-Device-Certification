import { ScheduleRegressionComponent } from './schedule-regression/schedule-regression.component';
import { TagRegressionComponent } from './tag-regression/tag-regression.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TestLabService } from './../../../@core/services/test-lab.service';
import { SelectTestcasesComponent } from './../select-testcases/select-testcases.component';
import { DataService } from './../../../@core/services/data.service';
import { Component, OnInit, ViewChildren, QueryList, Output, EventEmitter, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { UserService } from 'src/app/@core/services/user.service';
import { MatTabGroup } from '@angular/material/tabs';
import { ReservationService } from './../../../@core/services/reservation.service';
import { on } from 'events';
import { runInThisContext } from 'vm';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-configure-jobs',
  templateUrl: './configure-jobs.component.html',
  styleUrls: ['./configure-jobs.component.scss'],
})
export class ConfigureJobsComponent implements OnInit {
  // executionIdValid: boolean = true;
  @ViewChildren('selectTestCase')
  selectTestCase: QueryList<SelectTestcasesComponent>;
  automatedMail = false;
  tagRegressionName = '';
  isTagEdited: boolean = false;
  executionIdUpdate = '';
  updateJira = true;
  jiraRemarks = '';
  jiraUpdateType = 'update';
  estimatedTimeRequired: number = 0;
  bufferTime: number = 0;
  cpuGraph = false;
  disableRegressionButton = false;
  disableScheduleLater = false;
  selectedTestbeds = [null];
  selectedDevices = [null];
  validationList = [false];
  jobList = [{ valid: false }];
  activeTab = 0;
  selectedTeam;
  sub1;
  sub2;
  getTestbedStatusSub;
  runRegFlag: boolean = false;
  jira_option_flag: boolean = false;
  automated_mail_flag: boolean = false;
  jira_project_id_flag: boolean = false;
  user_valid_emailId: boolean = false;
  deviceInUseFlag: boolean = false;
  jiraDataLoaded: boolean = true;
  @Output() jobEvent = new EventEmitter();
  @ViewChild('tabGroup', { static: false }) tab: MatTabGroup;
  constructor(
    private dataService: DataService,
    private testLabService: TestLabService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private testBedService: TestBedService,
    private userService: UserService,
    private reservationService: ReservationService
  ) { }

  ngOnInit() {
    this.dataService.fetchSystemConfig();
    this.dataService.systemConfig.subscribe(config => {
      if (config && config.additional_time_for_reservation_value) {
        this.bufferTime = Number(config.additional_time_for_reservation_value) || 0;
        // console.log(this.bufferTime, "Buffer Time");

      }
    });
    this.sub1 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.dataService.isJiraEnabled.subscribe((dt) => {
      if (dt) {
        console.log('is jira enabled', dt);
        this.jira_option_flag = true;
        this.jira_project_id_flag = true;
      } else {
        this.updateJira = false;
        this.jira_option_flag = false;
        this.jira_project_id_flag = false;
      }
    });
    setTimeout(() => {
      this.userService.getAllusers().subscribe((data: any) => {
        if (data[0].extraSystemConfig && data[0].extraSystemConfig[0]) {
          if (data[0].extraSystemConfig[0].automated_mail == true) {
            this.automated_mail_flag = true;
          }
        }
        this.user_valid_emailId = !!this.dataService.getCurrentUser()['email'];
      });
      this.jobEvent.emit(this.jobId);
    }, 500);
  }

  /**
   * Add New Job Function to invoke new tab for adding regression
   */

  addNewJob() {
    this.dataService.loading.next(true);
    setTimeout(() => {
      this.jobList.push({ valid: false });
      this.activeTab = this.jobList.length - 1;
      this.tab.selectedIndex = this.jobList.length - 1;
      this.dataService.loading.next(false);
      this.validationList.push(false);
      this.selectedTestbeds.push(null);
      this.selectedDevices.push(null);
      this.selectedDevices = [...this.selectedDevices];
      this.selectedTestbeds = [...this.selectedTestbeds];
      this.disableButton();
    }, 500);
  }

  /**
   * Function invoked when tab is changed
   * @param event .
   */

  jobId: any = 1;
  tabChanged(event) {
    // const activeTab = Number(event.tabTitle.split('-')[1]) - 1;
    const activeTab = event.tab.textLabel;
    this.activeTab = activeTab;
    this.jobId = this.activeTab
    this.jobEvent.emit(this.jobId)

  }

  /**
   * Delete  a Job function
   */

  deleteJob() {
    this.dataService.loading.next(true);
    setTimeout(() => {
      this.jobList.splice(this.activeTab, 1);
      this.validationList.splice(this.activeTab, 1);
      this.selectedTestbeds.splice(this.activeTab, 1);
      this.selectedDevices.splice(this.activeTab, 1);
      this.selectedDevices = [...this.selectedDevices];
      this.selectedTestbeds = [...this.selectedTestbeds];
      if (this.activeTab - 1 >= 0) {
        this.activeTab -= 1;

      } else {
        this.activeTab = 0;
      }
      this.dataService.loading.next(false);
      this.disableButton();
    }, 500);
  }


  mappingValue() {
    this.jiraRemarks = '';
    this.dataService.loading.next(true);
    const allTeams = this.dataService.getTeams();
    const startTime = new Date();
    const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
    var kibanaURL = 'NA'
    var labels = [];
    if (selectedTeam && selectedTeam['kibanaURL']) {
      kibanaURL = selectedTeam['kibanaURL']
        ? selectedTeam['kibanaURL']
        : 'NA';
    }
    if (kibanaURL == undefined) {
      kibanaURL = 'NA'
    }
    const jobDetails = {};
    if (this.tagRegressionName != '') {
      jobDetails['run_id'] = this.tagRegressionName + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
    } else {
      jobDetails['run_id'] = null;
    }
    jobDetails['run_id'] = null;
    jobDetails['tagName'] = this.tagRegressionName;
    jobDetails['isTagEdited'] = this.isTagEdited;
    jobDetails['kibanaURL'] = kibanaURL;
    jobDetails['automatedMail'] = this.automatedMail ? 'Y' : 'N';

    jobDetails['startTime'] = new Date().toISOString();
    // jobDetails['regStatus'] = 'in progress';
    // jobDetails['team'] = this.selectedTeam;
    // jobDetails['user'] = this.dataService.getCurrentUser()['username'];
    // jobDetails['totalTC'] = 0;
    // jobDetails['passTC'] = 0;
    // jobDetails['failTC'] = 0;
    // jobDetails['norunTC'] = 0;
    jobDetails['job'] = [];
    /* added isReviewed flag for Regression Result analysis */
    jobDetails['isReviewed'] = 'No';
    // jobDetails['teamName'] = this.selectedTeam;
    const allJobs = this.selectTestCase.toArray();
    const selectedIssueKey = [];
    for (let index = 0; index < allJobs.length; index++) {
      const job = allJobs[index];
      const jobData: any = job.onRunClicked('SN');
      const jobStartTime = jobData['jobStartTime'] ? new Date(jobData['jobStartTime']) : new Date();
      const jobTimeRequired = Number(jobData['timeRequired']) || 0;
      const jobEstimatedEndDate = new Date(jobStartTime.getTime() + (jobTimeRequired + this.bufferTime) * 60 * 1000);
      console.log("jobEstimatedEndDate", jobEstimatedEndDate.toISOString());
      jobData['estimatedEndTime'] = jobEstimatedEndDate.toISOString();

      console.log("job data>>>>>", jobData);
      jobData['jira'] = this.updateJira ? jobData['jira'] : { 'update': false, 'type': 'upate', ...(this.jiraRemarks ? { 'jiraUnreachable': true, 'jiraRemarks': this.jiraRemarks } : {}) };
      // jobDetails['jira'] = {
      //   update: this.updateJira,
      //   type: this.jiraUpdateType,
      //   ueId: this.executionIdUpdate,
      //   key: this.executionIdUpdate
      // };


      //console.log('labels => ', labels);
      jobDetails['job'].push(jobData);
      // for (let index = 0; index < job.selectedTestcase.length; index++) {
      //   const element = job.selectedTestcase[index];
      //   if (element.jiraKey) {
      //     selectedIssueKey.push(element.jiraKey);
      // }
      // }
    }
    
    this.startRegression(jobDetails);
  }

  startRegression(jobDetails) {
    console.log('Starting regression with job details:', jobDetails);
    this.sub2 = this.testLabService.saveRegressionData(jobDetails).subscribe(

      data => {
        console.log('Regression started successfully:', data);
        if (data && data['_id']) {
          this.runRegFlag = true;
          this.dataService.loading.next(false);
          this.dataService.selectedRegressionData.next(data);
          this.router.navigate([`pages/regression/detail/${data['_id']}`], { state: { fromScreen: 'view' } });
        }
      },
      err => {
        console.error('Regression failed with error:', err);
        console.error('Error detail:', err?.error);
        console.error('Error message:', err?.error?.errorDetail || err?.error?.message || err?.message);
        this.runRegFlag = false;
        this.dataService.loading.next(false);
        console.log("error: ", err, err?.error?.jiraReachable)
        if (err?.error?.jiraReachable === false && err?.error?.error) {
          const rawError = err.error.errorDetail || err.error.error || '';
          let jiraErrMsg = '';
          if (rawError.toLowerCase().includes('cannot be assigned')) {
            this.jiraRemarks = "User doesn't have access to create Jira ticket";
            jiraErrMsg = 'This user does not have the permissions to create issue in the JIRA project. Do you want to schedule regression without Jira update?';
          } else if (/<\/?[a-z][\s\S]*>/i.test(rawError)) {
            this.jiraRemarks = 'Jira returned an unexpected error';
            jiraErrMsg = 'Jira returned an unexpected error. Do you want to schedule regression without Jira update?';
          } else {
            this.jiraRemarks = rawError;
            jiraErrMsg = rawError + ' Do you want to schedule regression without Jira update?';
          }
          this.showConfirmationPopup(jiraErrMsg, 'jiraReachable', 'SN');
        } else if (err?.error?.jiraReachable === false) {
          this.showConfirmationPopup('Jira Instance is not reachable, So Jira Test Execution update will not happen. Do you want to schedule regression?', 'jiraReachable', 'SN');
        }
        else {
          this.snackBar.open(err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.', 'Try Again', { duration: 5000 });
        }
      }
    );

  }

  // Generate Run ID
  generateSummaryName(regressionData, startTime) {
    let runId = '';
    if (regressionData) {
      runId = regressionData.job[0].module + '_' + regressionData.job[0].regressionType + '_' + this.dataService.getCurrentUser()['username'] + '_' +
        regressionData.job[0].schedulerType + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
    }
    return runId;
  }


  /**
   * Invoked After Run Button Clicked
   */

  onRunClicked() {
    if (this.hasCommonNonSharedDevices()) {
      return;
    }
    this.tagRegressionName = ""
    let allJobs: any = this.selectTestCase.toArray();
    let multiIteration = false;
    let multiJob = allJobs.length > 1;
    for (let index = 0; index < allJobs.length; index++) {
      if (allJobs[index].noIterations && allJobs[index].noIterations > 1) {
        multiIteration = true;
        break;
      }
    }
    let devName = allJobs[0].allDevices.find((dev) => dev._id == allJobs[0].selectedTestBed.dutId);
    let ontModel = null;
    if(allJobs[0].selectedTestBed.testBedName.indexOf('XGSPON') !== -1 && devName && devName['ONT Model (if XGSPON)']){
      ontModel = devName['ONT Model (if XGSPON)'];
    }
    let tfwNodes = [];
      tfwNodes = allJobs[0].selectedTestBed.nodes.filter((node) => node.tfw === true);
    let tfwId = tfwNodes.length > 0 ? tfwNodes[0].deviceId : null;
    let tfwDevice = tfwId ? allJobs[0].allDevices.find((dev) => dev._id == tfwId) : null;
    // Device FW first; use CM Firmware only when Device FW is absent.
    const deviceFwRaw = devName ? devName["deviceFWVersion"] : undefined;
    const deviceFwRawStr = (deviceFwRaw === undefined || deviceFwRaw === null || deviceFwRaw === 'NA') ? '' : String(deviceFwRaw).trim();
    const cmFwRaw = devName ? devName["CM Firmware Version"] : undefined;
    const cmFwRawStr = (cmFwRaw === undefined || cmFwRaw === null) ? '' : String(cmFwRaw).trim();
    const cmFwForTag = (deviceFwRawStr !== '') ? deviceFwRaw : (cmFwRawStr !== '' ? cmFwRaw : 'NA');
    if (tfwDevice) {
      this.tagRegressionName = devName?.deviceName + (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        (tfwDevice["deviceFWVersion"] != undefined ? tfwDevice["deviceFWVersion"] + "_" : "NA_") +
        allJobs[0]?.selectedTestcase[0]?.testSuiteName?.split(' ').join('_').split('_')[0];
    } else {
      this.tagRegressionName = devName?.deviceName + (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        allJobs[0]?.selectedTestcase[0]?.testSuiteName?.split(' ').join('_').split('_')[0];
    }

    if (multiIteration && multiJob) {
      this.tagRegressionName += "_ITR_MJ";
    } else if (multiIteration) {
      this.tagRegressionName += "_ITR";
    } else if (multiJob) {
      this.tagRegressionName += "_MJ";
    }
    if (this.jira_project_id_flag == false || this.user_valid_emailId == false) {
      this.updateJira = false;
    }
    if (this.selectedTeam) {
      const dialogRefAdd = this.dialog.open(TagRegressionComponent, {
        data: {
          name: this.tagRegressionName,
          updateJira: this.updateJira,
        },
        minHeight: 100,
        minWidth: 500,
      });
      dialogRefAdd.afterClosed().subscribe((result) => {
        if (result && result.event === 'submit') {
          // User clicked 'Apply Tag' - proceed with tag
          this.tagRegressionName = result.data;
          this.isTagEdited = result.isTagEdited || false;
          this.mappingValue();
        } else if (result && result.event === 'close') {
          // User clicked 'No Tag' - proceed without tag
          this.tagRegressionName = '';
          this.isTagEdited = false;
          this.mappingValue();
        }
        // If clicked outside (result is undefined), do nothing - don't trigger regression
      });
    } else {
      this.runRegFlag = false;
      this.dataService.loading.next(false);
      this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
    }
    // }
  }

  /**
   * Validate the datas for the regression
   * @param event .
   */


  isValid(event) {
    this.validationList[event['index']] = event['valid'];
    this.selectedTestbeds[event['index']] = event['testbed'];
    const devices = event['testbed']?.['nodes'].map((node) => node.deviceId);
    this.selectedDevices[event['index']] = devices;
    this.selectedTestbeds = _.cloneDeep(this.selectedTestbeds);
    this.selectedDevices = _.cloneDeep(this.selectedDevices);
    let testbedDevices;
    if (this.selectedTestbeds[event['index']] && this.selectedTestbeds[event['index']]._id) {
      this.getTestbedStatusSub = this.reservationService.getTestbedStatus(this.selectedTestbeds[event['index']]._id).subscribe((data: any) => {
        if (data && this.selectedTestbeds[event['index']]) {
          testbedDevices = data;
          let selectedTestbedDuplicate = _.cloneDeep(this.selectedTestbeds[event['index']]);
          selectedTestbedDuplicate.nodes.forEach((node: any) => {
            if (node.profileId != null && node.deviceId != null) {
              node.available = _.find(testbedDevices, {
                _id: node.deviceId,
              }).available;
            }
          });
          selectedTestbedDuplicate.nodes.forEach(element => {
            if (element.available == false) {
              this.deviceInUseFlag = true;
            }
          });
          this.disableButton();
        }
      })
    }
    this.disableButton();
  }

  disableButton() {
    const buttonDisable = [];

    this.validationList.forEach((value) => {
      if (value === true) {
        buttonDisable.push(value);
      }
    });
    if (buttonDisable.length === this.validationList.length) {
      this.disableRegressionButton = true;
      this.disableScheduleLater = true;
    } else {
      this.disableRegressionButton = false;
      this.disableScheduleLater = false;
    }
    if (this.deviceInUseFlag) {
      this.disableRegressionButton = false;
      this.disableScheduleLater = buttonDisable.length === this.validationList.length ? true : false;
      this.deviceInUseFlag = false;
    }
  }

  /**
   * Check if selected testbeds have common non-shared devices
   */
  private hasCommonNonSharedDevices(): boolean {
    if (!this.selectedTestbeds || this.selectedTestbeds.length <= 1) {
      return false;
    }
    
    // Filter out null testbeds
    const validTestbeds = this.selectedTestbeds.filter(tb => tb && tb._id);
    if (validTestbeds.length <= 1) {
      return false;
    }
    
    const allJobs = this.selectTestCase.toArray();
    const deviceIdCount: { [deviceId: string]: { count: number, testbeds: string[] } } = {};
    
    validTestbeds.forEach(tb => {
      tb.nodes
        .filter(node => node.deviceId && node.profileId != null)
        .forEach(node => {
          if (!deviceIdCount[node.deviceId]) {
            deviceIdCount[node.deviceId] = { count: 0, testbeds: [] };
          }
          deviceIdCount[node.deviceId].count++;
          if (!deviceIdCount[node.deviceId].testbeds.includes(tb.testBedName)) {
            deviceIdCount[node.deviceId].testbeds.push(tb.testBedName);
          }
        });
    });
    
    const commonDeviceIds = Object.keys(deviceIdCount).filter(deviceId => deviceIdCount[deviceId].testbeds.length > 1);
    
    // Group devices by their common testbed combinations
    const testbedCombinations: { [key: string]: string[] } = {};
    
    for (const deviceId of commonDeviceIds) {
      const device = allJobs[0]?.allDevices?.find(d => d._id === deviceId);
      if (device && device.shareDevice !== true) {
        const deviceName = device.deviceName || device._id;
        const testbedsKey = deviceIdCount[deviceId].testbeds.sort().join('|||');
        
        if (!testbedCombinations[testbedsKey]) {
          testbedCombinations[testbedsKey] = [];
        }
        testbedCombinations[testbedsKey].push(deviceName);
      }
    }
    
    const conflictMessages = [];
    for (const testbedsKey in testbedCombinations) {
      const devices = testbedCombinations[testbedsKey];
      const testbeds = testbedsKey.split('|||');
      conflictMessages.push({
        devices: devices,
        testbeds: testbeds
      });
    }
    
    if (conflictMessages.length > 0) {
      this.dataService.loading.next(false);
      this.dialog.open(ConfirmationDiaogComponent, {
        maxWidth: '90vw',
        width: 'auto',
        data: {
          name: 'Cannot Schedule The Regression..',
          isCommonDeviceTable: true,
          commonDeviceConflicts: conflictMessages,
          action: 'OKAY',
          showSingleButton: true
        },
        panelClass: 'app-full-bleed-dialog',
      });
      return true;
    }
    
    return false;
  }

  ngOnDestroy() {
    this.checkTestbedsStatus();

    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  /**
   * Schedule Later Regression Function
   */
  scheduleLater() {
    if (this.jira_project_id_flag == false || this.user_valid_emailId == false) {
      this.updateJira = false;
    }
    if (this.updateJira) {
      this.validateJiraUser('SL');
    } else {
      this.scheduleLaterExecution();
    }
  }
  private scheduleLaterExecution() {
    if (this.hasCommonNonSharedDevices()) {
      return;
    }

    if (this.selectedTeam) {
      const allTeams = this.dataService.getTeams();
      const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
      var kibanaURL = 'NA';
      if (selectedTeam && selectedTeam['kibanaURL']) {
        kibanaURL = selectedTeam['kibanaURL']
          ? selectedTeam['kibanaURL']
          : 'NA';
      }
      if (kibanaURL == undefined) {
        kibanaURL = 'NA';
      }
      const jobDetails = {};
      jobDetails['run_id'] = null;
      jobDetails['kibanaURL'] = kibanaURL;
      jobDetails['automatedMail'] = this.automatedMail ? 'Y' : 'N';
      jobDetails['jira'] = {
        update: this.updateJira,
        type: this.jiraUpdateType,
        ueId: this.executionIdUpdate,
        key: this.executionIdUpdate
      };
      /* added isReviewed flag for Regression Result analysis */
      jobDetails['isReviewed'] = "No";
      jobDetails['startTime'] = new Date().toISOString();      
      jobDetails['job'] = [];
      jobDetails['tagName'] = "";
      jobDetails['isTagEdited'] = false;
      // jobDetails['teamName'] = this.selectedTeam;
      const allJobs = this.selectTestCase.toArray();
      const selectedTestbeds = [];
      const totalTimeRequired = [];
      const selectedIssueKey = [];

      // const scheduledStartTime = jobDetails['startTime'] ? new Date(jobDetails['startTime']) : new Date();
      for (let index = 0; index < allJobs.length; index++) {
        const job = allJobs[index];
        const jobData: any = job.onRunClicked('SL');       
        selectedTestbeds.push(jobData['testbed']);
        totalTimeRequired.push(jobData['timeRequired']);
        jobDetails['job'].push(jobData);
        if (this.updateJira === true && this.executionIdUpdate === '') {
          for (let index = 0; index < job.selectedTestcase.length; index++) {
            const element = job.selectedTestcase[index];
            if (element.jiraKey) {
              selectedIssueKey.push(element.jiraKey);
              jobDetails['selectedIssueKey'] = selectedIssueKey;
            }
          }
        }
      }
      //  console.log("scheduler???? ", selectedTestbeds);
      jobDetails['run_id'] = null;

      const maxTimeRequired = _.max(totalTimeRequired);
      this.runRegFlag = true;
      const devices = Object.keys(this.selectedDevices).reduce((data, key) => {
        return [...data, ...this.selectedDevices[key]];
      }, []);
      const dialogRef = this.dialog.open(ScheduleRegressionComponent, {
        data: {
          jobDetails,
          maxTimeRequired,
          selectedTestbeds: selectedTestbeds,
          selectedDevices: devices,
          selectedTeam: this.selectedTeam,
          allJobs: this.selectTestCase.toArray(),
          quickScheduler: false,
          updateJira: this.updateJira
        },
        minHeight: 100,
        minWidth: 500,
      });
    } else {
      this.runRegFlag = false;
      this.dataService.loading.next(false);
      this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
    }
  }

  checkTestbedsStatus() {
    if (this.runRegFlag == false && this.selectedTestbeds && this.selectedTestbeds != null && this.selectedTestbeds.length > 0) {
      var removetestbed = this.selectedTestbeds.filter(function (item) {
        if (item != null && item.testBedName.toLowerCase().includes('_reused')) {
          return item
        }
      })

      removetestbed.forEach(el => {
        this.dataService.loading.next(true);
        this.testBedService
          .deleteTestbed(el._id)
          .subscribe(
            (result) => {
              this.dataService.loading.next(false);
              if (result) {
                this.dataService.getTestBedData().next(result);
              }
            },
            (error) => {
              this.dataService.loading.next(false);
            }
          );
      });
    }
  }

  checkJiraTeam() {

    if (this.jira_project_id_flag == false || this.user_valid_emailId == false) {
      setTimeout(() => {
        this.updateJira = false;
      }, 3000);
    }
  }

  scheduleNow() {
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
      // this.executionIdValid = true;
      this.checkJiraTCs(scheduleType);
    } else {
      // this.executionIdValid = true;
      this.onRunClicked();
    }
  }

  private checkJiraTCs(scheduleType) {
    const allJobs = this.selectTestCase.toArray();
    let fewNonJiraTcs = 0;
    let allNonJiraTcs = 0;
    let validJobs = 0;
    for (let index = 0; index < allJobs.length; index++) {
      const job = allJobs[index];
      const tempTcData = job.selectedTestcase?.map((element: any) => element).filter(element => {
        return (element.jiraKey);
      });
      if (tempTcData.length > 0 && job.selectedTestcase.length !== tempTcData.length) {
        fewNonJiraTcs++;
      } else if (tempTcData.length === 0) {
        allNonJiraTcs++;
      } else {
        validJobs++;
      }
    }
    // show popup
    if (allNonJiraTcs >= 1 && allJobs.length === allNonJiraTcs) {
      this.updateJira = false;
      this.showConfirmationPopup('The current scheduled regression got no automated Testcases which are part of Jira Test Cases, Do you want to continue scheduling regression without Jira update ?', 'checkJiraTCs', scheduleType);
    } else if (fewNonJiraTcs >= 1 || (allNonJiraTcs >= 1 && allJobs.length !== allNonJiraTcs)) {
      this.showConfirmationPopup('The current scheduled regression got few automated Testcases which are not part of Jira Test Cases, Do you want to continue scheduling regression ?', 'checkJiraTCs', scheduleType);
    } else if (validJobs === allJobs.length) {
      if (scheduleType === 'SN') {
        this.onRunClicked();
      } else if (scheduleType === 'SL') {
        this.scheduleLaterExecution();
      }
    }

  }

  previewFile() {
    // Where you will display your image
    var preview: any = document.querySelector('img');
    // The button where the user chooses the local image to display
    var file = document.querySelector('input[type=file]')//.files[0];
    // FileReader instance
    var reader = new FileReader();
    // When the image is loaded we will set it as source of
    // our img tag
    reader.onloadend = function () {
      preview.src = reader.result;
    }


    if (file) {
      // Load image as a base64 encoded URI
      //reader.readAsDataURL(file);
    } else {
      preview.src = "";
    }
  }

  showConfirmationPopup(text, next, scheduleType): any {
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
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
        if (next === 'validateJiraUser') {
          this.updateJira = false;
        } else if (next === 'jiraReachable') {
          this.updateJira = false;
          this.mappingValue();
        }
        if (scheduleType === 'SN' && next !== 'jiraReachable') {
          // this.validateExecutionId(scheduleType);
          this.onRunClicked();
        } else if (scheduleType === 'SL') {
          this.scheduleLaterExecution();
        }
      }
    });
  }
}
