import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { APIGroupComponent } from './api-group/api-group.component';
import { APIInventoryComponent } from './api-inventory.component';
import { APIComponent } from './api/api.component';
import { AddAPIComponent } from './api/add-api/add-api.component';
import { EditAPIComponent } from './api/edit-api/edit-api.component';
import { AddAPIGroupComponent } from './api-group/add-api-group/add-api-group.component';
import { EditAPIGroupComponent } from './api-group/edit-api-group/edit-api-group.component';
import { CloneAPIComponent } from './api/clone-api/clone-api.component';

const routes: Routes = [
    {
        path: 'api/add',
        component: AddAPIComponent
    },
    {
        path: 'api/edit',
        component: EditAPIComponent
    },
    {
        path: 'group/add',
        component: AddAPIGroupComponent
    },
    {
        path: 'group/edit',
        component: EditAPIGroupComponent
    },
    {
        path: 'api/clone',
        component: CloneAPIComponent
    },
    
    {
        path: '',
        component: APIInventoryComponent,
        children: [
            {
                path: 'group',
                component: APIGroupComponent
            },
            {
                path: 'api',
                component: APIComponent
            },

            {
                path: '',
                redirectTo: 'group',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class APIInventoryRoutingModule {}
