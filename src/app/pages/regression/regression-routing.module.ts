import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RegressionComponent } from './regression.component';
import { RegressionListComponent } from './regression-list/regression-list.component';
import { RegressionDetailComponent } from './regression-detail/regression-detail.component';
import { RegressionResultAnalysisComponent } from './regression-result-analysis/regression-result-analysis.component';

const routes: Routes = [
    {
        path: '',
        component: RegressionComponent,
        children: [
            {
                path: 'list',
                component: RegressionListComponent
            },
            {
                path: 'detail/:id',
                component: RegressionDetailComponent
            },
            {
                path: 'analysis',
                component: RegressionResultAnalysisComponent
            },
            {
               path: '**',
               redirectTo: 'list'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class RegressionRoutingModule {}
