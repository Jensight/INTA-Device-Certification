import { slideInOutAnimation } from './../../../../../@shared/animations/slide-in-out.animation';
import { InformationDiaogComponent } from './../../../../../@shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, OnDestroy,ViewChild } from '@angular/core';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { ExcelService } from "../services/excel-service";
import * as _ from 'lodash';
import { LocalDataSource } from 'angular2-smart-table';
import { NgxCaptureService } from 'ngx-capture';
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable';
import { TestLabService } from 'src/app/@core/services/test-lab.service';

@Component({
    selector: 'app-day-regression-detail',
    templateUrl: './day-regression-detail.component.html',
    styleUrls: ['./day-regression-detail.component.scss'],
    animations: [
        slideInOutAnimation
    ]
})
export class DayRegressionDetailComponent implements OnInit, OnDestroy {
    @ViewChild('screen', { static: true }) screen: any;
    @ViewChild('screen2', { static: true }) screen2: any;
    categoryMap ;
    reasonMap;
    user;
    subscription;
    state = 'next';
    selectedYear;
    selectedMonth;
    selectedDay;
    allDayData;
    next = false;
    back = false;
    page=5
    currentData;
    chartInput;
    chartInputPIE;
    sub1;
    sub2;
    tableData;
    sub3;
    sub4;
    chartInstance;
    chartInstancePIE;
    pdfHeight = 0;
    monthNames = [null, "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    loading = true;

    source: LocalDataSource = new LocalDataSource();
    imgBase64: string;
    imgBase642: string;
    pathQuarter: any;
    detailData: any;
    dataType = 'day';
    selectedRegStatus: any;
    showNoRun: boolean =  false;
    year: any;
    actualYear: any;
    actualMonth: any;
    constructor( private tlService: TestLabService,private captureService: NgxCaptureService, public dataService: DataService, private activatedRoute: ActivatedRoute, private matDialog: MatDialog, private router: Router, private excel:ExcelService) {

        this.user = this.dataService.getCurrentUser()
        this.subscription = this.activatedRoute.params.pipe(
            debounceTime(100),
            map(res => {
                let day;
                this.state = 'middle'
                let tempState;
                if (this.selectedYear > Number(res.year) ||
                    (this.selectedYear === Number(res.year) && this.selectedMonth > Number(res.month)) ||
                    (this.selectedYear === Number(res.year) && this.selectedMonth === Number(res.month) && this.selectedDay > Number(day))
                ) {
                    tempState = 'back'
                } else {
                    tempState = 'next'
                }
                setTimeout(() => {
                    this.state = tempState
                }, 100)
                this.pathQuarter = res.day.split("-")[2]
                day = res.day.split("-")[0];
                this.year = Number(res.day.split("-")[3]);
                this.actualYear = res.year;
                this.actualMonth = res.month;
                return res;
            }),
            switchMap(year => this.dataService.regressionAnalysisData.pipe(map(data => {
                return { data, ...year }
            }))))
            .subscribe((data: any) => {
                if (data.data) {

                    if (data.data &&
                        !isNaN(data.year) &&
                        !isNaN(data.month) &&
                        !isNaN(data.day.split('-')[0])) {
                        const year = Number(data.year);
                        const index = this.monthNames.indexOf(data.day.split('-')[1]);
                        const month = Number(index);
                        const day = Number(data.day.split('-')[0]);
                        this.allDayData = data.data.dailyData || [];
                        this.detailData = data.data.dailyData;
                        setTimeout(() => {
                            this.loadYears_Month_Day(this.year, month, day)
                            this.loadData(this.year, month, day)
                            this.loading = false;
                        }, 100)
                    } else if (data.data) {
                        const dailyData = data.data.dailyData;
                        const maxDailydata = dailyData[dailyData.length - 1]
                        // const dialog = this.matDialog.open(InformationDiaogComponent,
                        //     {
                        //         panelClass: 'app-full-bleed-dialog',
                        //         data: {
                        //             title: 'Invalid Year/Month',
                        //             body: `Please select a valid year and month to get regression analysis.
                        //                     Latest data is displayed !!!`
                        //         },
                        //         width: '600px'
                        //     });
                        // this.sub2=dialog.afterClosed().subscribe(() => {
                        //     this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${maxDailydata.year}/${maxDailydata.month}`)
                        // })
                    }
                }
            })
    }

    ngOnInit(): void {
        this.sub1 = this.dataService.sideBarOnToggle.subscribe(data => {
            if (data && this.chartInstance) {
                let idCount = 0;
                const id = setInterval(() => {
                    idCount++;
                    if( this.chartInstance){
                        this.chartInstance.resize();
                    }
                    if(this.chartInstancePIE){
                        this.chartInstancePIE.resize()
                    }
                    if (idCount > 5) {
                        idCount = 0;
                        clearInterval(id)
                    }
                }, 100)
            }
        })
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe()
        }
        if (this.sub1) {
            this.sub1.unsubscribe()
        }
        if (this.sub2) {
            this.sub2.unsubscribe()
        }
        if (this.sub3) {
            this.sub3.unsubscribe()
        }
        if (this.sub4) {
            this.sub4.unsubscribe()
        }

    }

