import { ReservationOverlappingComponent } from './../../device/reserve-devices/reservation-overlapping-warning/reservation-overlapping.component';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from './../../../../@core/services/data.service';
import { ReservationService } from './../../../../@core/services/reservation.service';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-edit-reservations',
    templateUrl: './edit-reservation.component.html',
    styleUrls: ['./edit-reservation.component.scss']
})
export class EditReservationComponent implements OnInit {
    dropdownOptions = [];
    reservationForm: UntypedFormGroup;
    success = new EventEmitter();
    date = new Date()
    config = {
        search: true
    };
    dataModel;
    formSubmitted = false;
    allUsers = [];
    sub1;
    sub2;
    sub3;
    sub4;
    
    constructor(
        private reservationService: ReservationService,
        private dataService: DataService,
        public dialogRef: MatDialogRef<EditReservationComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.sub1=this.dataService.getSettingsData().subscribe(data => {
            if(data){
                this.allUsers = data.users;
                this.dropdownOptions = this.allUsers.filter(d => {
                    return d.teams.indexOf(this.data.selectedTeam) > -1
                }).map(user => user.username);
            }
        })

        this.reservationForm = new UntypedFormGroup({
            type: new UntypedFormControl(null, Validators.required),
            reservationName: new UntypedFormControl({value:null , disabled: true}, Validators.required),
            users : new UntypedFormControl(null,Validators.required),
            reserveAt: new UntypedFormControl(null, Validators.required),
            releaseAt: new UntypedFormControl(null, Validators.required),
            reserveTime: new UntypedFormControl(new Date()),
            deviceIds: new UntypedFormControl(null),
            active: new UntypedFormControl(),
            createdAt: new UntypedFormControl(),
            reservationType : new UntypedFormControl(),
            reservedUser : new UntypedFormControl(),
            status : new UntypedFormControl(),
            _id : new UntypedFormControl(),
            testbedIds: new UntypedFormControl(),
        });

        this.reservationForm.patchValue(this.data.reservation);
        this.dataModel = this.data.reservation.users;
        if(new Date(this.data.reservation.reserveTime) < new Date()){
            this.reservationForm.get('reserveTime').disable();
            this.reservationForm.get('reserveAt').disable();
        }
        this.sub2=this.reservationForm.get('reserveAt').valueChanges.subscribe(value => {
           if(value === 'now'){
               this.reservationForm.get('reserveTime').clearValidators();
               this.reservationForm.get('reserveTime').setValue(new Date());
            }else if( value === 'later'){
                this.reservationForm.get('reserveTime').setValidators(Validators.required)
            }
        });

        this.sub3=this.reservationForm.get('reserveTime').valueChanges.subscribe(time => {
            if(time >= this.reservationForm.get('releaseAt').value){
                this.reservationForm.get('releaseAt').setValue(null);
            }
        })
     }

    close() {
        this.dialogRef.close();
    }

    updatevalue(data){
       this.reservationForm.get('users').setValue(this.dataModel);
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
    }
    editReservation(){
        this.formSubmitted = true;
        if(this.reservationForm.valid){
            this.dataService.loading.next(true)
            const updatedValue = this.reservationForm.getRawValue();
            const oldValue = this.data.reservation;
            this.sub4=this.reservationService.editReservationForm( {updatedValue,oldValue}).subscribe(data => {
                if(data){
                    this.dataService.loading.next(false)
                    this.success.emit(data);
                    this.snackBar.open('Reservation Updated Successfully', 'OK', {duration: 5000})
                    this.close()
                }
            }, error => {
                this.dataService.loading.next(false)
                if(error.error && error.error.error === 'STATE_CHANGED') {
                    this.success.emit(error.error.data);
                    this.snackBar.open('Update Failes. State changed', 'TRY AGAIN', {duration: 5000})
                } else if(error.error && error.error.error.includes('End Time Should be greater than Start Time')){
                    this.snackBar.open('Reservation Failed.. Check Release Time', 'ok', {duration : 5000})
                } else if (error.error && error.error.error.includes(' is Not Available')){
                    this.snackBar.open('Reservation Failed. One or More Device Not Available', 'ok', {duration : 5000});
                } else if (error.error && error.error.error.includes('Reservations Overlapping. Check timings.')){
                    // this.snackBar.open('Reservation Overlapping With Other', 'Try again', {duration : 5000});
                    this.dialog.open(ReservationOverlappingComponent,{width: '500px', data: error.error.details})
                }else {
                    this.snackBar.open('Some Error Occurred', 'Try again', {duration : 5000});
                }
                this.close()
            });
        }
    }
}
