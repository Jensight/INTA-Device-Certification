import { slideInOutAnimation } from './../../../../../@shared/animations/slide-in-out.animation';
import { InformationDiaogComponent } from './../../../../../@shared/components/information-dialog/information-dialog.component';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import * as _ from 'lodash';
import  jsPDF  from 'jspdf';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ExcelService } from "../services/excel-service";
import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, OnDestroy,ViewChild } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
import { NgxCaptureService } from 'ngx-capture';
import autoTable from 'jspdf-autotable';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-daily-regression-detail',
    templateUrl: './daily-regression-detail.component.html',
    styleUrls: ['./daily-regression-detail.component.scss'],
    animations: [
        slideInOutAnimation
    ]
})
export class DailyRegressionDetailComponent implements OnInit, OnDestroy {
    @ViewChild('screen', { static: true }) screen: any;
    @ViewChild('screen2', { static: true }) screen2: any;
    categoryMap ;
    reasonMap;
    user;
    subscription;
    chartInstance;
    chartInstancePIE;
    state = 'next';
    selectedYear;
    selectedMonth;
    weekData =["This week ","Last 1 week","Last 2 week","Last 3 week","Last 4 week"]
    startDate: any;
    endDate: any;
    allDayData = [];
    next = false;
    imgBase64: string;
    imgBase642 : string;
    monthobj={1:"January", 2:"February", 3:"March", 4:"April", 5:"May", 6:"June",
    7:"July", 8:"August", 9:"September", 10:"October", 11:"November", 12:"December"}
    back = false;
    dataType = 'daily';
    currentData = [];
    chartInput;
    chartInputPIE;
    monthNames = [null, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]
    sub1;
    sub2;
    sub3;
    sub4;
    currentWeekStartDt: any;
    currentWeekEndDt: any;
    first:any;
    last:any;
    tableData;
    today = new Date();
    quarter ="";
    loading = true;
    pdfHeight = 0
    duplicateArray
    checkButton:false;
    arrayWeek:any;
  
    selectedDateRangeTxt ="";
    pathQuarter=""
    source: LocalDataSource = new LocalDataSource();
    detailData: any;

