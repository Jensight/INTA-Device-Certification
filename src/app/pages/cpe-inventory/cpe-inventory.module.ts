import { EditScheduledRegressionComponent } from './view-reservations/edit-scheduled-regressions/edit-scheduled-regression.component';
import { ViewReservedDeviceDetailComponent } from './view-reservations/view-device-details/view-device-detail.component';
import { ReserveTestbedDialogComponent } from './testbed/reserve-testbed/reserve-testbed.component';
import { ViewTestbedDetailsComponent } from './testbed/view-testbed-details/view-testbed-details.component';
import { EditReservationComponent } from './view-reservations/edit-reservations/edit-reservation.component';
import { ReserveDeviceDialogComponent } from './device/reserve-devices/reserve-devices.component';
import { ViewDeviceDetailsComponent } from './device/view-device-details/view-device-details.component';
import { ReserveTestbedComponent } from './testbed/testbed.component';
import { ReserveDeviceComponent } from './device/device.component';
import { ViewReservationsComponent } from './view-reservations/view-reservations.component';
import { CPEInventoryComponent } from './cpe-inventory.component';
import { CPEInventoryRoutingModule } from './cpe-inventory-routing.module';
import { SharedModule } from './../../@shared/shared.module';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { ThemeModule } from './../../@theme/theme.module';
import { MaterialModule } from './../../app.material';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { ReservationOverlappingComponent } from './device/reserve-devices/reservation-overlapping-warning/reservation-overlapping.component';
// import { Angular2SmartTableModule } from 'angular2-smart-table';

@NgModule({
    declarations: [
        CPEInventoryComponent,
        ReserveDeviceComponent,
        ReserveDeviceDialogComponent,
        ReserveTestbedComponent,
        ViewDeviceDetailsComponent,
        ViewReservationsComponent,
        EditReservationComponent,
        ViewTestbedDetailsComponent,
        ReserveTestbedDialogComponent,
        ReservationOverlappingComponent,
        ViewReservedDeviceDetailComponent,
        EditScheduledRegressionComponent

    ],
    imports: [
        CommonModule,
        MaterialModule,
        CPEInventoryRoutingModule,
        ThemeModule,
        // Ng2SmartTableModule,
        Angular2SmartTableModule,
        SharedModule,
        SelectDropDownModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule
    ],
    exports: [],
    providers: []
})
export class CPEInventoryModule {}
