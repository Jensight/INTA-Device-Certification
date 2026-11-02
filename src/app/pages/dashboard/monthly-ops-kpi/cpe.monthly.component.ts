import { MonthlyOpsKpiComponent } from "./monthly-ops-kpi.component";
import { MonthlyDetailedAnalysisComponent } from "./monthly-detailed-analysis/monthly-detailed-analysis.component";
import {MonthlyOpsChartComponent} from "./monthly-ops-chart/monthly-ops-chart.component";
import { LogsDisplayComponent } from "./logs-display/logs-display.component";
export const CPE_MONTHLY_OPS=[
    MonthlyOpsKpiComponent,
    MonthlyDetailedAnalysisComponent,
    MonthlyOpsChartComponent,
    LogsDisplayComponent

    
]

export const cpe_Monthly_OPS_routes={
    path :"monthly-analysis",
    component: MonthlyDetailedAnalysisComponent ,

}