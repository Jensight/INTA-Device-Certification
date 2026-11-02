import { DataService } from './../../../../@core/services/data.service';
import { Component, OnInit, Input } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { Router, ActivatedRoute } from '@angular/router';
import { TestLabService } from '../../../../@core/services/test-lab.service';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegressionDeleteComponent } from '../../../../@shared/components/regression-delete/regression-delete.component';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { RegressionListComponent } from '../regression-list.component';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';

@Component({
    selector: 'app-action-buttons',
    styleUrls: ['./action-buttons.component.scss'],
    templateUrl: './action-buttons.component.html'
})
export class ActionButtonsComponent implements OnInit {
    @Input()
    value: any;
    @Input()
    rowData: any;
    @Input()
    startdt: any;
    @Input()
    enddt: any;
    showReRun = false;
    showReRunForPass: boolean = false;
    deleteRegressionValue: boolean = false;
    isDynamicRegression: boolean = false;
    sub1: any;
    sub: any;
    sub2: any;
    sub3: any;
    sub4: any;
    sub5: any;
    sub6: any;
    sub7: any;
    selectedTeam: any;
    userListData: any;
    currentUser: any;
    startDate: any;
    endDate: any;
    isScheduledRegression = true;
    isnoRunRegression = false;
    allDevices: any[] = [];
    allTestbed: any[] = [];
    // Add the static componentInit method here
    static componentInit(instance: ActionButtonsComponent, cell: Cell, startdt?: any, enddt?: any): void {
        const rowData = cell.getRow().getData();
        instance.rowData = rowData;
        instance.value = cell.getValue();

        if (startdt) {
            instance.startdt = startdt;
        }
        if (enddt) {
            instance.enddt = enddt;
        }
    }
    loggedinUser: any;
    bufferTime: number = 0;
    constructor(
        private dataService: DataService,
        private router: Router,
        private dialog: MatDialog,
        private activatedRoute: ActivatedRoute,
        private tlService: TestLabService,
        private snackBar: MatSnackBar,
        private testbedService: TestBedService,
        private dInventoryService: DeviceInventoryService,

    ) {
         this.sub5 = this.dataService.getTestBed().subscribe((tb) => {
                    if (tb) {
                        this.allTestbed = tb;
                        //this.checkTestbedStatus();
                    } else {
                        this.testbedService.getTestBed().subscribe((data: any) => {
                            this.dataService.getTestBedData().next(data);
                            this.dataService.getTestBed().subscribe(tb => {
                               
                                if (tb) {
                                    this.allTestbed = _.cloneDeep(tb);
                                }
                            });
                        });
                    }
                },  err =>{
                    console.log(err);
                });
        
                this.sub6 = this.dataService.getAllDevices().subscribe((device) => {
                    if (device) {
                        this.allDevices = device;
                    } else {
                        this.sub7=this.dInventoryService.getAllData().subscribe((data: any) => {
                            if (data) {
                                this.dataService.getDeviceInventoryData().next(data);
                                this.dataService.getAllDevices().subscribe(devices => {
                                if (devices) {
                                    this.allDevices = _.cloneDeep(devices);
                                    //const temp =  _.cloneDeep(devices);
                                }
                            });
                            }
                        });
                    }
                }, err =>{
                    console.log(err);
                });
    }

    ngOnInit() {
        this.dataService.fetchSystemConfig();
        this.dataService.systemConfig.subscribe(config => {
            if (config && config.additional_time_for_reservation_value) {
                this.bufferTime = Number(config.additional_time_for_reservation_value) || 0;
                // console.log(this.bufferTime, "Buffer Time");

            }
        });
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        if (this.rowData['failTC'] && this.rowData['failTC'] > 0) {
            this.showReRun = true;
        }
        if (this.rowData['regStatus'] && this.rowData['regStatus'] != 'in progress' && this.rowData['regStatus'] != 'Scheduled'
            && this.rowData['regStatus'] != 'NotExecuted'
        ) {
            this.showReRunForPass = true;
        }
        if (this.rowData['regStatus'] && (this.rowData['regStatus'] == 'Scheduled')) {
            this.isScheduledRegression = false;
        }
        if (this.rowData['regStatus'] && (this.rowData['regStatus'] == 'stopped' || this.rowData['regStatus'] == 'aborted' || this.rowData['regStatus'] == 'in progress')) {
            this.showReRun = false;
        }
        if (this.rowData['regStatus'] && (this.rowData['regStatus'] == 'NotExecuted')) {
            this.isnoRunRegression = true;
        }
        if (this.rowData['dynamicTagName'] || (this.rowData['tagName'] && this.rowData['tagName'].endsWith('_DYN'))) {
            this.isDynamicRegression = true;
        }
        this.deleteRegressionValue = this.dataService.deleteActions();
    }