    onChartInit(event) {
        this.chartInstance = event;
    }

    onChartInitPIE(event) {
        this.chartInstancePIE = event;
    }


    loadYears_Month_Day(year, month, day) {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month, day: d.day }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => {
            return String(data.year) + ('0' + String(data.month)).slice(-2) + ('0' + String(data.day)).slice(-2);
        })
        const allDataLastIndex = uniqYearsandMonth.length - 1;
        var index = _.findIndex(uniqYearsandMonth, { year, month, day });
        if (index < 0) {
            const dailyData = this.allDayData;
            const maxDailydata = dailyData[dailyData.length - 1]
            // const dialog = this.matDialog.open(InformationDiaogComponent,
            //     {
            //         panelClass: 'app-full-bleed-dialog',
            //         data: {
            //             title: 'No Data',
            //             body: `No Data Available for Selected user/model.
            //                         Please run regressions and come back !!!`
            //         },
            //         width: '600px'
            //     });
            // this.sub3=dialog.afterClosed().subscribe(() => {
            //     this.router.navigateByUrl(`/pages/dashboard`)
            // })
            this.dataService.regressionNoData.next(true);
        } else if (uniqYearsandMonth.length === 1) {
            this.next = false;
            this.back = false
        }
        else if (index === 0) {
            this.next = true;
            this.back = false
        } else if (index === allDataLastIndex) {
            this.next = false;
            this.back = true;
        } else {
            this.next = true;
            this.back = true;
        }
    }

    loadData(year, month, day) {
        var currentData = _.find(this.allDayData, { year, month, day });
        //console.log("currentData in day regres>>>>",currentData.length);
        if (currentData ) {
            this.selectedYear = year;
            this.selectedMonth = month;
            this.selectedDay = day;
            this.currentData = currentData['allTC'] || [];
            this.source.load(currentData['allTC']||[])
            let aryTotal={totalPass:0,totalFail:0,totalNoRun:0,totalReg:0,totalTc:0,firmwareVersion:[], totalAbort: 0, totalWarn: 0}
            currentData['allTC'].forEach((res)=>{
                 aryTotal.totalPass += res.passTC
                 aryTotal.totalFail += res.failTC
                 aryTotal.totalNoRun += res.norunTC ? res.norunTC : 0;
                 aryTotal.totalAbort += res.abortTC ? res.abortTC : 0;
                 aryTotal.totalWarn += res.warnTC ? res.warnTC : 0;
                 aryTotal.totalTc+= res.totalTC
                 let firmV=aryTotal.firmwareVersion.concat(res.firmwareVersion)
                 aryTotal.firmwareVersion=[...new Set(firmV)]
           })
           this.tableData = aryTotal
            this.processData()
        } else {
           

            const dailyData = this.allDayData;
            const maxDailydata = dailyData[dailyData.length - 1]
            this.dataService.regressionNoData.next(true);
            // const dialog = this.matDialog.open(InformationDiaogComponent,
            //     {
            //         panelClass: 'app-full-bleed-dialog',
            //         data: {
            //             title: 'No Data',
            //             body: `No Data Available for Selected year/month.
            //                     Latest data is displayed !!!`
            //         },
            //         width: '600px'
            //     });
            // this.sub4=dialog.afterClosed().subscribe(() => {
            //     this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${this.selectedYear}/${this.selectedMonth+"-"+this.pathQuarter}`)
            // });
        }
    }
