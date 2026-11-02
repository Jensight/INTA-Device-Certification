import { ReservationOverlappingComponent } from './reservation-overlapping-warning/reservation-overlapping.component';
import { DataService } from './../../../../@core/services/data.service';
import { UntypedFormGroup, UntypedFormControl, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core'
import { ReservationService } from './../../../../@core/services/reservation.service';
import * as _ from 'lodash';
@Component({
    selector: 'app-reserve-devices-component',
    templateUrl: './reserve-devices.component.html',
    styleUrls: ['./reserve-devices.component.scss']
})
export class ReserveDeviceDialogComponent implements OnInit {
    dropdownOptions = [];
    reservationForm: UntypedFormGroup;
    success = new EventEmitter();
    date = new Date()
    config = {
        search: true,
        displayKey: 'username'
    };
    dataModel;
    formSubmitted = false;
    allUsers = [];
    allReservationName = []
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sharedDevices = [];
    disableForm = false;
    constructor(
        private reservationService: ReservationService,
        private dataService: DataService,
        public dialogRef: MatDialogRef<ReserveDeviceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit() {
       this.sub1= this.dataService.getSettingsData().subscribe(data => {
            if(data){
                this.allUsers = _.sortBy(data.users,'username');
                this.allUsers.sort((a, b) => {
                    if (a.username.toLowerCase() > b.username.toLowerCase()) {
                      return 1;
          
                    }
                    if (a.username.toLowerCase() < b.username.toLowerCase()) {
                      return -1;
          
                    }
          
                    return 0;
                  });

               
                this.dropdownOptions = this.allUsers.filter(d => {
                    return d.teams.indexOf(this.data.selectedTeam) > -1
                });
            }
        });
      this.sub2=this.reservationService.getActiveReservationsDetails().subscribe((data:any) => {
            if(data){
                this.allReservationName = data;
            }
        })
      this.reservationForm = new UntypedFormGroup({
            type: new UntypedFormControl('once', Validators.required),
            reservationName: new UntypedFormControl(null, Validators.required),
            users : new UntypedFormControl([],Validators.required),
            reserveAt: new UntypedFormControl('now', Validators.required),
            releaseAt: new UntypedFormControl(null, Validators.required),
            reserveTime: new UntypedFormControl(new Date()),
            devices: new UntypedFormControl(this.data.selectedDevices)
        })
        this.data.selectedDevices.forEach(selectedDevice => {
            if (selectedDevice.shareDevice) {
                this.sharedDevices.push(selectedDevice.deviceName);
                this.disableForm = true;
            }
        });
        if (this.disableForm){
            this.reservationForm.disable();
        }
        

        this.sub3=this.reservationForm.get('reserveAt').valueChanges.subscribe(value => {
           if(value === 'now'){
               this.reservationForm.get('reserveTime').clearValidators();
               this.reservationForm.get('reserveTime').setValue(new Date());
            }else if( value === 'later'){
                this.reservationForm.get('reserveTime').setValidators(Validators.required)
            }
        });

        this.sub4=this.reservationForm.get('reserveTime').valueChanges.subscribe(time => {
            if(time >= this.reservationForm.get('releaseAt').value){
                this.reservationForm.get('releaseAt').setValue(null);
            }
        });
        this.sub5=this.reservationForm.get('reservationName').valueChanges.subscribe(value => {
            if (this.allReservationName.indexOf(value) !== -1) {
                this.reservationForm.get('reservationName').setErrors({ duplicate: true });
            } else if (this.reservationForm.get('reservationName').hasError('required')) {
                this.reservationForm.get('reservationName').setErrors(null);
                this.reservationForm.get('reservationName').setErrors({ required: true });
            } else {
                this.reservationForm.get('reservationName').setErrors(null);
            }
        });
    }

    close() {
        this.dialogRef.close();
    }

    updatevalue(data){
       this.reservationForm.get('users').setValue(this.dataModel);
    }

    reserveDevices(){

        this.formSubmitted = true;
        if(this.reservationForm.valid){
            this.dataService.loading.next(true)
            this.sub6=this.reservationService.reserveDevices({... this.reservationForm.value, loggedInUser: this.dataService.getCurrentUser()}).subscribe(data => {
                if(data){
                    this.dataService.loading.next(false)
                    this.success.emit(true)
                    this.dataService.getDeviceInventoryData().next(data);
                    this.snackBar.open('Reservation Placed Successfully', 'ok', {duration : 5000})
                    this.close();
                }
            },error => {
                //console.log(error.error);
                this.dataService.loading.next(false)
                if(error.error.error === 'STATE_CHANGED') {
                    this.snackBar.open('Reservation Failed. State changed', 'TRY AGAIN', {duration: 5000})
                } else if((error.error.error && error.error.error.includes('End Time Should be greater than Start Time')) || (error.error.errorDetail && error.error.errorDetail.includes('End Time Should be greater than Start Time'))) {
                    this.snackBar.open('Reservation Failed.. Check Release Time', 'ok', {duration : 5000})
                } else if ((error.error.error && error.error.error.includes(' is Not Available')) || (error.error.errorDetail && error.error.errorDetail.includes(' is Not Available'))) {
                    if (error.error.errorDetail) {
                        this.snackBar.open(error.error.errorDetail, 'ok', {duration : 5000});
                    } else {
                        this.snackBar.open('Reservation Failed. One or More Device Not Available', 'ok', {duration : 5000});
                    }
                } else if ((error.error.error && error.error.error.includes('Reservations Overlapping. Check timings.')) || (error.error.errorDetail && error.error.errorDetail.includes('Reservations Overlapping. Check timings.'))) {
                    if (error.error.details) {
                        this.dialog.open(ReservationOverlappingComponent,{width: '500px', data: error.error.details})
                    } else {
                        this.snackBar.open('Reservation Overlapping With Other', 'Try again', {duration : 5000});
                    }
                } else if ((error.error.error && error.error.error.includes('Device Not Available in Obelix Server')) || (error.error.errorDetail && error.error.errorDetail.includes('Device Not Available in Obelix Server'))) {
                    this.snackBar.open('One or more Device is reserved in obelix server', 'ok', {duration : 5000});
                } else if ((error.error.error && error.error.error.includes('Obelix Server is not Reachable')) || (error.error.errorDetail && error.error.errorDetail.includes('Obelix Server is not Reachable'))) {
                    this.snackBar.open('Cannot Reach Obelix Server', 'Try Again', {duration : 5000});
                } else {
                    this.snackBar.open('Some Error Occurred', 'Try again', {duration : 5000});
                }
                this.close();
                this.success.emit(false);
            });
        }

    }
    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
    }
}
