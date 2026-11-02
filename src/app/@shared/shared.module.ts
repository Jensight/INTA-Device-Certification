import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SHARED_COMPONENTS } from './components/components';
import { MaterialModule } from '../app.material';
import { ThemeModule } from '../@theme/theme.module';
import { SHARED_PIPES } from './pipes/pipes';
import { DndModule } from '@ng-dnd/core';
import { ToastrModule } from 'ngx-toastr';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { DragDropModule } from '@angular/cdk/drag-drop'
import {TranslateModule} from '@ngx-translate/core';
import { RegressionDeleteComponent } from './components/regression-delete/regression-delete.component';
import { NgxSpinnerModule } from 'ngx-spinner';
// import { MultiBackend, HTML5Backend } from '@ng-dnd/multi-backend';

@NgModule({
    declarations: [SHARED_COMPONENTS, SHARED_PIPES, RegressionDeleteComponent],
    imports: [
        CommonModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule,
        FormsModule,
        MaterialModule,
        ThemeModule,
        // DndModule.forRoot({ backend: HTML5Backend }),
        DragDropModule,
        ToastrModule,
        OwlNativeDateTimeModule,
        OwlDateTimeModule,
        TranslateModule,
        NgxSpinnerModule.forRoot({}),
        ToastrModule.forRoot({
            positionClass: 'toast-bottom-right',
            timeOut: 5000,
            newestOnTop: true,
            tapToDismiss: true,
            preventDuplicates: true,
            progressBar: true,
            closeButton: true,
            maxOpened: 5,
            autoDismiss: true, 
          }),
    ],
    exports: [
        SHARED_COMPONENTS,
        SHARED_PIPES,
        FormsModule,
        MaterialModule,
        DndModule,
        DragDropModule,
        ToastrModule,
        OwlNativeDateTimeModule,
        OwlDateTimeModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule,
        TranslateModule,
    ],
    providers: []
})
export class SharedModule {}