/* based on data performs the action to generate report */
    processData() {
            const xAxis = [];
            const yAxis = [{ name: 'Passed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }, 
            { name: 'Failed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }, 
            { name: 'No Run TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
            { name: 'Aborted TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
            { name: 'Warn TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
        ]
            this.currentData.forEach(element => {
                xAxis.push(element['run_id'])
                yAxis[0]['data'].push(element['passTC'])
                yAxis[1]['data'].push(element['failTC'])
                yAxis[2]['data'].push(element['norunTC'])
                yAxis[3]['data'].push(element['abortTC'] ? element['abortTC'] : 0);
                yAxis[4]['data'].push(element['warnTC'] ? element['warnTC'] : 0);
            });

            this.dataService.selectedRegStatus.subscribe((e) => {
                this.selectedRegStatus = e;                
                if ((this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))) {
                    this.showNoRun = false;
                } else {
                    this.showNoRun = true;
                }
            });
            const colorsList = ["#24a148", '#fa4d56', "#f1c21b", '#f78489ff', '#c76b20']
            this.chartInput = {
                title: { show: false },
                color: colorsList,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    formatter: (params, ticket, callback) => {
                        var temp = ``;
                        var head = ``;
                        var total = 0;
                        if (params[0] && params[0]['axisValue']) {
                            total += params[0]['value'];
                            head += `<div class="text-center" style="width:100%"> ${params[0]['axisValue']}</div>`
                            temp += `<div class="row">
                                    <div class="col-sm-6">${params[0]['seriesName']}</div>
                                    <div class="col-sm-6">: ${params[0]['value']}</div>
                                </div>`
                        }
                        if (params[1] && params[1]['axisValue']) {
                            total += params[1]['value'];
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[1]['value']}</div>
                    </div>`
                        }
                        if (params[2] && params[2]['axisValue']) {
                            total += params[2]['value'];
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[2]['value']}</div>
                    </div>`
                        }
                        if (params[3] && params[3]['axisValue']) {
                            total += params[3]['value'];
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[3]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[3]['value']}</div>
                    </div>`
                        }
                        if (params[4] && params[4]['axisValue']) {
                            total += params[4]['value'];
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[4]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[4]['value']}</div>
                    </div>`
                        }
                        var finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`
                        return head + finaltotal + temp;

                    }
                },
                legend: {
                    show: true,
                    data: ['Passed TC', 'Failed TC', 'No Run TC', 'Aborted TC', 'Warn TC'],
                    itemGap: 5,
                    textStyle: {

                        color: '#0d0d0d'

                    },
                    selected: {
                        "Passed TC": this.selectedRegStatus.includes('Completed')? true : false,
                        "Failed TC": this.selectedRegStatus.includes('Completed')? true : false,
                        "No Run TC": (this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))? false : true,
                        "Aborted TC": this.selectedRegStatus.includes('Completed') ? true : false,
                        "Warn TC": this.selectedRegStatus.includes('Completed') ? true : false,
                    }
                },
                grid: {
                    left: '7%',
                    right: '4%',
                    bottom: '10%',
                    top: '15%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxis,
                        name: 'Regression Jobs',
                        nameLocation: "center",
                        nameTextStyle: { padding: 11 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLabel: null,

                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: "No Of Test Cases",
                        nameLocation: "center",
                        nameTextStyle: { padding: 20 },
                        minInterval: 1,
                        splitLine: {
                            lineStyle: {
                                color: '#f2f2f2',
                            },
                        },
                        axisLine: {
                            show: true,
                            
                          },
                    },
                ],
                series: yAxis,
            };


            var legends = ['Pass TC', 'Fail TC', 'No Run TC', 'Aborted TC', 'Warn TC'];

            var passTC = 0;
            var failTC = 0;
            var noRunTC = 0;
            let abortTC = 0;
            let warnTC = 0;
            this.currentData.forEach(element => {
                passTC += element['passTC'];
                failTC += element['failTC'];
                noRunTC += element['norunTC'];
                abortTC += element.abortTC ? element.abortTC : 0;
                warnTC += element.warnTC ? element.warnTC : 0;
            });
            var series = [
                {
                    name: 'Pass TC',
                    value: passTC
                },
                {
                    name: 'Fail TC',
                    value: failTC
                },
                {
                    name: 'No Run TC',
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
            }
    }
/* based on particular value navigates to next level */
    redirectNext() {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month, day: d.day }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => {
            return String(data.year) + ('0' + String(data.month)).slice(-2) + ('0' + String(data.day)).slice(-2);
        })
        var index = _.findIndex(uniqYearsandMonth, { year: this.selectedYear, month: this.selectedMonth, day: this.selectedDay })
        if (index < uniqYearsandMonth.length - 1) {
            this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/day/${this.actualYear}/${this.actualMonth}/${uniqYearsandMonth[index + 1]['day'] + '-' + this.monthNames[uniqYearsandMonth[index + 1]['month']] + '-' + this.pathQuarter + '-' + uniqYearsandMonth[index + 1]['year']}`);
        }

    }
/* based on selection navigates to previous level */
    redirectPrevious() {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month, day: d.day }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => {
            return String(data.year) + ('0' + String(data.month)).slice(-2) + ('0' + String(data.day)).slice(-2);
        })
        var index = _.findIndex(uniqYearsandMonth, { year: this.selectedYear, month: this.selectedMonth, day: this.selectedDay })
        if (index > 0) {
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/day/${this.actualYear}/${this.actualMonth}/${uniqYearsandMonth[index - 1]['day'] + '-' + this.monthNames[uniqYearsandMonth[index - 1]['month']] + '-' + this.pathQuarter + '-' + uniqYearsandMonth[index - 1]['year']}`);
        }
    }

    goBackLevel() {
        this.dataService.regressionNoData.next(false);
        this.dataService.backFromDayScreen.next(true);
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${this.actualYear}/${this.actualMonth+"-"+this.pathQuarter}`)
    }
