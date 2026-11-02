import { TCUtilizationChartsComponent } from './tc-analysis/tc-utilization/tc-utilization.component';
import { TCEffortSavingsComponent } from './tc-analysis/effort-savings/effort-savings.component';
import { TCExecutionCountStatusComponent } from './tc-analysis/tc-execution-count/tc-execution-count.component';
import { TCYearlyStatusComponent } from './tc-analysis/yearly-status/yearly-status.component';
import { TcAnalysisComponent } from './tc-analysis/tc-analysis.component';
import { TcAnalysisStatusCardComponent } from './status-card.component';

export const TC_ANALYSIS = [
    TcAnalysisStatusCardComponent,
    TCYearlyStatusComponent,
    TCExecutionCountStatusComponent,
    TCEffortSavingsComponent,
    TCUtilizationChartsComponent,
    TcAnalysisComponent
]


export const TC_ANALYSIS_ROUTES = {
    path: 'tc-analysis',
    component: TcAnalysisComponent
}