    viewDetails() {
        // console.log("rowdata in actions>>>>>", this.rowData);
        const jobId = this.rowData['firstJobId'];
        const runId = this.rowData['reg_download_id'];
        
        if (jobId) {
            this.tlService.viewHTMLLogsForJob(jobId, runId);
        } else {
            this.tlService.getRegression(this.rowData['_id']).subscribe((regData: any) => {
                if (regData && regData.job && regData.job.length > 0 && regData.job[0].job_id) {
                    this.tlService.viewHTMLLogsForJob(regData.job[0].job_id, runId);
                }
            }, (err) => {
                console.error('Error fetching regression data:', err);
            });
        }
        // this.dataService.selectedRegressionData.next(null)
        // this.router.navigate(['../detail/' + this.rowData['_id']], { relativeTo: this.activatedRoute });
    }
deleteRegressionevent(){
    this.loggedinUser = this.dataService.getCurrentUser();
    console.log('loggedinUser', this.loggedinUser);
    if (this.rowData['user'] !== this.loggedinUser.username && !(this.loggedinUser.username === "sysadmin")) {
        this.dialog.open(RegressionDeleteComponent, {
            width: '400px',
            data: {
                name: 'Regression',
                successText: `Selected Regression is owned by other user. you don't have permission to delete this Regression.`,
                action: 'Delete',
                alert: true
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
    } else {
        const dialogRef = this.dialog.open(RegressionDeleteComponent, {
            width: '400px',
            data: {
                name: 'Regression',
                successText: `Deleting will remove the Regression List and this action can't be reversed.
                                Are you want to Proceed?`,
                action: 'Delete',
                alert: false
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub4 = dialogRef.afterClosed().subscribe((result: any) => {
            if (result === true) {
                this.deleteRegression();
            }
        });
    }
}

    deleteRegression() {
    console.log("row data", this.rowData);
    const startDate = moment(this.startdt).format('YYYY-MM-DDTHH:mm:ss');
    const endDate = moment(this.enddt).format('YYYY-MM-DDTHH:mm:ss');
    const data = {
        startDate: startDate,
        endDate: endDate,
        regId: this.rowData['_id']
    }
        
        
        this.dataService.loading.next(true);
        this.sub3 = this.tlService.deleteRegression(data).subscribe(
            (d: any) => {
                if (d) {
                    this.snackBar.open('Regression Deleted Successfully', 'ok', { duration: 5000 });
                    this.dataService.getRegressionData().next(d);
                } else {
                    this.snackBar.open('Failed Deleting Regression.', 'Try Again', { duration: 5000 });
                }
                this.dataService.loading.next(false);
            },
            (e: any) => {
                this.snackBar.open('Failed Deleting Regression.', 'Try Again', { duration: 5000 });
                this.dataService.loading.next(false);
            }
        );
    }

    downloadLog() {
        if (
            this.rowData.reg_download_id &&
            this.rowData.reg_download_id !== '' &&
            this.rowData.reg_download_id !== 'null'
        ) {
            this.tlService.downloadLogsForWholeRegression(this.rowData['reg_download_id']);
        } else {
            this.tlService.downloadLogsForWholeRegression(this.rowData['run_id']);
        }
    }

    reRunJob:boolean = false;
    
    /**
     * Fetch fresh testbeds, check for inactive testbeds in all jobs, then execute callback if all active
     */
    private checkTestbedsAndExecute(onSuccess: (latestTestbedData: any[], fullRegression: any) => void): void {
        this.testbedService.getTestBed().subscribe(
            (latestTestbedData: any) => {
                this.allTestbed = latestTestbedData;
                this.dataService.getTestBedData().next(latestTestbedData);
                this.sub2 = this.tlService.getFullRegression(this.rowData['_id']).subscribe(
                    (fullRegression: any) => {
                        if (!fullRegression) {
                            this.dataService.loading.next(false);
                            return this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
                        }
                        // Get unique inactive testbed names
                        const inactiveNames = [...new Set((fullRegression['job'] || [])
                            .filter((job: any) => job?.testbed)
                            .map((job: any) => {
                                const { _id: id, testBedName: name } = typeof job.testbed === 'object' ? job.testbed : { _id: job.testbed, testBedName: '' };
                                const tb = latestTestbedData.find((t: any) => t._id === id || t.testBedName === name);
                                return tb?.status === 'inactive' ? (tb.testBedName || name || 'Unknown') : null;
                            })
                            .filter(Boolean)
                        )];
                        
                        if (inactiveNames.length) {
                            this.dataService.loading.next(false);
                            return this.snackBar.open(`Cannot rerun regression. The following testbed(s) are inactive: ${inactiveNames.join(', ')}. Please activate the testbed(s) to schedule the regression.`, 'OK', { duration: 10000 });
                        }
                        onSuccess(latestTestbedData, fullRegression);
                    },
                    () => { this.dataService.loading.next(false); this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 }); }
                );
            },
            () => { this.dataService.loading.next(false); this.snackBar.open('Cannot rerun. Unable to verify testbed status.', 'OK', { duration: 10000 }); }
        );
    }

    rerunRegression() {
        this.dataService.loading.next(true);
        this.checkTestbedsAndExecute((_, fullRegression) => {
            this.executeRerunRegression(fullRegression);
        });
    }
    
    executeRerunRegression(fullRegression: any) {
                    let startTime=new Date()
                    let day=new Date(startTime)
                    let date=day.getDate().toString().padStart(2, '0')
                    let month=(day.getMonth()+1).toString().padStart(2, '0')
                    let shortYear = day.getFullYear().toString()
                    let twoDigitYear = shortYear.substring(shortYear.length-2)
                    let formatdate=date+month+twoDigitYear
                    let time=day.toISOString().split("T")[1]
                    const oldRegressionData = _.cloneDeep(fullRegression);
                    const newRegression = _.cloneDeep(fullRegression);
                    console.log('oldRegressionData => ', oldRegressionData);
                    console.log('newRegression => ', newRegression);
                    delete newRegression['sNo'];
                    delete newRegression['_id'];
                    newRegression['job'] = [];
                    let totalTC = 0;
                    const oldJobs = oldRegressionData['job'];
                    const selectedIssueKey: any[] = [];
                    var labels: any[] = [];
                    const newJobs = oldJobs.forEach((job: any) => {
                        // Resolve DUT firmware fresh for this rerun: Device FW first, use CM Firmware only when Device FW is absent.
                        const rerunTestBed = job.testbed && job.testbed.nodes ? job.testbed : _.find(this.allTestbed, { _id: job.testbed });
                        const rerunDutDevice: any = rerunTestBed ? _.find(this.allDevices, { _id: rerunTestBed.dutId }) : null;
                        let resolvedDutFw = job.firmwareVersion;
                        if (rerunDutDevice) {
                            const deviceFwRerun = rerunDutDevice['deviceFWVersion'];
                            const deviceFwRerunStr = (deviceFwRerun === undefined || deviceFwRerun === null || String(deviceFwRerun).trim().toUpperCase() === 'NA') ? '' : String(deviceFwRerun).trim();
                            const cmFwRerun = rerunDutDevice['CM Firmware Version'];
                            const cmFwRerunStr = (cmFwRerun === undefined || cmFwRerun === null) ? '' : String(cmFwRerun).trim();
                            resolvedDutFw = (deviceFwRerunStr !== '') ? deviceFwRerun : (cmFwRerunStr !== '' ? cmFwRerun : 'NA');
                        }
                        if (job['failTC'] && Number(job['failTC']) > 0 && this.reRunJob == false) {
                            const failedTC = _.filter(job['onExecution'], data => data.tcStatus === 'Fail');
                            let tcArr: any[] = []
                            failedTC.forEach(tc => {
                                tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                            });
                            totalTC += tcArr.length;
                            const jobData = _.cloneDeep(job);
                            jobData['onExecution'] = tcArr;
                            let jobarr = jobData['job_id'].split('_');
                            let index = jobarr.pop();
                            jobarr.pop();
                            jobarr.push(formatdate + '' + time.replace(/T/g, '').replace(/:|\.|Z/g, ''));
                            jobarr.push(index);
                            jobData['job_id'] = null; //jobarr.join("_")
                            // jobData['totalTC'] = tcArr.length;
                            // jobData['passTC'] = 0;
                            // jobData['failTC'] = 0;
                            // jobData['norunTC'] = tcArr.length;
                            jobData['testbed']=jobData['testbed']._id
                            delete jobData['totalTC']
                            delete jobData['passTC'] 
                            delete jobData['failTC']
                            delete jobData['norunTC']
                            delete jobData['warnTC']
                            delete jobData['abortTC']
                            delete jobData['excludedTC']
                            delete jobData['preExecution']
                            delete jobData['postExecution']
                            delete jobData['testbedData']
                            delete jobData['teamName']
                            delete jobData['dutId'] 
                            delete jobData['errorCodes']
                            delete jobData['htmlFolderPath'];
                            delete jobData['jobEndTime'];
                            delete jobData['jobHtmlFilePath'];
                            delete jobData['jobStartTime'];
                            delete jobData['jobTextFilePath'];
                            delete jobData['tcHtmlFilePath'];
                            delete jobData['tcTextFilePath'];
                            delete jobData['textFolderPath'];
                            delete jobData['job_status'];
                            delete jobData['compeletedIteration'];
                            delete jobData['comment'];
                            jobData['endPointFWs'] = [];
                            const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                            const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                                ? selectedTestBed.nodes.filter((node: any) => node.tfw === true)
                                : [];

                            tfwEnabledNodes.forEach((node: any) => {
                                const device = _.find(this.allDevices, { _id: node.deviceId });
                                if (device) {
                                    jobData['endPointFWs'].push({
                                        device: device.deviceName,
                                        model: device.model,
                                        fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                                    });
                                    console.log('jobData[\'endPointFWs\'] action', jobData['endPointFWs']);

                                }
                            });
                            const devices = this.allDevices;
                            console.log('devices', devices);
                            const currentDutDevice: any = _.find(devices, { _id: selectedTestBed.dutId });
                            console.log('currentDutDevice', currentDutDevice);
                            if (
                                currentDutDevice &&
                                currentDutDevice['ONT Model (if XGSPON)'] &&
                                currentDutDevice['ONT Model (if XGSPON)'] !== 'NA'
                            ) {
                                jobData['ontModel'] = currentDutDevice['ONT Model (if XGSPON)'];
                                console.log('jobData[\'ontModel\']', jobData['ontModel']);

                            } else {
                                if (jobData.hasOwnProperty('ontModel')) {
                                    delete jobData['ontModel'];
                                }
                            }
                            jobData['firmwareVersion'] = resolvedDutFw;
                            newRegression['job'].push(jobData);
                        } else if (this.reRunJob == true) { /*if(job['passTC'] && Number(job['passTC']) > 0 && job['failTC'] == 0)*/
                            var passedTC: any = _.filter(job['onExecution'], data => data.tcStatus === 'Pass');
                            var failedTC: any = _.filter(job['onExecution'], data => data.tcStatus === 'Fail');
                            var norunTC: any = _.filter(job['onExecution'], data => data.tcStatus === 'NoExec' || data.tcStatus === 'in progress' || data.tcStatus === 'in que');

                            var allTC = [] = [...passedTC, ...failedTC, ...norunTC]
                            let tcArr: any[] = []
                            //     allTC.forEach(tc => {
                            //    tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                            //     });

                            job['onExecution'].forEach((tc: any) => {
                                tcArr.push({ tcId: tc._id, suiteId: tc.testSuiteId, jiraKey: tc.jiraKey })
                                if (tc.jiraKey) {
                                    selectedIssueKey.push(tc.jiraKey);
                                }

                            });
                            if(job.testBedName){
                                labels.push(job.testBedName.replace(/ /g,"_"));
                            }
                            if(job.modelName){
                                labels.push(job.modelName.replace(/ /g,"_"));
                            }
                            
                            if(job.environment_type){
                              labels.push(job.environment_type.replace(/ /g,"_"));
                            }
                            if(resolvedDutFw){
                              labels.push(String(resolvedDutFw).replace(/ /g,"_"));
                            }
                            
                            console.log('All Test Case ', allTC);
                            // totalTC += allTC.length;
                            const jobData = _.cloneDeep(job);
                            jobData['onExecution'] = tcArr;

                            console.log("jobData['onExecution']>>>>>>", jobData['onExecution']);

                            let jobarr = jobData['job_id'].split('_')
                            let index = jobarr.pop()
                            jobarr.pop()
                            jobarr.push(formatdate + "" + time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                            jobarr.push(index)
                            jobData['job_id'] = null; //jobarr.join("_")
                            // jobData['totalTC'] = failedTC.length;
                            // jobData['passTC'] = 0;
                            // jobData['failTC'] = 0;
                            // jobData['norunTC'] = failedTC.length;
                            jobData['testbed'] = jobData['testbed']._id
                            delete jobData['totalTC']
                            delete jobData['passTC']
                            delete jobData['failTC']
                            delete jobData['norunTC']
                            delete jobData['warnTC']
                            delete jobData['abortTC']
                            delete jobData['excludedTC']
                            delete jobData['preExecution']
                            delete jobData['postExecution']
                            delete jobData['testbedData']
                            delete jobData['teamName']
                            delete jobData['dutId']
                            delete jobData['errorCodes']
                            delete jobData['htmlFolderPath'];
                            delete jobData['jobEndTime'];
                            delete jobData['jobHtmlFilePath'];
                            delete jobData['jobStartTime'];
                            delete jobData['jobTextFilePath'];
                            delete jobData['tcHtmlFilePath'];
                            delete jobData['tcTextFilePath'];
                            delete jobData['textFolderPath'];
                            delete jobData['job_status'];
                            delete jobData['compeletedIteration'];
                            delete jobData['comment'];
                            jobData['endPointFWs'] = [];
                            const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                            const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                                ? selectedTestBed.nodes.filter((node: any) => node.tfw === true)
                                : [];

                            tfwEnabledNodes.forEach((node: any) => {
                                const device = _.find(this.allDevices, { _id: node.deviceId });
                                if (device) {
                                    jobData['endPointFWs'].push({
                                        device: device.deviceName,
                                        model: device.model,
                                        fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                                    });
                                    console.log('jobData[\'endPointFWs\'] action', jobData['endPointFWs']);

                                }
                            });
                            const devices = this.allDevices;
                            console.log('devices', devices);
                            const currentDutDevice: any = _.find(devices, { _id: selectedTestBed.dutId });
                            console.log('currentDutDevice', currentDutDevice);
                            if (
                                currentDutDevice &&
                                currentDutDevice['ONT Model (if XGSPON)'] &&
                                currentDutDevice['ONT Model (if XGSPON)'] !== 'NA'
                            ) {
                                jobData['ontModel'] = currentDutDevice['ONT Model (if XGSPON)'];
                                console.log('jobData[\'ontModel\']', jobData['ontModel']);

                            } else {
                                if (jobData.hasOwnProperty('ontModel')) {
                                    delete jobData['ontModel'];
                                }
                            }
                            jobData['firmwareVersion'] = resolvedDutFw;
                            newRegression['job'].push(jobData);
                        }
                    });
                    delete newRegression['teamName']
                    delete newRegression['team']
                    delete newRegression['regStatus']
                    delete newRegression['user']
                    delete newRegression['totalTC']
                    delete newRegression['passTC']
                    delete newRegression['failTC']
                    delete newRegression['norunTC']
                    delete newRegression['warnTC']
                    delete newRegression['excludedTC']
                    delete newRegression['jiraRemarks']
                    delete newRegression['comment']
                        let oldReg=oldRegressionData['run_id'].split("_")
                        oldReg.pop()
                        oldReg.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                        newRegression['run_id'] = null; //oldReg.join("_");
                    newRegression['startTime'] = startTime.toISOString();                  
                    newRegression['parentReg'] = oldRegressionData['run_id'];
                    newRegression['isReviewed'] = "No";
                   
                  
                    newRegression.job.forEach((job: any) => {

                        if( job['jira'] && job['jira']['update']=== true  ) {
                            job['jira']['key'] = "";
                            job['jira']['ueId'] = "";
                            job['jira']['reRun'] = true;
                            if (job['jira'] && job['jira'].hasOwnProperty('jiraUnreachable')) {
                                delete job['jira']['jiraUnreachable'];
                            }
                            if (job['jira'] && job['jira'].hasOwnProperty('tests')) {
                                delete job['jira']['tests'];
                              }
                              if (job['jira'] && job['jira'].hasOwnProperty('regType')) {
                                delete job['jira']['regType'];
                            }
                                if (job['jira'] && job['jira'].hasOwnProperty('labels')) {
                                    delete job['jira']['labels'];
                                }
                                 
                               if (job['jira'] && job['jira'].hasOwnProperty('fewNonJiraTCs')) {
                                   delete job['jira']['fewNonJiraTCs'];
                               }
                               if (job['jira'] && job['jira'].hasOwnProperty('nonJiraTCs')) {
                                   delete job['jira']['nonJiraTCs'];
                               }
                                
                           }
                      });
                   
                    const scheduledStartTime = new Date(newRegression['startTime'] || new Date());
                    for (let job of newRegression['job']) {
                        const jobTimeRequired = Number(job.timeRequired) || 0;
                        job.jobStartTime = scheduledStartTime.toISOString();
                        const jobEstimatedEndDate = new Date(scheduledStartTime.getTime() + (jobTimeRequired + this.bufferTime) * 60 * 1000);
                        job.estimatedEndTime = jobEstimatedEndDate.toISOString();
                        console.log(job.estimatedEndTime, "estimatedEndTime");
                    }

                        this.sub = this.tlService.saveRegressionData(newRegression).subscribe(
                            (data: any) => {
                                if (data) {
                                    this.dataService.loading.next(false);
                                    this.dataService.selectedRegressionData.next(data);
                                    this.router.navigate([`pages/regression/detail/${data['_id']}`], { state: { fromScreen: 'view' } });
                                }
                            },
                            err => {
                                this.dataService.loading.next(false);
                                let errorMsg = err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.' ;
                                console.log("err>>>",errorMsg);
                                this.snackBar.open('Regression Failed.'+ errorMsg, 'Try Again', { duration: 5000 });
                            }
                        );
    }

    rerunExcludedRegression(){
        this.dataService.loading.next(true);
        this.checkTestbedsAndExecute((_, fullRegression) => {
            this.executeRerunExcludedRegression(fullRegression);
        });
    }
    
    executeRerunExcludedRegression(fullRegression: any) {
                let startTime=new Date()
                let day=new Date(startTime)
                let date=day.getDate().toString().padStart(2, '0')
                let month=(day.getMonth()+1).toString().padStart(2, '0')
                let shortYear = day.getFullYear().toString()
                let twoDigitYear = shortYear.substring(shortYear.length-2)
                let formatdate=date+month+twoDigitYear
                let time=day.toISOString().split("T")[1]
                const oldRegressionData = _.cloneDeep(fullRegression);
                const newRegression = _.cloneDeep(fullRegression);
                delete newRegression['sNo'];
                delete newRegression['_id'];
                newRegression['job'] = [];
                let totalTC = 0;
                const oldJobs = oldRegressionData['job'];
                console.log('oldJobs => ', oldJobs);
                const newJobs = oldJobs.forEach((job: any) => {
                    console.log('job => ', job);
                    if (job['excludedTC'] && Number(job['excludedTC']) > 0) { 
                        const excludedTC = _.filter(job['onExecution'], data => data.tcStatus === 'Excluded');
                        let tcArr: any[] = []
                        console.log('excludedTC => ', excludedTC);
                        excludedTC.forEach(tc => {
                            tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                        });
                        totalTC += tcArr.length;
                        const jobData = _.cloneDeep(job);
                        jobData['onExecution'] = tcArr;
                        let jobarr=jobData['job_id'].split('_')
                        let index=jobarr.pop()
                        jobarr.pop()
                        jobarr.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                        jobarr.push(index)
                        jobData['job_id']= null; //jobarr.join("_")
                        // jobData['totalTC'] = tcArr.length;
                        // jobData['passTC'] = 0;
                        // jobData['failTC'] = 0;
                        // jobData['norunTC'] = tcArr.length;
                        jobData['testbed']=jobData['testbed']._id
                        delete jobData['totalTC']
                        delete jobData['passTC'] 
                        delete jobData['failTC']
                        delete jobData['norunTC']
                        delete jobData['excludedTC']
                        delete jobData['warnTC']
                        delete jobData['abortTC']
                        delete jobData['preExecution']
                        delete jobData['postExecution']
                        delete jobData['testbedData']
                        delete jobData['teamName']
                        delete jobData['dutId']
                        delete jobData['modelName']
                        delete jobData['errorCodes']
                        delete jobData['htmlFolderPath'];
                        delete jobData['jobEndTime'];
                        delete jobData['jobHtmlFilePath'];
                        delete jobData['jobStartTime'];
                        delete jobData['jobTextFilePath'];
                        delete jobData['tcHtmlFilePath'];
                        delete jobData['tcTextFilePath'];
                        delete jobData['textFolderPath'];
                        delete jobData['job_status'];
                        delete jobData['compeletedIteration'];
                        delete jobData['comment'];
                        jobData['endPointFWs'] = [];
                        const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                        const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                            ? selectedTestBed.nodes.filter((node: any) => node.tfw === true)
                            : [];

                        tfwEnabledNodes.forEach((node: any) => {
                            const device = _.find(this.allDevices, { _id: node.deviceId });
                            if (device) {
                                jobData['endPointFWs'].push({
                                    device: device.deviceName,
                                    model: device.model,
                                    fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                                });
                                console.log('jobData[\'endPointFWs\'] action', jobData['endPointFWs']);

                            }
                        });
                        newRegression['job'].push(jobData);
                        newRegression['jira']['key'] = "";
                        newRegression['jira']['ueId'] = "";
                    } else {
                        this.dataService.loading.next(false);
                        this.snackBar.open('No Excluded Use Case Present.', 'OK', {
                            duration: 5000
                        });
                    }
                })
                delete newRegression['teamName']
                delete newRegression['team']
                delete newRegression['regStatus'] 
                delete newRegression['user']
                delete newRegression['totalTC']
                delete newRegression['passTC'] 
                delete newRegression['failTC']
                delete newRegression['norunTC']
                delete newRegression['excludedTC']
                delete newRegression['warnTC']
                delete newRegression['jiraRemarks']
                delete newRegression['comment']
                let oldReg=oldRegressionData['run_id'].split("_")
                oldReg.pop()
                oldReg.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                newRegression['run_id'] = null; //oldReg.join("_");
                newRegression['startTime'] = startTime.toISOString();                  
                newRegression['parentReg'] = oldRegressionData['run_id'];
                newRegression['isReviewed'] = "No";
                //console.log("newRegression>>>", newRegression)
                newRegression['job'].forEach((job: any) => {

                    if( job['jira'] && job['jira']['update']=== true  ) {
                        job['jira']['key'] = "";
                        job['jira']['ueId'] = "";
                        if (job['jira'] && job['jira'].hasOwnProperty('tests')) {
                            delete job['jira']['tests'];
                          }
                          if (job['jira'] && job['jira'].hasOwnProperty('regType')) {
                            delete job['jira']['regType'];
                        }
                            if (job['jira'] && job['jira'].hasOwnProperty('labels')) {
                                delete job['jira']['labels'];
                            }
                           
                           if (job['jira'] && job['jira'].hasOwnProperty('fewNonJiraTCs')) {
                               delete job['jira']['fewNonJiraTCs'];
                           }
                           if (job['jira'] && job['jira'].hasOwnProperty('nonJiraTCs')) {
                               delete job['jira']['nonJiraTCs'];
                           }
                            
                       }
                   });
                this.sub = this.tlService.saveRegressionData( newRegression).subscribe(
                 (data: any) => {
                    if (data) {
                        this.dataService.loading.next(false);
                        this.dataService.selectedRegressionData.next(data);
                        this.router.navigate([`pages/regression/detail/${data['_id']}`], { state: { fromScreen: 'view' } });
                    }
                }, err => {
                    this.dataService.loading.next(false);
                    let errorMsg = err && err.error && err.error.error ? err.error.error : '' ;
                    console.log("err>>>",errorMsg);
                    this.snackBar.open('Regression Failed.'+ errorMsg, 'Try Again', { duration: 5000 });
                });
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub) {
            this.sub.unsubscribe();
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
    }

     // Generate Run ID
  generateSummaryName(regressionData: any, startTime: any) {
   
    let runId = '';
    if (regressionData) {
      runId = regressionData.job[0].module && regressionData.job[0].module.length > 0 ? regressionData.job[0].module :this.selectedTeam+ '_' + regressionData.job[0].regressionType + '_' + this.dataService.getCurrentUser()['username'] + '_' +
        regressionData.job[0].schedulerType + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
    }
    
    return runId;
  }
  // to run not executed regression
  runNotExecutedRegression() {
 

  }
}
