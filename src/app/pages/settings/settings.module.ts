import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../../app.material';
import { ThemeModule } from '../../@theme/theme.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { AddUserComponent } from './add-user/add-user.component';
import { ViewUserComponent } from './view-user/view-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { SharedModule } from '../../@shared/shared.module';
import { ViewTeamComponent } from './view-team/view-team.component';
import { EditTeamComponent } from './edit-team/edit-team.component';
import { AddTeamComponent } from './add-team/add-team.component';
import { FeedbackComponent } from './view-feedback/feedback/feedback.component';
import { EditFeedbackComponent } from './edit-feedback/edit-feedback.component';
import { AddCommentComponent } from './edit-feedback/add-comment/add-comment.component';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { SysConfigComponent } from './system-configuration/sys-config/sys-config.component';
import { OtherConfigComponent } from './system-configuration/other-config/other-config.component';
import { DbManagementComponent } from './system-configuration/db-management/db-management.component';
import { LabSetUpConfigComponent } from './system-configuration/lab-set-up-config/lab-set-up-config.component';
import { AddLabSetUpComponent } from './system-configuration/lab-set-up-config/add-lab-set-up/add-lab-set-up.component';
import { AddErrorCodesComponent } from './system-configuration/add-error-codes/add-error-codes.component';
import { EditErrorCodeComponent } from './system-configuration/add-error-codes/edit-error-code/edit-error-code.component';
import { LoginlogoutreportComponent } from './loginlogoutreport/loginlogoutreport.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { DeviceTabComponent } from './system-configuration/db-management/device-tab/device-tab.component';
import { ApiTabComponent } from './system-configuration/db-management/api-tab/api-tab.component';
import { TestcaseTabComponent } from './system-configuration/db-management/testcase-tab/testcase-tab.component';
import { TestbedTabComponent } from './system-configuration/db-management/testbed-tab/testbed-tab.component';
import {VendorComponent} from '../device-inventory/vendor/vendor.component';
import { DashboardConfigComponent } from './system-configuration/dashboard-config/dashboard-config.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { DashboardRulesComponent } from './dashboard-rules/dashboard-rules.component';
import { AddDeviceTypeComponent } from './add-device-type/add-device-type.component';

@NgModule({
    declarations: [
        AddUserComponent,
        ViewUserComponent,
        VendorComponent,
        EditUserComponent,
        ViewTeamComponent,
        EditTeamComponent,
        AddTeamComponent,
        FeedbackComponent,
        EditFeedbackComponent,
        AddCommentComponent,
        SystemConfigurationComponent,
        SysConfigComponent,
        OtherConfigComponent,
	DbManagementComponent,
	LabSetUpConfigComponent,
        AddLabSetUpComponent,
        AddErrorCodesComponent,
        EditErrorCodeComponent,
	LoginlogoutreportComponent,
	  DeviceTabComponent,
        ApiTabComponent,
        TestcaseTabComponent,
        TestbedTabComponent,
        DashboardConfigComponent,
        DashboardRulesComponent,
        AddDeviceTypeComponent
    ],
    imports: [
        CommonModule,
        MaterialModule,
        ThemeModule,
        SettingsRoutingModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule,
        SharedModule,
        NgxSpinnerModule.forRoot({}),
        NgxEchartsModule.forRoot({
            echarts: () => import('echarts')
        }),
    ],
    exports: [],
    providers: []
})
export class SettingsModule { }
