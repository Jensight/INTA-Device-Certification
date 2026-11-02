// import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { ScheduleRegressionComponent } from './configure-jobs/schedule-regression/schedule-regression.component';
import { TagRegressionComponent } from './configure-jobs/tag-regression/tag-regression.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../@shared/shared.module';
import { MaterialModule } from '../../app.material';
import { ThemeModule } from '../../@theme/theme.module';
import { TestLabRoutingModule } from './test-lab-routing.module';
import { NgModule } from '@angular/core';
import { TestLabComponent } from './test-lab.component';
import { SelectTestcasesComponent } from './select-testcases/select-testcases.component';
import { ConfigureJobsComponent } from './configure-jobs/configure-jobs.component';
import { TreeviewModule } from '@samotics/ngx-treeview';
import { DeviceDetailComponent } from './select-testcases/device-details/device-detail.component';
import { VariableValueDisplayComponent } from './select-testcases/variable-value-display/variable-value-display.component';
import { QuickSchedulerComponent } from './quick-scheduler/quick-scheduler.component';
import { SelectTestbedsComponent } from './quick-scheduler/select-testbeds/select-testbeds.component';
import { TelemetrySchedulerComponent } from './telemetry-scheduler/telemetry-scheduler.component';
import { AutoTriggerRegressionComponent } from './auto-trigger-regression/auto-trigger-regression.component';
import { AutoRegressionResultComponent } from './auto-regression-result/auto-regression-result.component';
import { TestSuiteSelectionComponent } from './test-suite-selection/test-suite-selection.component';
import { DynamicSchedulerComponent } from './dynamic-scheduler/dynamic-scheduler.component';
import { DynamicSchedulerFormComponent } from './dynamic-scheduler/dynamic-scheduler-form/dynamic-scheduler-form.component';
import { DynamicSchedulerHistoryComponent } from './dynamic-scheduler/dynamic-scheduler-history/dynamic-scheduler-history.component';
import { SelectNetworkElementDialogComponent } from './dynamic-scheduler/select-network-element-dialog/select-network-element-dialog.component';
import { DynamicDeviceDetailsDialogComponent } from './dynamic-scheduler/dynamic-device-details-dialog/dynamic-device-details-dialog.component';
import { SelectClientDialogComponent } from './dynamic-scheduler/select-client-dialog/select-client-dialog.component';
import { TcMetricsComponent } from './dynamic-scheduler/tc-metrics/tc-metrics.component';
@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        MaterialModule,
        ThemeModule.forRoot(),
        TestLabRoutingModule,
        TreeviewModule.forRoot(),
        OwlDateTimeModule,
        OwlNativeDateTimeModule
    ],
    declarations: [
        TestLabComponent,
        SelectTestcasesComponent,
        ConfigureJobsComponent,
        DeviceDetailComponent,
        VariableValueDisplayComponent,
        ScheduleRegressionComponent,
        TagRegressionComponent,
        QuickSchedulerComponent,
        SelectTestbedsComponent,
        TelemetrySchedulerComponent,
        AutoTriggerRegressionComponent,
        TestSuiteSelectionComponent,
        AutoRegressionResultComponent,
        DynamicSchedulerComponent,
        DynamicSchedulerFormComponent,
        DynamicSchedulerHistoryComponent,
        SelectNetworkElementDialogComponent,
        DynamicDeviceDetailsDialogComponent,
        SelectClientDialogComponent,
        TcMetricsComponent
    ],
    bootstrap: []
})
export class TestLabModule {}
