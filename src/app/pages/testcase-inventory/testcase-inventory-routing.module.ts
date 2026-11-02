import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestCaseInventoryComponent } from './testcase-inventory.component';
import { ModuleComponent } from './module/module.component';
import { TestSuiteComponent } from './testsuite/testsuite.component';
import { TestGroupComponent } from './testgroup/testgroup.component';
import { TestCaseComponent } from './testcase/testcase.component';
import { AddTestCaseComponent } from './testcase/add-testcase/add-testcase.component';
import { EditTestCaseComponent } from './testcase/edit-testcase/edit-testcase.component';
import { MapTestCaseComponent } from './testsuite/map-testcase/map-testcase.component';
import { CloneTestCaseComponent } from './testcase/clone-testcase/clone-testcase.component';
import { AddTestGroupComponent } from './testgroup/add-testgroup/add-testgroup.component';
import { EditTestGroupComponent } from './testgroup/edit-testgroup/edit-testgroup.component';
import { DownloadComponent } from './download/download.component';

const routes: Routes = [
    {
        path: 'testcase/add',
        component: AddTestCaseComponent
    },
    {
        path: 'testcase/clone',
        component: CloneTestCaseComponent
    },
    {
        path: 'testcase/edit',
        component: EditTestCaseComponent
    },
    {
        path: 'testsuite/maptestcases',
        component: MapTestCaseComponent
    },
    {
        path: 'testgroup/add',
        component: AddTestGroupComponent
    },
    {
        path: 'testgroup/edit',
        component: EditTestGroupComponent
    },
    {
        path: '',
        component: TestCaseInventoryComponent,
        children: [
            {
                path: 'test-set',
                component: ModuleComponent
            },
            {
                path: 'testsuite',
                component: TestSuiteComponent
            },
            {
                path: 'testgroup',
                component: TestGroupComponent
            },
            {
                path: 'testcase',
                component: TestCaseComponent
            },
            {
                path: 'download',
                component: DownloadComponent
            },
            {
                path: '',
                redirectTo: 'test-set',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TestCaseInventoryRoutingModule {}
