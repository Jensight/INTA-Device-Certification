
import { AdminGuard } from './../@core/guards/admin.guard';
import { RouterModule, Routes, RouteReuseStrategy } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { LabSetupComponent } from './lab-setup/lab-setup.component';

const routes: Routes = [
    {
        path: '',
        component: PagesComponent,
        children: [
            {
                path: 'settings',
                loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
                canActivate: [AdminGuard]
            },
            {
                path: 'userSetting',
                loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule),
            },
            {
                path: 'device-inventory',
                loadChildren: () => import('./device-inventory/device-inventory.module').then(m => m.DeviceInventoryModule)
            },
            {
                path: 'test-bed',
                loadChildren: () => import('./test-bed/test-bed.module').then(m => m.TestBedModule)
            },
            {
                path: 'api-inventory',
                loadChildren: () => import('./api-inventory/api-inventory.module').then(m => m.APIInventoryModule)
            },
            {
                path: 'testcase-inventory',
                loadChildren: () => import('./testcase-inventory/testcase-inventory.module').then(m => m.TestCaseInventoryModule)
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: 'test-scheduler',
                loadChildren: () => import('./test-lab/test-lab.module').then(m => m.TestLabModule)
            },
            {
                path: 'regression',
                loadChildren: () => import('./regression/regression.module').then(m => m.RegressionModule)
            },
            {
                path: 'reserve',
                loadChildren: () => import('./cpe-inventory/cpe-inventory.module').then(m => m.CPEInventoryModule)
            },
            {
                path: 'lab-setup',
                //loadChildren: () => import('./lab-setup/lab-setup.module').then(m => m.LabSetupModule)
                component: LabSetupComponent
            },
            {
                path: 'about-us',
                component: AboutUsComponent
            },
            // {
            //     path: 'stats',
            //     component:AppStatsComponent,
            //     canActivate: [AdminGuard]
            // },
            {
                path: '**',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],

    exports: [RouterModule]
})
export class PagesRoutingModule { }
