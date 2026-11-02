import { EditTeamComponent } from './edit-team/edit-team.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AddUserComponent } from './add-user/add-user.component';
import { ViewUserComponent } from './view-user/view-user.component';
import { ViewTeamComponent } from './view-team/view-team.component';
import { AddTeamComponent } from './add-team/add-team.component';
import { FeedbackComponent } from './view-feedback/feedback/feedback.component';
import { EditFeedbackComponent } from './edit-feedback/edit-feedback.component';
import { SystemConfigurationComponent } from './system-configuration/system-configuration.component';
import { LoginlogoutreportComponent } from './loginlogoutreport/loginlogoutreport.component';
import { DbManagementComponent } from './system-configuration/db-management/db-management.component';
import { VendorComponent } from '../device-inventory/vendor/vendor.component';
const routes: Routes = [
    {
        path: 'user/add',
        component: AddUserComponent
    },
    {
        path: 'user/view',
        component: ViewUserComponent
    },
    {
        path: 'team/view',
        component: ViewTeamComponent
    },
    {
        path: 'team/add',
        component: AddTeamComponent
    },
    {
        path: 'team/edit',
        component: EditTeamComponent
    },
    {
        path: 'feedback/view',
        component: FeedbackComponent
    },
    {
        path: 'feedback/edit',
        component: EditFeedbackComponent
    },
    {
        path: 'system/configuration',
        component: SystemConfigurationComponent
    },
    {
        path: 'dbManagement',
        component: DbManagementComponent
    },{
        path:'user/loginlogoutAnalysis',
        component: LoginlogoutreportComponent
    },
    {
        path:'vendorName',
        component: VendorComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SettingsRoutingModule {}