/* downloads the selected data into report */
downloadReport(type) {
    this.dataService.loading.next(true);
    setTimeout(() => {
        if(type == 'excel') {
            this.downloadExcelReport();
        } else {
            this.downloadPdfReport();
        }
    }, 200)

}

capture(type) {
    this.captureService
      .getImage(this.screen.nativeElement, true)
      .subscribe((img) => {
        this.imgBase64 = img;
      });
    this.captureService
    .getImage(this.screen2.nativeElement, true)
    .subscribe((img) => {
    this.imgBase642 = img;
    this.downloadReport(type)
    });
      setTimeout(()=>{
      },0)
  }

    async downloadPdfReport() {
        let filter={}
        let option={}
        this.dataService.getfilter().subscribe((data)=>{
            filter=data
        })
        var head = (this.showNoRun)? [['TagName/RunID','Device','Firmware Version', 'Model','Total','Pass','Fail','Norun', 'Aborted', 'Warn']] : [['TagName/RunID','Device','Firmware Version', 'Model','Total','Pass','Fail','Aborted', 'Warn']];
        var body = []


        const doc = new jsPDF('p', 'mm', 'a4');
        this.source.getAll().then((res)=>{
            res.forEach((row)=>{
                let temp=[row.run_id,row.deviceName,row.firmwareVersion== undefined?'NA':row.firmwareVersion,row.model,row.totalTC,row.passTC,row.failTC,row.norunTC, row.abortTC ? row.abortTC : 0, row.warnTC ? row.warnTC : 0]
                body.push(temp)
            })
        })
        doc.text('Regression Jobs Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text( 'Type' , 20, 20);
        doc.text(': ' + `Regressions (${this.selectedDay}/${this.selectedMonth}/${this.selectedYear})`, 43, 20);
        doc.text( `Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Generated By`, 20, 30);
        doc.text(`:  ${this.user.username}`, 43, 30);
        doc.text(`User Selected`, 20, 35);
        doc.text(`:  ${filter['user']==1?"All":filter['user']}`, 43, 35);
        doc.text(`DeviceType Selected`, 20, 40);
        doc.text(`:  ${filter['deviceType']==1?"All":filter['deviceType']}`, 54, 40);
        doc.text(`Model Selected`, 20, 45);
        doc.text(`:  ${filter['model']==1?"All":filter['model']}`, 45, 45);
        doc.text(`Firmware Version`, 20, 50);
        doc.text(`:  ${filter['firmwareVersion'] === 1 ? 'All' : filter['firmwareVersion']}`, 49, 50);
        doc.text(`Regression status`, 20, 55);
        doc.text(`:  ${this.selectedRegStatus.join(', ')}`, 49, 55);
        doc.line(0, 59, 300, 59);
        this.pdfHeight = 58;

        if (this.chartInstance) {
            doc.text( 'Job-wise Summary', 85, this.pdfHeight);
            this.pdfHeight += 8;
            await doc.addImage(
                this.imgBase64,
                'png',
                5,
                this.pdfHeight,
                220,
                100,
                '',
                'FAST'
            );
            option= {
                0: {cellWidth:60},
                1: {cellWidth: 30},
                2: {cellWidth: 20},
                3: {cellWidth: 20},
                4: {cellWidth: 15},
               5: {cellWidth: 15},
               6: {cellWidth: 15},
                7: {cellWidth: 15}
              };
            doc.text( 'Detailed Summary', 85, 170);
            autoTable(doc,{ head: head, body: body,theme:'grid',startY:180,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',font: 'arial',fontSize: 10,},columnStyles: option})
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        await doc.save(`iCAT-Regression-Report(${this.selectedDay}/${this.selectedMonth}/${this.selectedYear}).pdf`);
        this.dataService.loading.next(false);
    }
    /** Handler */
    categoryMapHander(categoryMap) {
        
        this.categoryMap = categoryMap;
    }
    /** Handler */
    reasonMapHander(categoryMap) {
        this.reasonMap = categoryMap;
    }
    /* converts the data into excelsheet */
    downloadExcelReport(): void{ 
        let filter:any={}
        this.dataService.getfilter().subscribe((data)=>{
            filter=data
        })
        let details = {
            "Type": `Regressions (${this.selectedDay}/${this.selectedMonth}/${this.selectedYear})`,
            "Report Date" : `${new Date()}`, 
            "Generated By" : `${this.user.username}`,
            "User Selected" : `${filter['user']==1?"All":filter['user']}`,
            "Device Type Selected" : `${filter['deviceType']==1?"All":filter['deviceType']}`,
            "Model Selected":`${filter['model']==1?"All":filter['model']}`,
            "Firmware Version": `${filter['firmwareVersion'] === 1 ? 'All' : filter['firmwareVersion']}`,
            "Regression status": `${this.selectedRegStatus.join(', ')}`,
        };
        let clonedData;
        this.source.getAll().then((data) => {
            clonedData = _.cloneDeep(data);
            
            clonedData.forEach(el => {
                console.log("el", el.job_id.substring(0,el.job_id.lastIndexOf('_1')));
                if(el.job_id.substring(0,el.job_id.lastIndexOf('_1')) == el.run_id )
                
                   {
                        el.run_id = "NA";   
                    }
            });

            let tableHeaderKeysInOrder = (this.showNoRun)? ['job_id','run_id','totalfirmware','deviceName','model','totalTC','passTC','failTC','norunTC'] : ['job_id','run_id','totalfirmware','deviceName','model','totalTC','passTC','failTC'];
            let columns = (this.showNoRun)? ["RunID","TagName","Firmware Version","Device Name", "Model Name", "Total Tc","Pass Tc","Fail Tc","No Run Tc"] : ["RunID","TagName","Firmware Version","Device Name", "Model Name", "Total Tc","Pass Tc","Fail Tc"];
            this.excel.exportAsExcelFile("Summary", details, columns, clonedData, tableHeaderKeysInOrder, "ICAT-Day-Regression-Report", "Day Regression Jobs Summary", this.imgBase64, this.imgBase642, this.categoryMap, this.reasonMap);
            this.dataService.loading.next(false);
        });
    }

    onUserRowSelect(event): void {
        this.tlService.viewHTMLLogsForJob(event.data.job_id, null); 
    }

}
