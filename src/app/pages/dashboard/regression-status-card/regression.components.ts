import { RegressionStatusCardComponent } from './status-card.component';
import { RegressionAnalysisComponent } from './regression-analysis/regression-analysis.component';
import { WeekRegressionsDataComponent } from './regression-analysis/week-regressions-data/week-regressions-data.component';
import { TestcaseDetailsComponent } from './regression-analysis/testcase-details/testcase-details.component';

export const REGRESSION = [
    RegressionStatusCardComponent,
    RegressionAnalysisComponent,
    WeekRegressionsDataComponent,
    TestcaseDetailsComponent
];

export const REGRESSION_ROUTES =   {
    path: 'regression-analysis',
    component: RegressionAnalysisComponent,
    children: [
        {
            path: '',
            component: WeekRegressionsDataComponent
        }
        // },
        // {
        //     path: '',
        //     component: TestcaseDetailsComponent
        // }
    ]
};
