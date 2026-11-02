import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { FeedbackComponent } from './components/header/feedback/feedback.component';
import { MaterialModule } from 'src/app/app.material';


const BASE_MODULES = [FormsModule, ReactiveFormsModule];


const COMPONENTS = [
  FooterComponent,
  HeaderComponent

];
const PIPES = [

];

@NgModule({
  imports: [CommonModule, NgMultiSelectDropDownModule.forRoot(), MatRippleModule, MaterialModule, ...BASE_MODULES],
  exports: [CommonModule, MatRippleModule, MaterialModule, ...BASE_MODULES, ...PIPES, ...COMPONENTS],
  declarations: [...COMPONENTS, ...PIPES, FeedbackComponent],
})
export class ThemeModule {
  static forRoot(): ModuleWithProviders<ThemeModule> {
    return {
      ngModule: ThemeModule,
      providers: [],
    };
  }
}

