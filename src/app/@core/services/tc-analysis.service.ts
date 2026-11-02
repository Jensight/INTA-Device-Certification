import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Observable, forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { jsPDF } from 'jspdf';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TestCaseInventoryService } from './testcase-inventory.service';


@Injectable({
  providedIn: 'root'
})
export class TcAnalysisService {
  public  allJobs = [];
  public yearWiseData: any;
  public allTestGroups = new Map();
  public allTestCases: any;
  public user: any;
  public dataSubscription: any;
  public selectedTeam: any;

  constructor(private http: HttpClient,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private dashboardService: DashboardService,
    public tcService: TestCaseInventoryService) {
    this.user = this.dataService.getCurrentUser();
    this.dataSubscription = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
     
        this.getRegressionYears(team);


      }
    });
    this.tcService.getAllData().subscribe(data => {
        if (data) {
            this.dataService.getTcInventoryData().next(data);
            this.dataService.getTestGroup().subscribe(testGroups => {
                if (testGroups) {
                    testGroups.forEach( tg => {
                        this.allTestGroups.set(tg._id, tg.testGroupName);
                    });
                }
            });
            this.dataService.getTcInventoryData().subscribe (dt => {
                if (dt){
                    this.allTestCases = dt;
                }
            });
        }
    });

  }




    getRegressionYears(team: any): void {
        this.dashboardService.getAllRegressionYears().subscribe(data => {
            if (data) {
                let tempArr = [];
                data['years'].forEach(dt => {
                    tempArr.push(dt.toString());
                });
                tempArr = tempArr.reverse();
                this.dataService.getAllYears().next(tempArr);
                tempArr.forEach(year => {
                    this.getAllRegressionData(team, year);
                    });
            }
        });
    }
 
     /* setting  all regression data for test group analysis */
    private getAllRegressionData(team: any, year: string): void{
        this.dashboardService.getAllRegressionData(year).subscribe(data => {
            if (data) {
                this.yearWiseData = this.yearWiseData ? [...this.yearWiseData, ...this.groupByYear(data['data'], year)]
                    : this.groupByYear(data['data'], year);
                this.dataService.getyearWiseData().next(this.yearWiseData);
            }
        });
    }
    groupByYear(data, selectedYear): any {
        const yeardata = {};
        let year = null;
        const monthlyData = [];
        const execDetails = new Map();
        const allTCDetails = new Map();
        data.forEach(dt => {
            this.allJobs =  [...this.allJobs, ...dt['job']];
        });
        data.forEach(dt => {
            dt.job.forEach(ele => {
                if (ele.onExecution && ele.onExecution.length > 0) {
                    ele.onExecution.forEach(tc => {
                        const tcDetails = {
                            _id: tc._id,
                            tcName: tc.tcName,
                            user: dt.user,
                            year: ele.jobStartTime ? ele.jobStartTime.split('-')[0] : null,
                            month: ele.jobStartTime ? ele.jobStartTime.split('-')[1] : null,
                            day: ele.jobStartTime ? ele.jobStartTime.split('-')[2]?.slice(0, 2) : null,
                            tcErrorCode: tc.tcErrorCode ? Object.values(tc.tcErrorCode) : [],
                            tcGroup: tc.tcGroup,
                            status: tc.tcStatus,
                            autoExec: tc.autoExectime,
                            manualExec: tc.manualExectime
                        };
                        const tempTCDetails = allTCDetails.size > 0 ? allTCDetails.has(tc.tcGroup) ? allTCDetails.get(tc.tcGroup) : [] : [];
                        const temptcExecDetails = execDetails.size > 0 ? execDetails.has(tc.tcGroup) ?
                        execDetails.get(tc.tcGroup) : {
                            totalTC: 0,
                            passTC: 0,
                            failTC: 0,
                            norunTC: 0,
                            autoExec: 0,
                            manualExec: 0
                        } : {
                            totalTC: 0,
                            passTC: 0,
                            failTC: 0,
                            norunTC: 0,
                            autoExec: 0,
                            manualExec: 0
                        };
                        if (tc.tcStatus === 'Fail') {
                            year = ele.jobStartTime.split('-')[0];
                            if (yeardata[ele.jobStartTime.split('-')[0]]) {
                                temptcExecDetails.failTC++;
                                const existing = yeardata[ele.jobStartTime.split('-')[0]];
                                const existingErrorCodes = existing.errorCodes ? existing.errorCodes : new Map();
                                const tcArray = existing.tcGrpDetail.size > 0 ? existing.tcGrpDetail.has(tc.tcGroup) ?
                                    existing.tcGrpDetail.get(tc.tcGroup) : [] : [];
                                const tgerrCodeVal = existing.tstGrpErrCodes.size > 0 ? existing.tstGrpErrCodes.has(tc.tcGroup) ?
                                    existing.tstGrpErrCodes.get(tc.tcGroup) : new Map() : new Map();
                                if (tc.tcErrorCode) {
                                    Object.values(tc.tcErrorCode).forEach(errCode => {
                                        const errCodeVal = existingErrorCodes.size > 0 ? existingErrorCodes.has(errCode) ?
                                            existingErrorCodes.get(errCode) + 1 : 1 : 1;
                                        existingErrorCodes.set(errCode, errCodeVal);
                                        const tgErrCode = tgerrCodeVal.size > 0 ? tgerrCodeVal.has(errCode) ?
                                            tgerrCodeVal.get(errCode) + 1 : 1 : 1;
                                        tgerrCodeVal.set(errCode, tgErrCode);
                                    });
                                }
                                tcArray.push(tcDetails);
                                // existing.tcGrpDetail.set(tc.tcGroup, tcArray);l
                                existing.errorCodes = existingErrorCodes;
                                existing.tstGrpErrCodes.set(tc.tcGroup, tgerrCodeVal);
                                yeardata[ele.jobStartTime.split('-')[0]] = existing;
    
    
                            } else {
                                const tcGrpDetail = new Map();
                                const ErrCodeDetails = new Map();
                                const tstGrpErrCodes = new Map();
                                const tcArray = tcGrpDetail.size > 0 ? tcGrpDetail.has(tc.tcGroup) ?
                                    tcGrpDetail.get(tc.tcGroup) : [] : [];
                                const tgerrCodeVal = tstGrpErrCodes.size > 0 ? tstGrpErrCodes.has(tc.tcGroup) ?
                                    tstGrpErrCodes.get(tc.tcGroup) : new Map() : new Map();
                                if (tc.tcErrorCode) {
                                    Object.values(tc.tcErrorCode).forEach(errCode => {
                                        const errCodeVal = ErrCodeDetails.size > 0 ? ErrCodeDetails.has(errCode) ?
                                            ErrCodeDetails.get(errCode) + 1 : 1 : 1;
                                        ErrCodeDetails.set(errCode, errCodeVal);
                                        const tgErrCode = tstGrpErrCodes.size > 0 ? tstGrpErrCodes.has(errCode) ?
                                            tstGrpErrCodes.get(errCode) + 1 : 1 : 1;
                                        tstGrpErrCodes.set(errCode, tgErrCode);
                                    });
                                }
                                temptcExecDetails.failTC++;
                                tcArray.push(tcDetails);
                                tcGrpDetail.set(tc.tcGroup, tcArray);
                                tstGrpErrCodes.set(tc.tcGroup, tgerrCodeVal);
                                const tmpObj = {
                                    year: ele.jobStartTime.split('-')[0],
                                    tcGrpDetail,
                                    errorCodes: ErrCodeDetails,
                                    tstGrpErrCodes,
                                    allTCDetails,
                                };
                                yeardata[ele.jobStartTime.split('-')[0]] = tmpObj;
                            }
                        } else if (tc.tcStatus === 'Pass') {
                            temptcExecDetails.passTC++;
                        } else if (tc.tcStatus === 'NoExec' || tc.tcStatus === 'in que') {
                            temptcExecDetails.norunTC++;
                        }
                        temptcExecDetails.totalTC++;
                        temptcExecDetails.autoExec = temptcExecDetails.autoExec + tc.autoExectime;
                        temptcExecDetails.manualExec = temptcExecDetails.manualExec + tc.manualExectime;
                        execDetails.set(tc.tcGroup, temptcExecDetails);
                        tempTCDetails.push(tcDetails);
                        allTCDetails.set(tc.tcGroup, tempTCDetails);
                    });
                }
            });
        });
        yeardata[year]['allTCDetails'] = allTCDetails;
        yeardata[year]['yearlyData'] = execDetails;
        yeardata[year]['tstGrpUtilization'] = this.calculateYearlyUtilization(selectedYear);
        yeardata[year]['tstCaseUtilization'] = this.calculateTestCaseUtilization(selectedYear);
        yeardata[year]['monthlyUtilization'] = this.calculateTGUtilization(selectedYear);
        setTimeout(() => {
            if (yeardata[year]['allTCDetails']) {
                yeardata[year]['monthlyData'] = this.groupByMonth(yeardata[year], selectedYear);
                yeardata[year]['dailyData'] = this.groupDailyData(yeardata[year], selectedYear);
                yeardata[year]['tcData'] = this.groupByTC(yeardata[year], selectedYear);
                yeardata[year]['monthlyErrCodes'] = this.groupErrCodesByMonth(yeardata[year], selectedYear);
            }
        }, 100);
        return Object.values(yeardata);
    }
    groupByMonth(yearData, selectedYear): any{
        const monthlyDetails = new Map();
        this.allTestGroups.forEach((value, key) => {
               const data = yearData.allTCDetails.get(value);
               const monthlyData = [];
               const testGroup = value;
               let monthData = null;
               for (let i = 1; i <= 12; i++){
                    monthData = null;
                    monthData = data?.map((element: any) => element).filter(element => {
                        return (element.month === ('0' + i.toString()).slice(-2));
                    });
                    if (monthData && monthData.length > 0) {
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
                        monthData.forEach(ele => {
                            temp.totalTC++;
                            temp.autoExec = temp.autoExec + ele.autoExec;
                            temp.manualExec = temp.manualExec + ele.manualExec;
                            if (ele.status === 'Fail') {
                                temp.failTC++;
                            } else if (ele.status === 'Pass') {
                                temp.passTC++;
                            } else if (ele.status === 'NoExec' || ele.status === 'in que') {
                                temp.norunTC++;
                            }
                        });
                        temp.day = monthData[0].day;
                        temp.month = monthData[0].month;
                        temp.year = selectedYear;
                        monthlyData.push(temp);
                    }
                }
               monthlyDetails.set(testGroup, monthlyData);
            });
        return monthlyDetails;
    }

    groupDailyData(yearData, selectedYear): any {
        const dailyData = new Map();
        this.dataService.getTestGroup().subscribe(testgroups => {
            testgroups.forEach(tg => {
               const data = yearData.allTCDetails.get(tg.testGroupName);
               const tempdaillyData = [];
               let dayData = null;
               let monthData = null;
               const testGroup = tg.testGroupName;
               for ( let i = 1; i <= 12; i++) {
                monthData = null;
                monthData = data?.map((element: any) => element).filter(element => {
                    return (element.month === ('0' + i.toString()).slice(-2));
                });
                if (monthData && monthData.length > 0) {
                for (let j = 1; j <= 31; j++){
                dayData = null;
                dayData = monthData?.map((element: any) => element).filter(element => {
                    return (element.day === ('0' + j.toString()).slice(-2));
                });
                if (dayData && dayData.length > 0) {
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
                dayData.forEach(ele => {
                temp.totalTC++;
                temp.autoExec = temp.autoExec + ele.autoExec;
                temp.manualExec = temp.manualExec + ele.manualExec;
                if (ele.status === 'Fail') {
                    temp.failTC++;
                } else if (ele.status === 'Pass') {
                    temp.passTC++;
                } else if (ele.status === 'NoExec' || ele.status === 'in que') {
                    temp.norunTC++;
                }
                });
                temp.day = dayData[0].day;
                temp.month = dayData[0].month;
                temp.year = selectedYear;
                tempdaillyData.push(temp);
            }
            }
        }
        }
               dailyData.set(testGroup, tempdaillyData);
            });
        });
        return dailyData;
    }

    groupByTC(yearData, selectedYear): any {
        const tcData = new Map();
        this.dataService.getTestGroup().subscribe(testgroups => {
            testgroups.forEach(tg => {
            const data = yearData.allTCDetails.get(tg.testGroupName);
            let tcArrData = [];
            if (data && data.length > 0) {
                data.forEach(ele => {
                    if (tcData.size <= 0 || !tcData.has(ele._id)) {
                        const tempTcData = data?.map((element: any) => element).filter(element => {
                            return (element._id === ele._id);
                        });
                        tcArrData = [];
                        if (tempTcData) {
                        let monthData = null;
                        for ( let i = 1; i <= 12; i++) {
                            monthData = null;
                            monthData = tempTcData?.map((element: any) => element).filter(element => {
                                return (element.month === ('0' + i.toString()).slice(-2));
                            });
                            if (monthData && monthData.length > 0) {
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
                                monthData.forEach(dt => {
                                temp.totalTC++;
                                temp.autoExec = temp.autoExec + dt.autoExec;
                                temp.manualExec = temp.manualExec + dt.manualExec;
                                temp.day = dt.day;
                                if (dt.status === 'Fail') {
                                    temp.failTC++;
                                } else if (dt.status === 'Pass') {
                                    temp.passTC++;
                                } else if (dt.status === 'NoExec' || ele.status === 'in que') {
                                    temp.norunTC++;
                                }
                                });
                                temp.month = monthData[0].month;
                                temp.year = selectedYear;
                                tcArrData.push(temp);
                            }
                        }
                        }
                        tcData.set(ele._id, tcArrData);
                }
                });
            }
        });
        });
        return tcData;
    }

    groupErrCodesByMonth(yearData, selectedYear): any {
        const monthlyDetails = new Map();
        this.allTestGroups.forEach((testGroupName, tstGrpID) => {
            const data = yearData.allTCDetails.get(testGroupName);
            const monthlyErrCodes = [];
            let monthData = null;
            for (let i = 1; i <= 12; i++){
                 monthData = null;
                 monthData = data?.map((element: any) => element).filter(element => {
                     return (element.month === ('0' + i.toString()).slice(-2) && element.tcErrorCode &&  element.tcErrorCode.length > 0);
                 });
                 if (monthData && monthData.length > 0) {
                    const errCodes = new Map();
                    const month = monthData[0].month;
                    monthData.forEach(ele => {
                        Object.values(ele.tcErrorCode).forEach(errCode => {
                                        const errCodeVal = errCodes.size > 0 ? errCodes.has(errCode) ?
                                        errCodes.get(errCode) + 1 : 1 : 1;
                                        errCodes.set(errCode, errCodeVal);
                        });

                    });
                    monthlyErrCodes.push({errCodes, month});

                 }
            }
            monthlyDetails.set(testGroupName, monthlyErrCodes);

        });
        return monthlyDetails;
    }

    calculateYearlyUtilization(selectedYear: any): any {
        const testGrpUtilSum = new Map();
        const testGrpUtilCount = new Map();
        if (!this.allTestCases || this.allTestCases.length === 0) {
            return { testGrpUtilSum, testGrpUtilCount };
        }
    
        this.allTestCases.forEach(testCase => {
            if (testCase.utilization && testCase.tcId) {
                const tcutil = testCase.utilization[Number(selectedYear)];
                if (tcutil) {
                    const monthWiseutil = Object.values(tcutil).filter(Boolean); // remove undefined
                    let monthlydata = [];
                    monthWiseutil.forEach(ele => {
                        if (ele) {
                            monthlydata = [...monthlydata, Object.values(ele)];
                        }
                    });
    
                    const tcRegCount = this.allJobs?.filter(job => job.jobStartTime >= testCase.createdAt) || [];
    
                    let sum = 0;
                    monthlydata.forEach(ele => {
                        sum += ele.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                    });
    
                    const testGroupName = this.allTestGroups.get(testCase.tcGroupId);
                    if (testGroupName) {
                        const testGroupSumArr = testGrpUtilSum.get(testGroupName) || [];
                        const testGroupCountArr = testGrpUtilCount.get(testGroupName) || [];
    
                        testGroupSumArr.push(sum);
                        testGroupCountArr.push(tcRegCount.length);
    
                        testGrpUtilSum.set(testGroupName, testGroupSumArr);
                        testGrpUtilCount.set(testGroupName, testGroupCountArr);
                    }
                }
            }
        });
    
        return { testGrpUtilSum, testGrpUtilCount };
    }
    

    calculateTGUtilization(selectedYear): any {
        const tgUtilizationSum = new Map();
        const tgUtilizationCont = new Map();
        this.allTestCases.forEach(testCase => {
            if (testCase.utilization && testCase.tcId) {
                let tcRegCount  = [];
                let monthlydata = [];
                const tcutil = testCase.utilization[Number(selectedYear)];
                if (tcutil) {
                    const monthWiseutil = Object.values(tcutil);
                    const tcUtilKeys = Object.keys(tcutil);
                    const monthlySum = new Map();
                    const monthlyCout = new Map();
                    tcUtilKeys.forEach( (key, index) => {
                    monthlydata = [...monthlydata, Object.values(monthWiseutil[index])];
                    let sum = 0;
                    monthlydata.forEach(ele => {
                        const tempSum = ele.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                        sum = sum + tempSum;
                    });
                    tcRegCount = this.allJobs?.map((job: any) => job).filter(job => {
                        return (job.jobStartTime >= testCase.createdAt && (job.jobStartTime.split('-')[1] == Number(key) + 1));
                    });
                    const utilization = {sum, count: tcRegCount.length};
                    const testGroupUtilSum = tgUtilizationSum.size > 0 ? tgUtilizationSum.has(this.allTestGroups.get(testCase.tcGroupId))
                        ? tgUtilizationSum.get(this.allTestGroups.get(testCase.tcGroupId)) : new Map() : new Map();
                    const monthlyUtilSum = testGroupUtilSum.size > 0 ? testGroupUtilSum.has(Number(key) + 1) ?
                    testGroupUtilSum.get(Number(('0' + key.toString()).slice(-2)) + 1) : [] : [];
                    monthlyUtilSum.push(sum);
                    monthlySum.set(Number(('0' + key.toString()).slice(-2)) + 1, monthlyUtilSum);
                    const monthlyUtilCount = tgUtilizationCont.size > 0 ? tgUtilizationCont.has(Number(key) + 1) ?
                    tgUtilizationCont.get(Number(('0' + key.toString()).slice(-2)) + 1) : [] : [];
                    monthlyUtilCount.push(tcRegCount.length);
                    monthlyCout.set(Number(('0' + key.toString()).slice(-2)) + 1, monthlyUtilCount);
                });
                    tgUtilizationSum.set(this.allTestGroups.get(testCase.tcGroupId), monthlySum);
                    tgUtilizationCont.set(this.allTestGroups.get(testCase.tcGroupId), monthlyCout);
                }
            }
        });
        return {tgUtilizationSum, tgUtilizationCont};
    }

    calculateTestCaseUtilization(selectedYear): any {
        const tcData = new Map();
        this.allTestCases.forEach(testCase => {
            if (testCase.utilization && testCase.tcId) {
                let tcRegCount  = [];
                let monthlydata = [];
                const tcutil = testCase.utilization[Number(selectedYear)];
                if (tcutil) {
                    const monthWiseutil = Object.values(tcutil);
                    const tcUtilKeys = Object.keys(tcutil);
                    const monthlyUtil = new Map();
                    tcUtilKeys.forEach( (key, index) => {
                    monthlydata = [...monthlydata, Object.values(monthWiseutil[index])];
                    let sum = 0;
                    monthlydata.forEach(ele => {
                        const tempSum = ele.reduce((prev, curr) => Number(prev) + Number(curr), 0);
                        sum = sum + tempSum;
                    });
                    tcRegCount = this.allJobs?.map((job: any) => job).filter(job => {
                        return (job.jobStartTime >= testCase.createdAt && (job.jobStartTime.split('-')[1] == Number(key) + 1));
                    });
                    const utilization = tcRegCount.length > 0 ? sum / tcRegCount.length : 0;
                    monthlyUtil.set(Number(('0' + key.toString()).slice(-2)) + 1, utilization);
                });
                    tcData.set(testCase._id, monthlyUtil);
                }
            }
        });
        return tcData;
    }

   


}
