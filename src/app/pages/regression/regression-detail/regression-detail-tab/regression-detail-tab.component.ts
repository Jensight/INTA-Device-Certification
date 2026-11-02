import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { TestCaseStatusComponent } from './testcase-status/testcase-status.component';
import * as socketIO from 'socket.io-client';
import * as _ from 'lodash';
import { SERVER } from '../../../../models/config';
import { ActivatedRoute, Router } from '@angular/router';
import { TestLabService } from '../../../../@core/services/test-lab.service';
import { DataService } from '../../../../@core/services/data.service';
import { ToolTipDisplayComponent } from '../../../../@shared/components/tooltip-component/tooltip.component';
import { DatePipe, formatDate } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { TagRegressionComponent } from 'src/app/pages/test-lab/configure-jobs/tag-regression/tag-regression.component';
import { StopOptionsComponent } from './stop-options/stop-options.component';
import { ScheduleRegressionComponent } from 'src/app/pages/test-lab/configure-jobs/schedule-regression/schedule-regression.component';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import { UserService } from 'src/app/@core/services/user.service';
import { Console } from 'console';
import { DOMIAN_URL } from 'src/app/models/config';


@Component({
    selector: 'app-regression-tab',
    templateUrl: './regression-detail-tab.component.html',
    styleUrls: ['./regression-detail-tab.component.scss'],
    providers: [DatePipe]
})
export class RegressionDetailTabComponent implements OnInit, OnDestroy, OnChanges {
    stopDisable = true;
    duplicateRegression = {};
    barChart = false;
    chartData = new BehaviorSubject(null);
    number;
    tfwFirmwareVersions: { device: string; firmwareVersion: string }[] = [];
    
