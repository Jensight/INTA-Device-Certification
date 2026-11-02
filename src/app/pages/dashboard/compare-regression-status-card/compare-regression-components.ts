import { SelectRegressionComponent } from './regression-compare/select-regression/select-regression.component';
import { CompareRegressionComponent } from './regression-compare/regression-compare.component';
import { CompareRegStatusCardComponent } from './status-card.component';



export const COMPARE_REGRESSION = [
    CompareRegStatusCardComponent,
    CompareRegressionComponent,
    SelectRegressionComponent
]

export const COMPARE_REGRESSION_ENTRY = [
    SelectRegressionComponent
]

export const COMPARE_REGRESSION_ROUTES =   {
    path: 'compare-regressions',
    component: CompareRegressionComponent
}
