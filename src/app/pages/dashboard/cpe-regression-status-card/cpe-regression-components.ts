import { CPERegressionStatusCardComponent } from './status-card.component';
import { CPERegressionDetailedAnalysis } from './cpe-regression-detailed-analysis/cpe-regression-detailed-analysis.component';
import { CPEYearWiseAnalysisComponent } from './cpe-regression-detailed-analysis/year-wise-data/cpe-year-wise-data.component';
import { CPEMonthWiseAnalysisComponent } from './cpe-regression-detailed-analysis/month/cpe-month-wise-data.component';

export const CPE_REGRESSION = [
    CPERegressionStatusCardComponent,
    CPERegressionDetailedAnalysis,
    CPEYearWiseAnalysisComponent,
    CPEMonthWiseAnalysisComponent
]
export const CPE_REGRESSION_ROUTES = {
    path: 'cpe-analysis',
    component: CPERegressionDetailedAnalysis,
    children: [
        {
            path: ':type/:name/year/:year',
            component: CPEMonthWiseAnalysisComponent
        },
        {
            path: '',
            component: CPEYearWiseAnalysisComponent
        }
    ]
}
