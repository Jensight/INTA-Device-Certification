import { EditModelComponent } from './model/edit-model/edit-model.component';
import { AddModelComponent } from './model/add-model/add-model.component';
import { ModelVariableComponent } from './variables/model-variables.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DeviceInventoryComponent } from './device-inventory.component';
import { VendorComponent } from './vendor/vendor.component';
import { DeviceProfileComponent } from './device-profile/device-profile.component';
import { ModelComponent } from './model/model.component';
import { DeviceComponent } from './device/device.component';
import { AddDeviceComponent } from './device/add-device/add-device.component';
import { AddProfileComponent } from './device-profile/add-profile/add-profile.component';
import { EditDeviceComponent } from './device/edit-device/edit-device.component';
import { EditProfileComponent } from './device-profile/edit-profile/edit-profile.component';

const routes: Routes = [
    {
        path: 'device/add',
        component: AddDeviceComponent
    },
    {
        path: 'device-profile/add',
        component: AddProfileComponent
    },
    {
        path: 'vendor-model/add',
        component: AddModelComponent
    },{
        path: 'vendor-model/edit',
        component: EditModelComponent
    },
    {
        path: 'device/edit',
        component: EditDeviceComponent
    },
    {
        path: 'device-profile/edit',
        component: EditProfileComponent
    },
    {
        path: '',
        component: DeviceInventoryComponent,
        children: [
            // {
            //     path: 'vendor-name',
            //     component: VendorComponent
            // },
            {
                path: 'device-profile',
                component: DeviceProfileComponent
            },
            {
                path: 'vendor-model',
                component: ModelComponent
            },
            {
                path: 'device',
                component: DeviceComponent
            },
            {
                path: 'device-variables',
                component: ModelVariableComponent
            },
            {
                path: '',
                redirectTo: 'device-variables',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DeviceInventoryRoutingModule {}
