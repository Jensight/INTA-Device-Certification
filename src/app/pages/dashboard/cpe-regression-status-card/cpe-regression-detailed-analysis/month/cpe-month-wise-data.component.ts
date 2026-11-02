import { InformationDiaogComponent } from './../../../../../@shared/components/information-dialog/information-dialog.component';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { slideInOutAnimation } from './../../../../../@shared/animations/slide-in-out.animation';
import jsPDF  from 'jspdf';

@Component({
    selector: 'app-cpe-month-wise-analysis',
    templateUrl: './cpe-month-wise-data.component.html',
    styleUrls: ['./cpe-month-wise-data.component.scss'],
    animations: [
        slideInOutAnimation
    ]
})
export class CPEMonthWiseAnalysisComponent implements OnInit,OnDestroy {
    user;
    subscription;
    state;
    selectedYear;
    allData = {};
    selectedType;
    selectedTypeName;
    allYears = [];
    next = false;
    back = false;
    chartInput;
    chartInputPIE;
    nextYear;
    pdfHeight = 0;
    sub1;
    chartInstance;
    chartInstancePIE;
    loading = true;
    sub2;
    filteredMonth;
    filteredEndMonth;
    monthNames = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]



    constructor(public dataService: DataService, private activatedRoute: ActivatedRoute, private matDialog: MatDialog, private router: Router) {
        //If queryParams has months information 
        let temp = this.router.getCurrentNavigation().extras;
        if (temp.queryParams) {
            this.filteredMonth = temp.queryParams.filteredMonth;
            this.filteredEndMonth = temp.queryParams.filteredEndMonth;
        }
        this.user = this.dataService.getCurrentUser()
        this.subscription = this.activatedRoute.params.pipe(
            debounceTime(100),
            map((res:any) => {

                this.nextYear = this.selectedYear;
                return res
            }),
            switchMap(year => this.dataService.CPERegressionAnalysisData.pipe(map(data => {
                return { data, ...year }
            }))))
            .subscribe((data: any) => {
                // console.log(data)
                if(data['data'] && (data['type'] === 'model' || data['type'] === 'vendor') && !isNaN(data.year) &&Number(data.year) <= new Date().getFullYear() ){
                    this.allData = data['data']['monthlyData'];
                    this.selectedType = data['type'];
                    this.selectedTypeName = data['name'];
                    this.selectedYear = data['year'];
                    this.loadYears();
                    this.loading = false;
                }else {

                }
            });
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

    onChartInit(event) {
        this.chartInstance = event;
    }

    onChartInitPIE(event) {
        this.chartInstancePIE = event;
    }
/* loads all the years for the data */
    loadYears(){
        if(this.allData[this.selectedType][this.selectedYear][this.selectedTypeName]){
            this.allYears = Object.keys(this.allData[this.selectedType]);
            if (this.allYears.length === 1) {
                this.next = false;
                this.back = false
            }
            else if (this.allYears.indexOf(this.selectedYear) === 0) {
                this.next = false;
                this.back = false
                for (let index = (this.allYears.indexOf(this.selectedYear)+1); index < this.allYears.length; index++) {
                    const element = this.allYears[index];
                    if(this.allData[this.selectedType][element][this.selectedTypeName]){
                       this.next = true;
                    }
                }
            } else if (this.allYears.indexOf(this.selectedYear) + 1 === this.allYears.length) {
                this.next = false;
                this.back = false;
                for (let index = this.allYears.indexOf(this.selectedYear) -1; index >= 0 ; index--) {
                    const element = this.allYears[index];
                    if(this.allData[this.selectedType][element][this.selectedTypeName]){
                        this.back = true;
                    }
                }
            } else {
                this.next = false;
                this.back = false;
                for (let index = (this.allYears.indexOf(this.selectedYear)+1); index < this.allYears.length; index++) {
                    const element = this.allYears[index];
                    if(this.allData[this.selectedType][element][this.selectedTypeName]){
                       this.next = true;
                    }
                }
                for (let index = this.allYears.indexOf(this.selectedYear) -1; index >= 0 ; index--) {
                    const element = this.allYears[index];
                    if(this.allData[this.selectedType][element][this.selectedTypeName]){
                        this.back = true;
                    }
                }
            }
            this.processData()
        }else {
            const dialog = this.matDialog.open(InformationDiaogComponent,
                {
                    panelClass: 'app-full-bleed-dialog',
                    data: {
                        title: 'No Data/ Invalid Input ',
                        body: `No Data Available for Selected model/vendor.
                                    Please select from the available model/vendors`
                    },
                    width: '600px'
                });
            this.sub2=dialog.afterClosed().subscribe(() => {
                this.router.navigateByUrl(`/pages/dashboard/cpe-analysis`)
            })
        }
    }
/* based on selected value process the data */
    processData() {
        this.state = 'middle'
        let tempState;
        if (this.selectedYear < Number(this.nextYear)) {
            tempState = 'back'
        } else {
            tempState = 'next'
        }
        setTimeout(() => {
            this.state = tempState
        }, 20)
        const xAxis = [];
        const yAxis = [{ name: 'Passed TC', stack: 'a',areaStyle: {}, data: [], type: 'bar', barMinHeight: 3},
         { name: 'Failed TC', stack: 'a',areaStyle: {}, data: [], type: 'bar', barMinHeight: 3},
          { name: 'No Run TC', stack: 'a',areaStyle: {}, data: [], type: 'bar', barMinHeight: 3}]
        var passTC = 0;
        var failTC = 0;
        var noRunTC = 0;
        //If queryParams has months information we use it to show specific months data
        if (this.filteredMonth && this.filteredEndMonth) {
            for (let index = this.filteredMonth; index <= this.filteredEndMonth; index++) {
                xAxis.push(this.monthNames[index])
                const element = this.allData[this.selectedType][this.selectedYear][this.selectedTypeName][index]
                yAxis[0]['data'].push(element['passTC'])
                yAxis[1]['data'].push(element['failTC'])
                yAxis[2]['data'].push(element['norunTC'])
                passTC += element['passTC'];
                failTC += element['failTC'];
                noRunTC += element['norunTC'];
            }
        } else {
            for (let index = 1; index < 13; index++) {
                xAxis.push(this.monthNames[index])
                const element = this.allData[this.selectedType][this.selectedYear][this.selectedTypeName][index]
                yAxis[0]['data'].push(element['passTC'])
                yAxis[1]['data'].push(element['failTC'])
                yAxis[2]['data'].push(element['norunTC'])
                passTC += element['passTC'];
                failTC += element['failTC'];
                noRunTC += element['norunTC'];
            }
        }
        const colorsList = ['#20c997', '#ff4d88', '#ffc107'];
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
                            head += `<div class="text-center" style="width:100%">${params[0]['axisValue']}</div>`
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
                        var finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`
                        return head + finaltotal + temp;

                    }
                },
                toolbox: {
                    right: '10px',
                    top: '-7px',
                    feature: {
                      magicType: { show: true, type: ['bar', 'line'], title: {
                        bar: 'Bar View',
                        line: 'Line View'
                        }, option : {bar: {stack: false}, line: {stack: false}}},
                      restore: { show: true , title: 'Restore'},

                    }

                },
                legend: {
                    show: true,
                    data: ['Passed TC', 'Failed TC', 'No Run TC'],
                    itemGap: 5,
                    textStyle: {
                        color: '#0d0d0d'
                    }
                },
                grid: {
                    left: '4%',
                    right: '4%',
                    bottom: '10%',
                    top: '15%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxis,
                        name: 'Months',
                        nameLocation: "center",
                        nameTextStyle: { padding: 11 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#606060'
                            },
                        }
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: "No Of Regressions",
                        nameLocation: "center",
                        nameTextStyle: { padding: 30 },
                        minInterval: 1,
                        splitLine: {
                            lineStyle: {
                                color: '#f2f2f2',
                            },
                        },
                    },
                ],
                series: yAxis,
            };


        var legends = ['Pass TC', 'Fail TC', 'No Run TC'];
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
                }

            ];
        this.chartInputPIE = {
                tooltip: {
                    trigger: 'item'
                },
                color: colorsList,
                // legend: {
                //     orient: 'horizontal',
                //     right: 10,
                //     top: 20,
                //     bottom: 20,
                //     data: legends,
                //     textStyle: {
                //         color: colors.fgText
                //     }
                // },
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

    ngOnDestroy(){
        if(this.subscription){
            this.subscription.unsubscribe()
        }
        if(this.sub1){
            this.sub1.unsubscribe()
        }
        if(this.sub2){
            this.sub2.unsubscribe()
        }
    }

    goBackLevel(){
        this.router.navigateByUrl('/pages/dashboard/cpe-analysis')
    }
/* redirects the page to next level */
    redirectNext() {
        for (let index = (this.allYears.indexOf(this.selectedYear)+1); index < this.allYears.length; index++) {
            const element = this.allYears[index];
            if(this.allData[this.selectedType][element][this.selectedTypeName]){
                this.router.navigate(['/pages/dashboard/cpe-analysis/',this.selectedType,this.selectedTypeName,'year', element])
            }
        }
    }
/* redirects the page to previous level */
    redirectPrevious() {
        for (let index = this.allYears.indexOf(this.selectedYear) -1; index >= 0 ; index--) {
            const element = this.allYears[index];
            if(this.allData[this.selectedType][element][this.selectedTypeName]){
                this.router.navigate(['/pages/dashboard/cpe-analysis/',this.selectedType,this.selectedTypeName,'year', element])
            }
        }
    }
/* downloads the particular data */
    downloadReport() {
        this.dataService.loading.next(true);
        setTimeout(() => {
            this.downloadReports();
        }, 200)

    }

    async downloadReports() {
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.text(`${this.selectedTypeName} Analysis Report`,75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + ` ${this.selectedTypeName} Regressions(${this.selectedYear})`,43, 20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`,43, 25);
        doc.text(`Generated By`,20, 30);
        doc.text(`:  ${this.user.username}`, 43, 30 );
        doc.line(0, 32, 300, 32);
        this.pdfHeight = 45;

        if (this.chartInstance) {
            doc.text('Monthly Regression Summary',85, this.pdfHeight);
            this.pdfHeight += 8;
            doc.addImage(
                this.chartInstance.getDataURL({ pixelRatio: 2 }),
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
        if (this.chartInstancePIE) {
            doc.text('Yearly Summary',85, this.pdfHeight);
            this.pdfHeight += 3;
            doc.addImage(
                this.chartInstancePIE.getDataURL({ pixelRatio: 2 }),
                'png',
                50,
                this.pdfHeight,
                120,
                120,
                '',
                'FAST'
            );
            this.pdfHeight += 130;

        }
        doc.save(`${this.selectedTypeName}-Monthly-Regression-Report(${this.selectedYear}).pdf`);
        this.dataService.loading.next(false);
    }
}
