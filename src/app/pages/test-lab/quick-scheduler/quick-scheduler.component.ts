import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { ScheduleRegressionComponent } from '../configure-jobs/schedule-regression/schedule-regression.component';
import { TagRegressionComponent } from '../configure-jobs/tag-regression/tag-regression.component';
import * as _ from 'lodash';
import { SelectTestbedsComponent } from './select-testbeds/select-testbeds.component';
import { UserService } from 'src/app/@core/services/user.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-quick-scheduler',
  templateUrl: './quick-scheduler.component.html',
  styleUrls: ['./quick-scheduler.component.scss']
})
export class QuickSchedulerComponent implements OnInit, OnDestroy { 
@ViewChildren('selectTestBeds')
selectTestCase: QueryList<SelectTestbedsComponent>;
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
jira_option_flag:boolean = false;
automated_mail_flag:boolean = false;
jira_project_id_flag: boolean = false;
jiraDataLoaded: boolean = true;
constructor(
  private dataService: DataService,
  private testLabService: TestLabService,
  private router: Router,
  private snackBar: MatSnackBar,
  private dialog: MatDialog,
  private userService: UserService
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
  this.userService.getAllusers().subscribe((data:any)=>{
    if(data[0].extraSystemConfig && data[0].extraSystemConfig[0]){
      if(data[0].extraSystemConfig[0].automated_mail == true){
        this.automated_mail_flag = true;
      }
    }
  })
}

/**
 * Function invoked when tab is changed
 * @param event .
 */

tabChanged(event) {
  const activeTab = Number(event.tabTitle.split('-')[1]) - 1;
  this.activeTab = activeTab;
}



mappingValue() {
  this.jiraRemarks = '';
  this.dataService.loading.next(true);
  const allTeams = this.dataService.getTeams();
  const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
  const kibanaURL = selectedTeam['kibanaURL']
    ? selectedTeam['kibanaURL']
    : 'NA';
  const jobDetails = {};
  jobDetails['run_id'] = null;
  jobDetails['tagName'] = this.tagRegressionName;
  jobDetails['isTagEdited'] = this.isTagEdited;
  jobDetails['kibanaURL'] = kibanaURL;
  jobDetails['automatedMail'] = this.automatedMail ? 'Y' : 'N';
  // jobDetails['cpuGraph'] = this.cpuGraph ? 'Y' : 'N';
  jobDetails['jira'] = this.updateJira ? {
    update: this.updateJira,
    type: this.jiraUpdateType,
    ueId: this.executionIdUpdate,
  } : {
    update: false,
    type: this.jiraUpdateType,
    ueId: this.executionIdUpdate,
    ...(this.jiraRemarks ? { jiraUnreachable: true, jiraRemarks: this.jiraRemarks } : {}),
  };
  /* added isReviewed flag for Regression Result analysis */
  jobDetails['isReviewed'] = "No";
  jobDetails['startTime'] = new Date().toISOString();
  // jobDetails['regStatus'] = 'in progress';
  // jobDetails['team'] = this.selectedTeam;
  // jobDetails['user'] = this.dataService.getCurrentUser()['username'];
  // jobDetails['totalTC'] = 0;
  // jobDetails['passTC'] = 0;
  // jobDetails['failTC'] = 0;
  // jobDetails['norunTC'] = 0;
  jobDetails['job'] = [];
  // jobDetails['teamName'] = this.selectedTeam;
  const allJobs = this.selectTestCase.toArray();
  const selectedIssueKey = [];
    var labels = [];
  for (let index = 0; index < this.selectedTestbeds.length; index++) {
    const job = allJobs[0];

    const jobData: any = job.onRunClicked('SN', this.selectedTestbeds[index]);
    const jobStartTime = jobData['jobStartTime'] ? new Date(jobData['jobStartTime']) : new Date();
    const jobTimeRequired = Number(jobData['timeRequired']) || 0;
    const jobEstimatedEndDate = new Date(jobStartTime.getTime() + (jobTimeRequired + this.bufferTime) * 60 * 1000);
    console.log("jobEstimatedEndDate", jobEstimatedEndDate.toISOString());
    jobData['estimatedEndTime'] = jobEstimatedEndDate.toISOString();
    // jobData.job['job_id']=jobData.job['job_id']+"_"+"0"+(index+1)
    // jobDetails['totalTC'] += jobData.job['totalTC'];
    // jobDetails['norunTC'] += jobData.job['totalTC'];
    jobDetails['job'].push(jobData);
  }
    jobDetails['run_id']=null
      this.sub2 = this.testLabService.saveRegressionData( jobDetails).subscribe(

        data => {
          if (data && data['_id']) {
            this.dataService.loading.next(false);
            this.dataService.selectedRegressionData.next(data);
            this.router.navigate([`pages/regression/detail/${data['_id']}`], { state: { fromScreen: 'view' } });
          }
        },
        err => {
          console.log(err);
          this.dataService.loading.next(false);
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
          } else {
            this.snackBar.open(err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.', 'Try Again', { duration: 5000 });
          }
        }
      );
    
}

// Generate Run ID
generateSummaryName(regressionData, startTime) {
  let runId = '';
  if (regressionData) {
    runId = regressionData.job[0].module + '_' + regressionData.job[0].regressionType + '_' +this.dataService.getCurrentUser()['username'] + '_' +
      regressionData.job[0].schedulerType + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
  }
  return runId;
}

