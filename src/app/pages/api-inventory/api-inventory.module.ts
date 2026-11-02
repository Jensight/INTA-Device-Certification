import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APIInventoryRoutingModule } from './api-inventory-routing.module';
import { APIGroupComponent } from './api-group/api-group.component';
import { APIInventoryComponent } from './api-inventory.component';
import { ThemeModule } from '../../@theme/theme.module';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { SharedModule } from '../../@shared/shared.module';
import { APIComponent } from './api/api.component';
import { AddAPIGroupComponent } from './api-group/add-api-group/add-api-group.component';
import { URLDisplayComponent } from './api-group/url-display/url-display.component';

import { EditAPIGroupComponent } from './api-group/edit-api-group/edit-api-group.component';
import { AddAPIComponent } from './api/add-api/add-api.component';
import { EditAPIComponent } from './api/edit-api/edit-api.component';
import { VariableDisplayComponent } from './api/variable-display/variable-display.component';
import { MaterialModule } from '../../app.material';
import { APIStatusDisplayComponent } from './api-group/api-status-display/api-status-display.component';
import { TimeoutInterceptor } from '../../@core/services/timeout-interceptor';
import { CloneAPIComponent } from './api/clone-api/clone-api.component';

@NgModule({
    declarations: [
        APIGroupComponent,
        APIInventoryComponent,
        APIComponent,
        AddAPIGroupComponent,
        URLDisplayComponent,
        APIStatusDisplayComponent,
        EditAPIGroupComponent,
        AddAPIComponent,
        EditAPIComponent,
        VariableDisplayComponent,
        CloneAPIComponent
    ],
    imports: [CommonModule, MaterialModule, APIInventoryRoutingModule, ThemeModule, 
        // Ng2SmartTableModule, 
        SharedModule, Angular2SmartTableModule],
    exports: [],
    providers: [TimeoutInterceptor]
})
export class APIInventoryModule {}
