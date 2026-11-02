 import { Router } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ExcelService } from '../services/excel-service';
import { DataService } from '../../../../../@core/services/data.service';
import jsPDF from 'jspdf';
import * as _ from 'lodash';
import { LocalDataSource } from 'angular2-smart-table';
import { NgxCaptureService } from 'ngx-capture';
import autoTable from 'jspdf-autotable';
import {

    ViewChildren,
    QueryList,
    ChangeDetectorRef,
  } from '@angular/core';
import {
    animate,
    state,
    style,
    transition,
    trigger,
  } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';




@Component({
    selector: 'app-yearly-regression-detail-chart',
    templateUrl: './yearly-regression-detail.component.html',
    styleUrls: ['./yearly-regression-detail.component.scss'],
    animations: [
        trigger('detailExpand', [
          state('collapsed', style({ height: '0px', minHeight: '0' })),
          state('expanded', style({ height: '*' })),
          transition(
            'expanded <=> collapsed',
            animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
          ),
        ]),
      ]
})

export class YearlyRegressionDetailComponent implements OnInit {
    @ViewChild('screen', { static: true }) screen: any;
    chartDetails = {};
    allData: any = {};
    currentData = [];
    chartInput: any = {};
    chartInstance = null;
    sub1;
    route = 1;
    sub2;
    yearr;
    allDataSum;
    checkButton = false;
    allArry = [];
    quarter = 'Q1';
    dataType = 'yearly';
    q1 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion: [], modelFWVersion: [], q: 'Q1' };
    q2 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion: [], modelFWVersion: [], q: 'Q2' };
    q3 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion: [], modelFWVersion: [], q: 'Q3' };
    q4 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion: [], modelFWVersion: [], q: 'Q4' };
    chartInputPIE = {};
    chartInstancePIE = null;
    user;
    pdfHeight = 0;
    tableData = {};
    maxYear = new Date().getFullYear();
    loading = true;
    source: LocalDataSource = new LocalDataSource();
    dateRangeArray = [
        { label: 'Q1', value: 'Jan-Mar' }, { label: 'Q2', value: 'Apr-June' }, { label: 'Q3', value: 'July-Sept' },
        { label: 'Q4', value: 'Oct-Dec' }];
    selectedDateRange: any;
    imgBase64: string;

    selectedRegStatus: any;
    showNoRun =  false;
    deviceTypeListAvailable = false;
    constructor(private captureService: NgxCaptureService, public dataService: DataService, private router: Router, private excel:ExcelService,private cd: ChangeDetectorRef) {

        this.selectedDateRange = this.dateRangeArray[0];
    }

    ngOnInit(): void {
        let newData;
        const d = new Date();
        const newMonth = d.getMonth();
        this.allDataSum = [];
        // const aryTotal = { totalPass: 0, totalFail: 0, totalNoRun: 0, totalReg: 0, totalTc: 0 };
        this.user = this.dataService.getCurrentUser();
        this.dataService.backFromDailyScreen.next(false);
        this.dataService.filteredMonth.next(null);
        this.dataService.filteredYear.next(null);
        this.dataService.filteredEndMonth.next(null);
        this.dataService.filteredEndYear.next(null);
        this.dataService.regressionNoData.next(true);
        console.log('deviceTypeList in yearly', this.dataService.deviceTypeList);
        if (this.dataService.deviceTypeList && this.dataService.deviceTypeList.length > 0) {
            this.deviceTypeListAvailable = true;
        this.sub2 = this.dataService.regressionAnalysisData.subscribe(data => {
            this.allArry = [];
            this.q1 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion:[], modelFWVersion: [], q: 'Q1' };
            this.q2 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion:[], modelFWVersion: [], q: 'Q2' };
            this.q3 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion:[], modelFWVersion: [], q: 'Q3' };
            this.q4 = { totalTC: 0, totalReg: 0, totalPass: 0, totalFail: 0, totalNorun: 0, totalAbort: 0, totalWarn: 0, firmwareVersion:[], modelFWVersion: [], q: 'Q4' };
            const aryTotal = { totalPass: 0, totalFail: 0, totalNoRun: 0, totalReg: 0, totalTc: 0, totalAbort: 0, totalWarn: 0, firmwareVersion:[] };
            if (data) {
                this.allDataSum = data.monthlyData;
                data.monthlyData.length === 1 ? this.checkButton = true : this.checkButton = false;
                newData = data.monthlyData[data.monthlyData.length - this.route];
                newData.monthlyData?.forEach((res) => {
                    this.yearr = res.year
                    this.dataService.defaultYear.next(res.year);
                    if (res.month === 1 || res.month === 2 || res.month === 3) {
                        this.q1.totalReg += res.totalReg;
                        this.q1.totalTC += res.totalTC;
                        this.q1.totalPass += res.passTC;
                        this.q1.totalFail += res.failTC;
                        this.q1.totalNorun += res.norunTC;
                        this.q1.totalAbort += res.abortTC ? res.abortTC : 0;
                        this.q1.totalWarn += res.warnTC ? res.warnTC : 0;
                        const firmv = res.firmwareVersion && res.firmwareVersion !== undefined ? this.q1.firmwareVersion
                        .concat(res.firmwareVersion) : (this.q1.firmwareVersion !== undefined
                            && this.q1.firmwareVersion.length > 0 ? this.q1.firmwareVersion : []);
                        this.q1.firmwareVersion = [...new Set(firmv)];
                        this.addModeFWVersions(res, this.q1.modelFWVersion);
                    } else if (res.month === 4 || res.month === 5 || res.month === 6) {

                        this.q2.totalReg += res.totalReg;
                        this.q2.totalTC += res.totalTC;
                        this.q2.totalPass += res.passTC;
                        this.q2.totalFail += res.failTC;
                        this.q2.totalNorun += res.norunTC;
                        this.q2.totalAbort += res.abortTC ? res.abortTC : 0;
                        this.q2.totalWarn += res.warnTC ? res.warnTC : 0;
                        const firmv = res.firmwareVersion && res.firmwareVersion !== undefined ? this.q2.firmwareVersion
                        .concat(res.firmwareVersion) : (this.q2.firmwareVersion !== undefined
                            && this.q2.firmwareVersion.length > 0 ? this.q2.firmwareVersion : []);
                        this.q2.firmwareVersion = [...new Set(firmv)];
                        this.addModeFWVersions(res, this.q2.modelFWVersion);
                    } else if (res.month === 7 || res.month === 8 || res.month === 9) {
                        this.q3.totalReg += res.totalReg;
                        this.q3.totalTC += res.totalTC;
                        this.q3.totalPass += res.passTC;
                        this.q3.totalFail += res.failTC;
                        this.q3.totalNorun += res.norunTC;
                        this.q3.totalAbort += res.abortTC ? res.abortTC : 0;
                        this.q3.totalWarn += res.warnTC ? res.warnTC : 0;
                        const firmv = res.firmwareVersion && res.firmwareVersion !== undefined ? this.q3.firmwareVersion
                        .concat(res.firmwareVersion) : (this.q3.firmwareVersion !== undefined
                            && this.q3.firmwareVersion.length > 0 ? this.q3.firmwareVersion : []);
                        this.q3.firmwareVersion = [...new Set(firmv)];
                        this.addModeFWVersions(res, this.q3.modelFWVersion);
                    } else {
                        this.q4.totalReg += res.totalReg;
                        this.q4.totalTC += res.totalTC;
                        this.q4.totalPass += res.passTC;
                        this.q4.totalFail += res.failTC;
                        this.q4.totalNorun += res.norunTC;
                        this.q4.totalAbort += res.abortTC ? res.abortTC : 0;
                        this.q4.totalWarn += res.warnTC ? res.warnTC : 0;
                        const firmv = res.firmwareVersion && res.firmwareVersion !== undefined ? this.q4.firmwareVersion
                        .concat(res.firmwareVersion) : (this.q4.firmwareVersion !== undefined
                            && this.q4.firmwareVersion.length > 0 ? this.q4.firmwareVersion : []);
                        this.q4.firmwareVersion = [...new Set(firmv)];
                        this.addModeFWVersions(res, this.q4.modelFWVersion);
                    }
                });

                this.dataService.loading.next(true);

                this.currentData = data.yearlyData;

                this.allArry.push(this.q1);
                this.allArry.push(this.q2);
                this.allArry.push(this.q3);
                this.allArry.push(this.q4);

                this.allArry.forEach((res) => {
                    aryTotal.totalPass += res.totalPass;
                    aryTotal.totalFail += res.totalFail;
                    aryTotal.totalNoRun += res.totalNorun;
                    aryTotal.totalAbort += res.totalAbort ? res.totalAbort : 0;
                    aryTotal.totalWarn += res.totalWarn ? res.totalWarn : 0;
                    aryTotal.totalReg += res.totalReg;
                    aryTotal.totalTc += res.totalTC;
                    const firmV = aryTotal.firmwareVersion.concat(res.firmwareVersion);
                    aryTotal.firmwareVersion = [...new Set(firmV)];
                });
                console.log('this.allArry>>>', this.allArry);
                this.tableData = aryTotal;
                this.source.load(this.allArry);
                this.dataService.loading.next(false);

                const maxYear = _.maxBy(this.currentData, 'year');
                if (maxYear) {
                    this.maxYear = maxYear.year;
                }
                this.processData();
                this.loading = false;
            }
            else {

                this.dataService.regressionNoData.next(false);

            }

        });
        } else {
            this.dataService.loading.next(false);
        }
    }

    addModeFWVersions(res: any, tmpQuarterData: any[]): void {
        if (res.modelFWVersion) {
            const tempArray = Array.from(res.modelFWVersion, ([Model, FirmwareVersion]) => ({ Model, FirmwareVersion }));
           
            let existingmodel;
            if (tmpQuarterData.length > 0) {
                tempArray.forEach(tmpModelFw => {
                    existingmodel = tmpQuarterData?.map((element: any) => element).filter((element) => {
                        return element.Model === tmpModelFw.Model;
                    });
                    if (existingmodel.length > 0) {
                        tmpModelFw.FirmwareVersion.forEach(fwVersion => {
                            existingmodel[0].FirmwareVersion.push(fwVersion);
                        });
                        existingmodel[0].FirmwareVersion = [...new Set(existingmodel[0].FirmwareVersion)];
                    }else {
                        tmpQuarterData.push(tmpModelFw);
                    }
                });
            } else {
                tempArray.forEach(temp => {
                    tmpQuarterData.push(temp);
                });
            }
        }
    }

    redirectNext() {

        // this.router.navigate(['/pages/dashboard/tc-execution-analysis/', this.currentData[this.allYears.indexOf(this.selectedYear) + 1]])
        this.route -= 1;
        this.ngOnInit();
        this.checkButton = false;
    }

    redirectPrevious() {

        this.route += 1;
        if (this.allDataSum.length > this.route) {
            this.checkButton = false;
            this.ngOnInit();
        } else {
            this.ngOnInit();
            this.checkButton = true;
        }

    }
    onChartInit(event) {
        this.chartInstance = event;
    }

    onChartInitPIE(event) {
        this.chartInstancePIE = event;
    }

    /* based on data performs the action to generate report */


    quarterChange(event) {
    }

    processData() {

        this.dataService.regressionNoData.subscribe((res) => {

        });
        const xAxis = [];
        const yAxis = [{ name: 'Passed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
         { name: 'Failed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
         { name: 'No Run TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
         { name: 'Aborted TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
         { name: 'Warn TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
         { name: 'Total Regression Jobs', data: [], type: 'line', yAxisIndex: 1 }];
         // console.log("all array>>>>",this.allArry);
        this.allArry.forEach(element => {
                xAxis.push(element.q);
                yAxis[0].data.push(element.totalPass);
                yAxis[1].data.push(element.totalFail);
                yAxis[2].data.push(element.totalNorun);
                yAxis[3].data.push(element.totalAbort);
                yAxis[4].data.push(element.totalWarn);
                yAxis[5].data.push(element.totalReg);
            });

        this.dataService.selectedRegStatus.subscribe((e) => {
                this.selectedRegStatus = e;
                if ((this.selectedRegStatus.length === 1 && this.selectedRegStatus.includes('Completed'))) {
                    this.showNoRun = false;
                } else {
                    this.showNoRun = true;
                }
            });
        const colorsList = ['#24a148', '#fa4d56', '#f1c21b', '#f78489ff', '#c76b20','#5470C6'];
        this.chartInput = {
                title: { show: false },
                color: colorsList,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    formatter: (params, ticket, callback) => {
                        let temp = ``;
                        let head = ``;
                        let total = 0;

                        if (params[0] && params[0].axisValue) {

                             if (params[0].seriesName === 'Total Regression Jobs'){
                                params[0].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[0].value;
                            }
                             head += `<div class="text-center" style="width:100%">${params[0].axisValue}</div>`;
                             temp += `<div class="row">
                                    <div class="col-sm-6">${params[0].seriesName}</div>
                                    <div class="col-sm-6">: ${params[0].value}</div>
                                </div>`;
                        }
                        if (params[1] && params[1].axisValue) {
                            if (params[1].seriesName === 'Total Regression Jobs'){
                                params[1].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[1].value;
                            }
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1].seriesName}</div>
                        <div class="col-sm-6">: ${params[1].value}</div>
                    </div>`;
                        }
                        if (params[2] && params[2].axisValue) {

                            if (params[2].seriesName === 'Total Regression Jobs'){
                                params[2].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[2].value;
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2].seriesName}</div>
                        <div class="col-sm-6">: ${params[2].value}</div>
                    </div>`;
                        }
                        if (params[3] && params[3].axisValue) {

                            if (params[3].seriesName === 'Total Regression Jobs'){
                                params[3].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[3].value;
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[3].seriesName}</div>
                        <div class="col-sm-6">: ${params[3].value}</div>
                    </div>`;
                        }
                             if (params[4] && params[4].axisValue) {

                            if (params[4].seriesName === 'Total Regression Jobs'){
                                params[4].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[4].value;
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[4].seriesName}</div>
                        <div class="col-sm-6">: ${params[4].value}</div>
                    </div>`;
                        }
                             if (params[5] && params[5].axisValue) {

                            if (params[5].seriesName === 'Total Regression Jobs'){
                                params[5].seriesName = 'Total Reg.Jobs';
                            }else{
                                total += params[5].value;
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[5].seriesName}</div>
                        <div class="col-sm-6">: ${params[5].value}</div>
                    </div>`;
                        }
                        const finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`;
              //  console.log("head + finaltotal + temp>",` <div style = 'width: 200px;'>`+head + finaltotal + temp+ `</div>`)
                        return ` <div style = 'width: 220px;'>` + head + finaltotal + temp + `</div>`;

                    }
                },
                toolbox: {
                    right: '10px',
                    top: '-7px',
                    feature: {

                      magicType: { show: true, type: ['line', 'bar'], title: {
                        line: 'Line View',
                        bar: 'Bar View'
                        }, option : {line: {stack: false}, bar: {stack: false}}},
                      restore: { show: true , title: 'Restore'},

                    }

                  },
                legend: {
                    show: true,
                    top: 35,
                    data: ['Passed TC', 'Failed TC', 'No Run TC', 'Aborted TC', 'Warn TC', 'Total Regression Jobs'],
                    itemGap: 5,
                    textStyle: {

                        color: '#0d0d0d'

                    },
                    selected: {
                        'Passed TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        'Failed TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        'No Run TC': (this.selectedRegStatus.length === 1 && this.selectedRegStatus.includes('Completed')) ? false : true,
                        'Aborted TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        'Warn TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        'Total Regression Jobs': this.selectedRegStatus.includes('Completed') ? true : false,
                    }
                },
                grid: {
                    left: '6%',
                    right: '6%',
                    bottom: '10%',
                    top: '18%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxis,
                        name: 'Year',
                        nameLocation: 'center',
                        nameTextStyle: { padding: 11 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'No Of TestCases',
                        // position: 'left',
                        nameLocation: 'center',
                        // left: 30,
                        nameTextStyle: { padding: 35 },
                        alignTicks: true,
                        axisLine: {
                          show: true,

                        },

                    },
                    {
                        type: 'value',
                        name: 'Total Regression Jobs',
                       // position: 'right',
                       nameLocation: 'center',
                        nameTextStyle: { padding: 18 },
                        alignTicks: true,
                        axisLine: {
                            show: true,
                           lineStyle: {
                                color: colorsList[5]
                              }
                        },


                    },

                ],
                series: yAxis,
            };


        const legends = ['Pass TC', 'Fail TC', 'No Run TC', 'Aborted TC', 'Warn TC', 'Total Regression Jobs'];

        let passTC = 0;
        let failTC = 0;
        let noRunTC = 0;
        let totalReg = 0;
        let abortTC = 0;
        let warnTC = 0;

        this.currentData.forEach(element => {
                passTC += element.passTC;
                failTC += element.failTC;
                noRunTC += element.norunTC;
                abortTC += element.abortTC ? element.abortTC : 0;
                warnTC += element.warnTC ? element.warnTC : 0;
                totalReg += element.totalReg;
            });
        const series = [
                {
                    name: 'Pass TC',
                    type: 'bar',
                    value: passTC
                },
                {
                    name: 'Fail TC',
                    type: 'bar',
                    value: failTC
                },
                {
                    name: 'No Run TC',
                    type: 'bar',
                    value: noRunTC
                },
                {
                    name: 'Aborted TC',
                    type: 'bar',
                    value: abortTC
                },
                {
                    name: 'Warn TC',
                    type: 'bar',
                    value: warnTC
                },
                {
                    name: 'Total Regression Jobs',
                    type: 'line',
                    value: totalReg
                }

            ];
        this.chartInputPIE = {
                tooltip: {
                    trigger: 'item'
                },
                color: colorsList,
                legend: {
                    orient: 'horizontal',
                    right: 10,
                    top: 20,
                    bottom: 20,
                    data: legends,
                    textStyle: {
                        color: '#0d0d0d'
                    }
                },
                series: [
                    {
                        name: 'Regression Summary',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '50%'],
                        data: series,
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        },
                        label: {
                            show: true,
                            align: 'right',
                            fontSize: 8
                        }
                    }
                ]
            };
        if (this.currentData && this.tableData && this.tableData["totalReg"]>0) {
            this.dataService.regressionNoData.next(false);
        }
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }

    yearSelected(event) {
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/monthly/${this.yearr + '_' + event.name}`);
    }

    yearSelectedPie(event) {

        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/monthly/${this.maxYear}`);
    }
    /* downloads the report for selected data */
    downloadReport(type) {
        this.dataService.loading.next(true);
        setTimeout(() => {
            if (type === 'excel') {
                this.downloadExcelReport();
            } else {
                this.downloadPdfReport();
            }

        }, 200);

    }

    capture(type) {
        this.captureService
          .getImage(this.screen.nativeElement, true)
          .subscribe((img) => {
            this.imgBase64 = img;
            this.downloadReport(type);
          });
        setTimeout(() => {
          }, 0);
      }

    async downloadPdfReport() {
        let filter: any = {};
        this.dataService.getfilter().subscribe((data) => {
            filter = data;
        });
        const head = (this.showNoRun) ? [['Quarter', 'Total Regression Jobs', 'Total Unique FW Versions', 'Total TC', 'Pass TC', 'Fail TC', 'Norun TC']] : [['Quarter', 'Total Regression Jobs', 'Total Unique FW Versions', 'Total TC', 'Pass TC', 'Fail TC']];
        const body = [];
        const doc = new jsPDF('p', 'mm', 'a4');
        this.source.getAll().then((res) => {
            res.forEach((row) => {
                const temp = (this.showNoRun) ? [row.q, row.totalReg, row.firmwareVersion === undefined ? 0 : row.firmwareVersion.length, row.totalTC, row.totalPass, row.totalFail, row.totalNorun] : [row.q, row.totalReg, row.firmwareVersion.length, row.totalTC, row.totalPass, row.totalFail];
                body.push(temp);
            });
        });
        doc.text('Regression Jobs Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + 'Yearly Regressions', 43, 20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Generated By`, 20, 30, );
        doc.text(`:  ${this.user.username}`, 43, 30);
        doc.text(`User Selected`, 20, 35);
        doc.text(`:  ${filter.user === 1 ? 'All' : filter.user}`, 43, 35);
        doc.text(`DeviceType Selected`, 20, 40);
        doc.text(`:  ${filter.deviceType === 1 ? 'All' : filter.deviceType}`, 54, 40);
        doc.text(`Model Selected`, 20, 45);
        doc.text(`:  ${filter.model === 1 ? 'All' : filter.model}`, 45, 45);
        doc.text(`Firmware Version`, 20, 50);
        doc.text(`:  ${filter.firmwareVersion === 1 ? 'All' : filter.firmwareVersion}`, 49, 50);
        doc.text(`Regression status`, 20, 55);
        doc.text(`:  ${this.selectedRegStatus.join(', ')}`, 54, 55);
        doc.line(0, 59, 300, 59);
        this.pdfHeight = 58;
        if (this.chartInstance) {
            doc.text('Yearly Regression Jobs Summary', 85, this.pdfHeight);
            this.pdfHeight += 8;
            await doc.addImage(
                this.imgBase64,
                'png',
                5,
                this.pdfHeight,
                220,
                105,
                '',
                'FAST'
            );
            doc.text( 'Detailed Summary', 85, 170);
            autoTable(doc, { head, body, theme: 'grid', startY: 180, tableLineColor: 150, tableLineWidth: 0, styles: {overflow: 'linebreak', cellWidth: 'auto', font: 'arial', fontSize: 10, }, });
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        await doc.save('iCAT-Yearly-Regression-Report.pdf');
        this.dataService.loading.next(false);
    }

    /* converts the data into excelsheet */
    downloadExcelReport(): void{
        let filter: any = {};
        this.dataService.getfilter().subscribe((data) => {
            filter = data;
        });
        const details = {
            Type: 'Yearly Regressions',
            'Report Date' : `${new Date()}`,
            'Generated By' : `${this.user.username}`,
            'User Selected' : `${filter.user === 1 ? 'All' : filter.user}`,
            'Device Type Selected' : `${filter.deviceType === 1 ? 'All' : filter.deviceType}`,
            'Model Selected': `${filter.model === 1 ? 'All' : filter.model}`,
            'Firmware Version': `${filter.firmwareVersion === 1 ? 'All' : filter.firmwareVersion}`,
            'Regression status': `${this.selectedRegStatus.join(', ')}`,
        };
        this.source.getAll().then((data) => {
            const json = _.cloneDeep(data);
            const tableHeaderKeysInOrder = (this.showNoRun) ? ['q', 'totalReg', 'totalfirmware', 'totalTC', 'totalPass', 'totalFail', 'totalNorun'] : ['q', 'totalReg', 'totalfirmware', 'totalTC', 'totalPass', 'totalFail'];
            const columns = (this.showNoRun) ? ['Quarter', 'Total Regression Jobs', 'Total Unique FW Versions ', 'Total TC', 'Pass TC', 'Fail TC', 'No Run TC'] : ['Quarter', 'Total Regression Jobs', 'Total Unique FW Versions ', 'Total TC', 'Pass TC', 'Fail TC'];
            this.excel.exportAsExcelFile('Summary', details, columns, json, tableHeaderKeysInOrder, 'ICAT-Yearly-Regression-Report', 'Yearly Regression Jobs Summary', this.imgBase64, '', {}, {});
        });
        this.dataService.loading.next(false);
    }

}
