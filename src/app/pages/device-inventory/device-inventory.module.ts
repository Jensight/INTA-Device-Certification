import { EditVariableComponent } from './variables/edit-variable/edit-variable.component';
import { EditVariableGroupComponent } from './variables/edit-variable-group/edit-variable-group.component';
import { AddVariableComponent } from './variables/add-variable/add-variable.component';
import { AddVariableGroupComponent } from './variables/add-variable-group/add-variable-group.component';
import { NgModule } from '@angular/core';
import { DeviceInventoryRoutingModule } from './device-inventory.routing.module';
import { DeviceInventoryComponent } from './device-inventory.component';
import { ThemeModule } from '../../@theme/theme.module';
//import { VendorComponent } from './vendor/vendor.component';
import { AddVendorComponent } from './vendor/add-vendor/add-vendor.component';
import { EditVendorComponent } from './vendor/edit-vendor/edit-vendor.component';
import { SharedModule } from '../../@shared/shared.module';
import { DeviceProfileComponent } from './device-profile/device-profile.component';
import { ModelComponent } from './model/model.component';
import { DeviceComponent } from './device/device.component';
import { EditProfileComponent } from './device-profile/edit-profile/edit-profile.component';
import { AddProfileComponent } from './device-profile/add-profile/add-profile.component';
import { AddModelComponent } from './model/add-model/add-model.component';
import { EditModelComponent } from './model/edit-model/edit-model.component';
import { AddDeviceComponent } from './device/add-device/add-device.component';
import { EditDeviceComponent } from './device/edit-device/edit-device.component';
import { ShowPreviewComponent } from './device-profile/show-preview/show-preview.component';
import { ModelVariableComponent } from "./variables/model-variables.component";
import {ReactiveFormsModule} from '@angular/forms';
import { Angular2SmartTableModule } from 'angular2-smart-table';

@NgModule({
    declarations: [
        DeviceInventoryComponent,
        //VendorComponent,
        AddVendorComponent,
        EditVendorComponent,
        DeviceProfileComponent,
        ModelComponent,
        DeviceComponent,
        AddProfileComponent,
        EditProfileComponent,
        AddModelComponent,
        EditModelComponent,
        AddDeviceComponent,
        EditDeviceComponent,
        ShowPreviewComponent,
        ModelVariableComponent,
        AddVariableGroupComponent,
        AddVariableComponent,
        EditVariableGroupComponent,
        EditVariableComponent
    ],
    imports: [DeviceInventoryRoutingModule, ThemeModule, 
        // Ng2SmartTableModule, 
        SharedModule, ReactiveFormsModule, Angular2SmartTableModule],
    exports: [],
    providers: []
})
export class DeviceInventoryModule {}
