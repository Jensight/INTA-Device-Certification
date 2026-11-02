import { AdminGuard } from './guards/admin.guard';
import { ReservationService } from './services/reservation.service';
import { CPEInventoryService } from './services/cpe-inventory.service';
import { DashboardService } from './services/dashboard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterService } from './services/router.service';
import { ApiService } from './services/api.service';
import { ToastrService } from 'ngx-toastr';
import { DeviceInventoryService } from './services/device-inventory.service';
import { LoginService } from './services/login.service';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of as observableOf } from 'rxjs';

import { throwIfAlreadyLoaded } from './module-import-guard';
import { DataModule } from './data/data.module';
import { AnalyticsService } from './utils/analytics.service';
import { AuthGuard } from './guards/auth.guard';
import { DataService } from './services/data.service';
import { TeamService } from './services/team.service';
import { FeedbackService } from './services/feedback.service';
import { UserService } from './services/user.service';
import { TestBedService } from './services/test-bed.service';
import { TestCaseInventoryService } from './services/testcase-inventory.service';
import { TestLabService } from './services/test-lab.service';
// import { HttpModule } from '@angular/http';
import { TimeoutInterceptorProvider } from './services/timeout-interceptor';
import { CommonService } from './services/common.service';
import { DecryptPassword } from '../@shared/pipes/decrypt-password.pipe';
import { SideBarService } from '../@core/services/sideBar.service';

export class NbSimpleRoleProvider {
    getRole() {
        // here you could provide any role based on any auth flow
        return observableOf('guest');
    }
}

export const NB_CORE_PROVIDERS = [
    ...DataModule.forRoot().providers,
    AnalyticsService,
    AuthGuard,
    AdminGuard,
    LoginService,
    CommonService,
    DataService,
    TeamService,
    UserService,
    DeviceInventoryService,
    TestBedService,
    FeedbackService,
    ToastrService,
    ApiService,
    TestCaseInventoryService,
    TestLabService,
    RouterService,
    DashboardService,
    CPEInventoryService,
    ReservationService,
    SideBarService,
    TimeoutInterceptorProvider
];

@NgModule({ exports: [],
    declarations: [], imports: [CommonModule], providers: [DecryptPassword, provideHttpClient(withInterceptorsFromDi())] })
export class CoreModule {
    constructor(
        @Optional()
        @SkipSelf()
        parentModule: CoreModule
    ) {
        throwIfAlreadyLoaded(parentModule, 'CoreModule');
    }

    static forRoot(): ModuleWithProviders<CoreModule> {
        return {
            ngModule: CoreModule,
            providers: [...NB_CORE_PROVIDERS]
        };
    }
}
