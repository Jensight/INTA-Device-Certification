
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DataService } from './../../../../@core/services/data.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { Component, OnInit, OnDestroy } from '@angular/core';

import * as _ from 'lodash';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
@Component({
    selector: 'app-tc-execution-detailed',
    templateUrl: './tc-execution-detailed-analysis.component.html',
    styleUrls: ['./tc-execution-detailed-analysis.component.scss'],
})
export class TCExecutionDetailedComponent implements OnInit, OnDestroy {
    private user = null;
    dataSubscription;
    itemChange;
    selectedTeam;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/tc-execution-analysis',
            label: 'TC Execution Analysis'
        }
    ]
    sub1: any;
    allUsers: any = [];
    allUserNames: any = [];
    selectedUser = 1;
    sub2: any;
    allModels: any = [];
    selectedModel: any = 1;
    selectedFW: any = 1;
    yearlyData: any = [];
    subscribedData: any;
    allRegressionData: any;
    sub3: any;
    sub4: any;
    sub5: any;

    defaultVendor: any = [];
    modelArray = []
    QuarterObj: any = {};
    selectedRegStatus: any;
    selectRegFormControl = new UntypedFormControl();
    regStatus = ["Completed", "Aborted", "Stopped"];
    selectedDeviceType: any = "All";
    showNoRun = false;
    showError: boolean = false;
    filteredData: any = [];
    sub15: any;
    allFWVersions: any = [];
    selectedFirmware = 'All';
    fwInput: any;
    selectedONT = 'All';
    showONTPrior = false;
    showONTAfter = false;
    ontModelsArray = []
    ontModels = [];
    ontModelPriorArray = [];

    public executionAnalysisFormGroup = new UntypedFormGroup({
        selectFWFormControl: new UntypedFormControl('All')
    });

    fwVersionMatchedList = [];
    nonDutFWVersions = [];
    constructor(private dashboardService: DashboardService, private dInventoryService: DeviceInventoryService,
        public dataService: DataService, public tcService: TestCaseInventoryService) {
        this.user = this.dataService.getCurrentUser();
        this.defaultVendor = [];
        this.defaultVendor = this.dataService?.deviceTypeList;
        if (this.defaultVendor && this.defaultVendor.length > 0 && this.defaultVendor[0] !== 'All') {
            this.defaultVendor.splice(0, 0, 'All');
        }
        this.QuarterObj = this.tcService.QuarterObj;
        this.selectedUser = this.user.username.toLowerCase();

        this.dataService.loading.next(true)
        this.sub4 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
            this.dataService.getDeviceInventoryData().subscribe(dt => {
                if (!dt) {
                    this.sub15 = this.dInventoryService.getAllData().subscribe((data: any) => {
                        if (data && data.length > 0) {
                            this.dataService.getDeviceInventoryData().next(data);
                        }
                        //console.log("all models fetched >>>>>>>>>>");
                    });
                }
            });
        });

        this.sub5 = this.dataService.getTestGroup().subscribe(tgs => {
            if (!tgs) {
                this.tcService.getAllData().subscribe(data => {
                    if (data) {
                        this.dataService.getTcInventoryData().next(data);
                        this.dataService.getTestGroup().subscribe(testGroups => {
                        });
                    }
                });
            }
        });
        this.sub1 = this.dataService.getSettingsData().subscribe(data => {
            if (data) {

                this.allUsers = data.users;
                this.allUsers.forEach(element => {
                    if (element.teams.includes(this.selectedTeam)) {
                        this.allUserNames.push(element.username);
                    }

                });
                this.allUserNames = this.allUserNames.toLocaleString().toLowerCase().split(',');
                this.allUserNames.sort()
            }
        });
        if (this.dataService.deviceTypeList && this.dataService.deviceTypeList.length > 0) {
            this.sub2 = this.dataService.getAllModels().subscribe(model => {
                if (model) {
                    console.log('all models in tc exec', model);
                    this.modelArray = _.sortBy(model, 'modelName');
                    this.grtAllRegressionData();

                } else {
                    this.sub3 = this.dInventoryService
                        .getAllData()
                        .subscribe((data) => {
                            if (data) {
                                this.dataService.getDeviceInventoryData().next(data);
                                this.dataService.getAllModels().subscribe(model => {
                                    if (model) {

                                        // const filteredmodel = _.filter(model, obj => {
                                        //     return (
                                        //         obj['dut'] == true || obj['deviceVendor'] == "Google Android" || obj['deviceVendor'] == "Apple iOS"
                                        //             || obj['deviceVendor'] == "Sercomm" || obj['deviceVendor'] == "Comcast"
                                        //     );
                                        // });
                                        //this.allModels=_.sortBy(filteredmodel, 'modelName');
                                        this.modelArray = _.sortBy(model, 'modelName');
                                        this.grtAllRegressionData();



                                    }
                                });

                            }
                        });
                }
            });
            // if (this.selectedDeviceType == "Ignite All") {
            //     this.modelArray.forEach((res) => {
            //         if (["Technicolor", "Arris", "Comcast", "Sercomm"].includes(res.deviceVendor)) {
            //             this.allModels.push(res.modelName);
            //         }
            //     });
            // }
            this.defaultRegstatus();
            let fwData
            this.dataService.defaultYearObservable.subscribe((yr) => {
                if (yr) {
                    fwData = this.formateData(this.subscribedData.filter((item) => {
                        return item.year === yr;
                    }));
                    this.fwVersionMatchedList = [];
                    this.fwVersionMatchedList.push('All');
                    if (fwData) {
                        let yearlyData = fwData['yearlyData'][0];
                        if (this.selectedModel && this.selectedModel === 1) {
                            this.fwVersionMatchedList.push(...yearlyData['firmwareVersion']);
                        } else {
                            let modelFWVersion = yearlyData['modelFWVersion'];
                            if (modelFWVersion && modelFWVersion.size > 0) {
                                let modelFW = modelFWVersion.get(this.selectedModel);
                                if (modelFW && modelFW.length > 0) {
                                    this.fwVersionMatchedList.push(...modelFW);
                                }
                            }
                        }
                    }
                }
            });
        } else {
            this.defaultVendor = ['All'];
            this.selectedDeviceType = 'All';
            this.fwVersionMatchedList.push('All');
            this.selectRegFormControl.setValue(this.regStatus);
            this.dataService.loading.next(false)
            this.dataService.regressionNoData.next(true);
        }
        this.allUserNames = this.allUserNames.map(data => {
            return { 'value': data, 'title': data }
        });



    }

    ngOnInit(): void {
        if (this.defaultVendor && this.defaultVendor.length > 0) {
            this.defaultRegstatus();
            this.executionAnalysisFormGroup.controls.selectFWFormControl.valueChanges.subscribe((value) => {
                this.selectedFirmware = value;
                this.fwInput = null;
                this.filterBasedOnFWVersion();
            });
        }
    }
    grtAllRegressionData() {
        const regDt = this.dataService.allRegressionDetails.subscribe((data: any) => {

            if (data) {
                this.allRegressionData = _.cloneDeep(data);

                let statusFiltered = [];
                if (this.selectedRegStatus && this.selectedRegStatus.length > 0 && this.selectedRegStatus.length < 3) {
                    this.showNoRun = (this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed')) ? false : true;


                    this.selectedRegStatus = this.selectedRegStatus.map(element => {
                        return element.toLowerCase();
                    });

                    statusFiltered = data.filter((item) => {
                        return this.selectedRegStatus.includes(item.regStatus)
                    });

                    this.subscribedData = statusFiltered;



                } else {
                    this.subscribedData = data;
                }
                let filteredData: any;
                const tmpData = this.subscribedData;
                this.filteredData = tmpData;
                if (this.selectedUser && this.selectedUser !== 1) {
                    filteredData = tmpData?.map((element: any) => element).filter((element) => {
                        return element.user?.toLowerCase() === this.selectedUser;
                    });
                    this.subscribedData = filteredData;
                    if (this.defaultVendor.length > 0) {
                        this.filterBasedonDeviceType(this.selectedModel);
                    } else {
                        this.dataService.regressionNoData.next(true);
                        this.dataService.loading.next(false);
                    }
                } else {
                    // filteredData = tmpData;
                    this.filteredData = this.subscribedData;
                    if (this.defaultVendor.length > 0) {
                        this.filterBasedonDeviceType(this.selectedModel);
                    } else {
                        this.dataService.regressionNoData.next(true);
                        this.dataService.loading.next(false);
                    }
                }
                // console.log("after user fileter in const>>>>>", this.subscribedData);


            } else {
                this.dataService.regressionNoData.next(true);
                this.dataService.loading.next(false);
            }

        });
    }
    defaultRegstatus() {
        // To make regression status as default selected with options
        // let settingsData = this.dataService.getSettingsData().value;
        let enableCompletedRegressions = false;
        var config = this.dataService.getTeamDashBoardConfig(this.selectedTeam);
        enableCompletedRegressions = config && config.enable_completed_regression ? config.enable_completed_regression : false;
        if (enableCompletedRegressions) {
            // if (settingsData?.dashboardConfig[0]?.enable_completed_regression) {
            this.selectRegFormControl.setValue([this.regStatus[0]]);
            this.selectedRegStatus = [this.regStatus[0]];
            this.dataService.selectedRegStatus.next(this.selectedRegStatus);
        } else {
            this.selectRegFormControl.setValue(this.regStatus);
            this.selectedRegStatus = this.regStatus;
            this.dataService.selectedRegStatus.next(this.selectedRegStatus);
        }
    }

    formateData(data): any {

        if (data.length > 0) {
            let finalData = {};
            const filter = {
                user: this.selectedUser, model: this.selectedModel, deviceType: this.selectedDeviceType
                , firmwareVersion: this.selectedFirmware
            };
            this.dataService.getFIlterData().next(filter);
            const yearlyData = this.groupByYear(data);
            const monthlyData = this.groupByMonth(data);
            const dailyData = this.groupByDate(data);
            finalData = { ...finalData, yearlyData };
            finalData = { ...finalData, monthlyData };
            finalData = { ...finalData, dailyData };
            let fwData;
            this.dataService.defaultYear.subscribe((yr) => {
                fwData = yearlyData.find(item => item['year'] === yr);
            });
            this.fwVersionMatchedList = [];
            this.fwVersionMatchedList.push('All');
            if (fwData) {
                if (this.selectedModel && this.selectedModel === 1) {
                    this.fwVersionMatchedList.push(...fwData['firmwareVersion']);
                } else {
                    let modelFWVersion = fwData['modelFWVersion'];
                    if (modelFWVersion && modelFWVersion.size > 0) {
                        let modelFW = modelFWVersion.get(this.selectedModel);
                        if (modelFW && modelFW.length > 0) {
                            this.fwVersionMatchedList.push(...modelFW);
                        }
                    }
                }
            }

            return finalData;
        } else {
            let filter = { user: this.selectedUser, model: this.selectedModel, deviceType: this.selectedDeviceType, firmwareVersion: this.selectedFirmware }
            this.dataService.getFIlterData().next(filter)
            return {
                yearlyData: [
                    {
                        totalTC: 0,
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        abortTC: 0,
                        warnTC: 0,
                        totalReg: 0,
                        year: 0
                    }
                ],
                monthlyData: [
                    {
                        _id: 2022,
                        monthlyData: [
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 1,
                                quarter: 'Q1',
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 2,
                                quarter: 'Q1',
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 3,
                                quarter: 'Q1',
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 4,
                                quarter: "Q2",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 5,
                                quarter: "Q2",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 6,
                                quarter: "Q2",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 7,
                                quarter: "Q3",
                                year: 0
                            },
                            {
                                totalTC: 0,
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalReg: 0,
                                year: 0,
                                month: 8,
                                quarter: "Q3"
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 9,
                                quarter: "Q3",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 10,
                                quarter: "Q4",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 11,
                                quarter: "Q4",
                                year: 0
                            },
                            {
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                totalReg: 0,
                                month: 12,
                                quarter: "Q4",
                                year: 0,
                            }
                        ]
                    }
                ],
                dailyData: [
                    {
                        totalTC: 0,
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        abortTC: 0,
                        warnTC: 0,
                        totalReg: 0,
                        year: 0,
                        month: 8,
                        day: 12,
                        allTC: [
                            {
                                _id: null,
                                run_id: null,
                                deviceName: null,
                                model: null,
                                profileId: null,
                                profileName: null,
                                regStartedAt: null,
                                passTC: 0,
                                failTC: 0,
                                norunTC: 0,
                                abortTC: 0,
                                warnTC: 0,
                                totalTC: 0,
                                day: 0,
                                month: 0,
                                year: 0,
                                user: null
                            }
                        ]
                    }
                ]
            }

        }

    }
    groupByYear(data) {
        let yearlyOutput = {};

        data.forEach(d => {
            // console.log("data>>>>", d);
            if (!isNaN(d.year) && d.year) {
                // console.log('inside if nan', d.year, isNaN(d.year));
                if (yearlyOutput[d.year]) {
                    let exis = yearlyOutput[d.year];
                    let existingModelFWVersion = exis.modelFWVersion;
                    let fwversion = new Map();

                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []

                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);


                    fwversion.set(d.model, [...new Set(fwVersionModel)]);
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        exis.firmwareVersion.push(d.firmwareVersion)
                    }
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !exis.firmwareVersion.includes(fw)) {
                                exis.firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC + exis.totalTC,
                        "passTC": d.passTC + exis.passTC,
                        "failTC": d.failTC + exis.failTC,
                        "norunTC": d.norunTC + exis.norunTC,
                        "abortTC": d.abortTC ? d.abortTC + exis.abortTC : exis.abortTC,
                        "warnTC": d.warnTC ? d.warnTC + exis.warnTC : exis.warnTC,
                        "totalReg": ++exis.totalReg,
                        "year": d.year,
                        "firmwareVersion": [...new Set(exis.firmwareVersion)],
                        "modelFWVersion": existingModelFWVersion,
                    };
                    yearlyOutput[d.year] = tmp;
                } else {
                    const existingModelFWVersion = new Map();
                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []
                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);
                    let firmwareVersion = [];
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        firmwareVersion.push(d.firmwareVersion);
                    }
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !firmwareVersion.includes(fw)) {
                                firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC,
                        "passTC": d.passTC,
                        "failTC": d.failTC,
                        "norunTC": d.norunTC,
                        "abortTC": d.abortTC ? d.abortTC : 0,
                        "warnTC": d.warnTC ? d.warnTC : 0,
                        "totalReg": 1,
                        "year": d.year,
                        "firmwareVersion": firmwareVersion.length > 0 ? firmwareVersion : [],
                        "modelFWVersion": existingModelFWVersion,
                    };
                    yearlyOutput[d.year] = tmp;
                }
            }

        });

        return Object.values(yearlyOutput)

    };

    groupByMonth(data) {
        let monthlyOutput = {};

        data.forEach(d => {
            if (!isNaN(d.year) && d.year) {
                if (monthlyOutput[d.year] && monthlyOutput[d.year][d.month]) {

                    let exis = monthlyOutput[d.year][d.month];
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        exis.firmwareVersion.push(d.firmwareVersion)
                    }
                    const existingFailCategory = exis.failByCategory;
                    const existingErrorCodes = exis.errorCodes;
                    let existingModelFWVersion = exis.modelFWVersion;
                    if (d.tcGroups && d.tcGroups.length > 0) {
                        d.tcGroups.forEach(element => {
                            if (element && Object.entries(element).length !== 0) {
                                Object.keys(element).forEach(key => {
                                    existingFailCategory.size > 0 ? existingFailCategory.has(key) ? existingFailCategory.set(key,
                                        existingFailCategory.get(key) + element[key].failTC) : existingFailCategory.set(key, element[key].failTC)
                                        : existingFailCategory.set(key, element[key].failTC);
                                });

                            }
                        });
                    }
                    if (d.errorCodes && Object.keys(d.errorCodes).length > 0) {


                        Object.keys(d.errorCodes).forEach(key => {
                            existingErrorCodes.size > 0 ? existingErrorCodes.has(key) ? existingErrorCodes.set(key,
                                existingErrorCodes.get(key) + d.errorCodes[key]) : existingErrorCodes.set(key, d.errorCodes[key])
                                : existingErrorCodes.set(key, d.errorCodes[key]);
                        });



                    }
                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []

                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !exis.firmwareVersion.includes(fw)) {
                                exis.firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC + exis.totalTC,
                        "passTC": d.passTC + exis.passTC,
                        "failTC": d.failTC + exis.failTC,
                        "norunTC": d.norunTC ? d.norunTC + exis.norunTC : exis.norunTC,
                        "abortTC": d.abortTC ? d.abortTC + exis.abortTC : exis.abortTC,
                        "warnTC": d.warnTC ? d.warnTC + exis.warnTC : exis.warnTC,
                        "totalReg": ++exis.totalReg,
                        "year": d.year,
                        "month": d.month,
                        "quarter": this.QuarterObj[d.month],
                        "firmwareVersion": [...new Set(exis.firmwareVersion)],
                        "modelFWVersion": existingModelFWVersion,
                        failByCategory: existingFailCategory,
                        errorCodes: existingErrorCodes
                    };

                    monthlyOutput[d.year][d.month] = tmp;
                } else {
                    const failByCategory = new Map();
                    const errorCodes = new Map();
                    const existingModelFWVersion = new Map();
                    if (d.tcGroups && d.tcGroups.length > 0) {
                        d.tcGroups.forEach(element => {
                            if (element && Object.entries(element).length !== 0) {
                                Object.keys(element).forEach(key => {
                                    failByCategory.set(key, element[key].failTC);
                                });

                            }
                        });
                    }

                    if (d.errorCodes && Object.keys(d.errorCodes).length > 0) {
                        Object.keys(d.errorCodes).forEach(key => {
                            errorCodes.set(key, d.errorCodes[key]);
                        });
                        // }                
                    }
                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []
                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);
                    let firmwareVersion = [];
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        firmwareVersion.push(d.firmwareVersion);
                    }
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !firmwareVersion.includes(fw)) {
                                firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC,
                        "passTC": d.passTC,
                        "failTC": d.failTC,
                        "norunTC": d.norunTC,
                        "abortTC": d.abortTC ? d.abortTC : 0,
                        "warnTC": d.warnTC ? d.warnTC : 0,
                        "totalReg": 1,
                        "year": d.year,
                        "month": d.month,
                        "quarter": this.QuarterObj[d.month],
                        "firmwareVersion": firmwareVersion.length > 0 ? firmwareVersion : [],
                        "modelFWVersion": existingModelFWVersion,
                        failByCategory,
                        errorCodes
                    };
                    if (!monthlyOutput[d.year]) {
                        monthlyOutput[d.year] = {}
                    };
                    monthlyOutput[d.year][d.month] = tmp;
                    errorCodes

                }
            }

        });

        let monthlyOutputWithAllMonth = this.addAllMonths(monthlyOutput)

        return monthlyOutputWithAllMonth;
    }

    groupByDate(data) {
        let dailyOutput = {};

        let regressonList = [];

        data.forEach(d => {
            if (d.year && d.month && d.day && !isNaN(d.year) && !isNaN(d.month) && !isNaN(d.day)) {
                if (dailyOutput[d.year] && dailyOutput[d.year][d.month] && dailyOutput[d.year][d.month][d.day]) {
                    let fwversion = new Map();


                    let exis = dailyOutput[d.year][d.month][d.day];
                    var exisAlltc = [];
                    exisAlltc = dailyOutput[d.year][d.month][d.day].allTC;
                    exis.allTC.push(d);
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        exis.firmwareVersion.push(d.firmwareVersion)
                    }
                    const existingFailCategory = dailyOutput[d.year][d.month][d.day].failByCategory;
                    const existingErrorCodes = dailyOutput[d.year][d.month][d.day].errorCodes;
                    const existingModelFWVersion = dailyOutput[d.year][d.month][d.day].modelFWVersion;
                    if (d.tcGroups && d.tcGroups.length > 0) {
                        d.tcGroups.forEach(element => {
                            if (element && Object.entries(element).length !== 0) {
                                Object.keys(element).forEach(key => {
                                    existingFailCategory.size > 0 ? existingFailCategory.has(key) ? existingFailCategory.set(key,
                                        existingFailCategory.get(key) + element[key].failTC) : existingFailCategory.set(key, element[key].failTC)
                                        : existingFailCategory.set(key, element[key].failTC);
                                });

                            }
                        });
                    }
                    if (d.errorCodes && Object.keys(d.errorCodes).length > 0) {


                        Object.keys(d.errorCodes).forEach(key => {
                            existingErrorCodes.size > 0 ? existingErrorCodes.has(key) ? existingErrorCodes.set(key,
                                existingErrorCodes.get(key) + d.errorCodes[key]) : existingErrorCodes.set(key, d.errorCodes[key])
                                : existingErrorCodes.set(key, d.errorCodes[key]);
                        });



                    }

                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []
                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !exis.firmwareVersion.includes(fw)) {
                                exis.firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC + exis.totalTC,
                        "passTC": d.passTC + exis.passTC,
                        "failTC": d.failTC + exis.failTC,
                        "norunTC": d.norunTC + exis.norunTC,
                        "abortTC": d.abortTC ? d.abortTC + exis.abortTC : exis.abortTC,
                        "warnTC": d.warnTC ? d.warnTC + exis.warnTC : exis.warnTC,
                        "totalReg": ++exis.totalReg,
                        "year": d.year,
                        "month": d.month,
                        "day": d.day,
                        "allTC": exis.allTC,
                        "firmwareVersion": [...new Set(exis.firmwareVersion)],
                        "modelFWVersion": existingModelFWVersion,
                        failByCategory: existingFailCategory,
                        errorCodes: existingErrorCodes
                    };
                    dailyOutput[d.year][d.month][d.day] = tmp;
                } else {
                    const failByCategory = new Map();
                    const errorCodes = new Map();
                    let existingModelFWVersion = new Map();
                    if (d.tcGroups && d.tcGroups.length > 0) {
                        d.tcGroups.forEach(element => {
                            if (element && Object.entries(element).length !== 0) {
                                Object.keys(element).forEach(key => {
                                    failByCategory.set(key, element[key].failTC);
                                });

                            }
                        });
                    }
                    if (d.errorCodes && Object.keys(d.errorCodes).length > 0) {
                        Object.keys(d.errorCodes).forEach(key => {
                            errorCodes.set(key, d.errorCodes[key]);
                        });
                        // }                
                    }
                    let fwVersionModel = existingModelFWVersion.get(d.model) ? existingModelFWVersion.get(d.model) : []
                    fwVersionModel.push(d.firmwareVersion)
                    existingModelFWVersion.set(d.model, [...new Set(fwVersionModel)]);
                    let firmwareVersion = [];
                    if (d.firmwareVersion != null && d.firmwareVersion != "NA" && d.firmwareVersion != "Nil" && d.firmwareVersion != "") {
                        firmwareVersion.push(d.firmwareVersion);
                    }
                    // Adding tfw Firmware Version details
                    if (d.trackFW && d.trackFW.length > 0) {
                        d.trackFW.forEach((fw) => {
                            if (fw != null && fw != "NA" && fw != "Nil" && fw != "" && !firmwareVersion.includes(fw)) {
                                firmwareVersion.push(fw);
                            }
                        });
                    }
                    if (d.endPointFWs && d.endPointFWs.length > 0) {
                        d.endPointFWs.forEach((ep) => {
                            let fwVersionModel = existingModelFWVersion.get(ep.model) ? existingModelFWVersion.get(ep.model) : []
                            if (ep.fw != null && ep.fw != "NA" && ep.fw != "Nil" && ep.fw != "" && !fwVersionModel.includes(ep.fw)) {
                                fwVersionModel.push(ep.fw)
                            }
                            existingModelFWVersion.set(ep.model, [...new Set(fwVersionModel)]);
                        });
                    }
                    let tmp = {
                        "totalTC": d.totalTC,
                        "passTC": d.passTC,
                        "failTC": d.failTC,
                        "norunTC": d.norunTC,
                        "abortTC": d.abortTC ? d.abortTC : 0,
                        "warnTC": d.warnTC ? d.warnTC : 0,
                        "totalReg": 1,
                        "year": d.year,
                        "month": d.month,
                        "day": d.day,
                        "allTC": [d],
                        "firmwareVersion": firmwareVersion.length > 0 ? firmwareVersion : [],
                        "modelFWVersion": existingModelFWVersion,
                        failByCategory,
                        errorCodes
                    };
                    if (!dailyOutput[d.year]) {
                        dailyOutput[d.year] = {}
                    } if (!dailyOutput[d.year][d.month]) {
                        dailyOutput[d.year][d.month] = {}
                    } if (!dailyOutput[d.year][d.month][d.day]) {
                        dailyOutput[d.year][d.month][d.day] = {}
                    }

                    regressonList.push(d.run_id);
                    dailyOutput[d.year][d.month][d.day] = tmp;
                }
            }


        });

        dailyOutput = this.addAlldata(dailyOutput);

        return dailyOutput
    };
    addAlldata(d) {
        var firstLevelKey = Object.keys(d);
        let array = [];
        for (let index = 0; index < firstLevelKey.length; index++) {
            const element = firstLevelKey[index];
            let secondLevelKey = Object.keys(d[element])

            for (let j = 0; j < secondLevelKey.length; j++) {
                let thirdLevelKey = Object.keys(d[element][secondLevelKey[j]])

                for (let k = 0; k < thirdLevelKey.length; k++) {
                    array.push(d[element][secondLevelKey[j]][thirdLevelKey[k]]);
                }
            }

        }
        return array;
    }
    addAllMonths(d) {

        var firstLevelKey = Object.keys(d);
        let mData = [];
        let yearArray = {};
        for (let index = 0; index < firstLevelKey.length; index++) {

            const element = firstLevelKey[index];

            yearArray = { "_id": Number(firstLevelKey[index]) }
            let monthlydata = [];
            for (let j = 1; j < 13; j++) {
                if (!d[element][j]) {
                    d[element][j] = {
                        passTC: 0,
                        failTC: 0,
                        norunTC: 0,
                        abortTC: 0,
                        warnTC: 0,
                        totalTC: 0,
                        totalReg: 0,
                        month: j,
                        quarter: this.QuarterObj[j],
                        year: Number(firstLevelKey[index])
                    };
                }

                monthlydata.push(d[element][j]);
            }
            yearArray = { ...yearArray, "monthlyData": monthlydata }
            mData.push(yearArray);
        }


        return mData;
    }


    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe()
        }
    }

    filterBasedOnUser(): void {
        this.grtAllRegressionData();
    }

    filterBasedonDeviceType(selModel): void {
        //console.log("this.modelArray>>>>", this.modelArray);
        this.dataService.loading.next(true);
        this.allModels = [];
        this.showONTAfter = false;
        this.showONTPrior = false;
        this.ontModelsArray = [];
        this.ontModels = [];
        this.ontModelPriorArray =[];
        this.ontModelsArray = [];
        if (this.dataService.deviceTypeList && this.dataService.deviceTypeList.length > 0) {
            if (this.selectedDeviceType != "All") {
                this.selectedModel = 1;
                // Get team-specific dashboard rules configuration
                var teamConfig = this.dataService.getTeamDashBoardConfig(this.selectedTeam);
                var deviceTypeList = teamConfig && teamConfig.DeviceTypeList ? teamConfig.DeviceTypeList :
                    (this.dataService.dashBoardRulesConfig ? this.dataService.dashBoardRulesConfig['DeviceTypeList'] : []);
                let selectedVendorData = deviceTypeList.filter((data) => {
                    return data.DeviceType == this.selectedDeviceType
                });
                if (selectedVendorData.length > 0) {
                    const vendorArray = selectedVendorData[0].vendorArray;
                    const tempModelType = selectedVendorData[0].ModelType;
                    this.showONTAfter = selectedVendorData[0].ONTModelPosition === "ONTAfterModel";
                    this.showONTPrior = selectedVendorData[0].ONTModelPosition === "ONTPriorModel";
                    vendorArray.forEach((res) => {
                        const data = this.modelArray.filter((data) => {
                            if (data.tfw == undefined || data.tfw == null) {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT;
                            } else {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT && data.tfw == res.TFW;
                            }
                        }); 
                        // const interopData = this.subscribedData.filter((data) => {
                        //     return data.interopModel != null && data.interopModel != undefined
                        //      && data.interopModel != "";

                        // })
                        // console.log('interopData', interopData)
                        console.log('tempModelType', tempModelType, selectedVendorData);
                        if (data.length > 0) {
                            let filteredData = this.filterDataBasedOnModelType(tempModelType);
                            let regData = filteredData.filter((item) => {
                                return data.some((dataItem) => dataItem.deviceVendor === item.vendor);
                            });
                            let regressionModels = regData.map((item) => {
                                return item.model;
                            });
                            this.createModelONTModelArray(regData);
                            let endPointFWs = filteredData.map((item) => {
                                return item.endPointModels;
                            });
                            endPointFWs = _.filter(endPointFWs, (item) => {
                                return item && item.length > 0;
                            });
                            endPointFWs = _.flatten(endPointFWs);
                            endPointFWs = _.uniq(endPointFWs);

                            let finalModels = [];
                            data.forEach((item) => {
                                if (regressionModels.includes(item.modelName) || endPointFWs.includes(item.modelName)) {
                                    finalModels.push(item.modelName);
                                }
                            });
                            this.allModels.push(...finalModels);
                            this.allModels = _.uniq(this.allModels);
                        }
                    });
                }
            } else {
                this.selectedModel = 1;
                // Get team-specific dashboard rules configuration
                var teamConfig = this.dataService.getTeamDashBoardConfig(this.selectedTeam);
                var deviceTypeList = teamConfig && teamConfig.DeviceTypeList ? teamConfig.DeviceTypeList :
                    (this.dataService.dashBoardRulesConfig ? this.dataService.dashBoardRulesConfig['DeviceTypeList'] : []);
                deviceTypeList.forEach((devicetype) => {
                    const tempModelType = devicetype.ModelType ? devicetype.ModelType : devicetype.modelType;
                    devicetype.vendorArray.forEach((res) => {
                        const data = this.modelArray.filter((data) => {
                            if (data.tfw == undefined || data.tfw == null) {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT;
                            } else {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT && data.tfw == res.TFW;
                            }
                        });
                        console.log('tempModelType', tempModelType, devicetype);
                        if (data.length > 0) {
                            let filteredData = this.filterDataBasedOnModelType(tempModelType);
                            let regData = filteredData.filter((item) => {
                                return data.some((dataItem) => dataItem.deviceVendor === item.vendor);
                            });
                            let regressionModels = regData.map((item) => {
                                return item.model;
                            });
                            regressionModels = _.uniq(regressionModels);
                            let endPointFWs = filteredData.map((item) => {
                                return item.endPointModels;
                            });
                            endPointFWs = _.filter(endPointFWs, (item) => {
                                return item && item.length > 0;
                            });
                            endPointFWs = _.flatten(endPointFWs);
                            endPointFWs = _.uniq(endPointFWs);
                            let finalModels = [];
                            data.forEach((item) => {
                                if (regressionModels.includes(item.modelName) || endPointFWs.includes(item.modelName)) {
                                    finalModels.push(item.modelName);
                                }
                            });
                            this.allModels.push(...finalModels);
                            this.allModels = _.uniq(this.allModels);
                        }
                    });
                });
            }
            this.selectedModel = selModel;
            if (this.showONTPrior){
            this.ontModels = this.ontModelsArray.map(item => item.ontModel);
            this.ontModels = _.flatten(this.ontModels);
            this.ontModels = _.uniq(this.ontModels);
            this.filterModelsBasedOnONT();
            } else {
                this.filterBasedOnModel();

            }
        } else {
            this.dataService.loading.next(false);
            this.dataService.regressionNoData.next(true);
            this.subscribedData = [];
            this.allModels = [];
            this.selectedModel = 1;
            this.selectedDeviceType = 'All';
            this.selectedFirmware = 'All';
            // this.dataService.getFIlterData().next({ user: this.selectedUser, model: this.selectedModel, deviceType: this.selectedDeviceType, firmwareVersion: this.selectedFirmware });
        }

    }
    private createModelONTModelArray(regData: any) {
        let ontModels = regData.map((item) => {
            return { model: item.model, ontModel: item.ontModel };
        });
        ontModels = _.filter(ontModels, (item) => {
            return item.ontModel && item.ontModel.length > 0;
        });
        if (this.showONTAfter) {
            let ontModelsArray = _.groupBy(ontModels, 'model');
            let ontModelsArray1 = Object.keys(ontModelsArray).map((key) => {
                let ontModelList = ontModelsArray[key].map((item) => {
                    return item.ontModel;
                });
                ontModelList = _.filter(ontModelList, (item) => {
                    return item && item.length > 0;
                });
                ontModelList = _.flatten(ontModelList);
                ontModelList = _.uniq(ontModelList);
                return { model: key, ontModel: ontModelList };
            });
            this.ontModelsArray.push(...ontModelsArray1);
        } else if (this.showONTPrior) {
            let ontModelPriorArray = _.groupBy(ontModels, 'ontModel');
            let ontModelPriorArray1 = Object.keys(ontModelPriorArray).map((key) => {
                let modelList = ontModelPriorArray[key].map((item) => {
                    return item.model;
                });
                modelList = _.filter(modelList, (item) => {
                    return item && item.length > 0;
                });
                modelList = _.flatten(modelList);
                modelList = _.uniq(modelList);
                return { ontModel: key, model: modelList };
            });

            this.ontModelPriorArray.push(...ontModelPriorArray1);
        }

    }

    private filterDataBasedOnModelType(tempModelType): any {
        let tmpData = this.subscribedData;
        let filteredData = [];
        let interopdata = _.filter(tmpData, obj => {
            return obj.interopModel;
        });
        if (tempModelType) {
            if (tempModelType == "Interop") {
                filteredData = interopdata;
            } else {

                filteredData = _.filter(tmpData, obj => {
                    return (!obj.interopModel || obj.interopModel === null || obj.interopModel === undefined);
                });   
                if (tempModelType == "XGSPON") {
                    filteredData = _.filter(filteredData, obj => {
                        return (obj['imType'] && obj['imType'] === "XGSPON");
                    });
                } else if (tempModelType == "DOCSIS") {
                    filteredData = _.filter(filteredData, obj => {
                        return (!obj['imType'] || obj['imType'] !== "XGSPON");
                    });
                }

            }
            return filteredData;
        } else {
            return tmpData;
        }
    }

    filterBasedOnModel(): void {
        this.dataService.loading.next(true);
        const tmpData = this.subscribedData;
        let data: any;
        if (this.selectedDeviceType && this.selectedDeviceType !== 'All') {
            let tempModelType = this.dataService.modelTypeList.filter((data) => {
                return data.deviceType == this.selectedDeviceType;
            });
            if (this.selectedModel && this.selectedModel !== 1) {

                let filteredData = [];
                if (tempModelType && tempModelType.length > 0) {
                    if (tempModelType[0]?.ModelType == "Interop" || tempModelType[0]?.modelType == "Interop") {
                        filteredData = _.filter(tmpData, obj => {
                            return obj.interopModel === this.selectedModel
                                || (obj.endPointModels && obj.endPointModels.includes(this.selectedModel))
                        });
                    } else {
                        filteredData = _.filter(tmpData, obj => {
                            return obj.model === this.selectedModel
                                || (obj.endPointModels && obj.endPointModels.includes(this.selectedModel))
                        });

                        if (tempModelType[0]?.modelType == "XGSPON" || tempModelType[0]?.ModelType == "XGSPON") {
                            filteredData = _.filter(filteredData, obj => {
                                return (obj['imType'] && obj['imType'] === "XGSPON");
                            });
                        } else if (tempModelType[0]?.modelType == "DOCSIS" || tempModelType[0]?.ModelType == "DOCSIS") {
                            filteredData = _.filter(filteredData, obj => {
                                return (!obj['imType'] || obj['imType'] !== "XGSPON");
                            });
                        }

                    }
                }
                this.subscribedData = filteredData;
                data = filteredData;

            } else if (this.selectedModel && this.selectedModel == 1) {
                data = this.filterDataByModel(tmpData, tempModelType, this.allModels);
                data = _.uniqBy(data, '_id');
                this.subscribedData = data;
            }
        } else {
            let tempFilteredData = [];
            if (this.selectedModel && this.selectedModel == 1) {
                // Get team-specific dashboard rules configuration
                var teamConfig = this.dataService.getTeamDashBoardConfig(this.selectedTeam);
                var deviceTypeList = teamConfig && teamConfig.DeviceTypeList ? teamConfig.DeviceTypeList :
                    (this.dataService.dashBoardRulesConfig ? this.dataService.dashBoardRulesConfig['DeviceTypeList'] : []);
                deviceTypeList.forEach((devicetype) => {
                    let models = [];
                    let tempModelType = this.dataService.modelTypeList.filter((data) => {
                        return data.deviceType == devicetype.DeviceType;
                    });
                    devicetype.vendorArray.forEach((res) => {
                        const data = this.modelArray.filter((data) => {
                            if (data.tfw == undefined || data.tfw == null) {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT;
                            } else {
                                return data.deviceVendor == res.Vendor && data.dut == res.DUT && data.tfw == res.TFW;
                            }
                        });
                        if (data.length > 0) {
                            models.push(...data.map(dataItem => dataItem.modelName));
                            models = _.uniq(models);
                        }
                    });
                    tempFilteredData.push(this.filterDataByModel(tmpData, tempModelType, models));
                });
                tempFilteredData = _.flatten(tempFilteredData);
            }
            else {
                tempFilteredData = _.filter(tmpData, obj => {
                    return (obj.interopModel && obj.interopModel === this.selectedModel)
                        || (obj.endPointModels && obj.endPointModels.includes(this.selectedModel))
                        || (obj.model && obj.model === this.selectedModel)
                });

            }
            tempFilteredData = _.uniqBy(tempFilteredData, '_id');
            this.subscribedData = tempFilteredData;
            data = tempFilteredData;
        }
        setTimeout(() => {
            console.log("this.subscribedData>>>>", data);
            if (this.ontModelsArray.length > 0 && this.showONTAfter) {
                if(this.selectedModel !== 1) {
                    let finalONTModels = this.ontModelsArray.filter((item) => {
                        return item.model === this.selectedModel;
                    });
                    this.ontModels = finalONTModels && finalONTModels.length > 0 ? finalONTModels[0].ontModel : [];
                    this.ontModels = _.uniq(this.ontModels);
                } else {
                    this.ontModels = this.ontModelsArray.map(item => item.ontModel);
                    this.ontModels = _.flatten(this.ontModels);
                    this.ontModels = _.uniq(this.ontModels);
                }
                this.selectedONT = this.ontModels.includes(this.selectedONT) ? this.selectedONT : 'All';
                this.filterRegsBasedonONT();
            }
            if (!this.ontModels.includes('All')) {
                this.ontModels.unshift('All');
            }
            this.updateFirmwareVersionData(data);
        }, 1000);
    }

    private updateFirmwareVersionData(data: any) {
        this.allFWVersions = [...new Set(data.map(item => item.firmwareVersion).filter(element => {
            return element && element !== 'NA' && element !== '';
        }))];
        this.nonDutFWVersions = [...new Set(data.map(item => item.trackFW).filter(element => {
            return element && element.length > 0;
        }))];
        this.fwVersionMatchedList = [];
        this.nonDutFWVersions = _.flatten(this.nonDutFWVersions);
        this.fwVersionMatchedList.push('All');
        this.fwVersionMatchedList.push(...this.allFWVersions);
        this.fwVersionMatchedList.push(...this.nonDutFWVersions);
        this.fwVersionMatchedList = _.uniq(this.fwVersionMatchedList);
        console.log("this.allFWVersions>>>>", this.allFWVersions);
        this.filterBasedOnFWVersion();
    }

    private filterDataByModel(tmpData: any, tempModelType: any[], modelList: any): any {
        let filteredData = [];
        let filtereIgniteXGSPON = [];
        modelList.forEach(modelElement => {
            tmpData.forEach((subData) => {
                if ((tempModelType[0]?.modelType !== "Interop" || tempModelType[0]?.ModelType !== "Interop") && (modelElement == subData.model || (subData.endPointModels &&
                    subData.endPointModels.includes(modelElement)))) {
                    filteredData.push(subData);
                } else if (modelElement == subData.interopModel || (subData.endPointModels &&
                    subData.endPointModels.includes(modelElement))) {

                    filteredData.push(subData);
                }
            });
        });
        let filterXGSPONorDocsis = false;
        if (tempModelType[0]?.modelType == "XGSPON" || tempModelType[0]?.ModelType == "XGSPON") {
            filterXGSPONorDocsis = true;
            filtereIgniteXGSPON = _.filter(filteredData, obj => { return obj['imType'] && obj['imType'] === "XGSPON" });
        } else if (tempModelType[0]?.modelType == "DOCSIS" || tempModelType[0]?.ModelType == "DOCSIS") {
            filterXGSPONorDocsis = true;
            filtereIgniteXGSPON = _.filter(filteredData, obj => {
                return !obj['imType'] || obj['imType'] !== "XGSPON";
            });
        }
        if (filterXGSPONorDocsis) {
            return filtereIgniteXGSPON;
        } else {
            return filteredData;
        }
    }

    filterRegsBasedonONT() {
        const tmpData = this.subscribedData;
        if (this.selectedONT !== 'All'){
            const filteredData = tmpData.filter(item => item.ontModel === this.selectedONT);
            this.subscribedData = filteredData;
            if (this.showONTPrior) {
                this.filterBasedOnModel();
            } else {
                this.updateFirmwareVersionData(tmpData);
            }
        } else {
            this.subscribedData = tmpData;
            if (this.showONTPrior) {
                this.filterBasedOnModel();
            } else {
                this.updateFirmwareVersionData(tmpData);
            }
          
        }


    }

    filterModelsBasedOnONT() {
        this.ontModels = [];
        this.ontModels = this.ontModelPriorArray.map(item => item.ontModel);
        this.ontModels = _.flatten(this.ontModels);
        this.ontModels = _.uniq(this.ontModels);
        this.ontModels.unshift('All');
        console.log('Final ONT Models with All option:', this.ontModels);
       // console.log('selected ont model', this.selectedONT);
        this.selectedONT = this.ontModels.includes(this.selectedONT) ? this.selectedONT : 'All';
        if (this.selectedONT !== 'All') {
            let finalModels = this.ontModelPriorArray.filter((item) => {
                return item.ontModel === this.selectedONT;
            });
            this.allModels = finalModels && finalModels.length > 0 ? finalModels.map(item => item.model) : [];
            this.allModels = _.flatten(this.allModels);
            this.allModels = _.uniq(this.allModels);
        }
        this.dataService.loading.next(false);
        this.filterRegsBasedonONT();

    }

    filterBasedOnRegStatus() {
        this.selectRegFormControl.valueChanges.subscribe(e => {
            this.selectedRegStatus = e;
            this.dataService.selectedRegStatus.next(e);
            this.showError = false;
            if (this.selectedRegStatus.length == 1) {
                this.showError = true;
            }
            console.log('selected reg status', this.selectedRegStatus);
            //  this.filterBasedOnUser();
        });
        setTimeout(() => {

            this.grtAllRegressionData();
        }, 1);
    }


    filterBasedOnFWVersion() {
        this.dataService.loading.next(true);
        const tmpData = this.subscribedData;
        let filteredData = tmpData;
        if (this.selectedFirmware && this.selectedFirmware !== 'All') {
            filteredData = _.filter(tmpData, obj => {
                return obj.firmwareVersion == this.selectedFirmware || (obj.trackFW
                    && obj.trackFW.includes(this.selectedFirmware))
            });
        } else {

        }
        const formattedData = this.formateData(filteredData);
        if (formattedData && formattedData.yearlyData[0].year !== 0) {

            this.dataService.regressionAnalysisData.next(formattedData);
            this.dataService.showNoRunStatus.next((this.selectedRegStatus && this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed')) ? false : true);
            this.dataService.regressionNoData.next(false);
        }
        else {
            this.dataService.regressionAnalysisData.next(formattedData);
            this.dataService.showNoRunStatus.next((this.selectedRegStatus && this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed')) ? false : true);
            this.dataService.regressionNoData.next(true);
        }
        this.dataService.loading.next(false);


    }

    triggerEvent(ev) {
        if (ev) {
            // When dropdown opens, check if only one option is selected
            this.showError = this.selectedRegStatus && this.selectedRegStatus.length === 1;
        } else {
            // When dropdown closes, hide the error
            this.showError = false;
        }
    }


    filterFWOption(event) {
        let name = event.target.value.replace(/ /g, '');
        if (Boolean(name)) {
            this.fwVersionMatchedList = this.allFWVersions.filter((el) => (el.toLowerCase()).includes(name.toLowerCase()));
        } else {
            this.fwVersionMatchedList = [];
            this.fwVersionMatchedList.push('All');
            this.fwVersionMatchedList.push(...this.allFWVersions);
        }

    }
}
