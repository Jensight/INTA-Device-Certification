import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit, Input, OnChanges} from '@angular/core';
import { DataService } from '../../../../../@core/services/data.service';
// import { jsPDF } from 'jspdf';
import * as _ from 'lodash';
@Component({
  selector: 'app-testcase-details',
  templateUrl: './testcase-details.component.html',
  styleUrls: ['./testcase-details.component.scss']
})
export class TestcaseDetailsComponent implements OnInit, OnChanges, OnDestroy {
 @Input('showNoRunFlag') showNoRun;
 @Input('selectedRegStatus') selectedRegStatus;
 chartDetails = {};
 allData: any = {};
 currentData = [];
 chartInput: any = {};
 themeSubscription;
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
 months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 dateRangeDetails: any;
 constructor(public dataService: DataService, private router: Router) { }

  ngOnInit(): void {
    this.user = this.dataService.getCurrentUser();
    this.sub2 = this.dataService.regressionAnalysisDetails.subscribe(data => {
            if (data) {
                this.dataService.loading.next(true);
                this.currentData = data.dailyData;
                this.dateRangeDetails = data.dateRangeDetails;
                this.dataService.loading.next(false);
                this.processData();
                this.source = this.processSummaryData(this.currentData);
                this.loading = false;
            }

        });
      //  console.log("showNoRun in testcase>>>", this.showNoRun );
  }

  ngOnChanges(): void {
    if(this.currentData) {
        this.processData();
    }
}

onChartInit(event): void {
    this.chartInstance = event;
}

processSummaryData(data: any): any {
    const tmpData = [{
        dateRange: this.dateRangeDetails[0].desc,
        totalReg: 0,
        totalTC: 0,
        passTC: 0,
        failTC: 0,
        norunTC: 0,
     }];
    if (data){
        data.forEach(element => {
        tmpData[0].totalReg =  tmpData[0].totalReg + element.totalReg;
        tmpData[0].totalTC =  tmpData[0].totalTC + element.totalTC;
        tmpData[0].passTC =  tmpData[0].passTC + element.passTC;
        tmpData[0].failTC =  tmpData[0].failTC + element.failTC;
        tmpData[0].norunTC =  tmpData[0].norunTC + element.norunTC;
        });
    }
    return tmpData;
}

/* based on data performs the action to generate report */

processData(): void {
        const xAxis = [];
        const yAxis = [{ name: 'Pass TC', stack: 'a', data: [], type: 'bar',
         barMinHeight: 2, barMaxWidth: 80 },
         { name: 'Fail TC' , stack: 'a', data: [], type: 'bar',
         barMinHeight: 2, barMaxWidth: 80 },
          { name: 'No Run TC', stack: 'a',
          data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }];
        this.currentData.forEach(element => {
            xAxis.push(element.day + '-' + this.months[element.month-1]);
            //xAxis.push(new Date(element.startTime).getDate() + '-' + this.months[new Date(element.startTime).getMonth()]);
            yAxis[0].data.push(element.passTC);
            yAxis[1].data.push(element.failTC);
            yAxis[2].data.push(element.norunTC);

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
                data: ['Pass TC', 'Fail TC', 'No Run TC'],
                itemGap: 5,
                textStyle: {
                    color: '#0d0d0d'
                },
                selected: {
                    "Pass TC": true,
                    "Fail TC": true,
                    "No Run TC": (this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))? false : true

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
                    name: 'No Of Test cases',
                    nameLocation: 'center',
                    nameTextStyle: { padding: 11 },
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


        const legends = ['Pass TC', 'Fail TC', 'No Run TC'];

        let passTC = 0;
        let failTC = 0;
        let noRunTC = 0;
        this.currentData.forEach(element => {
          passTC += element.passTC;
          failTC += element.failTC;
          noRunTC += element.norunTC;
        });

        const series = [
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
                value:  noRunTC
            }

        ];




}

ngOnDestroy(): void {
    if (this.themeSubscription) {
        this.themeSubscription.unsubscribe();
    }
    if (this.sub1) {
        this.sub1.unsubscribe();
    }
    if (this.sub2) {
        this.sub2.unsubscribe();
    }
}

}
