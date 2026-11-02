import { DayRegressionDetailComponent } from './tc-execution-detailed-analysis/day-regression-detail/day-regression-detail.component';
import { DailyRegressionDetailComponent } from './tc-execution-detailed-analysis/daily-regression-detail/daily-regression-detail.component';
import { MonthlyRegressionDetailComponent } from './tc-execution-detailed-analysis/monthly-regression-detail/monthly-regression-detail.component';
import { YearlyRegressionDetailComponent } from './tc-execution-detailed-analysis/yearly-regression-detail/yearly-regression-detail.component';
import { TCExecutionDetailedComponent } from './tc-execution-detailed-analysis/tc-execution-detailed-analysis.component';
import { TcExecutionStatusCardComponent } from './status-card.component';
import { FailureCategoryDetailComponent } from './tc-execution-detailed-analysis/failure-category-detail/failure-category-detail.component';
import { DetailSummaryComponent } from './tc-execution-detailed-analysis/detail-summary/detail-summary.component';
import { CustomizedCalenderHeaderComponent } from './tc-execution-detailed-analysis/customized-calender-header/customized-calender-header.component';

export const TC_EXECUTION = [
    TcExecutionStatusCardComponent,
    TCExecutionDetailedComponent,
    YearlyRegressionDetailComponent,
    MonthlyRegressionDetailComponent,
    DailyRegressionDetailComponent,
    DayRegressionDetailComponent,
    FailureCategoryDetailComponent,
    DetailSummaryComponent,
    CustomizedCalenderHeaderComponent
];

export const TC_EXECUTION_ROUTES = {
    path: 'tc-execution-analysis',
    component: TCExecutionDetailedComponent,
    children: [
        {
            path: 'day/:year/:month/:day',
            component: DayRegressionDetailComponent
        },
        {
            path: 'daily/:year/:month',
            component: DailyRegressionDetailComponent
        },
        {
            path: 'monthly/:year',
            component: MonthlyRegressionDetailComponent

        },
        {
            path: '',
            component: YearlyRegressionDetailComponent
        }
    ]
}
