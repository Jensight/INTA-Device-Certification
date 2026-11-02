import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { COMPARE_REGRESSION_ROUTES } from './compare-regression-status-card/compare-regression-components';
import { TC_EXECUTION_ROUTES } from './tc-execution-status-card/tc-execution.components';
import { CPE_ROUTES } from './cpe-status-card/cpe.components';
import { CPE_REGRESSION_ROUTES } from './cpe-regression-status-card/cpe-regression-components';
import { TC_ANALYSIS_ROUTES } from './tc-analysis-status-card/tc-analysis.components';
import { ROI_REGRESSION_ROUTES } from './roi-status-card/roi.component';
import { REGRESSION_ROUTES } from './regression-status-card/regression.components';
import { cpe_Monthly_OPS_routes } from './monthly-ops-kpi/cpe.monthly.component';
import { BUILD_TYPE_REGRESSION_ROUTES } from './build-type-status-card/build-type.component';
import { cpe_Hygiene_Chart_routes } from './hygiene-page/cpe.hygiene.component';


const routes: Routes = [
    COMPARE_REGRESSION_ROUTES,
    CPE_ROUTES,
    TC_EXECUTION_ROUTES,
    CPE_REGRESSION_ROUTES,
    TC_ANALYSIS_ROUTES,
    ROI_REGRESSION_ROUTES,
    cpe_Monthly_OPS_routes,
    cpe_Hygiene_Chart_routes,
    {
        path: '',
        component: DashboardComponent
    },
    REGRESSION_ROUTES,
    BUILD_TYPE_REGRESSION_ROUTES
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule { }
