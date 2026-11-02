import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges, OnChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { DataService } from '../../../../@core/services/data.service';
import { Router } from '@angular/router';
import { DashboardService } from '../../../../@core/services/dashboard.service';
@Component({
    selector: 'app-roi-detailed-analysis',
    templateUrl: './roi-detailed-analysis.component.html',
    styleUrls: ['./roi-detailed-analysis.component.scss']
})
export class ROIDetailedAnalysisComponent implements OnInit {
    noData = false;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/roi-analysis',
            label: 'ROI Analysis'
        }
    ];
    loading = true;
    chartInput: any = {};
    selectedTeam;
    constructor(private router: Router, public dataService: DataService, private dashboardSerice: DashboardService) {
        this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.loadData();
            }
        });
    }
/* loads all the required data  */
    loadData() {
        let lowImpact = [];
        let highImpact = [];
        let moderateImpact = [];
        this.dashboardSerice.getROIAnalysisData().subscribe((data: any) => {
            this.loading = false;
            lowImpact = [];
            highImpact = [];
            moderateImpact = [];
            if (data.success && data.data.length > 0) {
                for (let index = 0; index < data.data.length; index++) {
                    const element = data.data[index];
                    if (element.easeOfAutomation > 5 && element.impactOfAutomation > 5) {
                        highImpact.push({
                            name: element['_id'],
                            value: [element['easeOfAutomation'], element['impactOfAutomation']]
                        });
                    } else if (element.easeOfAutomation < 5 && element.impactOfAutomation < 5) {
                        lowImpact.push({
                            name: element['_id'],
                            value: [element['easeOfAutomation'], element['impactOfAutomation']]
                        });
                    } else {
                        moderateImpact.push({
                            name: element['_id'],
                            value: [element['easeOfAutomation'], element['impactOfAutomation']]
                        });
                    }
                }
            }else {
                this.noData = true;
            }

            const colorsList = ['#24a148', '#fa4d56', '#f1c21b'];
            this.chartInput = {
                    title: { show: false },
                    color: colorsList,
                    grid: {
                        left: '5%',
                        right: '7%',
                        bottom: '5%',
                        top: '6%',
                        containLabel: true
                    },
                    tooltip: {
                        // trigger: 'axis',
                        showDelay: 0,
                        formatter: function(params) {
                            return params.name + ' <br/>' + params.value[0] + ', ' + params.value[1];
                        }
                    },
                    xAxis: [
                        {
                            name: 'Ease of Automation',
                            type: 'value',
                            scale: true,
                            splitLine: {
                                show: false
                            },
                            min: 0,
                            max: 10,
                            nameLocation: 'center',
                            nameTextStyle: { padding: 11 },
                            axisTick: {
                                alignWithLabel: true,
                            },
                        },
                    ],
                    yAxis: [
                        {
                            name: 'Impact of Automation',
                            type: 'value',
                            scale: true,
                            splitLine: {
                                show: false
                            },
                            min: 0,
                            max: 10,
                            nameLocation: "center",
                            nameTextStyle: { padding: 11 },
                            minInterval: 1,

                        },
                    ],
                    series: [
                        {
                            type: 'scatter',
                            data: [],
                            color: '#fa4d56',
                            markLine: {
                                silent: true,
                                symbol: 'none',
                                lineStyle: {
                                    normal: {
                                        type: 'solid',
                                        color: 'grey'
                                    }
                                },
                                data: [{ yAxis: 5 }, { xAxis: 5 }]
                            }
                        },
                        {
                            type: 'scatter',
                            data: [],
                            color: '#24a148'
                        },
                        {
                            type: 'scatter',
                            data: [],
                            color: '#f1c21b'
                        }
                    ]
                };
            this.chartInput.series[0].data = lowImpact;
            this.chartInput.series[1].data = highImpact;
            this.chartInput.series[2].data = moderateImpact;
            this.chartInput = { ...this.chartInput };



        });
    }

    ngOnInit() {}
}