  private hasCommonNonSharedDevices(): boolean {
     if (!this.selectedTestbeds || this.selectedTestbeds.length <= 1) {
    return false;
  }
    const allJobs = this.selectTestCase.toArray();
    const deviceIdCount: { [deviceId: string]: { count: number, testbeds: string[] } } = {};
    
    this.selectedTestbeds.forEach(tb => {
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

/**
 * Invoked After Run Button Clicked
 */

onRunClicked() {
  if (this.hasCommonNonSharedDevices()) {
    return;
  }
  this.tagRegressionName=""
  console.log('this.selectTestCase', this.selectTestCase);
  
  let jobsList = this.selectTestCase.toArray();
  let multiIteration = false;
  let multiJob = jobsList.length > 1; 
  for (let index = 0; index < jobsList.length; index++) {
    if (jobsList[index].noIterations && jobsList[index].noIterations > 1) {
      multiIteration = true;
      break;
    }
  }
  // let devName=jobsList[0].allDevices.find((dev)=>dev._id==jobsList[0].selectedTestBedsList[0].dutId)
  // this.tagRegressionName= devName?.deviceName+(devName["CM Firmware Version"]!=undefined?"_"+devName["CM Firmware Version"]+"_":"_NA_")+ (devName["deviceFWVersion"] != undefined ? "_" + devName["deviceFWVersion"] + "_" : "_NA_") + jobsList[0].checkedTestsuite[0].testSuiteName.split(' ').join('_').split('_')[0];
  let devName = jobsList[0].allDevices.find((dev) => dev._id == jobsList[0].selectedTestBed[0].dutId);
   let ontModel = null;
    if(jobsList[0].selectedTestBed[0].testBedName.indexOf('XGSPON') !== -1 && devName && devName['ONT Model (if XGSPON)']){
      ontModel = devName['ONT Model (if XGSPON)'];
    }
  let tfwNodes = [];
    if (jobsList?.[0]?.selectedTestBed?.[0]?.nodes) {
      tfwNodes = jobsList[0].selectedTestBed[0].nodes.filter((node) => node.tfw === true);
    }
    let tfwId = tfwNodes.length > 0 ? tfwNodes[0].deviceId : null;
    let tfwDevice = tfwId ? jobsList[0].allDevices.find((dev) => dev._id == tfwId) : null;
    // Device FW first; use CM Firmware only when Device FW is absent.
    const deviceFwRaw = devName ? devName["deviceFWVersion"] : undefined;
    const deviceFwRawStr = (deviceFwRaw === undefined || deviceFwRaw === null || deviceFwRaw === 'NA') ? '' : String(deviceFwRaw).trim();
    const cmFwRaw = devName ? devName["CM Firmware Version"] : undefined;
    const cmFwRawStr = (cmFwRaw === undefined || cmFwRaw === null) ? '' : String(cmFwRaw).trim();
    const cmFwForTag = (deviceFwRawStr !== '') ? deviceFwRaw : (cmFwRawStr !== '' ? cmFwRaw : 'NA');

    if (tfwDevice) {
      this.tagRegressionName = devName?.deviceName +(ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        (tfwDevice["deviceFWVersion"] != undefined ? tfwDevice["deviceFWVersion"] + "_" : "NA_") +
        jobsList[0].checkedTestsuite[0].testSuiteName.split(' ').join('_').split('_')[0];
    } else {
      this.tagRegressionName = devName?.deviceName + (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        jobsList[0].checkedTestsuite[0].testSuiteName.split(' ').join('_').split('_')[0];
    }
    
  if (multiIteration && multiJob) {
    this.tagRegressionName += "_ITR_MJ"; 
  } else if (multiIteration) {
    this.tagRegressionName += "_ITR";
  } else if (multiJob) {
    this.tagRegressionName += "_MJ";
  }
  if (this.selectedTestbeds.length > 1) {
    this.tagRegressionName += "_MJ";
  }
  if(this.jira_project_id_flag == false){
    this.updateJira = false;
  }
  if (this.selectedTeam) {
    const dialogRefAdd = this.dialog.open(TagRegressionComponent, {
      data: {
        name: this.tagRegressionName,
        updateJira: this.updateJira
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
    this.dataService.loading.next(false);
    this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
  }
}

/**
 * Validate the datas for the regression
 * @param event .
 */

  isValid(event) {
    this.selectedDevices = [];
    this.validationList[event['index']] = event['valid'];
    this.selectedTestbeds = event['testbed'];
    event['testbed'].forEach(element => {
      const devices = element['nodes'].map((node) => node.deviceId);
      this.selectedDevices.push(devices);
    });

    this.selectedTestbeds = _.cloneDeep(this.selectedTestbeds);
    this.selectedDevices = _.cloneDeep(this.selectedDevices);
    this.disableRegressionButton = event['valid'];
    this.disableScheduleLater = event['scheduleLater'];
   // this.disableButton();
  }

ngOnDestroy() {
  if (this.sub1) {
    this.sub1.unsubscribe();
  }
  if (this.sub2) {
    this.sub2.unsubscribe();
  }
}

scheduleNow() {
  if (this.updateJira) {
    console.log('inside if in schedule now');
    this.validateJiraUser('SN');
  } else {
    console.log('inside else in schedule now');
    this.onRunClicked();
  }
}

  validateJiraUser(scheduleType) {
    if (this.hasCommonNonSharedDevices()) {
      return;
    }
  if(this.dataService.getCurrentUser()['validJiraUser']){
    console.log('inside if in validate jira user');
    this.checkJiraTCs(scheduleType);
  } else if(this.dataService.getCurrentUser()['jiraReachable'] === true && this.dataService.getCurrentUser()['validJiraUser'] === false){
    this.showConfirmationPopup('You are not a valid Jira DCC Project user, So Jira Test Execution update will not happen. Do you want to schedule regression ?','validateJiraUser', scheduleType);
  }
  else if(this.dataService.getCurrentUser()['jiraReachable'] === false ){
    this.showConfirmationPopup('Jira Instance is not reachable, So Jira Test Execution update will not happen. Do you want to schedule regression ?','jiraReachable', scheduleType);
  }
}

private checkJiraTCs(scheduleType) {
  const allJobs = this.selectTestCase.toArray();
  console.log('all jobs in quick scheduler', allJobs);
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
    }else if(tempTcData.length === 0){
      this.updateJira = false;
      allNonJiraTcs ++;
    } else {
      validJobs++;
    }
  }
  // show popup
  if(allNonJiraTcs >= 1){
    this.showConfirmationPopup('The current scheduled regression got no automated Testcases which are part of Jira Test Cases, Do you want to continue scheduling regression without Jira update ?', 'checkJiraTCs', scheduleType);
  } else if (fewNonJiraTcs >= 1) {
    this.showConfirmationPopup('The current scheduled regression got few automated Testcases which are not part of Jira Test Cases, Do you want to continue scheduling regression ?', 'checkJiraTCs', scheduleType);
  } else if( validJobs === allJobs.length){
    if(scheduleType === 'SN'){
      this.onRunClicked();
     } else if (scheduleType === 'SL'){
       this.scheduleLaterExecution();
     }
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
                  if(next === 'validateJiraUser') {
                    this.updateJira = false;
                  }else if (next === 'jiraReachable'){ 
                    this.updateJira = false;
                  }
                  if (scheduleType === 'SN'){
                   // this.validateExecutionId(scheduleType);
                   this.onRunClicked();
                  } else if (scheduleType === 'SL') {
                    this.scheduleLaterExecution();
                  }
                } 
            });
  }

/**
 * Schedule Later Regression Function
 */
scheduleLater() {
  if(this.jira_project_id_flag == false){
    this.updateJira = false;
  }
  if (this.updateJira) {
    this.validateJiraUser('SL');
  }else {
    this.scheduleLaterExecution();
  }
}

  scheduleLaterExecution() {
    if (this.hasCommonNonSharedDevices()) {
      return;
    }
  if (this.selectedTeam) {
    const allTeams = this.dataService.getTeams();
    const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
    const kibanaURL = selectedTeam['kibanaURL']
      ? selectedTeam['kibanaURL']
      : 'NA';
    const jobDetails = {};
    jobDetails['run_id'] = null;
    jobDetails['kibanaURL'] = kibanaURL;
    jobDetails['automatedMail'] = this.automatedMail ? 'Y' : 'N';
    // Jira details
    jobDetails['jira'] = {
      update: this.updateJira,
      type: this.jiraUpdateType,
      // ueId: this.executionIdUpdate,
    };
    /* added isReviewed flag for Regression Result analysis */
    jobDetails['isReviewed'] = "No";
    // jobDetails['cpuGraph'] = this.cpuGraph ? 'Y' : 'N';
    jobDetails['startTime'] = new Date().toISOString();
    jobDetails['job'] = [];
    jobDetails['tagName'] = "";
    jobDetails['isTagEdited'] = false;
    // jobDetails['teamName'] = this.selectedTeam;
    const allJobs = this.selectTestCase.toArray();
    const selectedTestbeds = [];
    const totalTimeRequired = [];
  for (let index = 0; index < this.selectedTestbeds.length; index++) {
    const job = allJobs[0];
    const jobData = job.onRunClicked('SL', this.selectedTestbeds[index]);
    // jobData.job['job_id']=jobData.job['job_id']+"_"+"0"+(index+1)
      selectedTestbeds.push(jobData['testbed']);
      totalTimeRequired.push(jobData['timeRequired']);
      // jobDetails['totalTC'] += jobData.job['totalTC'];
      // jobDetails['norunTC'] += jobData.job['totalTC'];
      jobDetails['job'].push(jobData);
    }

  jobDetails['run_id']=null
    const maxTimeRequired = _.max(totalTimeRequired);
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
        allJobs:this.selectTestCase.toArray(),
        quickScheduler: true,
        updateJira: this.updateJira
      },
      minHeight: 100,
      minWidth: 500,
    });
  } else {
    this.dataService.loading.next(false);
    this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
  }
}

checkJiraTeam(){
  if(this.jira_project_id_flag == false){
    setTimeout(() => {
      this.updateJira = false;
    }, 3000);
  }
}

}
