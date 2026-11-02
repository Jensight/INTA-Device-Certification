import { NgModule } from '@angular/core';
import { TestCaseInventoryComponent } from './testcase-inventory.component';
import { TestCaseInventoryRoutingModule } from './testcase-inventory-routing.module';
import { CommonModule } from '@angular/common';
import { ThemeModule } from '../../@theme/theme.module';
import { ModuleComponent } from './module/module.component';
import { TestCaseComponent } from './testcase/testcase.component';
import { TestSuiteComponent } from './testsuite/testsuite.component';
import { TestGroupComponent } from './testgroup/testgroup.component';
import { AddModuleComponent } from './module/add-module/add-module.component';
import { EditModuleComponent } from './module/edit-module/edit-module.component';
import { AddTestCaseComponent } from './testcase/add-testcase/add-testcase.component';
import { EditTestCaseComponent } from './testcase/edit-testcase/edit-testcase.component';
import { AddTestGroupComponent } from './testgroup/add-testgroup/add-testgroup.component';
import { EditTestGroupComponent } from './testgroup/edit-testgroup/edit-testgroup.component';
import { AddTestSuiteComponent } from './testsuite/add-testsuite/add-testsuite.component';
import { EditTestSuiteComponent } from './testsuite/edit-testsuite/edit-testsuite.component';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { SharedModule } from '../../@shared/shared.module';
import { MaterialModule } from '../../app.material';
import { MapButtonComponent } from './testsuite/map-button/map.component';
import { MapTestCaseComponent } from './testsuite/map-testcase/map-testcase.component';
import { CloneTestCaseComponent } from './testcase/clone-testcase/clone-testcase.component';
import { AddTestGroupROIParamsComponent } from './testgroup/add-roi-parameter/add-roi-parameter.component';
import { DownloadComponent } from './download/download.component';

@NgModule({
    imports: [
        TestCaseInventoryRoutingModule,
        CommonModule,
        SharedModule,
        MaterialModule,
        ThemeModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule
    ],
    declarations: [
        TestCaseInventoryComponent,
        ModuleComponent,
        TestCaseComponent,
        TestSuiteComponent,
        TestGroupComponent,
        AddModuleComponent,
        EditModuleComponent,
        AddTestCaseComponent,
        EditTestCaseComponent,
        AddTestGroupComponent,
        EditTestGroupComponent,
        AddTestSuiteComponent,
        EditTestSuiteComponent,
        MapButtonComponent,
        MapTestCaseComponent,
        CloneTestCaseComponent,
        AddTestGroupROIParamsComponent,
        DownloadComponent
    ],
    bootstrap: []
})
export class TestCaseInventoryModule {}
