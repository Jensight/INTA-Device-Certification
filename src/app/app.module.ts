import { SelectTeamComponent } from './@auth/select-team/select-team.component';
import { LoginComponent } from './@auth/login/login.component';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './app.material';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { NgxCaptureModule } from 'ngx-capture';
import { BnNgIdleService } from 'bn-ng-idle';
import { NgxSpinnerModule } from 'ngx-spinner';
import { TestbedlistPopupComponent } from './testbedlist-popup/testbedlist-popup.component';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from './@shared/shared.module';
import { TestLabModule } from './pages/test-lab/test-lab.module';
import { MatCardModule } from '@angular/material/card';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ThemeModule.forRoot(),
    CoreModule.forRoot(),
    NgxCaptureModule,
    SharedModule,
    TestLabModule,
    MatCardModule,
    NgxSpinnerModule.forRoot({}),
    TranslateModule.forRoot({
      defaultLanguage: 'English',
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    ToastrModule.forRoot()
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    SelectTeamComponent,
    TestbedlistPopupComponent
  ],
  providers: [ BnNgIdleService],
  bootstrap: [AppComponent],
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
