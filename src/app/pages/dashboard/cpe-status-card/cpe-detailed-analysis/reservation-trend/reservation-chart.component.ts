import { DataService } from './../../../../../@core/services/data.service';
import { OnDestroy } from '@angular/core';
import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
@Component({
    selector: 'app-reservation-chart',
    templateUrl: './reservation-chart.component.html',
    styleUrls: ['./reservation-chart.component.scss']
})
export class ReservationChartComponent implements OnInit,OnChanges, OnDestroy {
    @Input() chartData = {};
    @Input() timeFrame = 7;
    @Input() xAxisName = '';
    @Input() dataName = '';
    @Input() chartNumber =0;
    @Input() chartName = null;
    @Output() chart = new EventEmitter();
    chartDetails = {};
    allData:any =  {};
    currentData = [];
    chartInput:any = {};
    sub1;
    chartInstance = null;
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
        const colorsList = ['#0096FF', '#ffb521', '#fa1b65'];
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
              bottom: '5%',
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
                name:"No Of Reservations",
                nameLocation: "center",
                nameTextStyle: {padding: 10},
                minInterval:1,
                splitLine: {
                  lineStyle: {
                    color: '#f2f2f2',
                  },
                },
              },
            ],
            series: yAxis,
          };
    }

    ngOnDestroy(){
        if(this.sub1){
            this.sub1.unsubscribe()
        }
    }
}