    selectedRegStatus: any;
    showNoRun: boolean =  false;
    dateRange = new FormGroup({
        start: new FormControl(),
        end: new FormControl()
      });
      maxDate=new Date();
      minDate=new Date(2022, 0, 1);
      year: any;
      month: any;
    constructor(private captureService: NgxCaptureService, public dataService: DataService,
                private activatedRoute: ActivatedRoute, private matDialog: MatDialog, private router: Router, private excel: ExcelService) {
        this.user = this.dataService.getCurrentUser();
        // this.first = this.today.getDate() - this.today.getDay(); // First day of the week
        // this.last = this.first + 6; // last day of the week
        // this.currentWeekStartDt = this.getStartOfWeek(new Date());
        // this.currentWeekEndDt = this.getEndOfWeek(new Date());
        this.dataService.backFromDayScreen.subscribe(fromDayScreen => {
            if (fromDayScreen) {
                this.dataService.filteredstartDate.subscribe(dt => {
                    if (dt){
                        this.dateRange.get('start').setValue(dt);
                    }
                });
                this.dataService.filteredendDate.subscribe(dt => {
                    if (dt){
                        this.dateRange.get('end').setValue(dt);
                    }
                });
            } else {
                this.dataService.filteredstartDate.next(null);
                this.dataService.filteredendDate.next(null);
            }
    });
        this.subscription = this.activatedRoute.params.pipe(
            debounceTime(100),
            map(res => {
                this.state = 'middle'
                let tempState;
                let month=res.month.split('-')[0]
                this.pathQuarter=res.month.split('-')[1]
                if (this.selectedYear > Number(res.year) || (this.selectedYear === Number(res.year) && this.selectedMonth > Number(month))) {
                    tempState = 'back'
                } else {
                    tempState = 'next'
                }
                setTimeout(() => {
                    this.state = tempState
                }, 100)
                return res
            }),
            switchMap(year => this.dataService.regressionAnalysisData.pipe(map(data => {
                this.currentData =[]
                this.tableData = {}
                return { data, ...year }
            }))))
            .subscribe((data: any) => {
                if (data.data) {
                    if (data.data && !isNaN(data.year) && Number(data.year) <= new Date().getFullYear() && !isNaN(data.month.split('-')[0]) && Number(data.month.split('-')[0]) < 13 && Number(data.month.split('-')[0]) > 0) {
                        this.year = Number(data.year);
                        this.month = Number(data.month.split('-')[0]);
                        if (!this.dateRange.value.start && !this.dateRange.value.start) {
                            this.dataService.selectedMonth.next(this.month);
                            this.dataService.selectedYear.next(this.year);
                        }
                        this.allDayData = data.data.dailyData || [];
                        this.detailData = data.data.dailyData;
                        setTimeout(() => {
                            this.loadYearsAndMonth(this.year, this.month);
                            this.loadData(this.year, this.month);
                            this.loading = false;
                        }, 100)
                    } else if (data.data) {
                        // const dailyData = data.data.dailyData;
                        // const maxDailydata = dailyData[dailyData.length - 1]
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
                        // this.sub2 = dialog.afterClosed().subscribe(() => {
                        //     this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${maxDailydata.year}/${maxDailydata.month}`)
                        // })
                        this.dataService.regressionNoData.next(true);
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
                    if (this.chartInstance) {
                        this.chartInstance.resize();
                    }
                    if (this.chartInstancePIE) {
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
    getStartOfWeek(date): void {
        date.setHours(0, 0, 0, 0);
        date.setDate((date.getDate() - date.getDay()) + 1);
        return date;
      }
      getEndOfWeek(date): void {
        date = this.getStartOfWeek(date);
        date.setDate(date.getDate() + 6);
        return date;
      }

    loadYearsAndMonth(year, month) {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => String(data.year) + String(data.month))
        const allDataLastIndex = uniqYearsandMonth.length - 1;
        var index = _.findIndex(uniqYearsandMonth, { year, month })
        if (index < 0) {
            const dailyData = this.allDayData;
            const maxDailydata = dailyData[dailyData.length - 1]
            // const dialog = this.matDialog.open(InformationDiaogComponent,
            //     {
            //         panelClass: 'app-full-bleed-dialog',
            //         data: {
            //             title: 'No Data',
            //             body: `No Data Available for Selected User/model.
            //                         Please run regressions and come back !!!`
            //         },
            //         width: '600px'
            //     });
            // this.sub3 = dialog.afterClosed().subscribe(() => {
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

    loadData(year, month) {
        let currentData = _.filter(this.allDayData, { year, month });
        if (currentData.length < 0) {
            const dailyData = this.allDayData;
            const maxDailydata = dailyData[dailyData.length - 1]
            const dialog = this.matDialog.open(InformationDiaogComponent,
                {
                    panelClass: 'app-full-bleed-dialog',
                    data: {
                        title: 'No Data',
                        body: `No Data Available for Selected year/month.
                                Latest data is displayed !!!`
                    },
                    width: '600px'
                });
            this.sub4 = dialog.afterClosed().subscribe(() => {
                this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${maxDailydata.year}/${maxDailydata.month}`)
            });
        } else {
            let aryTotal={totalPass:0,totalFail:0,totalNoRun:0,totalReg:0,firmwareVersion:[],totalTc:0, totalAbort:0, totalWarn: 0}
          
           let b =_.cloneDeep(this.allDayData)
           b.forEach((res)=>{
            res.monthName = this.monthobj[res.month]
            
            if(res && res.month && res.year && res.day){
                res.weekCount =this.weekCount(res.month,res.year)
                
               res.formattedData = res.day +"-" + res.monthName +"-"+ res.year
             let d = new Date(res.formattedData)
             let n = d.getDay()
             let days = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
             
             res.dayName = days[n]
             res.formattedDate = res.year +"-" + res.month +"-"+ res.day
            //  let date = new Date(res.formattedDate);
            //  let adjustedDate = date.getDate()+date.getDay();
            //  let prefixes = ['1', '2', '3', '4', '5','6'];
            //  res.weekNum = (parseInt(prefixes[0|adjustedDate/7]+1))
            res.weekNum = this.weekCountt(res.formattedDate)-2
            res.formatDateNew =  new Date(res.formattedDate).toISOString()

                // res.weekDay = d.setDate
            }
           })
         this.duplicateArray = b 
         this.currentData = _.filter(b, { year, month });
            //  this.source.load([aryTotal])
            this.selectedYear = year;
            this.selectedMonth = month;
            // this.currentData = currentData;
            this.source.load(currentData)
            this.currentData.forEach((res)=>{
                aryTotal.totalPass += res.passTC
                aryTotal.totalFail += res.failTC
                aryTotal.totalNoRun += res.norunTC;
                aryTotal.totalAbort += res.abortTC ? res.abortTC : 0;
                aryTotal.totalWarn += res.warnTC ? res.warnTC : 0;
                aryTotal.totalReg+= res.totalReg
                aryTotal.totalTc+= res.totalTC
                if(res.firmwareVersion){
                    let firmV = aryTotal.firmwareVersion.concat(res.firmwareVersion);
                    aryTotal.firmwareVersion = [...new Set(firmV)];
                }
                if (res.modelFWVersion){
                    const tempArray = Array.from(res.modelFWVersion, ([Model, FirmwareVersion]) => ({ Model, FirmwareVersion }));
                    res.modelFWVersionlist = [];
                    tempArray.forEach(temp => {
                        res.modelFWVersionlist.push(temp);
                    });
                }
          })
          this.tableData = aryTotal
            this.processData()
            this.selectedDateRangeTxt= this.monthNames[this.selectedMonth]+"("+this.selectedYear+") "+"Regression Jobs summary"
            this.quarterChange();
        }
      
    }
    
    weekCount(year, month_number) {

        // month_number is in the range 1..12
    
        var firstOfMonth = new Date(year, month_number-1, 1);
        var lastOfMonth = new Date(year, month_number, 0);
    
        var used = firstOfMonth.getDay() + lastOfMonth.getDate();

        return Math.ceil( used / 7);
    }
    weekCountt(event){
        var date = new Date(event);
    let adjustedDate = date.getDate()+date.getDay();
  
    let prefixes = ['1', '2', '3', '4', '5','6'];
    return (parseInt(prefixes[1 | adjustedDate / 7])+1);
    }

    onApply(): void {
        this.dataService.filteredstartDate.next(this.dateRange.value.start);
        this.dataService.filteredendDate.next(this.dateRange.value.end);
        this.quarterChange();
    }
    onClear(): void {
        this.dataService.filteredstartDate.next(null);
        this.dataService.filteredendDate.next(null);
        this.dataService.selectedMonth.subscribe(mnth => {
            if (mnth){
                this.month = mnth;
            }
        });
        this.dataService.selectedYear.subscribe(year => {
            if (year){
                this.year = year;
            }
        });
        this.dateRange.reset();
        this.loadYearsAndMonth(this.year, this.month);
        this.loadData(this.year, this.month);

    }
    quarterChange(){
   // this.quarter = event.value
   // if(event.value == "1W"){
        this.loading =true;
        let aryTotal = { totalPass: 0, totalFail: 0, totalNoRun: 0, totalReg: 0, firmwareVersion: [], totalTc: 0, totalAbort: 0, totalWarn: 0 };
        this.startDate = this.dateRange.value.start;
        this.endDate = this.dateRange.value.end;
        if (this.startDate && this.endDate){
        this.selectedDateRangeTxt = this.startDate.toDateString() + " - " + this.endDate.toDateString()
        this.currentData = this.duplicateArray.filter(res => {
            return new Date(res.formattedDate) >= new Date(this.startDate) && new Date(res.formattedDate) <= new Date(this.endDate)
        })
        this.source.load(this.currentData)
        this.detailData = this.currentData;
        this.currentData.forEach((res) => {
            aryTotal.totalPass += res.passTC
            aryTotal.totalFail += res.failTC
            aryTotal.totalNoRun += res.norunTC
            aryTotal.totalAbort += res.abortTC ? res.abortTC : 0;
            aryTotal.totalWarn += res.warnTC ? res.warnTC : 0;
            aryTotal.totalReg += res.totalReg
            aryTotal.totalTc += res.totalTC
            if (res.firmwareVersion) {
                let firmV = [...aryTotal.firmwareVersion, ...res.firmwareVersion];
                aryTotal.firmwareVersion = [...new Set(firmV)];
            }
            if (res.modelFWVersion) {
                const tempArray = Array.from(res.modelFWVersion, ([Model, FirmwareVersion]) => ({ Model, FirmwareVersion }));
                res.modelFWVersionlist = [];
                tempArray.forEach(temp => {
                    res.modelFWVersionlist.push(temp);
                });
            }
        })
        this.tableData = aryTotal;
        this.processData();
        this.loading = false;
    }

    //  }else {
    //     let count=Number(event.value.split('-')[1])
    //     let aryTotal={totalPass:0,totalFail:0,totalNoRun:0,totalReg:0,firmwareVersion:[],totalTc:0}
   
    //     const NoOfDays = 7 * count;
    //     this.startDate = new Date(this.currentWeekStartDt - NoOfDays * 24 * 60 * 60 * 1000);
    //     this.endDate = new Date(this.currentWeekEndDt - 7 * 24 * 60 * 60 * 1000);
    //     this.selectedDateRangeTxt = this.weekData[count] +" - "+ this.startDate.toDateString() +" - "+this.endDate.toDateString()
    //      this.currentData =  this.duplicateArray.filter(res=>{
    //         return new Date(res.formattedDate) >= new Date(this.startDate) && new Date(res.formattedDate) <= new Date(this.endDate)
    //     })
    //     this.source.load(this.currentData)
    //     this.detailData = this.currentData;
    //     this.currentData.forEach((res)=>{
    //         aryTotal.totalPass += res.passTC
    //         aryTotal.totalFail += res.failTC
    //         aryTotal.totalNoRun += res.norunTC
    //         aryTotal.totalReg+= res.totalReg
    //         aryTotal.totalTc+= res.totalTC
    //         if(res.firmwareVersion) {
    //             let firmV = [...aryTotal.firmwareVersion, ...res.firmwareVersion];
    //             aryTotal.firmwareVersion = [...new Set(firmV)];
    //         }
    //         if (res.modelFWVersion){
    //             const tempArray = Array.from(res.modelFWVersion, ([Model, FirmwareVersion]) => ({ Model, FirmwareVersion }));
    //             res.modelFWVersionlist = [];
    //             tempArray.forEach(temp => {
    //                 res.modelFWVersionlist.push(temp);
    //             });
    //         }
    //   })
    //   this.tableData = aryTotal
    //     this.processData()
    //  }

    }
    /* based on selection navigates to next level */
    redirectNext() {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => String(data.year) + String(data.month))
        const allDataLastIndex = uniqYearsandMonth.length - 1;
        var index = _.findIndex(uniqYearsandMonth, { year: this.selectedYear, month: this.selectedMonth })
        if (index < uniqYearsandMonth.length - 1) {
            this.router.navigate(['/pages/dashboard/tc-execution-analysis/daily', uniqYearsandMonth[index + 1]['year'], uniqYearsandMonth[index + 1]['month']])
        }

    }
    /* based on selection navigates to previous level */
    redirectPrevious() {
        const mappedYear = _.map(this.allDayData, (d) => {
            return { year: d.year, month: d.month }
        });
        const uniqYearsandMonth = _.uniqBy(mappedYear, data => String(data.year) + String(data.month))
        const allDataLastIndex = uniqYearsandMonth.length - 1;
        var index = _.findIndex(uniqYearsandMonth, { year: this.selectedYear, month: this.selectedMonth })
        if (index > 0) {
            this.router.navigate(['/pages/dashboard/tc-execution-analysis/daily', uniqYearsandMonth[index - 1]['year'], uniqYearsandMonth[index - 1]['month']])
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
             { name: 'Total Regression Jobs', data: [], type: 'line', yAxisIndex: 1  },
            ]
            this.currentData.forEach(element => {
                xAxis.push(element['day']+"-"+element['monthName'])
                yAxis[0]['data'].push(element['passTC'])
                yAxis[1]['data'].push(element['failTC'])
                yAxis[2]['data'].push(element['norunTC'])
                yAxis[3]['data'].push(element['abortTC'] ? element['abortTC'] : 0);
                yAxis[4]['data'].push(element['warnTC'] ? element['warnTC'] : 0);
                yAxis[5]['data'].push(element['totalReg'])
            });
            this.dataService.selectedRegStatus.subscribe((e) => {
                this.selectedRegStatus = e;                
                if ((this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))) {
                    this.showNoRun = false;
                } else {
                    this.showNoRun = true;
                }
            });
            const colorsList = ["#24a148", '#fa4d56', "#f1c21b", '#f78489ff', '#c76b20', "#5470C6"]
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
                            if(params[0]['seriesName'] == 'Total Regression Jobs'){
                                params[0]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[0]['value'];
                            }
                            head += `<div class="text-center" style="width:100%"> Day - ${params[0]['axisValue']}</div>`
                            temp += `<div class="row">
                                    <div class="col-sm-6">${params[0]['seriesName']}</div>
                                    <div class="col-sm-6">: ${params[0]['value']}</div>
                                </div>`
                        }
                        if (params[1] && params[1]['axisValue']) {
                            if(params[1]['seriesName'] == 'Total Regression Jobs'){
                                params[1]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[1]['value'];
                            }
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[1]['value']}</div>
                    </div>`
                        }
                        if (params[2] && params[2]['axisValue']) {
                            if(params[2]['seriesName'] == 'Total Regression Jobs'){
                                params[2]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[2]['value'];
                            }
                            
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[2]['value']}</div>
                    </div>`
                        }
                        if (params[3] && params[3]['axisValue']) {
                            
                            if(params[3]['seriesName'] == 'Total Regression Jobs'){
                                params[3]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[3]['value'];
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[3]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[3]['value']}</div>
                    </div>`
                        }
                                                if (params[4] && params[4]['axisValue']) {

                            if(params[4]['seriesName'] == 'Total Regression Jobs'){
                                params[4]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[4]['value'];
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[4]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[4]['value']}</div>
                    </div>`
                        }
                         if (params[5] && params[5]['axisValue']) {

                            if(params[5]['seriesName'] == 'Total Regression Jobs'){
                                params[5]['seriesName'] = 'Total Reg.Jobs'
                            }else{
                                total += params[5]['value'];
                            }
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[5]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[5]['value']}</div>
                    </div>`
                        }
                        var finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`
                        return ` <div style = 'width: 220px;'>`+head + finaltotal + temp+ `</div>`;

                    }
                },
                 toolbox: {
                    feature: {
                        top:-8,
                        right:10,
                        magicType: { show: true, type: ['line', 'bar'], title: {
                            line: 'Line View',
                            bar: 'Bar View'
                            }, option : {line: {stack: false}, bar: {stack: false}}},
                          restore: { show: true , title: 'Restore'},
                      
                    }
                  },
                legend: {
                    show: true,
                    top: 40,
                    data: ['Passed TC', 'Failed TC', 'No Run TC', 'Aborted TC', 'Warn TC', 'Total Regression Jobs'],
                    itemGap: 5,
                    textStyle: {

                        color: '#0d0d0d'

                    },
                    selected: {
                        "Passed TC": this.selectedRegStatus.includes('Completed')? true : false,
                        "Failed TC": this.selectedRegStatus.includes('Completed')? true : false,
                        "No Run TC": (this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))? false : true,
                        'Aborted TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        'Warn TC': this.selectedRegStatus.includes('Completed') ? true : false,
                        "Total Regression Jobs": this.selectedRegStatus.includes('Completed')? true : false,
                    }
                },
                grid: {
                    left: '4%',
                    right: '4%',
                    bottom: '10%',
                    top: '18%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxis,
                        name: 'Days of Month',
                        nameLocation: "center",
                        nameTextStyle: { padding: 30 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLabel: {
                              interval: xAxis.length > 30 ? 15 : xAxis.length > 15 ? 5 : 0,
                            rotate: 30
                        },
                    },
                    
                ],
                yAxis: [
                    
                    {
                        type: 'value',
                        name: "No Of TestCases",
                        nameLocation: "center",
                        nameTextStyle: { padding: 30 },
                        alignTicks: true,
                        axisLine: {
                          show: true,
                         
                        },
                       
                    },
                    {
                        type: 'value',
                        name: "Total Regression Jobs",
                        nameLocation: "center",
                        nameTextStyle: { padding: 11 },
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


            var legends = ['Pass TC', 'Fail TC', 'No Run TC', 'Aborted TC', 'Warn TC', 'Total Regression Jobs'];

            var passTC = 0;
            var failTC = 0;
            var noRunTC = 0;
            var totalReg = 0;
            let abortTC = 0;
            let warnTC = 0;
            this.currentData.forEach(element => {
                passTC += element['passTC'];
                failTC += element['failTC'];
                noRunTC += element['norunTC'];
                abortTC += element.abortTC ? element.abortTC : 0;
                warnTC += element.warnTC ? element.warnTC : 0;
                totalReg += element['totalReg'];
            });
            var series = [
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
                    smooth: true,
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
            }
    }

    yearSelected(event) {
       if(this.currentData[event.dataIndex].totalTC!=0){
        const filteredYear = this.currentData[event.dataIndex].year;
        const pathMonth = this.monthNames.indexOf(event.name.split('-')[1]);
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/day/${this.selectedYear}/${this.selectedMonth}/${event.name + '-' + this.pathQuarter + '-' + filteredYear}`);
        }
        else{
            this.matDialog.open(InformationDiaogComponent,
                {
                    panelClass: 'app-full-bleed-dialog',
                    data: {
                        title: 'No Data',
                        body: `Please select a valid day to get regression analysis`
                    },
                    width: '600px'
                });
        }
    }

    yearSelectedPie(event) {
        const maxData = this.allDayData[this.allDayData.length - 1]
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/day/${maxData['year']}/${maxData['month']}/${maxData['day']}`)
    }

    goBackLevel() {
        this.dataService.regressionNoData.next(false);
        this.dataService.backFromDailyScreen.next(true);
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/monthly/${this.selectedYear+"_"+this.pathQuarter}`)
    }
    /* downloads all the selected data  */
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
        this.dataService.getfilter().subscribe((data)=>{
            filter=data
        })
        var head = (this.showNoRun)? [['Date','Total Regression Jobs','Total Unique FW Versions','Total TC','Pass TC','Fail TC','Norun TC', 'Aborted TC', 'Warn TC']] : [['Date','Total Regression Jobs','Total Unique FW Versions','Total TC','Pass TC','Fail TC', 'Aborted TC', 'Warn TC']];
        var body = []


        const doc = new jsPDF('p', 'mm', 'a4');
        this.source.getAll().then((res)=>{
            res.forEach((row)=>{
                let temp=[row.day+"-"+this.monthNames[row.month]+"-"+row.year,row.totalReg,row.firmwareVersion== undefined?0:row.firmwareVersion.length,row.totalTC,row.passTC,row.failTC,row.norunTC, row.abortTC, row.warnTC]
                body.push(temp)
            })
        })
        doc.text('Regression Jobs Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + `Daily Regressions (${this.selectedMonth}/${this.selectedYear})`, 43, 20);
        doc.text(`Report Date`, 20, 25);
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
            doc.text('Day-wise Regression Jobs Summary', 85, this.pdfHeight);
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
            autoTable(doc,{ head: head, body: body,theme:'grid',startY:180,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',cellWidth:'auto',font: 'arial',fontSize: 10,},})
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        await doc.save(`iCAT-Daily-Regression-Report(${this.selectedMonth}/${this.selectedYear}).pdf`);
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
            "Type": `Daily Regressions (${this.monthobj[this.selectedMonth]}/${this.selectedYear})`,
            "Report Date" : `${new Date()}`,
            "Generated By" : `${this.user.username}`,
            "User Selected" : `${filter['user']==1?"All":filter['user']}`,
            "Device Type Selected" : `${filter['deviceType']==1?"All":filter['deviceType']}`,
            "Model Selected":`${filter['model']==1?"All":filter['model']}`,
            "Firmware Version": `${filter['firmwareVersion'] === 1 ? 'All' : filter['firmwareVersion']}`,
            "Regression status": `${this.selectedRegStatus.join(', ')}`,
        };
        let json = [];
        this.source.getAll().then(data => json = _.cloneDeep(data));
        let tableHeaderKeysInOrder = (this.showNoRun)? ['date','totalReg','totalfirmware','totalTC','passTC','failTC','norunTC'] : ['date','totalReg','totalfirmware','totalTC','passTC','failTC']; 
        let columns = (this.showNoRun)? ["Date","Total Regression Jobs","Total Unique FW Versions","Total TC", "Pass TC", "Fail TC","No Run TC"] : ["Date","Total Regression Jobs","Total Unique FW Versions","Total TC", "Pass TC", "Fail TC"];
        //this.excel.exportAsExcelFile(this.monthobj[this.selectedMonth]+"("+this.selectedYear+") Regression Jobs Summary",details,columns,json.data ,tableHeaderKeysInOrder,"ICAT-Daily-Regression-Report","Daily Regression Jobs Summary",this.imgBase64,this.imgBase642,this.categoryMap,this.reasonMap);
        this.excel.exportAsExcelFile("Summary",details,columns,json ,tableHeaderKeysInOrder,"ICAT-Daily-Regression-Report","Daily Regression Jobs Summary",this.imgBase64,this.imgBase642,this.categoryMap,this.reasonMap);
	this.dataService.loading.next(false);
    }

}
