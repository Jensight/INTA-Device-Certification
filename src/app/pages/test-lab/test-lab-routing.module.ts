import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestLabComponent } from './test-lab.component';
import { SelectTestcasesComponent } from './select-testcases/select-testcases.component';
import { ConfigureJobsComponent } from './configure-jobs/configure-jobs.component';
import { QuickSchedulerComponent } from './quick-scheduler/quick-scheduler.component';
import { TelemetrySchedulerComponent } from './telemetry-scheduler/telemetry-scheduler.component';
import { AutoTriggerRegressionComponent } from './auto-trigger-regression/auto-trigger-regression.component';
import { DynamicSchedulerComponent } from './dynamic-scheduler/dynamic-scheduler.component';
import { UnSaveChangesGuard } from 'src/app/@core/guards/unSaveChanges.guard';

const routes: Routes = [
    {
        path: '',
        component: TestLabComponent,
        children: [
            {
                path: 'configure',
                component: ConfigureJobsComponent
            },
            {
                path: '',
                redirectTo: 'configure',
                pathMatch: 'full'
            },
            {
                path: 'quickScheduler',
                component: QuickSchedulerComponent
            },
            {
                path: 'telemetry',
                component: TelemetrySchedulerComponent
            },
            {
                path: 'autoRegression',
                component: AutoTriggerRegressionComponent,
                canDeactivate: [UnSaveChangesGuard]
            },
            {
                path: 'dynamicScheduler',
                component: DynamicSchedulerComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
    providers: [UnSaveChangesGuard]
})
export class TestLabRoutingModule {}
