
import { SelectTeamComponent } from './@auth/select-team/select-team.component';
import {
    ExtraOptions,
    RouterModule,
    Routes,
    PreloadAllModules,
    PreloadingStrategy,
    RouteReuseStrategy
} from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from './@core/guards/auth.guard';
import { LoginComponent } from './@auth/login/login.component';

const routes: Routes = [
    {
        path: 'pages',
        loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
        canActivate: [AuthGuard],
        data: {
            breadcrumb: 'Pages'
        },
    },
    { path: 'login', component: LoginComponent },
    {
        path: 'selectteam',
        component: SelectTeamComponent,
        canActivate: [AuthGuard]
    },
    { path: '', redirectTo: 'pages', pathMatch: 'full' },
    { path: '**', redirectTo: 'pages' }
];

const config: ExtraOptions = {
    useHash: true,
    preloadingStrategy: PreloadAllModules,
    scrollPositionRestoration: 'top'
};

@NgModule({
    imports: [RouterModule.forRoot(routes, config)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
