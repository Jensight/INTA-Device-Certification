import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { DataService } from './../../../../@core/services/data.service';
import { OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-cpe-regression-detailed-analysis',
    templateUrl: './cpe-regression-detailed-analysis.component.html',
    styleUrls: ['./cpe-regression-detailed-analysis.component.scss']
})
export class CPERegressionDetailedAnalysis implements OnInit,OnDestroy {
    private user = null;
    dataSubscription;
    itemChange;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/cpe-analysis',
            label: 'CPE Analysis'
        }
    ]
    constructor(private dashboardService: DashboardService, private dataService: DataService) {
        this.user = this.dataService.getCurrentUser()
        this.dataSubscription = this.dataService.selectedTeam.pipe(
            mergeMap(team => {
                if (team) {
                    return this.dashboardService.getDetailedCPERegressionAnalysis()
                } else {
                    return Observable.create(null)
                }
            })
        ).subscribe(data => {
            if (data['yearlyData'] && (data['monthlyData']['model'] || data['monthlyData']['vendor'] ) ) {
                this.dataService.CPERegressionAnalysisData.next(data);
                this.dataService.CPERegressionNoData.next(false)
            }else {
                this.dataService.CPERegressionNoData.next(true)
            }
        });
    }

    ngOnInit(): void { }

    ngOnDestroy() {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe()
        }
    }

}
