import { Component, OnInit, AfterViewInit, Input, ViewChild, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { OnDestroy, AfterViewChecked } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
@Component({
    selector: 'app-pie-chart-summary',
    templateUrl: './pie-chart.component.html'
    // styleUrls: ['./name.component.scss']
})
export class PieChartSummaryComponent implements OnInit, OnDestroy, AfterViewInit {
    options: any = {};
    initOptions = {
        height: '300px',
        width: '330px'
    };
    @Input()
    data: BehaviorSubject<any>;
    chartInstance;
    dataSubscription;
    chartData;
    constructor(private cb: ChangeDetectorRef) {}

    ngOnInit() {}

    ngAfterViewInit() {


            this.options = {
                color: ['#60af20', '#b00020', '#ff9f05', '#c76b20', '#fa4d56'],
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b} : {c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'right',
                    data: ['Passed', 'Failed', 'No Run', 'Warning', 'Aborted'],
                    textStyle: {
                        color: '#0d0d0d'
                    }
                },
                series: [
                    {
                        name: 'Testcases',
                        type: 'pie',
                        radius: '63%',
                        center: ['50%', '50%'],
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                               // shadowColor: echarts.itemHoverShadowColor
                            }
                        },
                         label: {
                             normal: {
                                 textStyle: {
                                     color: '#0d0d0d'
                                 }
                             }
                         },
                         labelLine: {
                             normal: {
                                lineStyle: {
                                     color: '#0d0d0d'
                                 }
                             }
                         }
                    }
                ]
            };
            if(this.data){
                this.options['series'][0]['data'] = this.chartData;
            }
            if (this.chartInstance) {
                this.chartInstance.setOption(this.options);
            }
            this.cb.detectChanges();
        this.cb.detectChanges();
        this.dataSubscription = this.data.subscribe(data => {
            if (data) {
                this.chartData = data;
                this.options['series'][0]['data'] = data;
                if (this.chartInstance) {
                    this.chartInstance.setOption(this.options);
                }
            }
        });
    }

    onChartInit(event) {
        this.chartInstance = event;
        this.cb.detectChanges();
    }
    ngOnDestroy(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }
}
