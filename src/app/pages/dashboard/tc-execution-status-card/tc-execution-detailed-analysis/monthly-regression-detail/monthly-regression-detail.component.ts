import { slideInOutAnimation } from './../../../../../@shared/animations/slide-in-out.animation';
import { DataService } from './../../../../../@core/services/data.service';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { InformationDiaogComponent } from './../../../../../@shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy,ViewChild, Input, Output } from '@angular/core';
import { ExcelService } from "../services/excel-service";
import * as _ from 'lodash';
import { LocalDataSource } from 'angular2-smart-table';
import jsPDF from 'jspdf';
import { NgxCaptureService } from 'ngx-capture';
import autoTable from 'jspdf-autotable';
import { CustomizedCalenderHeaderComponent } from '../customized-calender-header/customized-calender-header.component';


@Component({
    selector: 'app-monthly-regression-detail',
    templateUrl: './monthly-regression-detail.component.html',
    styleUrls: ['./monthly-regression-detail.component.scss'],
    animations: [
        slideInOutAnimation
    ],
    // providers: [
    //     {
    //       provide: DateAdapter,
    //       useClass: MonthpickerDateAdapter,
    //       deps: [MAT_DATE_LOCALE, Platform],
    //     },
    //   ],
})
export class MonthlyRegressionDetailComponent implements OnInit, OnDestroy {
    @ViewChild('screen', { static: true }) screen: any;
    @ViewChild('screen2', { static: true }) screen2: any;
    subscription = null
    allYearData = [];
    currentData = []

    categoryMap ;
    reasonMap;

