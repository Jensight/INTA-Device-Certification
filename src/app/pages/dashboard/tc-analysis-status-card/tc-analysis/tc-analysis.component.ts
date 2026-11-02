import { TestCaseInventoryService } from './../../../../@core/services/testcase-inventory.service';
import { Observable, forkJoin } from 'rxjs';
import { DataService } from './../../../../@core/services/data.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import jsPDF  from 'jspdf';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import {TcAnalysisService  } from './../../../../@core/services/tc-analysis.service';

@Component({
    selector: 'app-tc-analysis',
    templateUrl: './tc-analysis.component.html',
    styleUrls: ['./tc-analysis.component.scss']
})
export class TcAnalysisComponent implements OnInit {
    loading = true;
    user;
    allData = {};
    dataSubscription;
    allYears = [];
    allTestGroups = [];
    allTestCases = [];
    selectedTCofSelectedTG = [];
    allCharts = {};
    noData = false;
    xLabelName = 'Testgroups';


    effortSavingsArea = {};
    yearlyData = {};
    executionCountStatus = {};
    effortSavingsData = {};
    utilizationData = {};
    allMonthlyData = [];
    selectedTeam;
    selectedYear = null;
    selectedTestGroup: any = 1;
    selectedTestCase: any = 1;
    monthNames = [null, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    pdfHeight = 0;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/tc-analysis',
            label: 'Test Group Analysis'
        }
    ];
    sub1;
    sub2;
    sub3;
    selectedTestGroupForDays: any;
    selectedMonth: any;
    allDayData: any;
    currentData: any;
    showBackButton = 0;
    yearWiseData;
    detailData;
    filteredData;
    hasFilter = false;
    maxDate;
    minDate: any;
    minEndDate: any;
    filteredEndMonth: any;
    filteredEndYear: any;
    filteredMonth: any;
    filteredYear: any;
    filteredAllTgData:any;
    monthPickerData = {};
    selectedTestCaseName = "All";
    searchTestCaseFormControl = new FormControl('');
    filteredTestCases: Observable<string[]>;
    showCumulative = false;
    cumulativeUtil: any;
    constructor(public dashboardService: DashboardService, public dataService: DataService,
         public tcService: TestCaseInventoryService, public tcAnalysisService: TcAnalysisService) {
        this.user = this.dataService.getCurrentUser();
        this.dataSubscription = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
        
                this.tcAnalysisService.getRegressionYears(this.selectedTeam);
              
                if (!this.allYears || this.allYears.length === 0) {
                    this.dataService.getAllYears().subscribe(data => {
                        this.allYears = data;
                        this.fetchAllData(team);

                    });
                    this.filteredTestCases = this.searchTestCaseFormControl.valueChanges.pipe(
                        startWith(''),
                        map(value => this._filter(value || '')),
                    );
                }
            }
        });
    }
    
    private _filter(value: string) {
        if (value == "1" || value == "All") {
            if (this.selectedTestGroup !== 1) {
                console.log("thos.alltestcasses",this.allTestCases);
                return this.allTestCases.filter(a => a.tcGroupId === this.selectedTestGroup._id);
            } else {
               return this.allTestCases;
            }
        }
        const filterValue = value.toLowerCase();
        return this.selectedTCofSelectedTG.filter(option => option.tcName.toLowerCase().includes(filterValue));
    }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
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
    }

    fetchAllRegressionData(team, yearChange): void {
        this.loading = true;
         this.dataService.getyearWiseData().subscribe(data => {
            if (data) {
                this.filteredData = data?.map((element: any) => element).filter(element => {
                    return (element.year === this.selectedYear);
                });
                if (this.filteredData && this.filteredData.length > 0) {
                    if (!yearChange) {
                        this.detailData = this.filteredData;
                        setTimeout(() => {
                            this.allTestGroupCumulativeData();
                            this.loadYearlyData(false);
                        }, 20);
                        this.loading = false;
                        
                    } else {
                        this.allTestGroupCumulativeData();
                        this.filterDetailData();
                    }
                }

            }
        });
    }

    public monthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        const year = Number(array[3]);
        const month = ('0' + (this.monthNames.indexOf(array[1])).toString()).slice(-2);
        this.filteredYear = year;
        this.filteredMonth = this.monthNames.indexOf(array[1]);
        input.value = month + '/' + year;

        if ((!this.filteredEndMonth && !this.filteredEndYear) || (this.filteredEndMonth < this.filteredMonth
            && !(this.filteredYear < this.filteredEndYear)) || (this.filteredYear > this.filteredEndYear)) {
            const endMonth = document.getElementById('pickerInput2') as HTMLInputElement | null;
            endMonth.value = month + '/' + year;
            this.filteredEndMonth = this.filteredMonth;
            this.filteredEndYear = this.filteredYear;
        }
        picker.close();
        this.fetchFilteredMonthsData();
    }
    public endMonthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        this.filteredEndYear = Number(array[3]);
        this.filteredEndMonth = this.monthNames.indexOf(array[1]);
        const month = ('0' + (this.monthNames.indexOf(array[1])).toString()).slice(-2);
        const year = Number(array[3]);
        input.value = month + '/' + year;
        picker.close();
        this.fetchFilteredMonthsData();
    }

    onClear(isYearChanged): void {
        const input = document.getElementById('pickerInput') as HTMLInputElement | null;
        input.value = null;
        const input2 = document.getElementById('pickerInput2') as HTMLInputElement | null;
        input2.value = null;
        this.filteredEndYear = null;
        this.filteredEndMonth = null;
        this.filteredYear = null;
        this.filteredMonth = null;
        if (!isYearChanged) {
            this.filterDetailData();
            this.loadYearlyData(false);
        }
    }

    dateRange(): any {
        const startYear = this.filteredYear;
        const endYear = this.filteredEndYear;
        const dates = [];
        for (let i = startYear; i <= endYear; i++) {
            const endMonth = i !== endYear ? 11 : this.filteredEndMonth;
            const startMon = i === startYear ? this.filteredMonth : 0;
            for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
                dates.push(('0' + j.toString()).slice(-2));
            }
        }
        return dates;
    }

    fetchFilteredMonthsData(): any {
        this.loading = true;
        const months = this.dateRange();
        if (this.selectedTestGroup === 1) {
            if (this.showCumulative) {
                this.toggleChange();
            } else {
            const yearlyData = new Map();
            const utilization = new Map();
            const tgFailedTcs = new Map();
            this.allTestGroups.forEach(testGroup => {
                const tgUtilSum =  this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(testGroup.testGroupName);
                const tgUtilCount =  this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(testGroup.testGroupName);
                let totalSum = 0;
                let totalLength = 0;
                months.forEach(month => {
                    if (tgUtilSum && tgUtilCount) {
                        let sum = 0;
                        let count = 0;
                        const sumElement = tgUtilSum.get(Number(month));
                        const countElement = tgUtilCount.get(Number(month));
                        if (sumElement && sumElement.length > 0) {
                            sum = sumElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                        }
                        if (countElement && countElement.length > 0) {
                            count = countElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                        }
                        totalSum = totalSum + Number(sum);
                        totalLength = totalLength + Number(count);
                    }
                });
                const tempTstGrp = this.filteredData[0].tcGrpDetail.get(testGroup.testGroupName);
                const tgErrCodes = this.filteredData[0]?.monthlyErrCodes?.get(testGroup.testGroupName);
                const { failedTCs, errorCodeMap } = this.setErrorCodesForTG(months, tgErrCodes, tempTstGrp);
                const avg = totalLength > 0 ? totalSum / totalLength : 0;
                utilization.set(testGroup.testGroupName, avg);
                tgFailedTcs.set(testGroup.testGroupName, failedTCs);
                const tempData = this.setTestGroupData(testGroup, months, true);
                yearlyData.set(testGroup.testGroupName, tempData);
                this.monthPickerData['yearlyData'] = yearlyData;
                this.monthPickerData['utilizaton'] = utilization;
                this.detailData = [{ tcGrpDetail: tgFailedTcs, errorCodes: errorCodeMap }];
            });
            this.loadYearlyData(true);
            }
        } else if (this.selectedTestGroup !== 1){
            if (this.selectedTestCase === 1) {
                const tgFailedTcs = new Map();
                const tgErrCodes = this.filteredData[0]?.monthlyErrCodes?.get(this.selectedTestGroup.testGroupName);
                const tempTstGrp = this.filteredData[0].tcGrpDetail.get(this.selectedTestGroup.testGroupName);
                const { failedTCs, errorCodeMap } = this.setErrorCodesForTG(months, tgErrCodes, tempTstGrp);
                tgFailedTcs.set(this.selectedTestGroup.testGroupName, failedTCs);
                this.detailData = [{ tcGrpDetail: tgFailedTcs, errorCodes: errorCodeMap }];
            } else {
                this.SetErrorCodesForTC();
            }
            const tempData = this.selectedTestCase !== 1 ? this.setTestGroupData(this.selectedTestCase._id, months, false) :
            this.setTestGroupData(this.selectedTestGroup, months, false);
            const tcUtilization = this.selectedTestCase !== 1 ?
            this.filteredData[0]?.tstCaseUtilization.get(this.selectedTestCase._id) : null;
            const tgSum = this.selectedTestCase !== 1 ?
            null : this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(this.selectedTestGroup.testGroupName);
            const tgCount = this.selectedTestCase !== 1 ?
            null : this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(this.selectedTestGroup.testGroupName);
            this.selectedTestCase !== 1 ? this.updateMonthlyData(tempData, tgSum, tgCount, tcUtilization, true, true) :
            this.updateMonthlyData(tempData, tgSum, tgCount, tcUtilization, false, true) ;
        }
        this.loading = false;
    }

    private setErrorCodesForTG(months: any, tgErrCodes: any, tempTstGrp: any) {
        const failedTCs = [];
        const errorCodeMap = new Map();
        months.forEach(month => {
            let monthData;
            if (tgErrCodes) {
                tgErrCodes.forEach(tgErrCode => {
                    if (tgErrCode.month === month) {
                        tgErrCode.errCodes.forEach((value, key) => {
                            const errorCodeCount = errorCodeMap.size > 0 ? errorCodeMap.has(key) ?
                                errorCodeMap.get(key) + value : value : value;
                            errorCodeMap.set(key, errorCodeCount);
                        });
                    }
                });
            }
            monthData = tempTstGrp?.map((element: any) => element).filter(element => {
                return (element.month === month);
            });
            if (monthData && monthData.length > 0) {
                failedTCs.push(monthData);
            }
        });
        return { failedTCs, errorCodeMap };
    }

    private setTestGroupData(testGroup: any, months: any, allTGSelected: boolean): any {
        const tempData = {
            totalTC: 0,
            passTC: 0,
            failTC: 0,
            norunTC: 0,
            autoExec: 0,
            manualExec: 0,
            day: null,
            month: null,
            year: null
        };
        const testGroupData = this.selectedTestCase && this.selectedTestCase !== 1 ?
        this.filteredData[0].tcData.get(this.selectedTestCase._id) :
        this.filteredData[0].monthlyData.get(testGroup.testGroupName);
        if (testGroupData && testGroupData.length > 0) {
            if (allTGSelected) {
                months.forEach(month => {
                    testGroupData.forEach(ele => {
                    if (ele.month === month.toString()) {
                        tempData.totalTC = tempData.totalTC + ele.totalTC;
                        tempData.passTC = tempData.passTC + ele.passTC;
                        tempData.failTC = tempData.failTC + ele.failTC;
                        tempData.norunTC = tempData.norunTC + ele.norunTC;
                        tempData.autoExec = tempData.autoExec + ele.autoExec;
                        tempData.manualExec = tempData.manualExec + ele.manualExec;
                        tempData.month = ele.month;
                        tempData.year = this.selectedYear;
                    }
                });
                });
                return tempData;

            } else {
               const tempArr = [];
               months.forEach(month => {
                testGroupData.forEach(ele => {
                if (ele.month === month.toString()) {
                    tempArr.push(ele);
                }
            });
            });
               return tempArr;
            }
        } else if (this.selectedTestCase && this.selectedTestCase !== 1) {
            const tempArr = [];
            tempArr.push(tempData);
        } else {
            return tempData;
        }
    }

    /** Handler */
    categoryMapHander(categoryMap): void {
    }
    /** Handler */
    reasonMapHander(categoryMap): void {
    }

    filterDetailData(): void {
        this.hasFilter = false;
        if (this.filteredData[0].year !== this.selectedYear.toString()) {
            this.dataService.getyearWiseData().subscribe(data => {
                if (data) {
                    this.filteredData = data?.map((element: any) => element).filter(element => {
                        return (element.year === this.selectedYear);
                    });
                    this.loading = false;
                }
            });
        } else {
            if (this.filteredMonth && this.filteredEndMonth) {
            this.fetchFilteredMonthsData();

            } else {
                this.loadYearlyData(false);
                 this.loading = false;

            }
        }
        if (this.selectedTestGroup !== 1 && this.selectedTestCase === 1) {
            this.hasFilter = true;
            if (this.filteredMonth && this.filteredEndMonth) {
                const tgFailedTcs = new Map();
                const tgErrCodes = this.filteredData[0]?.monthlyErrCodes?.get(this.selectedTestGroup.testGroupName);
                const tempTstGrp = this.filteredData[0].tcGrpDetail.get(this.selectedTestGroup.testGroupName);
                const { failedTCs, errorCodeMap } = this.setErrorCodesForTG(this.dateRange(), tgErrCodes, tempTstGrp);
                tgFailedTcs.set(this.selectedTestGroup.testGroupName, failedTCs);
                this.detailData = [{ tcGrpDetail: tgFailedTcs, errorCodes: errorCodeMap }];
            } else {
                const tempTstGrp = this.filteredData[0].tcGrpDetail.get(this.selectedTestGroup.testGroupName);
                const tcGrpDetail = new Map();
                const errorCodes = this.filteredData[0].tstGrpErrCodes.get(this.selectedTestGroup.testGroupName);
                tcGrpDetail.set(this.selectedTestGroup.testGroupName, tempTstGrp);
                this.detailData = [{ tcGrpDetail, errorCodes }];
            }

        } else if (this.selectedTestGroup !== 1 && this.selectedTestCase !== 1) {
             this.hasFilter = true;
            this.SetErrorCodesForTC();
        } else {
            this.detailData = this.filteredData;
        }
    }

    SetErrorCodesForTC(): void {
        const tempTstGrp = this.filteredData[0].tcGrpDetail.get(this.selectedTestGroup.testGroupName);
        const temptc = tempTstGrp?.map((element: any) => element).filter(element => {
            return (element.tcName === this.selectedTestCase.tcName);
        });
        const tcGrpDetail = new Map();
        const errorCodes = new Map();
        tcGrpDetail.set(this.selectedTestCase.tcName, temptc);
        if (temptc && temptc.length) {
            temptc.forEach(tc => {
                if (tc.tcErrorCode) {
                    tc.tcErrorCode.forEach(errCode => {
                        const errCodeVal = errorCodes.size > 0 ? errorCodes.has(errCode) ?
                            errorCodes.get(errCode) + 1 : 1 : 1;
                        errorCodes.set(errCode, errCodeVal);

                    });
                }
            });
        }
        this.detailData = [{ tcGrpDetail, errorCodes }];
    }

    fetchAllData(team) {
        if (this.allYears?.length > 0) {
            this.noData = false;
            this.selectedYear = this.allYears[0];
            this.setMinMaxValues();
            this.sub1 = this.dataService.getTestGroup().subscribe(tg => {
                this.allTestGroups = tg;
            });
            this.sub2 = this.dataService.getTestCases().subscribe(tc => {
                this.allTestCases = tc;
            });
            this.dataService.tcAnalysisData.next(false);
            this.fetchAllRegressionData(this.selectedTeam, false);
            this.dataService.loading.next(false);
        } else {
            this.dataService.tcAnalysisData.next(true);
            this.noData = true;
        }
        // });
        //    }
        //  });
    }

    private setMinMaxValues(): void {
        this.minDate = new Date(Number(this.selectedYear), 0, 1);
        this.minEndDate = new Date(Number(this.selectedYear), 0, 1);
        this.maxDate = Number(this.selectedYear) === new Date().getFullYear() ? new Date()
            : new Date(Number(this.selectedYear), 11, 31);
    }

    updateTestGroup() {
        this.showCumulative = false;
        this.selectedTestCase = 1;
        this.selectedTestCaseName = "All";
        this.searchTestCaseFormControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        if (this.selectedTestGroup !== 1) {
            this.selectedTCofSelectedTG = this.allTestCases.filter(a => a.tcGroupId === this.selectedTestGroup._id);
            // this.loadYearlyData();
            this.filterDetailData();
        } else {
            this.selectedTCofSelectedTG = [];
            this.filterDetailData();
            // this.loadYearlyData();
        }
    }

    loadYearlyData(monthSelected: boolean) {
        const groupName = [];
        const count = [];
        const fail = [];
        const manualExec = [];
        const autoExec = [];
        const noRun = [];
        const pass = [];
        const passExecution = {
            name: 'Passed',
            type: 'bar',
            data: pass,
            barMinHeight: 2
        };
        const failedExecution = {
            name: 'Failed',
            type: 'bar',
            data: fail,
            barMinHeight: 2
        };
        const noExecution = {
            name: 'No Execution',
            type: 'bar',
            data: noRun,
            barMinHeight: 2
        };
        if (this.selectedTestGroup === 1) {
            this.xLabelName = 'Testgroups';
            this.noData = false;
            const data = monthSelected ? this.monthPickerData['yearlyData'] : this.filteredData[0].yearlyData;
            const tstGrpUtilization = monthSelected ? this.monthPickerData['utilizaton'] : this.filteredData[0].tstGrpUtilization;
            data.forEach((element: any, group: any) => {
                groupName.push(group);
                count.push(element.totalTC);
                fail.push(element.failTC);
                manualExec.push(Math.round((element.manualExec + Number.EPSILON) * 100) / 100);
                noRun.push(element.norunTC);
                pass.push(element.passTC);
                autoExec.push(Math.round((element.autoExec + Number.EPSILON) * 100) / 100);
            });
            this.yearlyData['xLabel'] = groupName;
            this.yearlyData['series'] = [passExecution, failedExecution, noExecution];
            this.yearlyData = { ... this.yearlyData };
            const series = [];
            for (let index = 0; index < groupName.length; index++) {
                const element = groupName[index];
                const temp = { name: element, value: count[index] };
                series.push(temp);
            }
            this.executionCountStatus['legends'] = groupName;
            this.executionCountStatus['series'] = series;
            this.executionCountStatus = { ...this.executionCountStatus };
            const effortSavings = [];
            const yAxis = [
                { barMaxWidth: 30, name: 'Automation Effort', stack: 1, data: [], type: 'line' },
                { name: 'Manual Effort', data: [], type: 'line' },
                { name: 'Effort Savings', data: [], type: 'line', areaStyle: {} }
            ];
            for (let index = 0; index < manualExec.length; index++) {
                const element = manualExec[index];
                const savings = element - autoExec[index];
                effortSavings.push(Math.round((savings + Number.EPSILON) * 100) / 100);
            }
            yAxis[1].data = manualExec;
            yAxis[0].data = autoExec;
            yAxis[2].data = effortSavings;
            this.effortSavingsData['xLabel'] = groupName;
            this.effortSavingsData['yLabel'] = yAxis;
            this.effortSavingsData = { ...this.effortSavingsData };

            const yAxisEffortSavings = [{ name: 'Effort Savings', data: effortSavings, type: 'line', areaStyle: {} }];
            this.effortSavingsArea['xLabel'] = groupName;
            this.effortSavingsArea['yLabel'] = yAxisEffortSavings;
            this.effortSavingsArea = { ...this.effortSavingsArea };


            const unUtilization = [];
            const utilizationYAxis = [{ barMaxWidth: 30, name: 'Utilization (%)', stack: 1, data: [], type: 'line' }];
            groupName.forEach(group => {
                let roundValue = 0;
                if (monthSelected) {
                    const element = tstGrpUtilization.get(group);
                    if (element) {
                        roundValue = Math.round(element * 100) / 100;
                        unUtilization.push(roundValue);
                    } else {
                        unUtilization.push(0);
                    }

                    }else {
                        const sumElement = tstGrpUtilization.testGrpUtilSum.get(group);
                        const countElement = tstGrpUtilization.testGrpUtilCount.get(group);
                        if (sumElement && sumElement.length > 0 && countElement && countElement.length > 0) {
                            const tgsum = sumElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                            const tgcount = countElement.reduce((prev, curr) =>  Number(prev) + Number(curr), 0);
                            const finalVal = tgcount > 0 ? tgsum / tgcount : 0;
                            const avg = (finalVal) * 100;
                            roundValue = Math.round(avg * 100) / 100;
                            unUtilization.push(roundValue);
                        } else {
                            unUtilization.push(0);
                        }
                    }
               
            });
            utilizationYAxis[0].data = unUtilization;
            this.utilizationData['xLabel'] = groupName;
            this.utilizationData['yLabel'] = utilizationYAxis;
            this.utilizationData = { ...this.utilizationData };
        } else {
            this.xLabelName = 'Months';
            let monthlyData;
            let utilization;
            let isTestCase;
            let tgSum;
            let tgCount;
            if (this.selectedTestCase === 1) {
                monthlyData = this.filteredData[0]?.monthlyData?.get(this.selectedTestGroup.testGroupName);
                tgSum = this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(this.selectedTestGroup.testGroupName);
                tgCount = this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(this.selectedTestGroup.testGroupName);
                isTestCase = false;
            } else {
                monthlyData = this.filteredData[0]?.tcData.get(this.selectedTestCase._id);
                utilization = this.filteredData[0]?.tstCaseUtilization.get(this.selectedTestCase._id);
                isTestCase = true;
            }
            this.updateMonthlyData(monthlyData, tgSum, tgCount, utilization, isTestCase);

        }
    }

    yearChange(): void {
        this.loading = true;
        this.onClear(true);
        this.setMinMaxValues();
        this.allMonthlyData = [];   
        this.showCumulative = false;
        this.fetchAllRegressionData(this.selectedTeam, true);
    }
    
    clearSearchField() {
        this.selectedTestCase = "";
        this.selectedTestCaseName = "";
        this.noData = true;
    }

    updateMonthlyData(monthlyData, tgUtilSum, tgUtilCount, tcUtilization, isTestCase, monthSelected ?: boolean) {
        let groupName = [];
        const count = [];
        const fail = [];
        const manualExec = [];
        const autoExec = [];
        const noRun = [];
        const pass = [];
        const passExecution = {
            name: 'Passed',
            type: 'bar',
            data: pass,
            barMinHeight: 2
        };
        const failedExecution = {
            name: 'Failed',
            type: 'bar',
            data: fail,
            barMinHeight: 2
        };
        const noExecution = {
            name: 'No Execution',
            type: 'bar',
            data: noRun,
            barMinHeight: 2
        };
        let totalPassTC = 0;
        let totalFail = 0;
        let totalNoRun = 0;
        let totalCount = 0;
        if (monthlyData) {
            console.log("monthlydata>>628", monthlyData);
            monthlyData.sort((a, b) => a.month - b.month);
            monthlyData.forEach(element => {
                console.log("element>>", element);
                groupName.push(element.month);
                count.push(element.totalTC);
                totalCount += element.totalTC;
                fail.push(element.failTC);
                totalFail += element.failTC;
                manualExec.push(Math.round((element.manualExec + Number.EPSILON) * 100) / 100);
                noRun.push(element.norunTC);
                totalNoRun += element.norunTC;
                pass.push(element.passTC);
                totalPassTC += element.passTC;
                autoExec.push(Math.round((element.autoExec + Number.EPSILON) * 100) / 100);
            });
        }
        const months = groupName;
        groupName = groupName.map(a => this.monthNames[a.replace(/^0+/, '')]);
        this.yearlyData['xLabel'] = groupName;
        this.yearlyData['series'] = [passExecution, failedExecution, noExecution];
        this.yearlyData = { ... this.yearlyData };
        const series = [];
        if (totalCount === 0) {
            this.noData = true;
        } else {
            this.noData = false;
        }
        const tgDetails = {};
        tgDetails['pass'] = totalPassTC;
        tgDetails['fail'] = totalFail;
        tgDetails['noRun'] = totalNoRun;
        series.push({ name: 'Passed', value: tgDetails['pass'] });
        series.push({ name: 'Failed', value: tgDetails['fail'] });
        series.push({ name: 'No Run', value: tgDetails['noRun'] });
        this.executionCountStatus['legends'] = ['Passed', 'Failed', 'No Run'];
        this.executionCountStatus['series'] = series;
        this.executionCountStatus = { ...this.executionCountStatus };

        const effortSavings = [];
        const yAxis = [{ name: 'Manual Effort', data: [], type: 'line' },
        { barMaxWidth: 30, name: 'Automation Effort', stack: 1, data: [], type: 'line' },
        { name: 'Effort Savings', data: [], type: 'line', areaStyle: {} }];
        for (let index = 0; index < manualExec.length; index++) {
            const element = manualExec[index];
            const savings = element - autoExec[index];
            effortSavings.push(Math.round((savings + Number.EPSILON) * 100) / 100);
        }
        yAxis[0].data = manualExec;
        yAxis[1].data = autoExec;
        yAxis[2].data = effortSavings;
        this.effortSavingsData['xLabel'] = groupName;
        this.effortSavingsData['yLabel'] = yAxis;
        this.effortSavingsData = { ...this.effortSavingsData };

        const yAxisEffortSavings = [{ name: 'Effort Savings', data: effortSavings, type: 'line', areaStyle: {} }];
        this.effortSavingsArea['xLabel'] = groupName;
        this.effortSavingsArea['yLabel'] = yAxisEffortSavings;
        this.effortSavingsArea = { ...this.effortSavingsArea };
        const unUtilization = [];
        const utilizationYAxis = [{ barMaxWidth: 30, name: 'Utilization (%)', stack: 1, data: [], type: 'line' }];
        this.getMonthlyUtilization(isTestCase, months,  tgUtilSum, tgUtilCount, tcUtilization, unUtilization);
        utilizationYAxis[0].data = unUtilization;
        this.utilizationData['xLabel'] = groupName;
        this.utilizationData['yLabel'] = utilizationYAxis;
        this.utilizationData = { ...this.utilizationData };
    }

    private getMonthlyUtilization(isTestCase: any, months: any[],
                                  tgUtilSum: any, tgUtilCount: any, utilization: any, unUtilization: any[]): void {
        if (isTestCase) {
            months.forEach(month => {
                if (utilization) {
                    const element = utilization.get(Number(month));
                    if (element) {
                        const roundValue = Math.round(element * 100) / 100;
                        unUtilization.push(roundValue);
                    } else {
                        unUtilization.push(0);
                    }
                } else {
                    unUtilization.push(0);
                }
            });
        } else {
            let totalSum = 0;
            let totalCount = 0;
            months.forEach(month => {
                console.log('month', month, tgUtilCount, tgUtilSum);
                if (tgUtilSum && tgUtilCount) {
                    const sumElement = tgUtilSum.get(Number(month));
                    const countElement = tgUtilCount.get(Number(month));
                    if (sumElement && sumElement.length > 0 && countElement && countElement.length > 0) {
                        const sum = sumElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                        const count = countElement.reduce((prev, curr) =>  Number(prev) + Number(curr), 0);
                        totalSum = totalSum + sum;
                        totalCount = totalCount + count;
                        const avg = totalCount > 0 ? (totalSum / totalCount) : 0;
                        const roundValue = Math.round(avg * 100) / 100;
                        unUtilization.push(roundValue);
                    } else {
                        unUtilization.push(0);
                    }
                } else {
                    unUtilization.push(0);
                }
            });
        }
    }

    updateCharts(event) {
        this.allCharts = { ...this.allCharts, ...event };
    }

    downloadReport() {
        this.dataService.loading.next(true);
        setTimeout(() => {
            this.downloadReports();
        }, 200);

    }

    async downloadReports() {
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.text('Testcase Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text('Year', 20, 20);
        doc.text(': ' + this.selectedYear, 43, 20);
        doc.text('Testgroup', 20, 25);
        doc.text(': ' + (this.selectedTestGroup === 1 ? 'All' : this.selectedTestGroup.testGroupName), 43, 25);
        doc.text('Testcase', 20, 30, );
        doc.text(': ' + (this.selectedTestCase === 1 ? 'All' : this.selectedTestCase.tcName), 43, 30);
        doc.text(`Report Date`, 20, 35);
        doc.text(`:  ${new Date()}`, 43, 35);
        doc.text(`Generated By`, 20, 40);
        doc.text(`:  ${this.user.username}`, 43, 40);
        doc.line(0, 42, 300, 42);
        this.pdfHeight = 55;
        if (this.allCharts['yearlyStatus']) {
            doc.text('Yearly Status', 90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['yearlyStatus'].getDataURL({ pixelRatio: 2 }),
                'png',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }

        }

        if (this.allCharts['executionCount']) {
            doc.text('Execution Status', 90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['executionCount'].getDataURL({ pixelRatio: 2 }),
                'PNG',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }

        if (this.allCharts['effortSavings']) {
            doc.text('ROI(Manual vs Automation Effort)', 90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['effortSavings'].getDataURL({ pixelRatio: 2 }),
                'PNG',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if (this.allCharts['efforSavingsArea']) {
            doc.text('Effor Savings', 90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['efforSavingsArea'].getDataURL({ pixelRatio: 2 }),
                'JPEG',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if (this.allCharts['utilization']) {
            doc.text('Yearly Utilization', 90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['utilization'].getDataURL({ pixelRatio: 2 }),
                'JPEG',
                15,
                this.pdfHeight,
                190,
                100,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }

        await doc.save(`iCAT-TC-Report(${this.selectedYear + (this.selectedTestGroup !== 1 ? ' - ' + this.selectedTestGroup.testGroupName : '') + (this.selectedTestCase !== 1 ? ' - ' + this.selectedTestCase.tcName : '')}).pdf`);
        this.dataService.loading.next(false);

    }

    updateTestCase() {
        let temp = this.allTestCases.filter((element) => {
            return (element.tcName === this.selectedTestCaseName)
        });
        this.selectedTestCase = temp[0];
        if (!this.selectedTestCase && (!this.selectedTestCaseName || this.selectedTestCaseName == "All")) {
            this.selectedTestCase = 1;
            this.selectedTestCaseName = "All";
        }
        if (this.selectedTestCase !== 1) {
            if (!this.selectedTestCase && this.selectedTestCaseName) {
                this.noData = true;
            } else {
            const monthlyData = this.filteredData[0].tcData.get(this.selectedTestCase._id);
            const utilization = this.filteredData[0]?.tstCaseUtilization.get(this.selectedTestCase._id);
            this.updateMonthlyData(monthlyData, null, null, utilization, true);
            this.filterDetailData();
            }
        } else {
            this.updateTestGroup();
        }

    }

    yearSelected(event): void {
        if (this.filteredData[0].monthlyData.get(event.name) !== undefined) {
            this.showBackButton = 1;
            this.xLabelName = 'Months';
            this.selectedTestGroupForDays = event.name;
            this.selectedTestGroup = this.allTestGroups.filter(element => {
                return (element.testGroupName === event.name);
            })[0];
            this.updateTestGroup();
            const monthlyData = this.filteredData[0].monthlyData.get(event.name);
            const tgSum = this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(event.name);
            const tgCount = this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(event.name);
            this.updateMonthlyData(monthlyData, tgSum, tgCount, null, false);
        } else if (this.xLabelName !== 'Days') {
            this.showBackButton = 1;
            this.xLabelName = 'Days';
            let monthlyData = [];
            if (this.selectedTestGroup === 1) {
                monthlyData = this.filteredData[0].dailyData.get(this.selectedTestGroupForDays);
            } else {
                this.selectedTestGroupForDays = this.selectedTestGroup.testGroupName;
                monthlyData = this.filteredData[0].dailyData.get(this.selectedTestGroup.testGroupName);
            }
            this.selectedMonth = event.name;
            this.updateDayData(monthlyData);
        }

    }

    // Date Data

    updateDayData(monthlyData) {
        const year = Number(this.selectedYear);
        const month = Number(this.monthNames.indexOf(this.selectedMonth));
        this.allDayData = this.filteredData[0].dailyData.get(this.selectedTestGroupForDays) || [];
        setTimeout(() => {
            this.loadYearsAndMonth(year, month);
            this.loadData(year, month);
            this.loading = false;
        }, 100);
    }

    loadYearsAndMonth(year, month) {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month };
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => String(data.year) + String(data.month));
        const allDataLastIndex = uniqYearsandMonth.length - 1;
        const index = _.findIndex(uniqYearsandMonth, { year, month });
        // if (uniqYearsandMonth.length === 1) {
        //     this.next = false;
        //     this.back = false
        // }
        // else if (index === 0) {
        //     this.next = true;
        //     this.back = false
        // } else if (index === allDataLastIndex) {
        //     this.next = false;
        //     this.back = true;
        // } else {
        //     this.next = true;
        //     this.back = true;
        // }
    }

    loadData(selectedyear, selectedmonth) {
        const month = ('0' + selectedmonth.toString()).slice(-2);
        const year = selectedyear.toString();
        const currentData = _.filter(this.allDayData, { year, month });
        if (currentData.length < 0) {
            const dailyData = this.allDayData;
            const maxDailydata = dailyData[dailyData.length - 1];
        } else {
            this.selectedYear = selectedyear;
            this.selectedMonth = selectedmonth;
            this.currentData = currentData;
            this.processData();
        }
    }

    /* based on data performs the action to generate report */
    processData() {
        const groupName = [];
        const count = [];
        const fail = [];
        const manualExec = [];
        const autoExec = [];
        const noRun = [];
        const pass = [];
        const regressionCount = [];
        const utilizedCount = [];
        const passExecution = {
            name: 'Passed',
            type: 'bar',
            data: pass,
            barMinHeight: 2
        };
        const failedExecution = {
            name: 'Failed',
            type: 'bar',
            data: fail,
            barMinHeight: 2
        };
        const noExecution = {
            name: 'No Execution',
            type: 'bar',
            data: noRun,
            barMinHeight: 2
        };
        this.currentData.sort((a, b) => a.day - b.day);
        let totalPassTC = 0;
        let totalFail = 0;
        let totalNoRun = 0;
        let totalCount = 0;
        // for (let index = 0; index < this.currentData.length; index++) {
        //  const element = this.currentData[index];
        this.currentData.forEach(element => {
            groupName.push(element.day);
            count.push(element.totalTC);
            totalCount += element.totalTC;
            fail.push(element.failTC);
            totalFail += element.failTC;
            manualExec.push(Math.round((element.manualExec + Number.EPSILON) * 100) / 100);
            noRun.push(element.norunTC);
            totalNoRun += element.norunTC;
            pass.push(element.passTC);
            totalPassTC += element.passTC;
            // regressionCount.push(element['regressionCount']);
            // utilizedCount.push(element['utilizedCount']);
            autoExec.push(Math.round((element.autoExec + Number.EPSILON) * 100) / 100);
        });
        // groupName = groupName.map(a => this.monthNames[a]);
        this.yearlyData['xLabel'] = groupName;
        this.yearlyData['series'] = [passExecution, failedExecution, noExecution];
        this.yearlyData = { ... this.yearlyData };
        let tgDetails = _.find(this.filteredData[0], { tcGroupId: this.selectedTestGroup._id });
        const series = [];
        if (totalCount === 0) {
            this.noData = true;
        } else {
            this.noData = false;
        }
        tgDetails = {};
        tgDetails.pass = totalPassTC;
        tgDetails.fail = totalFail;
        tgDetails.noRun = totalNoRun;
        series.push({ name: 'Passed', value: tgDetails.pass });
        series.push({ name: 'Failed', value: tgDetails.fail });
        series.push({ name: 'No Run', value: tgDetails.noRun });
        this.executionCountStatus['legends'] = ['Passed', 'Failed', 'No Run'];
        this.executionCountStatus['series'] = series;
        this.executionCountStatus = { ...this.executionCountStatus };
    }

    return(): void {
        if (this.xLabelName === 'Months') {
            this.showBackButton = 0;
            this.selectedTestGroup = 1;
            this.filterDetailData();
        } else if (this.xLabelName === 'Days') {
            this.xLabelName = 'Months';
            let monthlyData = [];
            let utilization = [];
            let isTestCase;
            let tgSum;
            let tgCount;
            if (this.selectedTestGroup === 1) {
                monthlyData = this.filteredData[0].monthlyData.get(this.selectedTestGroupForDays);
            } else {
                if (this.selectedTestCase !== 1) {
                    this.showBackButton = 0;
                    monthlyData = this.filteredData[0].tcData.get(this.selectedTestCase._id);
                    utilization = this.filteredData[0].tstCaseUtilization.get(this.selectedTestCase._id);
                    tgSum = null;
                    tgCount = null;
                    isTestCase = true;
                } else {
                    monthlyData = this.filteredData[0].monthlyData.get(this.selectedTestGroup.testGroupName);
                    utilization = null;
                    tgSum = this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(this.selectedTestGroup.testGroupName);
                    tgCount = this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(this.selectedTestGroup.testGroupName);
                    isTestCase = false;
                }
            }
            this.updateMonthlyData(monthlyData, tgSum, tgCount, utilization, isTestCase);
        }
    }
   
    toggleChange() {
        this.xLabelName = this.showCumulative ? 'Months' : 'Testgroups';
        if (this.showCumulative) {
            if (this.filteredMonth && this.filteredEndMonth) {
                const tempData = [];
                const tempUtilSum = new Map();
                const tempUtilCount = new Map();
                const months = this.dateRange();
                months.forEach(month => {
                    const data = this.allMonthlyData.filter(element => {
                        return (element.month === month);
                    });
                    if (data.length > 0) {
                        tempData.push(data[0]);
                    }
                    tempUtilSum.set(Number(month), this.cumulativeUtil.utilSum.get(Number(month)));
                    tempUtilCount.set(Number(month), this.cumulativeUtil.utilCount.get(Number(month)));
                });
                console.log("filteredData1186", tempData, this.cumulativeUtil, tempUtilSum,  tempUtilCount);
                this.updateMonthlyData(tempData, tempUtilSum, tempUtilCount, null, false, null);
            }
            else {
                console.log("filteredData1186 else", this.cumulativeUtil);
                this.updateMonthlyData(this.allMonthlyData, this.cumulativeUtil.utilSum, this.cumulativeUtil.utilCount, null, false, null);
            }
        }
        else {
            this.loadYearlyData(false);
        }


        console.log("showCumulative", this.showCumulative);
    }

    allTestGroupCumulativeData() {

        let monthData;
        const temp = {
            totalTC: 0,
            passTC: 0,
            failTC: 0,
            norunTC: 0,
            autoExec: 0,
            manualExec: 0,
            day: null,
            month: null,
            year: null
        };
        const utilSum = new Map();
        const utilCount = new Map();
        this.allTestGroups.forEach(testGroup => {
            const data = this.filteredData[0].monthlyData?.get(testGroup.testGroupName);
            const tgUtilSum =  this.filteredData[0]?.monthlyUtilization?.tgUtilizationSum.get(testGroup.testGroupName);
            const tgUtilCount =  this.filteredData[0]?.monthlyUtilization?.tgUtilizationCont.get(testGroup.testGroupName);
            for (let i = 1; i <= 12; i++) {
                monthData = null;
                monthData = data?.map((element: any) => element).filter(element => {
                    return (element.month === ('0' + i.toString()).slice(-2));
                });
                if (monthData && monthData.length > 0) {
                    const existingDataIndex = this.allMonthlyData.findIndex(element => element.month === ('0' + i.toString()).slice(-2));
                    if (existingDataIndex >= 0) {
                        this.allMonthlyData[existingDataIndex].totalTC += monthData[0].totalTC;
                        this.allMonthlyData[existingDataIndex].passTC += monthData[0].passTC;
                        this.allMonthlyData[existingDataIndex].failTC += monthData[0].failTC;
                        this.allMonthlyData[existingDataIndex].norunTC += monthData[0].norunTC;
                        this.allMonthlyData[existingDataIndex].autoExec += monthData[0].autoExec;
                        this.allMonthlyData[existingDataIndex].manualExec += monthData[0].manualExec;
                    } else {
                        const tempData = { ...temp };
                        tempData.totalTC = monthData[0].totalTC;
                        tempData.passTC = monthData[0].passTC;
                        tempData.failTC = monthData[0].failTC;
                        tempData.norunTC = monthData[0].norunTC;
                        tempData.autoExec = monthData[0].autoExec;
                        tempData.manualExec = monthData[0].manualExec;
                        tempData.day = monthData[0].day;
                        tempData.month = monthData[0].month;
                        tempData.year = monthData[0].year;
                        this.allMonthlyData.push(tempData);
                    }
                }
                if (tgUtilSum && tgUtilCount) {
                    let sum = 0;
                    let count = 0;
                    const sumElement = tgUtilSum.get(Number('0' + i.toString().slice(-2)));
                    const countElement = tgUtilCount.get(Number('0' + i.toString().slice(-2)));
                    if (sumElement && sumElement.length > 0) {
                        sum = sumElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                    }
                    if (countElement && countElement.length > 0) {
                        count = countElement.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                    }
                    const totalSum = utilSum.size > 0 ? utilSum.has(i) ? utilSum.get(i) : [] : [];
                    const totalLength = utilCount.size > 0 ? utilCount.has(i) ? utilCount.get(Number(i)) : [] : [];
                    totalSum.push(sum);
                    totalLength.push(count);
                    utilSum.set(i, totalSum);
                    utilCount.set(i, totalLength);
                }


            }
        });
        this.cumulativeUtil = {utilSum, utilCount};
        console.log('cumulative util @ 1211', this.cumulativeUtil);
    }

    ngOnInit(): void { }
}
