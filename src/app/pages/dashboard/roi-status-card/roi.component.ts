import { ROIStatusCardComponent } from './status-card.component';
import { ROIDetailedAnalysisComponent } from './roi-detailed-analysis/roi-detailed-analysis.component';


export const ROI = [
    ROIStatusCardComponent,
    ROIDetailedAnalysisComponent
]



export const ROI_REGRESSION_ROUTES =   {
    path: 'roi-analysis',
    component: ROIDetailedAnalysisComponent
}
