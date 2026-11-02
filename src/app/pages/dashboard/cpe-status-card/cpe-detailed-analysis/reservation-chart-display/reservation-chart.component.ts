import { OnDestroy } from '@angular/core';
import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, SimpleChanges, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as _ from 'lodash';


@Component({
    selector: 'app-reservation-chart-display',
    templateUrl: './reservation-chart.component.html',
    styleUrls: ['./reservation-chart.component.scss']
})
export class ReservationChartDisplayComponent implements OnInit, OnDestroy, OnChanges {
    @Input() chartData = {};
    @Input() timeFrame = 7;
    @Input() xAxisName = '';
    @Input() yAxisName = '';
    @Input() dataName = '';
    @Input() chartNumber =0;
    @Input() chartName = null;
    @Output() chart = new EventEmitter();
    chartDetails = {};
    allData:any =  {};
    currentData = [];
    chartInput:any = {};
    themeSubscription;
    chartInstance = null;
    sub1;
    constructor(private dataService: DataService) { }

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

    ngOnChanges(changes:SimpleChanges) {
        if(changes.chartData && !_.isEmpty(changes.chartData.currentValue) && !_.isEqual(changes.chartData.currentValue, changes.chartData.previousValue)){
            this.allData = changes.chartData.currentValue.data;
            this.chartDetails = changes.chartData.currentValue.details;

            if(this.timeFrame === 7){
                this.currentData= changes.chartData.currentValue.data.sevenDays;
            }else if (this.timeFrame === 30){
                this.currentData= changes.chartData.currentValue.data.thirtyDays;
            }else {
                this.currentData = changes.chartData.currentValue.data.allDays;
            }
            this.processData();
        }
        if(changes.timeFrame && changes.timeFrame.currentValue !== changes.timeFrame.previousValue){
            if(Number(changes.timeFrame.currentValue) === 7){
                this.currentData= this.allData.sevenDays;
            }else if (Number(changes.timeFrame.currentValue) === 30){
                this.currentData= this.allData.thirtyDays;
            }else {
                this.currentData = this.allData.allDays;
            }
            if(!_.isEmpty(this.allData)){
                this.processData();
            }

        }
    }
/* based on data performs the action to generate report */
    processData() {
        const xAxis = [];
        const yAxis = _.cloneDeep(this.chartDetails['seriesDetails']);
        this.currentData.forEach(element => {
            xAxis.push(element[this.dataName])
            this.chartDetails['keys'].forEach((key,index) => {
                    yAxis[index]['data'].push(element[key])
            });
        });
        const colorsList = ['#0275d8', '#ff4d88', '#ffc107'];
        this.chartInput = {
            title:{show:false},
            color: colorsList,
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow',
              },
            },
            legend: {
                show:true,
                data:this.chartDetails['legend'],
                itemGap: 5,
                textStyle: {
                    color: '#0d0d0d'
                }
            },
            grid: {
              left: '4%',
              right: '4%',
              bottom: '10%',
              top:'15%',
              containLabel: true,
            },
            xAxis: [
              {
                type: 'category',
                data: xAxis,
                name:this.xAxisName,
                nameLocation: "center",
                nameTextStyle: {padding: 11},
                axisTick: {
                  alignWithLabel: true,
                },
              },
            ],
            yAxis: [
              {
                type: 'value',
                name: this.yAxisName ? this.yAxisName : "No Of Reservations",
                nameLocation: "center",
                nameTextStyle: {padding: 28},
                minInterval:1,
                splitLine: {
                  lineStyle: {
                    color: '#f2f2f2',
                  },
                },
              },
            ],
            dataZoom: [
                {
                    show: true,
                    start: 0,
                    end: 100
                },
                {
                    type: 'inside',
                    start: 24,
                    end: 100
                },
                {
                    show: false,
                    yAxisIndex: 0,
                    filterMode: 'empty',
                    width: 30,
                    height: '80%',
                    showDataShadow: false,
                    left: '93%'
                }
            ],
            series: yAxis,
          };
    }

    selected(event): void {
        this.chart.next(event);
    }

    ngOnDestroy(){
        if(this.themeSubscription){
            this.themeSubscription.unsubscribe()
        }
        if(this.sub1){
            this.sub1.unsubscribe()
        }
    }
}
