import { Component, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';



@Component({
    selector: 'app-bar-chart-summary',
    templateUrl: './bar-chart.component.html'
    // styleUrls: ['./name.component.scss']
})
export class BarChartSummaryComponent implements OnInit, OnDestroy {
    results = [{ name: 'Passed', value: 10 }, { name: 'Failed', value: 2 }, { name: 'To Be Run', value: 3 }, { name: 'Warning', value: 4 }];
    showLegend = false;
    showXAxis = true;
    showYAxis = true;
    xAxisLabel = 'Testcases';
    yAxisLabel = 'Count';
    colorScheme;
    dataSubscription;
    view = [340, 300];
    @Input() data;
    constructor() {

        this.colorScheme = {
            domain: [
                '#60af20', '#b00020', '#ff9f05', '#c76b20', '#fa4d56', '#ff9f05'
            ]
        };
    }

    ngOnInit() {
        this.dataSubscription = this.data.subscribe(data => {
            if (data) {
                this.results = data.map(d =>{
                    if(d['value'] == undefined){
                        d['value'] = 0;
                    }
                    var temp = {...d}
                    temp['value'] = Number(temp['value'])
                    return temp
                });

            }
        });
    }
    ngOnDestroy(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
    }
}
