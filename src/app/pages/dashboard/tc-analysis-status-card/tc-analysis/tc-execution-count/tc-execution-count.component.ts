import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, SimpleChanges, EventEmitter, Output, Input } from '@angular/core';

@Component({
    selector: 'app-tc-execution-count',
    templateUrl: './tc-execution-count.component.html',
    styleUrls: ['./tc-execution-count.component.scss']
})
export class TCExecutionCountStatusComponent implements OnInit {
    sub1;
    chartInstance;
    @Input() chartData = {};
    @Input() chartName = null;
    @Output() chart = new EventEmitter();
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
        let colorsList = ['#914e0a', '#fc9003', '#d7fc03', '#ff4d88', '#17a2b8', '#03f4fc', '#A52A2A', '#808000', '#008000', '#033E3E', '#B87333', '#800517', '#A74AC7', '#3B2F2F', '#20c997', '#ffc107'];
        if (this.data.series && (this.data.series[0].name.includes("Passed") || this.data.series[0].name.includes("Failed") || this.data.series[0].name.includes("No Run"))) {
            colorsList.unshift('#24a148', '#fa4d56', '#f1c21b');
        }
        this.chartInput = {
                tooltip: {
                    trigger: 'item'
                },
                color: colorsList,
                // legend: {
                //     orient: 'horizontal',
                //     right: 10,
                //     top: 10,
                //     bottom: 20,
                //     data: this.data.legends || [],
                //     textStyle: {
                //         color: colors.fgText
                //     }
                // },
                series: [
                    {
                        name: 'Execution Summary',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '60%'],
                        data: this.data.series || [],
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
            };
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe()
        }
    }
}