    selectedYear = null;
    chartInstance = null;
    chartInstancePIE = null;
    state = 'next';
    chartInput = {};
    chartInputPIE = {};
    allYears = [];
    next = false;
    back = false;
    latestYear;
    sub1;
    sub2;
    pathQuarter;
    quarter="";
    arrayQuarter=[]
    QuarterObj ={1:"Q1",2:"Q1",3:"Q1",4:"Q2",5:"Q2",6:"Q2",7:"Q3",8:"Q3",9:"Q3",10:"Q4",11:"Q4",12:"Q4"}
    monthobj={1:"January", 2:"February", 3:"March", 4:"April", 5:"May", 6:"June",
    7:"July", 8:"August", 9:"September", 10:"October", 11:"November", 12:"December"}
    sub3;
    sub4;
   pdfHeight = 0;
    user;
    max;
    tableData;
    nextYear;
    allArry=[]
    name = 'Angular';
    imgBase64 = '';
    imgBase642 = '';
    q1 ={totalTC:0,totalReg:0,totalPass:0,totalFail:0,firmwareVersion:[],totalNorun:0,totalAbort:0,totalWarn:0 }
    q2 ={totalTC:0,totalReg:0,totalPass:0,totalFail:0,firmwareVersion:[],totalNorun:0,totalAbort:0,totalWarn:0}
    q3 ={totalTC:0,totalReg:0,totalPass:0,totalFail:0,firmwareVersion:[],totalNorun:0,totalAbort:0,totalWarn:0}
    q4 ={totalTC:0,totalReg:0,totalPass:0,totalFail:0,firmwareVersion:[],totalNorun:0,totalAbort:0,totalWarn:0}
    monthNames = [null, "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    loading = true;
    source: LocalDataSource = new LocalDataSource();
    detailData: any;
    dataType = 'monthly';
    selectedRegStatus: any;
    showNoRun: boolean =  false;
    filteredMonth: any;
    filteredYear: any;
    filteredEndMonth: any;
    filteredEndYear: any;
    calenderHeader = CustomizedCalenderHeaderComponent;
    year: any;
    maxDate = new Date();
    minDate = new Date(2022, 0, 1);
    minEndDate = new Date(2022, 0, 1);
    showNoDataMsg = true;
    constructor(private captureService: NgxCaptureService, public dataService: DataService, private activatedRoute: ActivatedRoute, private matDialog: MatDialog, private router: Router, private excel:ExcelService) {

        this.user = this.dataService.getCurrentUser();
        this.dataService.backFromDayScreen.next(false);
        this.dataService.filteredMonth.subscribe(month => {
                this.filteredMonth = month || month == 0 ? month : null;
        });
        this.dataService.filteredYear.subscribe(year => {
                this.filteredYear = year ? year : null;
        });
        this.dataService.filteredEndMonth.subscribe(month => {
                this.filteredEndMonth = month ? month : null;
        });
        this.dataService.filteredEndYear.subscribe(year => {
                this.filteredEndYear = year ? year : null;
        });
        this.subscription = this.activatedRoute.params.pipe(
            debounceTime(100),
            map(res => {
      
                this.nextYear = this.selectedYear;
             this.pathQuarter = res.year.split("_")[1]
     
            //    res.year.split("_")[1]
          
                return res.year.split("_")[0]
            }),
            switchMap(year => this.dataService.regressionAnalysisData.pipe(map(data => {
                // this.currentData =[]
                this.allArry =[]
                
                this.tableData ={}
                this.arrayQuarter=[]
               
               
                return { data, year }
            }))),
            debounceTime(1000))
            .subscribe((data: any) => {
                if (data.data) {
                    if (!isNaN(data.year) && Number(data.year) <= new Date().getFullYear()) {
                        this.year = Number(data.year);
                        if (!this.filteredMonth && !this.filteredYear){
                            this.dataService.selectedquarterYear.next(this.year);
                        }
                        if (data.data) {
                            this.detailData = data.data.monthlyData;
                            this.allYearData = data.data.monthlyData;
                            setTimeout(() => {
                                this.loadYears(this.year);
                                this.loadData(this.year);
                                this.loading = false;
                            }, 100)

                        }
                    } else {
                        const dialog = this.matDialog.open(InformationDiaogComponent,
                            {
                                panelClass: 'app-full-bleed-dialog',
                                data: {
                                    title: 'Invalid Year',
                                    body: `Please select a valid year to get regression analysis.
                                            Latest data is displayed !!!`
                                },
                                width: '600px'
                            });
                        this.sub2 = dialog.afterClosed().subscribe(() => {
                            this.router.navigateByUrl(`pages/dashboard/tc-execution-analysis/monthly/${this.latestYear}`)
                        })

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

    loadData(year) {
        var index = _.findIndex(this.allYearData, { _id: year });
        if (index < 0) {
            // const dialog = this.matDialog.open(InformationDiaogComponent,
            //     {
            //         panelClass: 'app-full-bleed-dialog',
            //         data: {
            //             title: 'No Data',
            //             body: `No Data Available for Selected Year.
            //                         Displaying the Latest data !!!`
            //         },
            //         width: '600px'
            //     });
            // this.sub3 = dialog.afterClosed().subscribe(() => {
            //     this.router.navigateByUrl(`pages/dashboard/tc-execution-analysis/monthly/${this.latestYear}`)
            // })
            this.dataService.regressionNoData.next(true);
        } else {
            this.dataService.backFromDailyScreen.subscribe(fromDailyScreen => {
                const input = document.getElementById('pickerInput') as HTMLInputElement | null;
                const input2 = document.getElementById('pickerInput2') as HTMLInputElement | null;
                if (fromDailyScreen){
                    if ((this.filteredMonth || this.filteredMonth == 0) && this.filteredYear){
                        input.value = ('0' + (Number(this.filteredMonth) + 1).toString()).slice(-2) + '/' + this.filteredYear.toString();
                        input2.value = ('0' + (Number(this.filteredEndMonth) + 1).toString()).slice(-2) + '/'
                                        + this.filteredEndYear.toString();
                    }
                } else {
                    if ((this.filteredMonth || this.filteredMonth == 0) && this.filteredYear){
                        input.value = ('0' + (Number(this.filteredMonth) + 1).toString()).slice(-2) + '/' + this.filteredYear.toString();
                        input2.value = ('0' + (Number(this.filteredEndMonth) + 1).toString()).slice(-2) + '/'
                                        + this.filteredEndYear.toString();
                    } else {
                    input.value = null;
                    input2.value = null;
                    }
                }
            });
            this.currentData = this.allYearData[index]['monthlyData'];
            this.selectedYear = this.allYearData[index]['_id'];     
            let aryTotal={totalPass:0,totalFail:0,totalNoRun:0,totalReg:0,firmwareVersion:[],modelFWVersion:[],totalTc:0, totalAbort: 0, totalWarn: 0,}
            this.allYearData.forEach((years)=>{
                years['monthlyData'].forEach((res)=>{
                    res.monthName = this.monthobj[res.month]
                });
            });
               
            this.allYearData[index]['monthlyData'].forEach((res)=>{
                console.log('res @ 240',res);
                if(res.quarter == this.pathQuarter) {                
                    this.arrayQuarter.push(res);           
                }
            });
            this.arrayQuarter.forEach((res) => {
                aryTotal.totalPass += res.passTC;
                aryTotal.totalFail += res.failTC;
                aryTotal.totalNoRun += res.norunTC;
                aryTotal.totalReg+= res.totalReg;
                aryTotal.totalTc+= res.totalTC;
                aryTotal.totalAbort += res.abortTC ? res.abortTC : 0;
                aryTotal.totalWarn += res.warnTC ? res.warnTC : 0;
                if(res.firmwareVersion){
                    let firmV = aryTotal.firmwareVersion.concat(res.firmwareVersion);
                    console.log('frimV',firmV);
                    aryTotal.firmwareVersion = [...new Set(firmV)];
                }
                if (res.modelFWVersion){
                    const tempArray = Array.from(res.modelFWVersion, ([Model, FirmwareVersion]) => ({ Model, FirmwareVersion }));
                    res.modelFWVersionlist = [];
                    tempArray.forEach(temp => {
                        res.modelFWVersionlist.push(temp);
                    });
                }

            });
            if (aryTotal.totalReg > 0) {
                this.showNoDataMsg = false;
                this.dataService.regressionNoData.next(false);

            } else {
                this.showNoDataMsg = true;
                this.dataService.regressionNoData.next(true);
            }
            console.log("Load", this.arrayQuarter);
            this.source.load(this.arrayQuarter);
            console.log("load arr", aryTotal);
            this.tableData = aryTotal;
            this.processData();
            if ((this.filteredMonth  || this.filteredMonth == 0) && this.filteredYear) {
                this.quarterChange();
            }
            this.loading = false;
        }
    }
    public monthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        const year = Number(array[3]);
        this.filteredYear = year;
        const month = ('0' + (this.months.indexOf(array[1]) + 1).toString()).slice(-2);
        this.filteredMonth = this.months.indexOf(array[1]);
        this.dataService.filteredMonth.next(this.filteredMonth);
        this.dataService.filteredYear.next(this.filteredYear);
        input.value = month + '/' + year;
        this.minEndDate = value;
        if ((!this.filteredEndMonth && !this.filteredEndYear) || (this.filteredEndMonth < this.filteredMonth
            && !(this.filteredYear < this.filteredEndYear)) || (this.filteredYear > this.filteredEndYear)){
            const endMonth = document.getElementById('pickerInput2') as HTMLInputElement | null;
            endMonth.value = month + '/' + year;
            this.filteredEndMonth = this.filteredMonth;
            this.filteredEndYear = this.filteredYear;
            this.dataService.filteredEndMonth.next(this.filteredEndMonth);
            this.dataService.filteredEndYear.next(this.filteredEndYear);
        }
        picker.close();
        this.quarterChange();
    }
    public endMonthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        this.filteredEndYear = Number(array[3]);
        this.filteredEndMonth =  this.months.indexOf(array[1]);
        this.dataService.filteredEndMonth.next(this.filteredEndMonth);
        this.dataService.filteredEndYear.next(this.filteredEndYear);
        const month = ('0' + (this.months.indexOf(array[1]) + 1).toString()).slice(-2);
        const year = Number(array[3]);
        input.value = month + '/' + year;
        picker.close();
        this.quarterChange();
    }
    onClear(): void {
        this.filteredMonth = null;
        this.filteredYear = null;
        this.filteredEndMonth = null;
        this.filteredEndYear = null;
        const input = document.getElementById('pickerInput') as HTMLInputElement | null;
        input.value = null;
        const input2 = document.getElementById('pickerInput2') as HTMLInputElement | null;
        input2.value = null;
        this.dataService.filteredMonth.next(null);
        this.dataService.filteredYear.next(null);
        this.dataService.filteredEndMonth.next(null);
        this.dataService.filteredEndYear.next(null);
        this.dataService.selectedquarterYear.subscribe(year => {
            if (year){
                this.year = year;
            }
        });
        this.arrayQuarter = [];
        this.loadYears(this.year);
        this.loadData(this.year);
    }
    public dateRange(): any {
    const startYear = this.filteredYear;
    const endYear = this.filteredEndYear;
    const dates = [];
    for (let i = startYear; i <= endYear; i++) {
        const endMonth = i !== endYear ? 11 : this.filteredEndMonth;
        const startMon = i === startYear ? this.filteredMonth : 0;
        for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
            dates.push([i, j].join('-'));
        }
    }
    return dates;
}
    quarterChange(): void {
        this.loading = true;
        const index = _.findIndex(this.allYearData, { _id: this.filteredYear });
       // this.quarter = event.value
      //  if(event.value == "1M") {
        let aryTotal = { totalPass: 0, totalFail: 0, totalNoRun: 0, totalReg: 0, totalAbort: 0, totalWarn: 0, firmwareVersion: [], modelFWVersion: [], totalTc: 0 }
        let d = new Date();
        const newMonth = this.filteredMonth;
        const endMonth = this.filteredEndMonth;
        this.arrayQuarter = [];
        console.log('filtered start month and year', this.filteredMonth, this.filteredYear);
        console.log('filtered end month and year', this.filteredEndMonth, this.filteredEndYear);
        if ( this.filteredMonth === this.filteredEndMonth && this.filteredYear === this.filteredEndYear){
            this.arrayQuarter = [this.allYearData[index]?.['monthlyData'][newMonth]];
            console.log('monthly data for selected year ', this.allYearData[index]?.['monthlyData']);
            console.log('final Array quarterin if ', this.arrayQuarter);
        } else {
            const months = this.dateRange();
            console.log('months', months);
            months.forEach(month => {
                const index1 = _.findIndex(this.allYearData, { _id: Number(month.split('-')[0]) });
                console.log('monthly data for selected year ', this.allYearData[index1]?.['monthlyData']);
                this.arrayQuarter.push(this.allYearData[index1]?.monthlyData[Number(month.split('-')[1])]);
            });
            console.log('final array quarter in else', this.arrayQuarter);
        }
        this.detailData = this.arrayQuarter;
        this.source.load(this.arrayQuarter)
        this.processData()
        this.arrayQuarter.forEach((res) => {
            aryTotal.totalPass += res.passTC;
            aryTotal.totalFail += res.failTC;
            aryTotal.totalNoRun += res.norunTC;
            aryTotal.totalReg += res.totalReg;
            aryTotal.totalTc += res.totalTC;
            aryTotal.totalAbort += res.abortTC ? res.abortTC : 0;
            aryTotal.totalWarn += res.warnTC ? res.warnTC : 0;
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
        });
        if (aryTotal.totalReg > 0) {
            this.showNoDataMsg = false;
            this.dataService.regressionNoData.next(false);

        } else {
            this.showNoDataMsg = true;
            this.dataService.regressionNoData.next(true);

        }
        console.log("1M arr", aryTotal);
        this.tableData = aryTotal;
        this.loading = false;
       // }  
        // else {
        //     let aryTotal={totalPass:0,totalFail:0,totalNoRun:0,totalReg:0,firmwareVersion:[],modelFWVersion: [],totalTc:0}
        //     let date= new Date()
        //     let currMonth=date.getMonth()
        //     this.currentData=[]
        //     let count=Number(event.value.split('-')[1])
        //     let limit=_.cloneDeep(count)
        //     let currArr=[]
        //     for (let mindex = 1; mindex<=limit; mindex++) {
        //         if(this.allYearData[index]['monthlyData'][currMonth-mindex]!=undefined){
        //             currArr.unshift(this.allYearData[index]['monthlyData'][currMonth-mindex])
        //             count--
        //         }
        //         else{
        //             for (let pindex = count; pindex >= 1; pindex--) {
        //                 if(this.allYearData[index-1]!=undefined&&this.allYearData[index-1]['monthlyData'][this.allYearData[index-1]['monthlyData'].length-pindex]!=undefined) {
        //                     this.currentData.push(this.allYearData[index-1]['monthlyData'][this.allYearData[index-1]['monthlyData'].length-pindex])
        //                 }
        //                 else {
        //                     let month={passTC: 0,failTC: 0,norunTC: 0,totalTC: 0,totalReg: 0,month: 13-pindex,quarter:this.QuarterObj[13-pindex],year:this.allYearData[index]['_id']-1,monthName:this.monthobj[13-pindex]}
        //                     this.currentData.push(month);
        //                 }
        //             }                
        //             break;
        //         }
                
        //     }
        //     this.currentData=this.currentData.concat(currArr)
        //     this.source.load(this.currentData)
        //     this.arrayQuarter = this.currentData
        //     this.detailData = this.arrayQuarter;
        //     this.processData()
        //     console.log("else", this.arrayQuarter);
        //     this.arrayQuarter.forEach((res) => {
        //         aryTotal.totalPass += res.passTC;
        //         aryTotal.totalFail += res.failTC;
        //         aryTotal.totalNoRun += res.norunTC;
        //         aryTotal.totalReg+= res.totalReg;
        //         aryTotal.totalTc+= res.totalTC;
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
        //     })
        //     console.log("else ary", aryTotal);
        //     this.tableData = aryTotal;
        // }
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
    /* based on data performs the action to generate report */
    processData() {
        // this.state = 'middle'
        // let tempState;
        // if (this.selectedYear < Number(this.nextYear)) {
        //     tempState = 'back'
        // } else {
        //     tempState = 'next'
        // }
        // setTimeout(() => {
        //     this.state = tempState
        // }, 20)
            const xAxis = [];
            const yAxis = [{ name: 'Passed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
             { name: 'Failed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }, 
             { name: 'No Run TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
            { name: 'Aborted TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
            { name: 'Warn TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 },
             { name: 'Total Regression Jobs', data: [], type: 'line', yAxisIndex: 1  }]
            this.arrayQuarter.forEach(element => {
                xAxis.push(element?.['monthName']+" "+(element?.['year'].toString().substr(-2)))
                yAxis[0]['data'].push(element['passTC'])
                yAxis[1]['data'].push(element['failTC'])
                yAxis[2]['data'].push(element['norunTC'])
                yAxis[3]['data'].push(element['abortTC']);
                yAxis[4]['data'].push(element['warnTC']);
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
            const colorsList = ["#24a148", '#fa4d56', "#f1c21b",'#f78489ff', '#c76b20',"#5470C6"]
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
                            head += `<div class="text-center" style="width:100%">${params[0]['axisValue']}</div>`
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
                        right:10,
                        top:-7,
                        magicType: { show: true, type: ['line', 'bar'], title: {
                            line: 'Line View',
                            bar: 'Bar View'
                            }, option : {line: {stack: false}, bar: {stack: false}}},
                          restore: { show: true , title: 'Restore'},
                      
                    }
                  },
                legend: {
                    show: true,
                    top: 39,
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
                        "Total Regression Jobs":this.selectedRegStatus.includes('Completed') ? true : false,
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
                        name: 'Months',
                        nameLocation: "center",
                        nameTextStyle: { padding: 30 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLabel: {
                            rotate:30
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: "No Of TestCases",
                        nameLocation: "center",
                        nameTextStyle: { padding: 35 },
                        alignTicks: true,
                        axisLine: {
                          show: true,
                          
                        },
                       
                    },
                    {
                        type: 'value',
                        name: "Total Regression Jobs",
                        nameLocation: "center",
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
                abortTC += element.abortTC;
                warnTC += element.warnTC;
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
        console.log(event,this.selectedYear)
        if(this.arrayQuarter[event.dataIndex].totalTC!=0){
            this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${"20"+event.name.split(" ")[1]}/${this.monthNames.indexOf(event.name.split(" ")[0])+"-"+this.pathQuarter}`)
        }
        else{
            this.matDialog.open(InformationDiaogComponent,
                {
                    panelClass: 'app-full-bleed-dialog',
                    data: {
                        title: 'No Data',
                        body: `Please select a valid month to get regression analysis`
                    },
                    width: '600px'
                });
        }
       
    }

    yearSelectedPie(event) {
        const yearData = _.find(this.allYearData, { _id: this.selectedYear })
        const max = _.maxBy(yearData['monthlyData'], 'totalReg')
        if (max && typeof max === 'object' && 'month' in max) {
            this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis/daily/${this.selectedYear}/${max.month}`)
        }

    }




    // redirectNext() {
    //     this.router.navigate(['/pages/dashboard/tc-execution-analysis/monthly', this.allYears[this.allYears.indexOf(this.selectedYear) + 1]])
    // }

    // redirectPrevious() {
    //     this.router.navigate(['/pages/dashboard/tc-execution-analysis/monthly', this.allYears[this.allYears.indexOf(this.selectedYear) - 1]])
    // }
    /* load the year on selection of particular year */
    loadYears(year) {
        this.allYears = _.map(this.allYearData, d => d._id);
        this.allYears = _.sortBy(this.allYears, (a) => a);

        if (this.allYears.length === 0) {

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
            // this.sub4 = dialog.afterClosed().subscribe(() => {
            //     this.router.navigateByUrl(`/pages/dashboard`)
            // })

        } else {
            this.latestYear = this.allYears[this.allYears.length - 1]
            if (this.allYears.length === 1) {
                this.next = false;
                this.back = false
            }
            else if (this.allYears.indexOf(year) === 0) {
                this.next = true;
                this.back = false
            } else if (this.allYears.indexOf(year) + 1 === this.allYears.length) {
                this.next = false;
                this.back = true;
            } else {
                this.next = true;
                this.back = true;
            }
        }

    }
    /* downloads all the selected data */
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
        var head = (this.showNoRun)? [['Date','Total Regression Jobs','Total Unique FW Versions','Total TC','Pass TC','Fail TC','Norun TC','Abort TC','Warn TC']]
         : [['Date','Total Regression Jobs','Total Unique FW Versions','Total TC','Pass TC','Fail TC', 'Abort TC','Warn TC']];
        var body = []
        const doc = new jsPDF('p', 'mm', 'a4');
        this.source.getAll().then((res)=>{
            res.forEach((row)=>{
                let temp=[this.monthNames[row.month]+"-"+row.year,row.totalReg,row.firmwareVersion== undefined?0:row.firmwareVersion.length,row.totalTC,row.passTC,row.failTC,row.norunTC,row.abortTC,row.warnTC]
                body.push(temp)
            })
        })
        doc.text('Regression Jobs Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + 'Monthly Regressions(' + this.selectedYear + ')', 43, 20);
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
            doc.text('Monthly Regression Jobs Summary', 85, this.pdfHeight);
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
        await doc.save(`iCAT-Monthly-Regression-Report(${this.selectedYear}).pdf`);
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
    async downloadExcelReport(): Promise<void> { 
        let filter:any={}
        this.dataService.getfilter().subscribe((data)=>{
            filter=data
        })
        let details = {
            "Type": 'Monthly Regressions',
            "Report Date" : `${new Date()}`,
            "Generated By" : `${this.user.username}`,
            "User Selected" : `${filter['user']==1?"All":filter['user']}`,
            "Device Type Selected" : `${filter['deviceType']==1?"All":filter['deviceType']}`,
            "Model Selected":`${filter['model']==1?"All":filter['model']}`,
            "Firmware Version": `${filter['firmwareVersion'] === 1 ? 'All' : filter['firmwareVersion']}`,
            "Regression status": `${this.selectedRegStatus.join(', ')}`,
        };
        let json = await this.source.getAll();
        let tableHeaderKeysInOrder = (this.showNoRun)? ['monthName','totalReg','totalfirmware','totalTC','passTC','failTC','norunTC'] : ['monthName','totalReg','totalfirmware','totalTC','passTC','failTC'];
        let columns = (this.showNoRun)? ["Month","Total Regression Jobs","Total Unique FW Versions ","Total TC", "Pass TC", "Fail TC","No Run TC"] : ["Month","Total Regression Jobs","Total Unique FW Versions ","Total TC", "Pass TC", "Fail TC"];
        this.excel.exportAsExcelFile("Summary",details,columns,json.data ,tableHeaderKeysInOrder,"ICAT-Monthly-Regression-Report","Monthly Regression Jobs Summary",this.imgBase64,this.imgBase642,this.categoryMap,this.reasonMap);
        this.dataService.loading.next(false);
    }
    goBackLevel() {
        this.router.navigateByUrl(`/pages/dashboard/tc-execution-analysis`)
    }


}
