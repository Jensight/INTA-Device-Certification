import { UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from './../../../../@core/services/data.service';
import { UntypedFormGroup } from '@angular/forms';
import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { ReservationService } from '../../../../@core/services/reservation.service';

@Component({
    selector: 'app-scheduled-regression-edit',
    templateUrl: './edit-scheduled-regression.component.html',
    styleUrls: ['./edit-scheduled-regression.component.scss']
})
export class EditScheduledRegressionComponent implements OnInit {
    selectedTestbedIds = [];
    maxtime:any = 0;
    checkFlag = false;
    testbedAvailable = false;
    reservationForm: UntypedFormGroup;
    allReservationName = [];
    formSubmitted = false;
    date = new Date(new Date().getTime() + 2 * 60000);
    testbedName = 'Testbed';
    loadingText = `Checking ${this.testbedName} availibility.Wait a moment !!`;
    @ViewChild('check') check: ElementRef;
    @ViewChild('path') path: ElementRef;
    @ViewChild('cross') cross: ElementRef;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    constructor(
        private reservationService: ReservationService,
        private dataService: DataService,
        public dialogRef: MatDialogRef<EditScheduledRegressionComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        this.maxtime = new Date(this.data['reservation']['releaseAt']).getTime() - new Date(this.data['reservation']['reserveTime']).getTime()
    }

    ngOnInit(): void {
        this.selectedTestbedIds = this.data['reservation']['testbedIds'];
        if (this.selectedTestbedIds.length > 1) {
            this.testbedName = 'Testbeds';
        }
        this.reservationForm = new UntypedFormGroup({
            _id: new UntypedFormControl(null),
            type: new UntypedFormControl('once', Validators.required),
            reservationName: new UntypedFormControl(null, Validators.required),
            users: new UntypedFormControl([this.dataService.getCurrentUser()], Validators.required),
            reserveAt: new UntypedFormControl('later', Validators.required),
            releaseAt: new UntypedFormControl(),
            reserveTime: new UntypedFormControl(),
            testbedIds: new UntypedFormControl(this.selectedTestbedIds)
        });
        this.reservationForm.patchValue(this.data.reservation);

        this.sub1=this.reservationService.getAllReservationName().subscribe((data: any) => {
            if (data) {
                this.allReservationName = data;
            }
        });

        this.sub2=this.reservationForm.get('reserveAt').valueChanges.subscribe(value => {
            if (value === 'now') {
                this.reservationForm.get('reserveTime').clearValidators();
                this.reservationForm.get('reserveTime').setValue(new Date());
            } else if (value === 'later') {
                this.reservationForm.get('reserveTime').setValidators(Validators.required);
            }
        });

        this.sub3=this.reservationForm.get('reservationName').valueChanges.subscribe(value => {
            if (this.allReservationName.indexOf(value) !== -1) {
                this.reservationForm.get('reservationName').setErrors({ duplicate: true });
            } else if (this.reservationForm.get('reservationName').hasError('required')) {
                this.reservationForm.get('reservationName').setErrors(null);
                this.reservationForm.get('reservationName').setErrors({ required: true });
            } else {
                this.reservationForm.get('reservationName').setErrors(null);
            }
        });

        this.sub4=this.reservationForm.get('reserveTime').valueChanges.subscribe(time => {
            this.checkFlag = false;
            this.testbedAvailable = false;
            this.loadingText = `Checking  ${this.testbedName}  availibility.Wait a moment !!`;
            this.loadingText = `${this.testbedName}  available on selected time.`;
            const d = new Date(time.getTime() + this.maxtime);
            this.reservationForm.get('releaseAt').setValue(d);
        });
    }

    checkAvailibility() {
        this.checkFlag = true;
        this.sub5=this.reservationService
            .checkTestbedAvailability( {
                ...this.reservationForm.value,
                loggedInUser: this.dataService.getCurrentUser()
            })
            .subscribe(
                data => {
                    if (data) {
                        this.setSuccess();
                        this.testbedAvailable = true;
                        this.loadingText = `${this.testbedName} available on selected time.`;
                    }
                },
                err => {
                    this.setFail();
                    this.testbedAvailable = false;
                    if (err.error.error.includes('Reservations Overlapping')) {
                        const date = new Date(err.error.details.nextPossibleReservation);
                        this.loadingText = ` ${
                            this.testbedName
                        } Unavailable. Next Available at ${date.toLocaleString()}`;
                    } else {
                        this.loadingText = 'Reservation Failed. Try Again';
                    }
                }
            );
    }

    close() {
        this.dialogRef.close();
    }

    reserveDevices() {
        this.formSubmitted = true;
        this.sub6=this.reservationService
            .updateScheduledReservation(this.reservationForm.value)
            .subscribe(
                (data: any) => {
                    if (data) {
                        this.snackBar.open('Reservation Updated Successfully', 'OK', {
                            duration: 5000
                        });
                        this.dataService.allReservation.next(data)
                    } else {
                        this.snackBar.open('Failed Updating Reservation', 'Try Again', {
                            duration: 5000
                        });
                    }
                    this.dialogRef.close();
                },
                err => {
                    console.log(err);
                    this.snackBar.open('Failed Updating Reservation', 'Try Again', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            );
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
    }
    setSuccess() {
        this.check.nativeElement.classList.remove('danger');
        this.path.nativeElement.classList.remove('danger');
        this.check.nativeElement.classList.add('check-complete');
        this.path.nativeElement.classList.add('path-complete');
        this.check.nativeElement.classList.add('success');
        this.path.nativeElement.classList.add('success');
    }

    setFail() {
        this.check.nativeElement.classList.remove('check-complete');
        this.check.nativeElement.classList.remove('success');
        this.cross.nativeElement.classList.remove('success');
        this.path.nativeElement.classList.remove('success');
        this.cross.nativeElement.classList.add('cross-complete');
        this.path.nativeElement.classList.add('path-complete');
        this.cross.nativeElement.classList.add('danger');
        this.path.nativeElement.classList.add('danger');
    }

    reset() {
        this.check.nativeElement.classList.remove('check-complete');
        this.check.nativeElement.classList.remove('success');
        this.check.nativeElement.classList.remove('danger');
        this.path.nativeElement.classList.remove('check-complete');
        this.path.nativeElement.classList.remove('success');
        this.path.nativeElement.classList.remove('danger');
        this.cross.nativeElement.classList.remove('check-complete');
        this.cross.nativeElement.classList.remove('success');
        this.cross.nativeElement.classList.remove('danger');
    }
}
