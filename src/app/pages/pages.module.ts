import { CoreModule } from './../@core/core.module';
import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';

import { PagesRoutingModule } from './pages-routing.module';
import { ThemeModule } from '../@theme/theme.module';
import { AboutUsComponent } from './about-us/about-us.component';
import { LabSetupComponent } from './lab-setup/lab-setup.component';
import { SharedModule } from '../@shared/shared.module';
import { AppStatsComponent } from './app-stats/app-stats.component';
import { LabSettingComponent } from './lab-setup/lab-setting/lab-setting.component';
import { RackViewComponent } from './lab-setup/rack-view/rack-view.component';
import { LabViewComponent } from './lab-setup/lab-view/lab-view.component';
import { LabRowViewComponent } from './lab-setup/lab-row-view/lab-row-view.component';
import { AddTestbedDetailsLabComponent } from './lab-setup/add-testbed-details-lab/add-testbed-details-lab.component';
import { ViewTestbedDetailsComponent } from './lab-setup/view-testbed-details/view-testbed-details.component';
import { LabOverviewComponent } from './lab-setup/lab-overview/lab-overview.component';
import { ConfigureTestbedApiComponent } from './lab-setup/configure-testbed-api/configure-testbed-api.component';


const PAGES_COMPONENTS = [PagesComponent,AboutUsComponent, LabSetupComponent,AppStatsComponent];

@NgModule({
    imports: [PagesRoutingModule, ThemeModule, SharedModule],
    declarations: [...PAGES_COMPONENTS, LabSettingComponent, RackViewComponent, LabViewComponent, LabRowViewComponent, AddTestbedDetailsLabComponent, ViewTestbedDetailsComponent, LabOverviewComponent, ConfigureTestbedApiComponent]
})
export class PagesModule {}
