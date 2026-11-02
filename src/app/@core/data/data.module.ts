import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

// import { StateService } from './state.service';
import { LayoutService } from './layout.service';

const SERVICES = [
   // StateService,
    LayoutService
];

@NgModule({
    imports: [CommonModule],
    providers: [...SERVICES]
})
export class DataModule {
    static forRoot(): ModuleWithProviders<DataModule> {
        return {
            ngModule: DataModule,
            providers: [...SERVICES]
        };
    }
}
