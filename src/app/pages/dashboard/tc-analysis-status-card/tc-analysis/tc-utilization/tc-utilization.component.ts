import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-tc-utilization',
    templateUrl: './tc-utilization.component.html',
    styleUrls: ['./tc-utilization.component.scss']
})
export class TCUtilizationChartsComponent implements OnInit {
    sub1;
    chartInstance;
    @Input() chartData = {};
    @Input() chartName = null;
    @Output() chart = new EventEmitter();
    @Input() noData = false;
    @Input() xLableName =' Testgroups'
    chartInput = {};
    data;

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.sub1 = this.dataService.sideBarOnToggle.subscribe(data => {
            if (data && this.chartInstance) {
                let idCount = 0;
                const id = setInterval(() => {
                    idCount++;
                    if (this.chartInstance) {
                        this.chartInstance.resize();
                    }
                    if (idCount > 5) {
                        idCount = 0;
                        clearInterval(id)
                    }
                }, 100)
            }
        })
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['chartData']) {
            this.data = changes['chartData'].currentValue
            this.processData()
        }
    }

    onChartInit(event) {
        this.chartInstance = event;
        const temp = {};
        temp[this.chartName] = event;
        this.chart.emit(temp)
    }
/* based on data performs the action to generate report */
    processData() {
      
        const dataString = JSON.stringify(this.data);
        const dataObject = JSON.parse(dataString, (key, value) => {
          if (value === null) {
            return 0;
          } else {
            return value;
          }
        });
        const xAxis = this.data['xLabel'] || [];
        const colorsList = ['#ff4d88', '#ffc107'];
        this.chartInput = {
            color: colorsList,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
                show: !this.noData
            },
            title: {
                text: 'No Data Available',
                left: '37%',
                top: '45%',
                show: this.noData
            },
            legend: {
                show: true,
                itemGap: 5,
                textStyle: {
                    color: '#0d0d0d'
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
                    name: this.xLableName,
                    nameLocation: "center",
                    nameTextStyle: { padding: 11 },
                    axisTick: {
                        alignWithLabel: true,
                    },
                },
            ],
            yAxis: [
                {
                    type: 'value',
                    name: "Utilization (%)",
                    nameLocation: "center",
                    nameTextStyle: { padding: 12 },
                    minInterval: 1,
                    splitLine: {
                        lineStyle: {
                            color: '#f2f2f2',
                        },
                    },
                },
            ],
            series: dataObject['yLabel'] || [],
        };
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe()
        }
    }
}
