import { BuildTypeStatusCardComponent } from "./build-type-status-card.component";
import { BuildTypeAnalysisComponent } from "./build-type-analysis/build-type-analysis.component";
export const BUILD_TYPE_REGRESSION = [
    BuildTypeStatusCardComponent,
    BuildTypeAnalysisComponent
]
export const BUILD_TYPE_REGRESSION_ROUTES = {
    path: 'environment-analysis',
    component: BuildTypeAnalysisComponent,
}