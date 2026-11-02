import { CommonModule } from '@angular/common';
import { RegressionRoutingModule } from './regression-routing.module';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../@shared/shared.module';
import { MaterialModule } from '../../app.material';
import { ThemeModule } from '../../@theme/theme.module';
import { RegressionComponent } from './regression.component';
import { RegressionListComponent } from './regression-list/regression-list.component';
import { StatusDisplayComponent } from './regression-list/status-display/status.display.component';
import { ActionButtonsComponent } from './regression-list/action-buttons/action-buttons.component';
import { TestcaseStatusCountComponent } from './regression-list/testcase-status-count/testcase-status-count.component';
import { RegressionDetailComponent } from './regression-detail/regression-detail.component';
import { RegressionDisplayComponent } from './regression-list/regression-name-display/regression-name-display.component';
import { RegressionDetailTabComponent } from './regression-detail/regression-detail-tab/regression-detail-tab.component';
import { PieChartSummaryComponent } from './regression-detail/regression-detail-tab/pie-chart-summary/pie-chart.component';
import { BarChartSummaryComponent } from './regression-detail/regression-detail-tab/bar-chart-summary/bar-chart.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { TestCaseStatusComponent } from './regression-detail/regression-detail-tab/testcase-status/testcase-status.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LiveLogsComponent } from './regression-detail/regression-detail-tab/live-logs/live-logs.component';
import { StopOptionsComponent } from './regression-detail/regression-detail-tab/stop-options/stop-options.component';
import { RegressionResultAnalysisComponent } from './regression-result-analysis/regression-result-analysis.component';
import { UpdateRegressionReviewComponent } from './regression-result-analysis/update-regression-review/update-regression-review.component';
import { Angular2SmartTableModule } from 'angular2-smart-table';
@NgModule({
    imports: [
        CommonModule,
        ThemeModule,
        RegressionRoutingModule,
        SharedModule,
        MaterialModule,
        // Ng2SmartTableModule,
        NgxEchartsModule.forRoot({
            echarts: () => import('echarts')
        }),
        NgxChartsModule,
        Angular2SmartTableModule
    ],
    declarations: [
        RegressionComponent,
        RegressionDetailComponent,
        RegressionListComponent,
        StatusDisplayComponent,
        ActionButtonsComponent,
        TestcaseStatusCountComponent,
        RegressionDisplayComponent,
        RegressionDetailTabComponent,
        PieChartSummaryComponent,
        BarChartSummaryComponent,
        TestCaseStatusComponent,
        LiveLogsComponent,
        StopOptionsComponent,
        RegressionResultAnalysisComponent,
        UpdateRegressionReviewComponent
    ],
    bootstrap: []
})
export class RegressionModule { }
