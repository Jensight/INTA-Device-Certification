import { Router } from '@angular/router';
import { Component, OnDestroy, OnChanges, OnInit, Input, SimpleChanges } from '@angular/core';
import { DataService } from '../../../../../@core/services/data.service';
// import { jsPDF } from 'jspdf';
import * as _ from 'lodash';
@Component({
    selector: 'app-week-regressions-data',
    templateUrl: './week-regressions-data.component.html',
    styleUrls: ['./week-regressions-data.component.scss']
})
export class WeekRegressionsDataComponent implements OnInit, OnChanges, OnDestroy {
    @Input('showNoRunFlag') showNoRun;
    @Input('selectedRegStatus') selectedRegStatus;
    chartDetails = {};
    allData: any = {};
    currentData = [];
    chartInput: any = {};
    chartInstance = null;
    sub1;
    sub2;
    chartInputPIE = {};
    chartInstancePIE = null;
    user;
    pdfHeight = 0;
    maxYear = new Date().getFullYear();
    loading = true;
    source: any;
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    dateRangeDetails: any;
    constructor(public dataService: DataService, private router: Router) {

    }

    ngOnInit(): void {
        this.user = this.dataService.getCurrentUser();
        this.sub2 = this.dataService.regressionAnalysisDetails.subscribe(data => {
            if (data) {
                console.log("final data>>>>>", data);
                this.dataService.loading.next(true);
                this.currentData = data.dailyData;
                this.dateRangeDetails = data.dateRangeDetails;
                this.dataService.loading.next(false);
                this.processData();
                this.source = (this.processSummaryData(this.currentData));

                this.loading = false;
            }

        });
      
        // if( !this.showNoRun){
        //     document.getElementById("aborted").style.display = 'none';
        //     document.getElementById("stopped").style.display = 'none';
        // }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if(this.currentData) {
            this.processData();
        }
    }

    onChartInit(event): void {
        this.chartInstance = event;
    }

    /* based on data performs the action to generate report */

    processData(): void {
            const xAxis = [];
            const yAxis = [{ name: 'Completed', stack: 'a', data: [], type: 'bar',
             barMinHeight: 2, barMaxWidth: 80 },
             { name: 'Aborted', stack: 'a', data: [], type: 'bar',
             barMinHeight: 2, barMaxWidth: 80 },
              { name: 'Stopped', stack: 'a',
              data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }];
            this.currentData.forEach(element => {
                xAxis.push(element.day + '-' + this.months[element.month-1]);
               // xAxis.push(new Date(element.startTime).getDate() + '-' + this.months[new Date(element.startTime).getMonth()]);
                yAxis[0].data.push(element.completed);
                yAxis[1].data.push(element.aborted);
                yAxis[2].data.push(element.stopped);

            });
            const colorsList =  ['#24a148', '#fa4d56', '#f1c21b'];
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
                            total += params[0].value;
                            head += `<div class="text-center" style="width:100%">${params[0].axisValue}</div>`;
                            temp += `<div class="row">
                                    <div class="col-sm-6">${params[0].seriesName}</div>
                                    <div class="col-sm-6">: ${params[0].value}</div>
                                </div>`;
                        }
                        if (params[1] && params[1].axisValue) {
                            total += params[1].value;
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1].seriesName}</div>
                        <div class="col-sm-6">: ${params[1].value}</div>
                    </div>`;
                        }
                        if (params[2] && params[2].axisValue) {
                            total += params[2].value;
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2].seriesName}</div>
                        <div class="col-sm-6">: ${params[2].value}</div>
                    </div>`;
                        }
                        const finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`;
                        return head + finaltotal + temp;

                    }
                },
                legend: {
                    show: true,
                    data: ['Completed', 'Aborted', 'Stopped'] ,
                    itemGap: 5,
                    textStyle: {
                        color: '#0d0d0d'
                    },
                    selected: {
                        "Completed": this.selectedRegStatus.includes('Completed')? true : false,
                        "Aborted": this.selectedRegStatus.includes('Aborted')? true : false,
                        "Stopped": this.selectedRegStatus.includes('Stopped')? true : false

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
                        name: 'Day',
                        nameLocation: 'center',
                        nameTextStyle: { padding: 20 },
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
                        name: 'No Of Regressions',
                        nameLocation: 'center',
                        nameTextStyle: { padding: 10 },
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


            const legends = ['Completed', 'Aborted', 'Stopped'] ;

            let completed = 0;
            let aborted = 0;
            let stopped = 0;
            this.currentData.forEach(element => {
                completed += element.completed;
                aborted += element.aborted;
                stopped += element.stopped;
            });

            const series = [
                {
                    name: 'Completed',
                    value: completed
                },
                {
                    name: 'Aborted',
                    value: aborted
                },
                {
                    name: 'Stopped',
                    value: stopped
                }

            ];




    }

    processSummaryData(data: any): any {
        const tmpData = [{
            dateRange: this.dateRangeDetails[0].desc,
            totalReg: 0,
            totalTC: 0,
            completed: 0,
            aborted: 0,
            stopped: 0,
         }];
        if (data){
            data.forEach(element => {
            tmpData[0].totalReg =  tmpData[0].totalReg + element.totalReg;
            tmpData[0].totalTC =  tmpData[0].totalTC + element.totalTC;
            tmpData[0].completed =  tmpData[0].completed + element.completed;
            tmpData[0].aborted =  tmpData[0].aborted + element.aborted;
            tmpData[0].stopped =  tmpData[0].stopped + element.stopped;
        });
    }

        return tmpData;

    }

    ngOnDestroy(): void {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }

       /* downloads the report for selected data */
    // downloadReport() {
    //     this.dataService.loading.next(true);
    //     setTimeout(() => {
    //         this.downloadReports();
    //     }, 200)

    // }

    // async downloadReports(): void {
    //     const doc = new jsPDF('p', 'mm', 'a4');
    //     doc.text('Regression Jobs Analysis Report', 75, 10);
    //     doc.setFontSize(10);
    //     doc.text('Type', 20, 20);
    //     doc.text(': ' + 'Yearly Regressions', 43, 20);
    //     doc.text(`Report Date`, 20, 25);
    //     doc.text(`:  ${new Date()}`, 43, 25);
    //     doc.text(`Generated By`, 20, 30,);
    //     doc.text(`:  ${this.user.username}`, 43, 30);
    //     doc.line(0, 32, 300, 32);
    //     this.pdfHeight = 45;

    //     if (this.chartInstance) {
    //         doc.text('Yearly Regression Summary', 85, this.pdfHeight);
    //         this.pdfHeight += 8;
    //         await doc.addImage(
    //             this.chartInstance.getDataURL({ pixelRatio: 2 }),
    //             'png',
    //             15,
    //             this.pdfHeight,
    //             190,
    //             90,
    //             '',
    //             'FAST'
    //         );
    //         this.pdfHeight += 130;
    //         if (this.pdfHeight >= 251) {
    //             doc.addPage();
    //             this.pdfHeight = 20;
    //         }
    //     }
    //     if (this.chartInstancePIE) {
    //         doc.text('Total Regression Summary', 85, this.pdfHeight);
    //         this.pdfHeight += 3;
    //         await doc.addImage(
    //             this.chartInstancePIE.getDataURL({ pixelRatio: 2 }),
    //             'png',
    //             30,
    //             this.pdfHeight,
    //             150,
    //             90,
    //             '',
    //             'FAST'
    //         );
    //         this.pdfHeight += 130;

    //     }
    //     await doc.save('iCAT-Yearly-Regression-Report.pdf');
    //     this.dataService.loading.next(false);
    // }


}