    selectedRegressionId;
    tfwFirmwareVersionsString: string;
    selectedTeam;
    @Input()
    jobData:any = {};
    @Input()
    selectedRegression = {};
    reRunDisabled = false;
    firstChange = true;
    noOfJobs;
    editregressionmode:boolean = false;
    editFlagObj:any = {};
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Testcases Found',
        pager: {
            perPage: 5
        },
        mode: 'external',
        hideSubHeader: true,
        actions: {
            add: false,
            edit: this.editregressionmode,
            delete: false,
            position: 'right',
            custom: [
            ]
        },
        columns: {
            displayId: {
                title: 'TC Id',
                type: 'string',
                class: 'text-center',
                width: '115px',
                filter: false
            },
            tcName: {
                title: 'Tc Name',
                type: 'custom',
                class: 'text-center',
                width: '230px',
                filter: false,
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
              ToolTipDisplayComponent.componentInit(instance, cell, 50);
            }
            },
            execStatus: {
                title: 'Status',
                type: 'custom',
                width: '110px',
                class: 'text-center',
                filter: false,
                renderComponent: TestCaseStatusComponent,
                componentInitFunction: (instance: TestCaseStatusComponent, cell: Cell) => {
                    TestCaseStatusComponent.componentInit(instance, cell, this.jobData, this.selectedRegression['regStatus'], this.duplicateRegression['run_id']);
                  }                
            },
            tcStartTime: {
                title: 'Start Time',
                type: 'string',
                width: '155px',
                class: 'text-center',
                filter: false,
                valuePrepareFunction: data => {
                    if(data && data != 'null'){
                    return  formatDate(data, 'dd, MMM ,yyyy h:mm:ss a','en_US')
                    }
                }
            },
            tcStopTime: {
                title: 'End Time',
                type: 'string',
                width: '150px',
                class: 'text-center',
                filter: false,
                valuePrepareFunction: data => {
                    if(data && data != 'null'){
                    return formatDate(data, 'dd, MMM ,yyyy h:mm:ss a','en_US')
                    }
                }
            },
            tcExecTime: {
                title: 'Duration',
                width: '60px',
                sort: false,
                type: 'string',
                filter: false,
                valuePrepareFunction: data => {
                    return (data && data !== 'null') ? new Date(Math.abs(parseFloat(data)) * 1000).toISOString().substring(11, 19) : '';
                }
            }
        }
    };
    private socketIO;
    sub1;
    sub2;
    sub3;
    sub;
    sub4;
    source: LocalDataSource = new LocalDataSource();
    liveLogs = true;
    sub5: any;
    stopButton: any;
    jiraId: any;
    htmlLogPath: any;
    sub12: any;
    sub13: any;
    allTestbed: any;
    allModules: any;
    allTestgroup: any;
    allTestcase: any;
    allTestsuite: any;
    sub6: any;
    allNodes: any;
    sub7: any;
    allDevices: any;
    sub8: any;
    testBedVariables: any;
    sub10: any;
    allAPI: any;
    sub11: any;
    allAPIGroup: any;
    modelSubscription: any;
    allModels: any;
    getRegAllDetails: any;
    regDetail:any;
    errorCode:any;
    bufferTime: number = 0;
    enable_edit_reg_status: boolean = false;
    hasFailedTestCases: boolean = false;
    jira_domain:any;
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private tlService: TestLabService,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private datePipe: DatePipe,
        private dialog: MatDialog,
        private dInventoryService: DeviceInventoryService,
        private testbedService: TestBedService,
        private userService: UserService,
        private testLabService: TestLabService,
    ) {
        this.sub1 = this.route.params.subscribe(param => {
            this.selectedRegressionId = param['id'];
            if (!this.firstChange) {
                // this.routeChange()
            }
            // this.routeChange();
        });
        this.sub2 = this.dataService.selectedTeam.subscribe(data => {
            if (data) {
                this.selectedTeam = data;
            }
        });

        this.dataService.getSettingsData().subscribe((settingsdata: any) => {
            if (!settingsdata) {
                this.userService.getAllusers().subscribe((data: any) => {
                    this.dataService.saveSettingData(data[0]);
                    settingsdata = data;
                });
            }
            this.jira_domain = settingsdata.jiraConfig[0].jiraIP
        });
        this.sub12 = this.dataService.getTestBed().subscribe((tb) => {
            if (tb) {
                this.allTestbed = tb;
                //this.checkTestbedStatus();
            } else {
                this.testbedService.getTestBed().subscribe(data => {
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

        this.sub7 = this.dataService.getAllDevices().subscribe((device) => {
            if (device) {
                this.allDevices = device;
            } else {
                this.sub8=this.dInventoryService.getAllData().subscribe(data => {
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
        this.errorCode = this.dataService.getErrorCodes();
    }
    deleteApiValue:boolean = false;
    pathArray:any = [];
    @Input() regEditFlag;
    ngOnInit(): void {
        this.dataService.fetchSystemConfig();
        this.dataService.systemConfig.subscribe(config => {
            if (config && config.additional_time_for_reservation_value) {
                this.bufferTime = Number(config.additional_time_for_reservation_value) || 0;
                // console.log(this.bufferTime, "Buffer Time");

            }
        });
        if (Array.isArray(this.jobData?.endPointFWs) && this.jobData?.endPointFWs.length > 0) {
            this.tfwFirmwareVersions = this.jobData.endPointFWs.map(endpoint => ({
              device: endpoint.device, firmwareVersion: endpoint.fw 
            }));
            this.tfwFirmwareVersionsString = 
            this.tfwFirmwareVersions.map((endpoint: { device: string; firmwareVersion: string }) => `${endpoint.device} : ${endpoint.firmwareVersion}`).join(', ');
          } 
          else {
            this.tfwFirmwareVersions = [];
          }

        if(!this.jobData['excludedTC']){
            this.jobData['excludedTC'] = 0;
        }
        if(!this.jobData['warnTC']){
            this.jobData['warnTC'] = 0;
        }
        if(!this.jobData['abortTC']){
            this.jobData['abortTC'] = 0;
      }
        const failedTC = _.filter(this.jobData['onExecution'], data => data.tcStatus === 'Fail');
        this.hasFailedTestCases = failedTC.length > 0 ? true : false;
        this.pathArray = this.router.url.split('/');
        // console.log('this.pathArray =. ', this.pathArray);
        this.routeChange();
        this.firstChange = false;
        this.tlService.getFullRegression(this.selectedRegressionId)
        .subscribe((data:any)=>{
            this.getRegAllDetails = data;
            this.regDetail = data;
            this.noOfJobs = data.job.length;
            if(data.jira && data.jira.key) {
                this.jiraId = data.jira.key;
            }

        });

        this.editregressionmode=this.dataService.deleteActions();
        //console.log('customTitle => ', this.regEditFlag)
        //console.log('this.editregressionmode => ', this.editregressionmode)
        if(this.editregressionmode === true && this.regEditFlag == true) {
            //console.log('inside if(this.editregressionmode === true && this.enable_edit_reg_status == true) {');
            this.settings.actions.edit = this.editregressionmode;
            this.settings.actions.custom.push( 
            {
                name: 'Edit',
                title: '<i class="fa fa-pencil" title="edit"></i>'
            });
        }
    }
    ngOnChanges(changes): void {
        this.duplicateRegression = { ...this.selectedRegression };
        // console.log(changes)
        // console.log(this.selectedRegressionId)
        //  console.log(this.jobData)
        // console.log(this.selectedRegression)
        // this.routeChange()
    }

    routeChange() {
        if (this.socketIO) {
            this.socketIO.off('data');
            this.socketIO.disconnect();
        }
        this.socketIO = socketIO.connect(SERVER);
        this.socketIO.on(this.selectedRegressionId, data => {
            this.duplicateRegression = data;
            if (data && data['regStatus'] === 'completed') {
                const failedTC = _.filter(this.jobData['onExecution'], data => data.tcStatus === 'Fail');
                this.hasFailedTestCases = failedTC.length > 0 ? true : false;
                this.stopDisable = true;
            } else {
                this.stopDisable = false;
            }
            if (this.jobData) {
                this.jobData = _.cloneDeep(_.find(data['job'], { job_id: this.jobData['job_id'] }));
                this.log();
                console.log('on execution', this.jobData['onExecution']);
                 this.jobData['onExecution'].forEach(element => {
                                    element.displayId = element.jiraKey ? element.jiraKey : element.tcId 
                });
                this.source.load(this.jobData['onExecution']);
                this.source.refresh();
                if (
                    this.jobData['failTC'] &&
                    Number(this.jobData['failTC']) > 0 &&
                    this.selectedRegression['regStatus'] !== 'completed' 
                ) {
                    this.reRunDisabled = false;
                } else {
                    this.reRunDisabled = true;
                }
                // this.getRegressionData();
            }
        });
        const chartData = [
            { value: this.jobData['passTC'], name: 'Passed' },
            { value: this.jobData['failTC'], name: 'Failed' },
            { value: this.jobData['norunTC'], name: 'No Run' },
            { value: this.jobData['warnTC'], name: 'Warning' },
            { value: this.jobData['abortTC'], name: 'Aborted' },
            { value: this.jobData['excludedTC'], name: 'Excuded'}
        ];
        this.chartData.next(chartData);
        this.jobData['onExecution'].forEach(element => {
            element.displayId = element.jiraKey ? element.jiraKey : element.tcId 
        });
        this.source.load(this.jobData['onExecution']);
        this.source.refresh();
        if (
            this.jobData['failTC'] &&
            Number(this.jobData['failTC']) > 0 &&
            this.selectedRegression['regStatus'] === 'completed'
        ) {
            this.reRunDisabled = false;
        } else {
            this.reRunDisabled = true;
        }

        if (this.selectedRegression['regStatus'] === 'completed' || this.selectedRegression['regStatus'] === 'stopped'|| this.selectedRegression['regStatus'] === 'aborted' || this.selectedRegression['regStatus'] === 'partial'  ) {
            this.liveLogs = true;
        } else {
            this.liveLogs = false;
        }
    }

    log() {
        const chartData = [
            { value: this.jobData['passTC'], name: 'Passed' },
            { value: this.jobData['failTC'], name: 'Failed' },
            { value: this.jobData['norunTC'], name: 'No Run' },
            { value: this.jobData['warnTC'], name: 'Warning' },
            { value: this.jobData['abortTC'], name: 'Aborted' },
            { value: this.jobData['excludedTC'], name: 'Excuded'}
        ];
        this.chartData.next(chartData);
    }

    ngOnDestroy() {
        if (this.socketIO) {
            this.socketIO.off('data');
            this.socketIO.disconnect();
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
        if (this.sub) {
            this.sub.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if(this.sub12) {
            this.sub12.unsubscribe();
        }
    }

    getRegressionData(startDate, endDate) {
        this.sub3 = this.tlService.getRegressionData(startDate, endDate, 'All').subscribe(regressionData => {
            if (regressionData) {
                this.dataService.getRegressionData().next(regressionData);
            }
        });
    }

    downloadJobLogs() {
        this.tlService.downloadExcelLogsForJobs(this.jobData['job_id'], false,this.duplicateRegression['run_id']);
    }

    downloadTcLogs(tc) {
        this.tlService.downloadLogsForTestcase(this.jobData['job_id'], null, null, this.duplicateRegression['run_id']);
    }

    getTimeDifference(start: any, end: any): any {
        const a = new Date(start);
        const b = new Date(end);
        const diffInSecs =  Math.abs(b.getTime() - a.getTime());
        return (new Date(diffInSecs).toISOString().substring(11, 19));
    }

    getDateFormatting(dateVal: any): any {
        
        return formatDate(dateVal, 'dd, MMM ,yyyy h:mm:ss a','en_US')
        //this.datePipe.transform(new Date(dateVal).toLocaleString(), 'dd, MMM ,yyyy h:mm:ss a');
        // const newDate = new Date(dateVal);

        // let sMonth = this.padValue(newDate.getMonth() + 1);
        // let sDay = this.padValue(newDate.getDate());
        // let sYear = newDate.getFullYear();
        // let sHour = newDate.getHours();
        // let sMinute = this.padValue(newDate.getMinutes());
        // let sAMPM = 'AM';

        // let iHourCheck = parseInt(sHour);

        // if (iHourCheck > 12) {
        //     sAMPM = 'PM';
        //     sHour = iHourCheck - 12;
        // }
        // else if (iHourCheck === 0) {
        //     sHour = 12;
        // }

        // sHour = this.padValue(sHour);

        // return sMonth + "-" + sDay + "-" + sYear + " " + sHour + ":" + sMinute + " " + sAMPM;

    }

    getDutName(): string {
        const dutId = this.jobData && this.jobData['dutId'];
        if (!dutId || !this.allDevices) return 'NA';
        const device = _.find(this.allDevices, { _id: dutId });
        return (device && device.deviceName) ? device.deviceName : 'NA';
    }

    /**
     * Comma-separated list of Network Element device names present in the
     * regression's testbed (all testbed nodes apart from the DUT). Falls back
     * to node.deviceName / node.name / node.deviceId when the device isn't
     * resolvable from allDevices.
     */
    getNetworkElements(): string {
        const testbed = this.jobData && this.jobData['testbed'];
        const nodes: any[] = (testbed && Array.isArray(testbed.nodes)) ? testbed.nodes : [];
        if (nodes.length === 0) return 'NA';

        const dutId = this.jobData && this.jobData['dutId'];
        const names: string[] = [];
        nodes.forEach((node: any) => {
            if (!node) return;
            // Skip the DUT node
            if (dutId && node.deviceId && String(node.deviceId) === String(dutId)) return;
            let resolvedName = '';
            if (node.deviceId && this.allDevices) {
                const dev = _.find(this.allDevices, { _id: node.deviceId });
                if (dev && dev.deviceName) resolvedName = dev.deviceName;
            }
            if (!resolvedName) {
                resolvedName = node.deviceName || node.name || node.nodeName || '';
            }
            if (resolvedName) names.push(resolvedName);
        });

        return names.length > 0 ? names.join(', ') : 'NA';
    }
    getTestSuiteList(): string {
        console.log('Fetching test suite list for job:', this.jobData);
        const selectedTCList = this.jobData && this.jobData.onExecution ? this.jobData.onExecution : [];
        const testSuiteList = selectedTCList.map((tc: any) => tc.testSuiteName);
        const uniqueTestSuiteList = Array.isArray(testSuiteList) && testSuiteList.length > 0 ? Array.from(new Set(testSuiteList)) : [];
       return uniqueTestSuiteList && Array.isArray(uniqueTestSuiteList) && uniqueTestSuiteList.length > 0 ? uniqueTestSuiteList.join(', ') : 'NA';
    }

    getOntModelValue(): string {
        const isInvalidValue = (value: any): boolean => {
            if (!value) return true; // handles null, undefined, empty string
            const stringValue = value.toString().toLowerCase().trim();
            return stringValue === 'na' || stringValue === 'null' || stringValue === '';
        };

        // Helper function to check if testbed is XGS-PON
        const isXGSPONTestbed = (testbed: any): boolean => {
            if (!testbed) return false;
            const testbedName = testbed.testBedName || testbed.name || '';
            return testbedName.indexOf('XGSPON') !== -1;
        };
 
        // Only show ONT Model for XGS-PON testbeds
        // First check if current job's testbed is XGS-PON
        if (this.jobData && this.jobData.testbed && !isXGSPONTestbed(this.jobData.testbed)) {
            return null; // Not XGS-PON testbed, don't show ONT Model
        }

        // First check if ontModel exists directly on jobData
        if (this.jobData && this.jobData['ontModel'] && !isInvalidValue(this.jobData['ontModel'])) {
            return this.jobData['ontModel'];
        }
       
        // Then check if it exists in the regression data structure for the current job only
        if (this.getRegAllDetails && this.getRegAllDetails.job && this.getRegAllDetails.job.length > 0) {
            // Find the current job in the regression details
            const currentJob = this.getRegAllDetails.job.find(job => job.job_id === this.jobData.job_id);
            if (currentJob && currentJob.testbed && isXGSPONTestbed(currentJob.testbed) && 
                currentJob.ontModel && !isInvalidValue(currentJob.ontModel)) {
                return currentJob.ontModel;
            }
        }
       
        // Check in nested job structure
        if (this.jobData && this.jobData.job && this.jobData.job[0] && this.jobData.job[0]['ontModel'] && !isInvalidValue(this.jobData.job[0]['ontModel'])) {
            return this.jobData.job[0]['ontModel'];
        }
       
        return null; // Return null if no valid ONT Model found or not XGS-PON testbed
    }
    // padValue(value) {
    //     return (value < 10) ? "0" + value : value;
    // }

    /**
     * Fetch fresh testbed data and check if testbed is inactive before proceeding
     */
    checkTestbedAndProceed(testbedId: string, testbedName: string, onSuccess: () => void): void {
        if (!testbedId && !testbedName) {
            onSuccess();
            return;
        }
        this.testbedService.getTestBed().subscribe(
            (latestTestbedData: any[]) => {
                this.allTestbed = latestTestbedData;
                this.dataService.getTestBedData().next(latestTestbedData);
                const testbed = latestTestbedData.find(tb => tb._id === testbedId || tb.testBedName === testbedName);
                const displayName = testbed?.testBedName || testbedName ;
                if (testbed?.status === 'inactive') {
                    this.dataService.loading.next(false);
                    this.snackBar.open(`Cannot rerun this job. The testbed "${displayName}" is inactive. Please activate the testbed to schedule the regression.`, 'OK', { duration: 10000 });
                    return;
                }
                onSuccess();
            },
            () => {
                this.dataService.loading.next(false);
                this.snackBar.open('Cannot rerun this job. Unable to verify testbed status. Please try again.', 'OK', { duration: 10000 });
            }
        );
    }

    reRunJob: boolean = false
    rerunRegression(ab) {
        this.dataService.selectedRegressionData.next('ReRunClicked');
        this.dataService.loading.next(true);
        let jobdata = _.cloneDeep(this.jobData);
        const isObject = typeof jobdata.testbed === 'object';
        const testbedId = isObject ? (jobdata.testbed?._id || '') : (jobdata.testbed || '');
        const testbedName = isObject ? (jobdata.testbed?.testBedName || '') : '';
        
        // Check if current job's testbed is inactive before proceeding (with fresh data fetch)
        this.checkTestbedAndProceed(testbedId, testbedName, () => {
            this.executeRerunRegression(jobdata);
        });
    }
    
    executeRerunRegression(jobdata: any) {
        let startTime=new Date()
                    let day=new Date(startTime)
                            let date=day.getDate().toString().padStart(2, '0')
                            let month=(day.getMonth()+1).toString().padStart(2, '0')
                            let shortYear = day.getFullYear().toString()
                            let twoDigitYear = shortYear.substring(shortYear.length-2)
                            let formatdate=date+month+twoDigitYear
                            let time=day.toISOString().split("T")[1]
        if ((jobdata['failTC'] && Number(jobdata['failTC']) > 0) || this.reRunJob == true ) {
            this.sub4 = this.tlService.getFullRegression(this.selectedRegressionId).subscribe(
                fullRegression => {
                    if (fullRegression) {
                        console.log("fullRegression>>>",fullRegression);
                        jobdata = _.find(fullRegression['job'], { job_id: this.jobData['job_id'] });

                        const jobDataClone = _.cloneDeep(jobdata);
                        const oldRegressionData = _.cloneDeep(this.selectedRegression);
                        const newRegression = _.cloneDeep(fullRegression);
                        delete newRegression['sNo'];
                        delete newRegression['_id'];
                        newRegression['job'] = [];
                        const selectedIssueKey = [];
                        
                        let totalTC = 0;
                         
                        if(jobdata['failTC'] && Number(jobdata['failTC']) > 0 && this.reRunJob == false){
                            console.log('inside IF');
                            const failedTC = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Fail');
                            let tcArr=[]
                            // Store the first test case's suite name before creating tcArr
                            const firstTestCaseSuiteName = jobdata['onExecution'] && jobdata['onExecution'].length > 0 && jobdata['onExecution'][0].testSuiteName 
                                ? jobdata['onExecution'][0].testSuiteName 
                                : '';
                            failedTC.forEach(tc => {
                                console.log('tc',tc);
                               tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId});
                               if (tc.jiraKey) {
                                selectedIssueKey.push(tc.jiraKey);
                            }
                            });
                            
                            const jobData = _.cloneDeep(jobDataClone);
                            // Preserve the testSuiteName for tag generation
                            if (firstTestCaseSuiteName && tcArr.length > 0 && !tcArr[0].testSuiteName) {
                                tcArr[0].testSuiteName = firstTestCaseSuiteName;
                            }
                            if (typeof jobData.testbed === 'string') {
                                jobData.testbed = JSON.parse(jobData.testbed);
                            }
                            jobData['onExecution'] = tcArr;
                            
                            let jobarr=jobData['job_id'].split('_')
                            let index=jobarr.pop()
                            jobarr.pop()
                            jobarr.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                            jobarr.push(index)
                            jobData['job_id']= null; //jobarr.join("_")
                            // jobData['totalTC'] = failedTC.length;
                            // jobData['passTC'] = 0;
                            // jobData['failTC'] = 0;
                            // jobData['norunTC'] = failedTC.length;
                            jobData['testbed']=jobData['testbed']._id
                            delete jobData['preExecution']
                            delete jobData['postExecution']
                            delete jobData['totalTC']
                            delete jobData['passTC'] 
                            delete jobData['failTC']
                            delete jobData['excludedTC']
                            delete jobData['norunTC']
                            delete jobData['warnTC']
                            delete jobData['abortTC'] 
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
                            delete jobData['textFolderPath'];
                            delete jobData['tcTextFilePath'];
                            delete jobData['job_status'];
                            delete jobData['compeletedIteration'];
                            delete jobData['comment'];
                             jobData['endPointFWs'] = [];
                            // Find all nodes in the selected testbed where tfw is enabled
                            const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                            const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                                ? selectedTestBed.nodes.filter(node => node.tfw === true)
                                : [];

                            tfwEnabledNodes.forEach(node => {
                                const device = _.find(this.allDevices, { _id: node.deviceId });
                                if (device) {
                                    jobData['endPointFWs'].push({
                                        device: device.deviceName,
                                        model: device.model,
                                        fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                                    });
                                    console.log('jobData[\'endPointFWs\']', jobData['endPointFWs']);
                                    
                                }
                            });

                          
                            const devices = this.allDevices;
                            console.log('devices', devices);
                            const currentDutDevice = _.find(devices, { _id: selectedTestBed.dutId });
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

                            newRegression['job'].push(jobData);
                        } else if(this.reRunJob == true){
                            //console.log('inside else if');
                            var passedTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Pass');
                            //const failedTC = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Fail');
                            var failedTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Fail');
                            // var norunTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'NoExec');
                            var norunTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'NoExec' || data.tcStatus ==='in progress' || data.tcStatus === 'in que' );
                            var warnTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Warning');
                            var excludedTC: any = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Excluded')

                            var allTC = [] = [...passedTC, ...failedTC, ...norunTC, ...excludedTC, ...warnTC];
                            let tcArr=[]
                            // Store the first test case's suite name before creating tcArr
                            const firstTestCaseSuiteName = jobdata['onExecution'] && jobdata['onExecution'].length > 0 && jobdata['onExecution'][0].testSuiteName 
                                ? jobdata['onExecution'][0].testSuiteName 
                                : '';
                            // allTC.forEach(tc => {
                            //     tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                            // });
                            jobdata['onExecution'].forEach(tc => {
                                tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                                if (tc.jiraKey) {
                                    selectedIssueKey.push(tc.jiraKey);
                                }
                            });
                            const jobData = _.cloneDeep(jobDataClone);
                            // Preserve the testSuiteName for tag generation
                            if (firstTestCaseSuiteName && tcArr.length > 0 && !tcArr[0].testSuiteName) {
                                tcArr[0].testSuiteName = firstTestCaseSuiteName;
                            }
                            if (typeof jobData.testbed === 'string') {
                                jobData.testbed = JSON.parse(jobData.testbed);
                            }
                            jobData['onExecution'] = tcArr;
                            let jobarr=jobData['job_id'].split('_')
                            let index=jobarr.pop()
                            jobarr.pop()
                            jobarr.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                            jobarr.push(index)
                            jobData['job_id']=null;
                            // jobData['totalTC'] = allTC.length;
                            // jobData['passTC'] = 0;
                            // jobData['failTC'] = 0;
                            // jobData['norunTC'] = allTC.length;
                            jobData['testbed']=jobData['testbed']._id
                            delete jobData['preExecution']
                            delete jobData['postExecution']
                            delete jobData['totalTC']
                            delete jobData['passTC'] 
                            delete jobData['failTC']
                            delete jobData['excludedTC']
                            delete jobData['norunTC']
                            delete jobData['warnTC']
                            delete jobData['abortTC'] 
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
                            delete jobData['textFolderPath'];
                            delete jobData['tcTextFilePath'];
                            delete jobData['job_status'];
                            delete jobData['compeletedIteration'];
                            delete jobData['comment'];
                        jobData['endPointFWs'] = [];
                        const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                        const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                            ? selectedTestBed.nodes.filter(node => node.tfw === true)
                            : [];

                        tfwEnabledNodes.forEach(node => {
                            const device = _.find(this.allDevices, { _id: node.deviceId });
                            if (device) {
                                jobData['endPointFWs'].push({
                                    device: device.deviceName,
                                    model: device.model,
                                    fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                                });
                                console.log('jobData[\'endPointFWs\']', jobData['endPointFWs']);
                                
                            }
                        });

                        // Fix: define devices as this.allDevices
                        const devices = this.allDevices;
                        console.log('devices', devices);
                        const currentDutDevice = _.find(devices, { _id: selectedTestBed.dutId });      
                        console.log('currentDutDevice', currentDutDevice);                         
                        if (
                            currentDutDevice &&
                            currentDutDevice['ONT Model (if XGSPON)'] &&
                            currentDutDevice['ONT Model (if XGSPON)'] !== 'NA'
                        ) {
                            jobData['ontModel'] = currentDutDevice['ONT Model (if XGSPON)'];
                            console.log('jobData[\'ontModel\']', jobData['ontModel']);
                            
                        } else {
                            // Remove ontModel if value is NA or not present
                            if (jobData.hasOwnProperty('ontModel')) {
                                delete jobData['ontModel'];
                            }
                        }
                        newRegression['job'].push(jobData);      
                        console.log("jobdata ont", jobData);
                                         
                        }
                        let oldReg=oldRegressionData['run_id'].split("_")
                        oldReg.pop()
                        oldReg.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
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
                        delete newRegression['comment']
                        newRegression['run_id'] = null; //oldReg.join("_");
                        newRegression['startTime'] = startTime.toISOString();
                        // newRegression['regStatus'] = 'in progress';
                        // newRegression['user'] = this.dataService.getCurrentUser()['username'];
                        // newRegression['totalTC'] = totalTC;
                        // newRegression['passTC'] = 0;
                        // newRegression['failTC'] = 0;
                        // newRegression['norunTC'] = totalTC;
                        newRegression['parentReg'] = oldRegressionData['run_id'];
                        newRegression['isReviewed'] = 'No';
                      
                        let totalIterations = newRegression['job'].reduce((total, job) => total + job.numOfIteration, 0);
                        
                        // Generate tagName based on the specific job being rerun (same logic as configure-jobs)
                        // This ensures the tagName reflects the current job, not the first job from multi-job regression
                        if (newRegression['job'] && newRegression['job'].length > 0) {
                            const currentJob = newRegression['job'][0];
                            const selectedTestBed = currentJob.testbed && currentJob.testbed.nodes 
                                ? currentJob.testbed 
                                : _.find(this.allTestbed, { _id: currentJob.testbed });
                            
                            if (selectedTestBed) {
                                const devName = _.find(this.allDevices, { _id: selectedTestBed.dutId });
                                let ontModel = null;
                                if (selectedTestBed.testBedName && selectedTestBed.testBedName.indexOf('XGSPON') !== -1 && 
                                    devName && devName['ONT Model (if XGSPON)']) {
                                    ontModel = devName['ONT Model (if XGSPON)'];
                                }
                                
                                const tfwNodes = selectedTestBed.nodes ? selectedTestBed.nodes.filter((node) => node.tfw === true) : [];
                                const tfwId = tfwNodes.length > 0 ? tfwNodes[0].deviceId : null;
                                const tfwDevice = tfwId ? _.find(this.allDevices, { _id: tfwId }) : null;
                                
                                // Get first test case's suite name
                                const firstTestSuiteName = currentJob.onExecution && currentJob.onExecution.length > 0 && 
                                    currentJob.onExecution[0].testSuiteName 
                                    ? currentJob.onExecution[0].testSuiteName 
                                    : '';
                                const suitePart = firstTestSuiteName ? firstTestSuiteName.split(' ').join('_').split('_')[0] : '';
                                console.log(suitePart, 'suitepart');
                                
                                if (tfwDevice) {
                                    newRegression['tagName'] = (devName?.deviceName || '') + 
                                        (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
                                        (devName && devName["CM Firmware Version"] != undefined ? "_" + devName["CM Firmware Version"] + "_" : "_NA_") +
                                        (tfwDevice["deviceFWVersion"] != undefined ? tfwDevice["deviceFWVersion"] + "_" : "NA_") +
                                        suitePart;
                                } else {
                                    newRegression['tagName'] = (devName?.deviceName || '') + 
                                        (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
                                        (devName && devName["CM Firmware Version"] != undefined ? "_" + devName["CM Firmware Version"] + "_" : "_NA_") +
                                        suitePart;
                                }
                            } else {
                                newRegression['tagName'] = '';
                            }
                        } else {
                            newRegression['tagName'] = '';
                        }
                        
                        if (newRegression['tagName'] && newRegression['tagName'].includes('_MJ')) {
                            newRegression['tagName'] = newRegression['tagName'].replace('_MJ', '');
                          } 
                        if (newRegression['tagName'] && newRegression['tagName'].includes('_ITR') && totalIterations <= 1) {
                            newRegression['tagName'] = newRegression['tagName'].replace('_ITR', '');
                          } 
                          newRegression['job'].forEach(job => {

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
                            


                        
                        // if ( newRegression['jira']['update']=== true ) {
                          
                        //     let summaryName = this.generateSummaryName(newRegression,  startTime );
                        //     if (newRegression['tagName'] !== '') {
                        //       summaryName = newRegression['tagName']; //+ '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
                        //     }
                        //     const jiraData = { summary: summaryName, tests: selectedIssueKey, team: this.selectedTeam, labels: labels };
                        //     this.testLabService.createJiraTestcase(jiraData).subscribe(
                        //       dataResult => {
                        //         console.log('Jira Create Cycle Success:', dataResult);
                        //         if(dataResult['issueKey']){
                        //             newRegression['jira'].ueId = dataResult['issueId'];
                        //             newRegression['jira'].key = dataResult['issueKey'];
                        //             newRegression['run_id']=this.generateSummaryName(newRegression, startTime);
                        //             this.sub = this.tlService.saveRegressionData(newRegression).subscribe(
                        //                 rerunData => {
                        //                     console.log(rerunData)
                        //                     if (rerunData) {
                                                
                        //                         this.router.navigate([`pages/regression/detail/${rerunData['_id']}`]);
                        //                         this.dataService.selectedRegressionData.next(rerunData);
                        //                         this.dataService.loading.next(false);
                        //                     }
                        //                 },
                        //                 err => {
                        //                     this.dataService.loading.next(false);
                        //                     let errorMsg = err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.' ;
                        //                     this.snackBar.open(errorMsg, 'Try Again', {
                        //                         duration: 5000
                        //                     });
                        //                 }
                        //             );
                        //         }
                        //       },
                        //       err => {
                        //         console.error('Jira Create Cycle Failed:', err);
                        //         this.dataService.loading.next(false);
                        //         this.snackBar.open(err && err.error && err.error.error ? err.error.error : 'Jira Create Cycle Failed.', 'Try Again', { duration: 5000 });
                        //       }
                        //     );
                        //   } else {

                        const scheduledStartTime = new Date(newRegression['startTime'] || new Date());
                        for (let job of newRegression['job']) {
                            const jobTimeRequired = Number(job.timeRequired) || 0;
                            job.jobStartTime = scheduledStartTime.toISOString();
                            const jobEstimatedEndDate = new Date(scheduledStartTime.getTime() + (jobTimeRequired + this.bufferTime) * 60 * 1000);
                            job.estimatedEndTime = jobEstimatedEndDate.toISOString();
                            console.log(job.estimatedEndTime, "estimatedEndTime");
                        }
                            this.sub = this.tlService.saveRegressionData(newRegression).subscribe(
                                rerunData => {
                                    console.log(rerunData)
                                    if (rerunData) {
                                        
                                        this.router.navigate([`pages/regression/detail/${rerunData['_id']}`], { state: { fromScreen: 'view' } });
                                        this.dataService.selectedRegressionData.next(rerunData);
                                        this.dataService.loading.next(false);
                                    }
                                },
                                err => {
                                    this.dataService.loading.next(false);
                                    let errorMsg = err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.' ;
                                    this.snackBar.open(errorMsg, 'Try Again', {
                                        duration: 5000
                                    });
                                }
                            );
                        //   }

                       
                    } else {
                        this.dataService.loading.next(false);
                        this.snackBar.open('Regression Failed.', 'Try Again', {
                            duration: 5000
                        });
                    }
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Regression Failed.', 'Try Again', {
                        duration: 5000
                    });
                }
            );
        } else {
            console.log('no fail tc');
        }
    }

    downloadJobExcel() {
        this.tlService.downloadExcelLogsForJobs(this.jobData['job_id'], true,this.duplicateRegression['run_id']);
    }

    viewHtmlLogs() {
       // console.log('Viewing HTML logs for job ID:', this.jobData);
        this.tlService.viewHTMLLogsForJob(this.jobData['job_id'], this.duplicateRegression['run_id']);
    }

    copyHtmlUrl(): void {
        this.tlService.getHTMLLogsUrlForJob(this.jobData['job_id'], this.duplicateRegression['run_id']).subscribe(data => {
            if (data) {
                console.log('url', data);
                if (!navigator.clipboard) {
                    const textArea = document.createElement('textarea');
                    textArea.value = data;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        this.snackBar.open('HTML Log Path copied', 'OK', {
                            duration: 5000
                        });
                    } catch (err) {
                        console.error('Unable to copy to clipboard', err);
                        this.snackBar.open('Failed to copy HTML Log Path', 'Try Again', {
                            duration: 5000
                        });
                    }
                    document.body.removeChild(textArea);
                } else {
                    navigator.clipboard.writeText(data)
                    this.snackBar.open('HTML Log Path copied', 'OK', {
                        duration: 5000
                    });
                }
            } else {
                this.snackBar.open('Failed to copy HTML Log Path', 'Try Again', {
                 duration: 5000
                });
            }
        }, err => {
            this.snackBar.open('Failed to copy HTML Log Path', 'Try Again', {
            duration: 5000
            });
        }
        );
    }
    sendEmailReport() {
        this.dataService.loading.next(true);
        this.tlService
            .sendMailReport({
                user: this.dataService.getCurrentUser(),
                regressionId: this.selectedRegressionId
            })
            .subscribe(
                data => {
                    this.dataService.loading.next(false);
                    if (data) {
                        this.snackBar.open('Report Sent to your E-Mail', 'OK', {
                            duration: 5000
                        });
                    } else {
                        this.snackBar.open('Failed Sending Report', 'Try Again', {
                            duration: 5000
                        });
                    }
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Failed Sending Report', 'Try Again', {
                        duration: 5000
                    });
                }
            );
    }

    stopRegression(stopOption) {
        this.tlService.stopRegression(this.selectedRegression['run_id'], stopOption, this.noOfJobs,this.jobData['job_id']  ).subscribe(result => {
            if (result && result['status']) {
                this.snackBar.open(result['message'], 'ok', {
                    duration: 5000
                });
            } else {
                this.snackBar.open('Failed Stopping the regression', 'ok', {
                    duration: 5000
                });
            }
        }, (err) => {
            this.snackBar.open('Failed Stopping the regression', 'ok', {
                duration: 5000
            });
        })
    }
    stopRegressionPopUp() {
        // const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
        //     width: '500px',
        //     data: {
        //         name: 'Reservation',
        //         text:
        //             "This will cancel all schedules and release devices associated with this. This action can't be reversed. Are you sure you want to proceed?",
        //         action: 'Cancel'
        //     },
        //     panelClass: 'app-full-bleed-dialog'
        // });
        // this.sub5=dialogRef.afterClosed().subscribe(result => {
        //     if (result === true) {
        //        this.stopRegression();
        //     }
        // });
        const dialogRefAdd = this.dialog.open(StopOptionsComponent, {
            data: {
              name: this.stopButton,
            },
            minHeight: 100,
            minWidth: 500,
           autoFocus: false,
          });
      
          dialogRefAdd.afterClosed().subscribe((result) => {
            this.stopButton = result?.data;
            console.log("this.stopButton>>>",this.stopButton , result.data);
            this.stopRegression(this.stopButton);
          });
    }

    openScheduledLater() {
        let jobdata = _.cloneDeep(this.jobData);
        this.dataService.loading.next(true);
        const isObject = typeof jobdata.testbed === 'object';
        const testbedId = isObject ? (jobdata.testbed?._id || '') : (jobdata.testbed || '');
        const testbedName = isObject ? (jobdata.testbed?.testBedName || '') : '';
        
        // Check if current job's testbed is inactive before proceeding
        this.checkTestbedAndProceed(testbedId, testbedName, () => {
            this.dataService.loading.next(false);
            this.executeOpenScheduledLater(jobdata);
        });
    }
    
    executeOpenScheduledLater(jobdata: any) {
        /*this.sub13 = this.dataService.getTCModules().subscribe((modules) => {
            if (modules) {
                this.allModules = modules;
                console.log('this.allModules => ', this.allModules);
            }
        });
        this.sub3 = this.dataService.getTestGroup().subscribe((tcGroup) => {
            if (tcGroup) {
                this.allTestgroup = tcGroup;
                console.log('this.allTestgroup => ', this.allTestgroup);
            }
        });
        this.sub4 = this.dataService.getTestCases().subscribe((tc) => {
            if (tc) {
                this.allTestcase = tc;
                console.log('this.allTestcase => ', this.allTestcase);
            }
        });
        this.sub5 = this.dataService.getTestSuites().subscribe((ts) => {
            if (ts) {
                this.allTestsuite = ts;
                console.log('this.allTestsuite => ', this.allTestsuite);
            }
        });
      
        this.sub6 = this.dataService.getNodes().subscribe((nodes) => {
            if (nodes) {
                this.allNodes = nodes;
                console.log('this.allNodes => ', this.allNodes)
            }
        });*/
      
        
        /*this.sub8 = this.dataService.getTestbedVariables().subscribe((tbVar) => {
            if (tbVar) {
                this.testBedVariables = tbVar;
                console.log('this.testBedVariables => ', this.testBedVariables);
            }
        });
      
        this.sub10 = this.dataService.getAllAPI().subscribe((api) => {
            if (api) {
                this.allAPI = api;
                console.log('this.allAPI => ', this.allAPI)
            }
        });
      
        this.sub11 = this.dataService.getAllAPIGroup().subscribe((apiGroup) => {
            if (apiGroup) {
                this.allAPIGroup = apiGroup;
                console.log('this.allAPIGroup => ', this.allAPIGroup);
            }
        });
      
        this.modelSubscription = this.dataService
         .getAllModels()
         .subscribe((models) => {
            if (models) {
                this.allModels = models;
                console.log('this.allModels => ', this.allModels);
            }
        });*/
        
        if (this.selectedTeam) {
            const allTeams = this.dataService.getTeams();
            const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
            var kibanaURL = 'NA';
            if(selectedTeam && selectedTeam['kibanaURL']) {
                kibanaURL = selectedTeam['kibanaURL']
                ? selectedTeam['kibanaURL']
                : 'NA';
            }
            
            if(kibanaURL == undefined){
                kibanaURL = 'NA';
            }

            const jobDetails = {};
            jobDetails['run_id'] = null;
            jobDetails['kibanaURL'] = this.getRegAllDetails.kibanaURL;
            jobDetails['automatedMail'] = this.getRegAllDetails.automatedMail;
            // if(this.getRegAllDetails.jira){
            //     jobDetails['jira'] = {
            //         update: this.getRegAllDetails.jira.update,
            //         type: this.getRegAllDetails.jira.type,
            //         ueId: "",//this.getRegAllDetails.jira.ueId,
            //         key:  "",// this.getRegAllDetails.jira.key
            //     };
            // } else {
            //     jobDetails['jira'] = {
            //         update: false,
            //         type: 'update',
            //         ueId: '',
            //         key: ''
            //     };
            // }
            
            // jobDetails['cpuGraph'] = this.cpuGraph ? 'Y' : 'N';
            jobDetails['startTime'] = new Date().toISOString();
            jobDetails['job'] = [];
            jobDetails['tagName'] = "";
            /* added isReviewed flag for Regression Result analysis */
            jobDetails['isReviewed'] = "No";
            let allJobs:any = [{acs_time_interval:''}];//jobdata.onExecution;
            let selectedTestbeds = [];
            const totalTimeRequired = [];
            const selectedIssueKey = [];
            let onExecution = [];
            let preExecution =[];
            let postExecution = [];
            const devices:any = [];
            let selectedTestcase:any =[];
            let tb_1 = [] = _.filter(this.allTestbed, function(tb) {
                return (tb.testBedName == jobdata.testbed.testBedName)
            })

            if(tb_1.length > 0) {
                selectedTestbeds.push(tb_1[0]._id);
            }

            for (let j = 0; j < this.getRegAllDetails.job.length; j++) {
                if(this.getRegAllDetails.job[j].job_id == this.jobData.job_id){
                    //console.log('insied Jib Details => ', this.getRegAllDetails.job[j]);
                    for (let k = 0; k < this.getRegAllDetails.job[j].onExecution.length; k++) {
                        onExecution.push({tcId:this.getRegAllDetails.job[j].onExecution[k]._id, suiteId
                            :this.getRegAllDetails.job[j].onExecution[k].testSuiteId
                        })
                    }
                    for (let l = 0; l < this.getRegAllDetails.job[j].preExecution.length; l++) {
                        preExecution.push({tcId:this.getRegAllDetails.job[j].preExecution[l]._id, suiteId
                            :this.getRegAllDetails.job[j].preExecution[l].testSuiteId
                        })
                    }
                    for (let m = 0; m < this.getRegAllDetails.job[j].postExecution.length; m++) {
                        postExecution.push({tcId:this.getRegAllDetails.job[j].postExecution[m]._id, suiteId
                            :this.getRegAllDetails.job[j].postExecution[m].testSuiteId
                        })
                    }
                    let jobData:any = {};
                    jobData.schedulerType = "SL"; // this.getRegAllDetails.job[j].schedulerType;
                    jobData.firmwareVersion = this.getRegAllDetails.job[j].firmwareVersion
                    jobData.job_id = null;
                    jobData.module = this.getRegAllDetails.job[j].module
                    jobData.numOfIteration = this.getRegAllDetails.job[j].numOfIteration
                    jobData.reRunOnFail = this.getRegAllDetails.job[j].reRunOnFail
                    jobData.regressionType = this.getRegAllDetails.job[j].regressionType
                    jobData.telementry = this.getRegAllDetails.job[j].telementry
                    jobData.testbed = this.getRegAllDetails.job[j].testbed._id
                    jobData.timeRequired = this.getRegAllDetails.job[j].timeRequired
                    totalTimeRequired.push(this.getRegAllDetails.job[j].timeRequired);
                    jobData.onExecution = onExecution;
                    jobData.preExecution = preExecution;
                    jobData.postExecution = postExecution;
                    if(this.getRegAllDetails.job[j].dutId){
                        devices.push(this.getRegAllDetails.job[j].dutId)
                    }
                    selectedTestcase = this.getRegAllDetails.job[j].onExecution;
                    // changes for jira object 
                    if (this.getRegAllDetails.job[j].jira.update === true) {
                        jobData['jira'] = {
                            update: this.getRegAllDetails.job[j].jira.update,
                            type: this.getRegAllDetails.job[j].jira.type,
                            ueId: "",//this.getRegAllDetails.job[j].jira.ueId,
                            key:  "",// this.getRegAllDetails.job[j].jira.key
                        };
                        

                    } else {
                        jobData['jira'] = {
                            update: false,
                            type: 'update',
                            ueId: '',
                            key: ''
                        };
                    }
                    
// End- Changes for jira object
                    // Update endPointFWs with latest TFW device firmware versions
                    jobData['endPointFWs'] = [];
                    const selectedTestBed = jobData.testbed && jobData.testbed.nodes
                        ? jobData.testbed
                        : _.find(this.allTestbed, { _id: jobData.testbed });
                    const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                        ? selectedTestBed.nodes.filter(node => node.tfw === true)
                        : [];

                    tfwEnabledNodes.forEach(node => {
                        const device = _.find(this.allDevices, { _id: node.deviceId });
                        if (device) {
                            jobData['endPointFWs'].push({
                                device: device.deviceName,
                                model: device.model,
                                fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                            });
                        }
                    });

                    // Set the string for display (for the table)
                    this.tfwFirmwareVersionsString = jobData['endPointFWs']
                        .map(ep => `${ep.device} : ${ep.fw}`)
                        .join(', ');
                    jobDetails['job'].push(jobData);
                }

            }
            //allJobs[0].acs_time_interval=''
            allJobs[0].activeTab=0;
            // allJobs[0].allAPI = this.allAPI;
            // allJobs[0].allAPIGroup = this.allAPIGroup;
            allJobs[0].allDevices = this.allDevices;
            // allJobs[0].allModels = this.allModels;
            // allJobs[0].allModules = this.allModules;
            // allJobs[0].allNodes = this.allNodes;
            // allJobs[0].allTestbed = this.allTestbed;
            // allJobs[0].allTestcase = this.allTestcase
            // allJobs[0].allTestgroup = this.allTestgroup
            // allJobs[0].allTestsuite = this.allTestsuite;
            // allJobs[0].alreadySelectedDevices = [];
            // allJobs[0].alreadySelectedTBs = [];
            // allJobs[0].checkedTestsuite = [];
            allJobs[0].selectedTestBed =  tb_1[0];
            //allJobs[0].testBedVariables = this.testBedVariables;
            allJobs[0].selectedTestcase = selectedTestcase;
            //  console.log("scheduler???? ", selectedTestbeds);
            //jobDetails['run_id'] = null;
            const maxTimeRequired = _.max(totalTimeRequired);
            //this.runRegFlag = true;
            
            // const devices = Object.keys(this.selectedDevices).reduce((data:any, key) => {
            //   return [...data, ...this.selectedDevices[key]];
            // }, []);
            
            const dialogRef = this.dialog.open(ScheduleRegressionComponent, {
                data: {
                    jobDetails,
                    maxTimeRequired,
                    selectedTestbeds: selectedTestbeds,
                    selectedDevices: devices,
                    selectedTeam: this.selectedTeam,
                    allJobs:allJobs,
                    quickScheduler: false
                },
                minHeight: 100,
                minWidth: 500,
            });
        } else {
            //this.runRegFlag = false;
            this.dataService.loading.next(false);
            this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
        }
    }

    openScheduledLaterForFail(){
        let jobdata = _.cloneDeep(this.jobData);
        this.dataService.loading.next(true);
        const isObject = typeof jobdata.testbed === 'object';
        const testbedId = isObject ? (jobdata.testbed?._id || '') : (jobdata.testbed || '');
        const testbedName = isObject ? (jobdata.testbed?.testBedName || '') : '';
        
        // Check if current job's testbed is inactive before proceeding
        this.checkTestbedAndProceed(testbedId, testbedName, () => {
            this.dataService.loading.next(false);
            this.executeOpenScheduledLaterForFail(jobdata);
        });
    }
    
    executeOpenScheduledLaterForFail(jobdata: any) {
        if (this.selectedTeam) {
            const allTeams = this.dataService.getTeams();
            const selectedTeam = _.find(allTeams, { name: this.selectedTeam });
            var kibanaURL = 'NA';
            if(selectedTeam && selectedTeam['kibanaURL']) {
                kibanaURL = selectedTeam['kibanaURL']
                ? selectedTeam['kibanaURL']
                : 'NA';
            }
            
            if(kibanaURL == undefined){
                kibanaURL = 'NA';
            }

            const jobDetails = {};
            jobDetails['run_id'] = null;
            jobDetails['kibanaURL'] = this.getRegAllDetails.kibanaURL;
            jobDetails['automatedMail'] = this.getRegAllDetails.automatedMail;
            /* added isReviewed flag for Regression Result analysis */
            jobDetails['isReviewed'] = "No";
           
            
            // jobDetails['cpuGraph'] = this.cpuGraph ? 'Y' : 'N';
            jobDetails['startTime'] = new Date().toISOString();
            jobDetails['job'] = [];
            jobDetails['tagName'] = "";
            let allJobs:any = [{acs_time_interval:''}];//jobdata.onExecution;
            let selectedTestbeds = [];
            const totalTimeRequired = [];
            const selectedIssueKey = [];
            let onExecution = [];
            let preExecution =[];
            let postExecution = [];
            const devices:any = [];
            let selectedTestcase:any =[];
            let tb_1 = [] = _.filter(this.allTestbed, function(tb) {
                return (tb.testBedName == jobdata.testbed.testBedName)
            })

            if(tb_1.length > 0) {
                selectedTestbeds.push(tb_1[0]._id);
            }

            for (let j = 0; j < this.getRegAllDetails.job.length; j++) {
                if(this.getRegAllDetails.job[j].job_id == this.jobData.job_id){
                    console.log('insied Jib Details => ', this.getRegAllDetails.job[j]);
                    let jobData:any = {};
                    jobData.timeRequired = 0;
                    for (let k = 0; k < this.getRegAllDetails.job[j].onExecution.length; k++) { 
                        if(this.getRegAllDetails.job[j].onExecution[k].execStatus == "Fail") {
                            onExecution.push({tcId:this.getRegAllDetails.job[j].onExecution[k]._id, suiteId
                                :this.getRegAllDetails.job[j].onExecution[k].testSuiteId
                            })
                            jobData.timeRequired = jobData.timeRequired + parseInt(this.getRegAllDetails.job[j].onExecution[k].manualExectime)
                            totalTimeRequired.push(jobData.timeRequired);
                            console.log('totalTimeRequired => ', totalTimeRequired);
                        }
                    }
                    for (let l = 0; l < this.getRegAllDetails.job[j].preExecution.length; l++) {
                        preExecution.push({tcId:this.getRegAllDetails.job[j].preExecution[l]._id, suiteId
                            :this.getRegAllDetails.job[j].preExecution[l].testSuiteId
                        })
                        jobData.timeRequired = jobData.timeRequired + parseInt(this.getRegAllDetails.job[j].onExecution[l].manualExectime)
                        totalTimeRequired.push(this.getRegAllDetails.job[j].timeRequired);
                    }
                    for (let m = 0; m < this.getRegAllDetails.job[j].postExecution.length; m++) {
                        postExecution.push({tcId:this.getRegAllDetails.job[j].postExecution[m]._id, suiteId
                            :this.getRegAllDetails.job[j].postExecution[m].testSuiteId
                        })
                        jobData.timeRequired = jobData.timeRequired + parseInt(this.getRegAllDetails.job[j].onExecution[m].manualExectime)
                        totalTimeRequired.push(this.getRegAllDetails.job[j].timeRequired);
                    }
                    
                    jobData.schedulerType = 'SL'; //this.getRegAllDetails.job[j].schedulerType;
                    jobData.firmwareVersion = this.getRegAllDetails.job[j].firmwareVersion
                    jobData.job_id = null;
                    jobData.module = this.getRegAllDetails.job[j].module
                    jobData.numOfIteration = this.getRegAllDetails.job[j].numOfIteration
                    jobData.reRunOnFail = this.getRegAllDetails.job[j].reRunOnFail
                    jobData.regressionType = this.getRegAllDetails.job[j].regressionType
                    jobData.telementry = this.getRegAllDetails.job[j].telementry
                    jobData.testbed = this.getRegAllDetails.job[j].testbed._id
                    jobData.onExecution = onExecution;
                    jobData.preExecution = preExecution;
                    jobData.postExecution = postExecution;
                    if(this.getRegAllDetails.job[j].dutId){
                        devices.push(this.getRegAllDetails.job[j].dutId)
                    }
                    selectedTestcase = this.getRegAllDetails.job[j].onExecution;

                    if (this.getRegAllDetails.job[j].jira.update === true) {
                        jobData['jira'] = {
                            update: this.getRegAllDetails.job[j].jira.update,
                            type: this.getRegAllDetails.job[j].jira.type,
                            ueId: "",//this.getRegAllDetails.job[j].jira.ueId,
                            key:  "",// this.getRegAllDetails.job[j].jira.key
                        };
                        

                    } else {
                        jobData['jira'] = {
                            update: false,
                            type: 'update',
                            ueId: '',
                            key: ''
                        };
                    }
                    // Update endPointFWs with latest TFW device firmware versions
                    jobData['endPointFWs'] = [];
                    const selectedTestBed = jobData.testbed && jobData.testbed.nodes
                        ? jobData.testbed
                        : _.find(this.allTestbed, { _id: jobData.testbed });
                    const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                        ? selectedTestBed.nodes.filter(node => node.tfw === true)
                        : [];

                    tfwEnabledNodes.forEach(node => {
                        const device = _.find(this.allDevices, { _id: node.deviceId });
                        if (device) {
                            jobData['endPointFWs'].push({
                                device: device.deviceName,
                                model: device.model,
                                fw: device.deviceFWVersion ? device.deviceFWVersion : 'NA'
                            });
                        }
                    });

                    // Set the string for display (for the table)
                    this.tfwFirmwareVersionsString = jobData['endPointFWs']
                        .map(ep => `${ep.device} : ${ep.fw}`)
                        .join(', ');
                    jobDetails['job'].push(jobData);
                }

            }
            //allJobs[0].acs_time_interval=''
            allJobs[0].activeTab=0;
            // allJobs[0].allAPI = this.allAPI;
            // allJobs[0].allAPIGroup = this.allAPIGroup;
            allJobs[0].allDevices = this.allDevices;
            // allJobs[0].allModels = this.allModels;
            // allJobs[0].allModules = this.allModules;
            // allJobs[0].allNodes = this.allNodes;
            // allJobs[0].allTestbed = this.allTestbed;
            // allJobs[0].allTestcase = this.allTestcase
            // allJobs[0].allTestgroup = this.allTestgroup
            // allJobs[0].allTestsuite = this.allTestsuite;
            // allJobs[0].alreadySelectedDevices = [];
            // allJobs[0].alreadySelectedTBs = [];
            // allJobs[0].checkedTestsuite = [];
            allJobs[0].selectedTestBed =  tb_1[0];
            //allJobs[0].testBedVariables = this.testBedVariables;
            allJobs[0].selectedTestcase = selectedTestcase;
            //  console.log("scheduler???? ", selectedTestbeds);
            //jobDetails['run_id'] = null;
            console.log('totalTimeRequired =====> ', totalTimeRequired);
            const maxTimeRequired = _.max(totalTimeRequired);
            //this.runRegFlag = true;
            
            // const devices = Object.keys(this.selectedDevices).reduce((data:any, key) => {
            //   return [...data, ...this.selectedDevices[key]];
            // }, []);
            
            const dialogRef = this.dialog.open(ScheduleRegressionComponent, {
                data: {
                    jobDetails,
                    maxTimeRequired,
                    selectedTestbeds: selectedTestbeds,
                    selectedDevices: devices,
                    selectedTeam: this.selectedTeam,
                    allJobs:allJobs,
                    quickScheduler: false
                },
                minHeight: 100,
                minWidth: 500,
            });
        } else {
            //this.runRegFlag = false;
            this.dataService.loading.next(false);
            this.snackBar.open('Regression Failed.', 'Try Again', { duration: 5000 });
        }
    }

    showModal: boolean = false;
    selectedStatus:any;
    regresStatusList:any = [{key:'No Run', value:'NoExec'}, {key:'Passed', value:'Pass'}, {key:'Failed', value:'Fail'}, {key:'Exclude', value:'Excluded'}, {key:'Warning', value:'Warning'}];
    editRegressionDetails(event) {
        // console.log('evevt => ', event)
        this.editFlagObj = event;
        // console.log(this.editFlagObj);
        this.showModal = true;
    }
    onCustom(event) {
        //console.log('inside onCustom ', this.jobData);
        // console.log('event.data.tcStatus => ', event.data.tcStatus);
        if(event.action == 'Edit') {
            if(event.data.tcStatus != 'in progress' && event.data.tcStatus != 'NoExec' && this.getRegAllDetails.regStatus != "in progress"){
                this.editRegressionDetails(event);
            } else {
                this.snackBar.open('Sorry not allow to change status', 'X', { duration: 5000 });
            }
        } 
    }

    close() {
        this.showModal = false;
        this.selectedStatus = '';
        this.editFlagObj = {};
    }

    loading:boolean = false;
    getTestStatus() {
        this.loading = true;
        //console.log('selectedStatus => ', this.selectedStatus);
        this.editFlagObj.data.tcStatus = this.selectedStatus;
        var regData = this.getRegAllDetails;
        for (let i = 0; i < this.getRegAllDetails.job.length; i++) {
            if(this.jobData.job_id == this.getRegAllDetails.job[i].job_id) {
                for (let j = 0; j < this.getRegAllDetails.job[i].onExecution.length; j++) {
                    if(this.getRegAllDetails.job[i].onExecution[j].tcName == this.editFlagObj.data.tcName) {
                        //regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                        if(this.getRegAllDetails.job[i].onExecution[j].tcStatus == 'Pass'){
                            regData.passTC = parseInt(regData.passTC) - 1;
                            regData.job[i].passTC = parseInt(regData.job[i].passTC) - 1;
                        }
                        if(this.getRegAllDetails.job[i].onExecution[j].tcStatus == 'Fail'){
                            regData.failTC = parseInt(this.getRegAllDetails.failTC) - 1;
                            regData.job[i].failTC = parseInt(this.getRegAllDetails.job[i].failTC) - 1;
                        }
                        if(this.getRegAllDetails.job[i].onExecution[j].tcStatus == 'NoExec'){
                            regData.norunTC = this.getRegAllDetails.norunTC - 1;
                            regData.job[i].norunTC = this.getRegAllDetails.job[i].norunTC - 1;
                        }
                        if(this.getRegAllDetails.job[i].onExecution[j].tcStatus == 'Warning'){
                            regData.warnTC = this.getRegAllDetails.warnTC - 1;
                            regData.job[i].warnTC = this.getRegAllDetails.job[i].warnTC - 1;
                        }
                        if(this.getRegAllDetails.job[i].onExecution[j].tcStatus == 'Exclude'){
                            regData.excludedTC = this.getRegAllDetails.excludedTC - 1;
                            regData.job[i].excludedTC = this.getRegAllDetails.job[i].excludedTC - 1;
                        }
                        if(this.selectedStatus == 'Pass'){
                            regData.passTC = parseInt(this.getRegAllDetails.passTC) + 1;
                            regData.job[i].passTC = parseInt(this.getRegAllDetails.job[i].passTC) + 1;
                            regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                            regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                        }
                        if(this.selectedStatus == 'Fail'){
                            regData.failTC = parseInt(regData.failTC) + 1;
                            regData.job[i].failTC = parseInt(regData.job[i].failTC) + 1;
                            regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                            regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                            if(!regData.job[i].errorCodes){
                                regData.job[i].errorCodes = {};
                            }
                        }
                        if(this.selectedStatus == 'NoExec'){
                            regData.norunTC = this.getRegAllDetails.norunTC + 1;
                            regData.job[i].norunTC = this.getRegAllDetails.job[i].norunTC + 1;
                            regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                            regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                        }
                        // if(this.selectedStatus == 'Warning'){
                        //     regData.warnTC = this.getRegAllDetails.warnTC + 1;
                        //     regData.job[i].warnTC = this.getRegAllDetails.job[i].warnTC + 1;
                        //     regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                        //     regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                        // }
                        if(this.selectedStatus == 'warning'){
                            if(this.getRegAllDetails.warnTC){
                                regData.warnTC = this.getRegAllDetails.warnTC + 1;
                            } else {
                                regData.warnTC = 1;
                            }
                            if(this.getRegAllDetails.job[i].warnTC){
                                regData.job[i].warnTC = this.getRegAllDetails.job[i].warnTC + 1;
                            } else {
                                regData.job[i].warnTC = 1;
                            }
                            regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                            regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                        }
                        if(this.selectedStatus == 'Excluded'){
                            if(this.getRegAllDetails.excludedTC){
                                regData.excludedTC = this.getRegAllDetails.excludedTC + 1;
                            } else {
                                regData.excludedTC = 1;
                            }
                            if(this.getRegAllDetails.job[i].excludedTC){
                                regData.job[i].excludedTC = this.getRegAllDetails.job[i].excludedTC + 1;
                            } else {
                                regData.job[i].excludedTC = 1;
                            }
                            regData.job[i].onExecution[j].tcStatus = this.selectedStatus;
                            regData.job[i].onExecution[j].execStatus = this.selectedStatus;
                        }
                        
                        setTimeout(() => {
                            this.tlService.updateTCStatus({updateData:this.editFlagObj.data, regressionId:this.getRegAllDetails._id, jobIndex:i, job_id:this.jobData.job_id, regData:regData})
                            .subscribe((data:any) => {
                                this.getRegAllDetails = regData;
                                this.showModal = false;
                                this.loading = false;
                                this.selectedStatus = '';
                                this.editFlagObj = {};
                                //this.router.navigate([this.router.url])
                                this.router.navigateByUrl('/',{skipLocationChange:true}).then(()=>{
                                    this.router.navigate(['pages/regression/detail/' + this.pathArray[this.pathArray.length-1]]).then(()=>{
                                      //console.log(`After navigation I am on:${this.router.url}`)
                                    })
                                })
                                //this.router.navigate(['pages/regression/detail/' + this.pathArray[this.pathArray.length-1]]); //, { relativeTo: this.route }
                                this.snackBar.open('Data Updated Successfully', 'X', { duration: 5000 });
                            }, err => {
                                this.loading = false;
                                this.showModal = false;
                                this.selectedStatus = '';
                                this.editFlagObj = {};
                                this.snackBar.open(err + ', Some error in Update', 'X', { duration: 5000 });
                            })
                        }, 2000);
                    }
                } 
            }
        }
    }

    rerunExcludedRegression() {
        this.dataService.selectedRegressionData.next('ReRunClicked');
        this.dataService.loading.next(true);
        let jobdata = _.cloneDeep(this.jobData);
        const isObject = typeof jobdata.testbed === 'object';
        const testbedId = isObject ? (jobdata.testbed?._id || '') : (jobdata.testbed || '');
        const testbedName = isObject ? (jobdata.testbed?.testBedName || '') : '';
        
        // Check if current job's testbed is inactive before proceeding (with fresh data fetch)
        this.checkTestbedAndProceed(testbedId, testbedName, () => {
            this.executeRerunExcludedRegression(jobdata);
        });
    }
    
    executeRerunExcludedRegression(jobdata: any) {
        let startTime=new Date()
        let day=new Date(startTime)
        let date=day.getDate().toString().padStart(2, '0')
        let month=(day.getMonth()+1).toString().padStart(2, '0')
        let shortYear = day.getFullYear().toString()
        let twoDigitYear = shortYear.substring(shortYear.length-2)
        let formatdate=date+month+twoDigitYear
        let time=day.toISOString().split("T")[1];
        this.sub4 = this.tlService.getFullRegression(this.selectedRegressionId).subscribe(
         fullRegression => {
            if (fullRegression) {
                jobdata = _.find(fullRegression['job'], { job_id: this.jobData['job_id'] });
                const jobDataClone = _.cloneDeep(jobdata);
                const oldRegressionData = _.cloneDeep(this.selectedRegression);
                const newRegression = _.cloneDeep(fullRegression);
                delete newRegression['sNo'];
                delete newRegression['_id'];
                newRegression['job'] = [];
                let totalTC = 0;
                const excludedTC = _.filter(jobdata['onExecution'], data => data.tcStatus === 'Excluded');
                let tcArr=[]
                if(excludedTC.length > 0){
                    excludedTC.forEach(tc => {
                        tcArr.push({tcId:tc._id,suiteId:tc.testSuiteId})
                    });
                    const jobData = _.cloneDeep(jobDataClone);
                    if (typeof jobData.testbed === 'string') {
                        jobData.testbed = JSON.parse(jobData.testbed);
                    }
                    jobData['onExecution'] = tcArr;
                    let jobarr=jobData['job_id'].split('_')
                    let index=jobarr.pop()
                    jobarr.pop()
                    jobarr.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
                    jobarr.push(index)
                    jobData['job_id']= null; //jobarr.join("_")
                    // jobData['totalTC'] = failedTC.length;
                    // jobData['passTC'] = 0;
                    // jobData['failTC'] = 0;
                    // jobData['norunTC'] = failedTC.length;
                    jobData['testbed']=jobData['testbed']._id
                    delete jobData['preExecution']
                    delete jobData['postExecution']
                    delete jobData['totalTC']
                    delete jobData['passTC'] 
                    delete jobData['failTC']
                    delete jobData['excludedTC']
                    delete jobData['norunTC']
                    delete jobData['warnTC']
                    delete jobData['abortTC'] 
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
                    delete jobData['textFolderPath'];
                    delete jobData['tcTextFilePath'];
                    delete jobData['job_status'];
                    delete jobData['compeletedIteration'];
                    delete jobData['comment'];
                    jobData['endPointFWs'] = [];
                    const selectedTestBed = jobData.testbed && jobData.testbed.nodes ? jobData.testbed : _.find(this.allTestbed, { _id: jobData.testbed });
                    const tfwEnabledNodes = selectedTestBed && selectedTestBed.nodes
                        ? selectedTestBed.nodes.filter(node => node.tfw === true)
                        : [];

                    tfwEnabledNodes.forEach(node => {
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
                    let oldReg=oldRegressionData['run_id'].split("_")
                    oldReg.pop()
                    oldReg.push(formatdate+""+time.replace(/T/g, "").replace(/:|\.|Z/g, ""))
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
                    newRegression['run_id'] = null; //oldReg.join("_");
                    newRegression['startTime'] = startTime.toISOString();
                    // newRegression['regStatus'] = 'in progress';
                    // newRegression['user'] = this.dataService.getCurrentUser()['username'];
                    // newRegression['totalTC'] = totalTC;
                    // newRegression['passTC'] = 0;
                    // newRegression['failTC'] = 0;
                    // newRegression['norunTC'] = totalTC;
                    newRegression['parentReg'] = oldRegressionData['run_id'];
                    newRegression['isReviewed'] = "No";
                    newRegression['job'].forEach(job => {

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
                    this.sub = this.tlService.saveRegressionData(newRegression).subscribe(
                        rerunData => {
                            if (rerunData) {
                                this.router.navigate([`pages/regression/detail/${rerunData['_id']}`], { state: { fromScreen: 'view' } });
                                this.dataService.selectedRegressionData.next(rerunData);
                                this.dataService.loading.next(false);
                            }
                        },
                        err => {
                            this.dataService.loading.next(false);
                            let errorMsg = err && err.error && err.error.errorDetail ? err.error.errorDetail : 'Regression Failed.' ;
                            this.snackBar.open(errorMsg, 'Try Again', {
                                duration: 5000
                            });
                        }
                    );
                } else {
                    this.dataService.loading.next(false);
                    this.snackBar.open('No Excluded Use Case Present.', 'OK', {
                        duration: 5000
                    });
                }
            } else {
                this.dataService.loading.next(false);
                this.snackBar.open('Regression Failed.', 'Try Again', {
                    duration: 5000
                });
            }
        }, err=>{
            this.dataService.loading.next(false);
            this.snackBar.open('Regression Failed.', 'Try Again', {
                duration: 5000
            });
        })
    }

      // Generate Run ID
  generateSummaryName(regressionData, startTime) {
    let runId = '';

    if (regressionData) {
      runId = (regressionData.job[0].module && regressionData.job[0].module.length > 0 ? regressionData.job[0].module : this.selectedTeam) + '_' + regressionData.job[0].regressionType + '_' + this.dataService.getCurrentUser()['username'] + '_' +
        regressionData.job[0].schedulerType + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
    }
    return runId;
  }
}
