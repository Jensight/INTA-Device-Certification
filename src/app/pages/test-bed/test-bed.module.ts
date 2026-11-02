import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../@shared/shared.module';
import { MaterialModule } from '../../app.material';
import { ThemeModule } from '../../@theme/theme.module';
import { TestBedViewComponent } from './test-bed-view/test-bed-view.component';
import { TestBedRoutingModule } from './test-bed-routing.module';
import { AddTestBedComponent } from './test-bed-view/add-test-bed/add-test-bed.component';
import { ConfigureButtonComponent } from './test-bed-view/configure-button/configure-button.component';
import { NodeNameDisplayComponent } from './test-bed-view/node-name-display/node-name-display.component';
import { EditTestBedComponent } from './test-bed-view/edit-test-bed/edit-test-bed.component';
import { TestBedComponent } from './test-bed.component';
import { NodeComponent } from './nodes/nodes.component';
import { AddNodeComponent } from './nodes/add-node/add-node.component';
import { EditNodeComponent } from './nodes/edit-node/edit-node.component';
import { VariablesComponent } from './variables/variables.component';
import { ProfileComponent } from './profile/profile.component';
import { AddVariablesComponent } from './variables/add-variables/add-variables.component';
import { EditVariablesComponent } from './variables/edit-varibales/edit-variables.component';
import { AddProfileComponent } from './profile/add-profile/add-profile.component';
import { EditProfileComponent } from './profile/edit-profile/edit-profile.component';
import { AddTestbedConfigComponent } from './test-bed-view/add-testbed-config/add-testbed-config.component';
import { EditTestbedConfigComponent } from './test-bed-view/edit-testbed-config/edit-testbed-config.component';
import { CloneTestBedComponent } from './test-bed-view/clone-test-bed/clone-test-bed.component';
import { CloneProfileComponent } from './profile/clone-profile/clone-profile.component';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { UserTestbedMatrixComponent } from './user-testbed-matrix/user-testbed-matrix.component';
@NgModule({
    declarations: [
        TestBedComponent,
        TestBedViewComponent,
        AddTestBedComponent,
        NodeNameDisplayComponent,
        ConfigureButtonComponent,
        EditTestBedComponent,
        // TestBedConfigureComponent,
        NodeComponent,
        AddNodeComponent,
        EditNodeComponent,
        VariablesComponent,
        ProfileComponent,
        AddVariablesComponent,
        EditVariablesComponent,
        AddProfileComponent,
        EditProfileComponent,
        AddTestbedConfigComponent,
        EditTestbedConfigComponent,
        CloneTestBedComponent,
        CloneProfileComponent,
        UserTestbedMatrixComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        MaterialModule,
        ThemeModule,
        TestBedRoutingModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule
    ],
    exports: [],
    providers: []
})
export class TestBedModule {}
