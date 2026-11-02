import { TC_EXECUTION } from './tc-execution-status-card/tc-execution.components';
import { TC_ANALYSIS } from './tc-analysis-status-card/tc-analysis.components';
import { CPE_STATUS } from './cpe-status-card/cpe.components';
import { CPE_REGRESSION } from './cpe-regression-status-card/cpe-regression-components';
import { COMPARE_REGRESSION, COMPARE_REGRESSION_ENTRY } from './compare-regression-status-card/compare-regression-components';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../@shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard.routing.module';
import { MaterialModule } from '../../app.material';
import { ThemeModule } from '../../@theme/theme.module';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NgxEchartsModule } from 'ngx-echarts';
import { CountUpModule } from 'ngx-countup';
import { NgxLoadingModule } from 'ngx-loading';
import { REGRESSION } from './regression-status-card/regression.components';
import { ROI } from './roi-status-card/roi.component';
import { CPE_MONTHLY_OPS } from './monthly-ops-kpi/cpe.monthly.component';
import { LogsDisplayComponent } from './monthly-ops-kpi/logs-display/logs-display.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { BUILD_TYPE_REGRESSION } from './build-type-status-card/build-type.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { HygienePageComponent } from './hygiene-page/hygiene-page.component';
import { CPE_Hygiene_Chart } from './hygiene-page/cpe.hygiene.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        COMPARE_REGRESSION,
        CPE_REGRESSION,
        CPE_STATUS,
        REGRESSION,
        TC_ANALYSIS,
        DashboardComponent,
        TC_EXECUTION,
        ROI,
        CPE_MONTHLY_OPS,
        CPE_Hygiene_Chart,
        LogsDisplayComponent,
        BUILD_TYPE_REGRESSION,
        HygienePageComponent,
    ],
    imports: [
        CommonModule,
        MaterialModule,
        DashboardRoutingModule,
        ThemeModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule,
        SharedModule,
        MatCardModule,
	NgxLoadingModule.forRoot({}),
        NgxSpinnerModule.forRoot({}),
        NgxEchartsModule.forRoot({
            echarts: () => import('echarts')
        }),
        CountUpModule,
        MatDatepickerModule,
        ReactiveFormsModule
    ],
    exports: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardModule {}
