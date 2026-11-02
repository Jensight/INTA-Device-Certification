import { DataService } from './../../../../../@core/services/data.service';
import { Component,OnDestroy, OnInit, Input, SimpleChanges,Output,EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { DatePipe } from '@angular/common';
import { TimeDifferencePipe } from '../../../../../@shared/pipes/time-diffrence.pipe';
@Component({
    selector: 'app-reservation-streak-chart',
    templateUrl: './reservation-streak.component.html',
    styleUrls: ['./reservation-streak.component.scss'],
    providers: [DatePipe, TimeDifferencePipe]
})
export class ReservationStreakComponent implements OnInit, OnDestroy {
    @Input() chartData = {};
    @Input() timeFrame = 7;
    @Input() xAxisName = '';
    @Input() dataName = '';
    @Input() chartNumber = 0;
    @Input() chartName = null;
    @Output() chart = new EventEmitter();
    chartDetails = {};
    allData: any = {};
    currentData = [];
    chartInput: any = {};
    chartInstance =null;
    sub1;
    constructor(private timeDifference: TimeDifferencePipe , private datePipe: DatePipe, private dataService: DataService) { }

    ngOnInit(): void {
        this.sub1 = this.dataService.sideBarOnToggle.subscribe(data => {
            if(data && this.chartInstance){
                let idCount =0;
                const id = setInterval(()=> {
                    idCount++;
                    if( this.chartInstance){
                        this.chartInstance.resize();
                    }
                    if(idCount >5){
                        idCount = 0;
                        clearInterval(id)
                    }
                },100)

            }
        })
    }

    onChartInit(event){
        this.chartInstance = event;
        const temp = {};
        temp[this.chartName] = event;
        this.chart.emit(temp)
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.chartData && !_.isEmpty(changes.chartData.currentValue) && !_.isEqual(changes.chartData.currentValue, changes.chartData.previousValue)) {
            this.allData = changes.chartData.currentValue.data;
            this.chartDetails = changes.chartData.currentValue.details;
            if (this.timeFrame === 7) {
                this.currentData = changes.chartData.currentValue.data.sevenDays;
            } else if (this.timeFrame === 30) {
                this.currentData = changes.chartData.currentValue.data.thirtyDays;
            } else {
                this.currentData = changes.chartData.currentValue.data.allDays;
            }
            this.processData();
        }
        if (changes.timeFrame && changes.timeFrame.currentValue !== changes.timeFrame.previousValue) {
            if (Number(changes.timeFrame.currentValue) === 7) {
                this.currentData = this.allData.sevenDays;
            } else if (Number(changes.timeFrame.currentValue) === 30) {
                this.currentData = this.allData.thirtyDays;
            } else {
                this.currentData = this.allData.allDays;
            }
            if (!_.isEmpty(this.allData)) {
                this.processData();
            }

        }
    }
    /* based on data performs the action to generate report */
    processData() {
            var legends= [];
            var series= [];
            this.currentData.forEach(element => {
                legends.push(element[this.dataName]);
                series.push({name:element[this.dataName], value: element['differentDays'], last: this.datePipe.transform(element['lastReservation'],'short')})
            });

            const colorsList = ['#1ebd5e', '#4371bf', '#f54c4c', '#f2b90c', '#6abad9'];
            // To get random colors for pie chart
            // for(let i=0; legends.length > i; i++) {                    
            //     colorsList.push(this.getRandomColor());                    
            // }

            this.chartInput = {
                tooltip: {
                    trigger: 'item',
                    formatter:  (params, ticket, callback) => {
                        return `Name: ${params.data.name} <br>
                                Last Used: ${this.timeDifference.transform(params.data.value)}  ago <br>
                                Date: ${params.data.last}`
                    }
                },
                color: colorsList,
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    left: 50,
                    top: 330,
                    data: legends,
                    textStyle: {
                        color: '#0d0d0d'
                    }
                },
                series: [
                    {
                        name: 'Unutilized Streak (days)',
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
                            show:true,
                            align: 'right',
                            fontSize: 8
                        }
                    }
                ]
            }
    }

    // getRandomColor() {
    //     var color = Math.floor(0x1000000 * Math.random()).toString(16);
    //     return '#' + ('000000' + color).slice(-6);
    // }

    ngOnDestroy() {
        if(this.sub1){
            this.sub1.unsubscribe()
        }
    }
}
