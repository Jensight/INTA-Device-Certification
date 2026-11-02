import { ViewReservationsComponent } from './view-reservations/view-reservations.component';
import { ReserveTestbedComponent } from './testbed/testbed.component';
import { CPEInventoryComponent } from './cpe-inventory.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReserveDeviceComponent } from './device/device.component';
import { ViewReservedDeviceDetailComponent } from './view-reservations/view-device-details/view-device-detail.component';

const routes: Routes = [
    {
        path:'reservation/view-device',
        component: ViewReservedDeviceDetailComponent
    },
    {
        path:'view',
        component : ViewReservationsComponent
    },
    {
        path: '',
        component: CPEInventoryComponent,
        children: [
            {
                path: 'testbed',
                component: ReserveTestbedComponent
            },
            {
                path: 'device',
                component: ReserveDeviceComponent
            },
            {
                path: '',
                redirectTo: 'device',
                pathMatch: 'full',
                
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CPEInventoryRoutingModule {}
