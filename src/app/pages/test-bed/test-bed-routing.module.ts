import { TestBedConfigureComponent } from './test-bed-configure/test-bed-configure.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestBedViewComponent } from './test-bed-view/test-bed-view.component';
import { TestBedComponent } from './test-bed.component';
import { NodeComponent } from './nodes/nodes.component';
import { VariablesComponent } from './variables/variables.component';
import { ProfileComponent } from './profile/profile.component';
import { AddTestBedComponent } from './test-bed-view/add-test-bed/add-test-bed.component';
import { EditTestBedComponent } from './test-bed-view/edit-test-bed/edit-test-bed.component';
import { AddProfileComponent } from './profile/add-profile/add-profile.component';
import { EditProfileComponent } from './profile/edit-profile/edit-profile.component';
import { CloneTestBedComponent } from './test-bed-view/clone-test-bed/clone-test-bed.component';
import { CloneProfileComponent } from './profile/clone-profile/clone-profile.component';
import { UserTestbedMatrixComponent } from './user-testbed-matrix/user-testbed-matrix.component';

const routes: Routes = [
    {
        path: 'view/add',
        component: AddTestBedComponent
    },
    {
        path: 'view/edit',
        component: EditTestBedComponent
    },
    {
        path: 'testbed-profile/add',
        component: AddProfileComponent
    },
    {
        path: 'testbed-profile/edit',
        component: EditProfileComponent
    },
    {
        path: 'testbed-profile/clone',
        component: CloneProfileComponent
    },
    {
        path: 'view/configure',
        component: TestBedConfigureComponent
    },
    {
        path: 'view/clone',
        component: CloneTestBedComponent
    },
    {
        path: '',
        component: TestBedComponent,
        children: [
            {
                path: 'network-element',
                component: NodeComponent
            },
            {
                path: 'view',
                component: TestBedViewComponent
            },
            {
                path: 'testbed-profile',
                component: ProfileComponent
            },
            {
                path: 'testbed-variables',
                component: VariablesComponent
            },
            {
                path: 'user-testbed-matrix',
                component: UserTestbedMatrixComponent
            },

            {
                path: '',
                redirectTo: 'nodes',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TestBedRoutingModule {}
