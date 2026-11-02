import {  switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataService } from './../../../../@core/services/data.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { transition, trigger, style, animate, state } from '@angular/animations';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ReservationService } from 'src/app/@core/services/reservation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TimeDifferencePipe } from 'src/app/@shared/pipes/time-diffrence.pipe';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import * as _ from 'lodash';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { ViewTargetComponent } from 'src/app/@shared/components/api-inventory-delete/view-target/view-target.component';
@Component({
    selector: 'app-view-reserved-devices',
    templateUrl: './view-device-detail.component.html',
    styleUrls: ['./view-device-detail.component.scss'],
    animations: [
        trigger('simpleFadeAnimation', [
            state('in', style({ opacity: 1 })),
            transition(':enter', [
                style({ opacity: 0 }),
                animate(300)
            ]),
            transition(':leave',
                animate(300, style({ opacity: 0 })))
        ])
    ]
})
export class ViewReservedDeviceDetailComponent implements OnInit, OnDestroy {
    sub2;
    selectedReservation;
    allDevices = [];
    reservedDevices = [];
    selectedDevice = null;
    public className = ['green-color', 'pink-color', 'orange-color', 'red-color']
    fromScreen: string = 'list';
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/reserve/view',
            label: 'Reservation List'
        },
        {
            link: '#/pages/reserve/reservation/view-device',
            label: 'View Device'
        },
    ]
    sub5: any;
    sub6: any;
    source: any;
    selectedTeam: String;
    sub3: any;
    sub4: any;
    testbedData: any;
    allTestCases: any[] = [];
    allTestSuites: any[] = [];
    constructor(private dataService: DataService, private router: Router, private dialog: MatDialog,
       
        private reservationService: ReservationService,
        private snackBar: MatSnackBar,
       
        private dInventoryService: DeviceInventoryService,
        private testbedService: TestBedService
        ) { }
 
    ngOnInit(): void {
        if (history.state && history.state.fromScreen) {
            this.fromScreen = history.state.fromScreen;
        }
        
        this.dataService.getTestCases().subscribe(testCases => {
            if (testCases) {
                this.allTestCases = testCases;
            } 
        });
        
        this.dataService.getTestSuites().subscribe(testSuites => {
            if (testSuites) {
                this.allTestSuites = testSuites;
            } 
        });

        this.sub2 = this.dataService.selectedReservation
            .pipe(
                switchMap(data => {
                    return this.dataService.getAllDevices().pipe(
                        map(devices => {
                            return { devices: devices, reservation: data };
                        })
                    );
                }),
                switchMap(dataa => {
                    return this.dataService.selectedTeam.pipe(
                        map(team => {
                            this.selectedTeam = team;
                            return { ...dataa, team };
                        })
                    );
                })
            ).subscribe(data => {
                if(data.reservation){
                    this.selectedReservation = data.reservation;
                    this.allDevices = data.devices;
                    this.getDevicesOfReservation()
                    if(this.selectedReservation.reservationType==='REGRESSION'){
                        this.getTestCasesOfReservation();
                    }
                }else  if (data.team){
                    this.router.navigateByUrl('/reserve/view')
                }
            })
    }

    getDevicesOfReservation() {
        this.reservedDevices = this.allDevices.filter(device => {
                return this.selectedReservation.deviceIds.indexOf(device._id) > -1
        });
    }

    getTestCasesOfReservation() {
        if (this.selectedReservation) {
            this.reservationService.getTestCasesOfReservation(this.selectedReservation._id).subscribe(
                (data: any) => {
                    this.selectedReservation['jobDetails'] = data.data[0].jobData.job;
                }
            );
        }
    }

    showTestCaseDetails() {
        const testbedData = [];
        const testcaseDetails = [];
        const testsuiteDetails = [];

        this.selectedReservation.jobDetails.forEach(jobDetail => {
            const testbedName = jobDetail.testBedName;
            const testCases = jobDetail.onExecution || [];
            testbedData.push({
                testbedName: testbedName,
                testCases: testCases
            });
            testCases.forEach(tc => {
                let testCaseName;
                let testSuiteName;
                if (tc.tcName) {
                    testCaseName = tc.tcName;
                } else if (tc.tcId) {
                    const testCaseObj = this.allTestCases.find(t => t._id === tc.tcId);
                    testCaseName = testCaseObj?.testCaseName || testCaseObj?.tcName || tc.tcId;
                }

                const testSuiteObj = this.allTestSuites.find(s => s._id === (tc.testSuiteId || tc.suiteId));
                testSuiteName = testSuiteObj.testSuiteName;

                testcaseDetails.push({
                    testbedName: testbedName,
                    testSuiteName: testSuiteName,
                    testCaseName: testCaseName
                });
            });

            const uniqueSuiteNames = [...new Set(testCases.map(tc =>
                tc.testSuiteName || this.allTestSuites.find(s => s._id === (tc.testSuiteId || tc.suiteId))?.testSuiteName
            ))];

            uniqueSuiteNames.forEach(suiteName => {
                if (suiteName) {
                    testsuiteDetails.push({
                        testbedName: testbedName,
                        testSuiteName: suiteName
                    });
                }
            });
        });

        this.dialog.open(ViewTargetComponent, {
            data: {
                targetName: "TestSuite Details",
                testbedData: testbedData,
                testcaseDetails: testcaseDetails,
                testsuiteDetails: testsuiteDetails,
                isTestbedView: true
            },
            width: '900px',
            autoFocus: false,
            panelClass: 'app-full-bleed-dialog'
        });
    }

    ngOnDestroy(){
       if(this.sub2){
        this.sub2.unsubscribe()
    }
    }


    cancelReservationConfirmation() {
        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            data: {
                name: 'Reservation',
                text:
                    "This will cancel all schedules and release devices associated with this. This action can't be reversed. Are you sure you want to proceed?",
                action: 'Cancel'
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub5=dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
               this.cancelReservation();
            }
        });
    }

    cancelReservation() {
        this.dataService.loading.next(true);
        if (this.selectedReservation.reservationType === 'REGRESSION') {
            this.sub6=this.reservationService.cancelScheduledRegression( this.selectedReservation._id).subscribe(
                (data: any) => {
                    this.dataService.loading.next(false);
                    if (data.length >= 0) {
                        this.snackBar.open('Reservation Cancelled Successfully', 'OK', {
                            duration: 5000
                        });
                    
                        const reservationData = _.find(data, { _id: this.selectedReservation._id })                                          
                            let tbname=[]
                            this.testbedService.getTestBed().subscribe(data => {
                                this.dataService.getTestBedData().next(data);
                                this.dataService.getTestBed().subscribe(tb => {
                                   
                                    if (tb) {
                                        this.testbedData = _.cloneDeep(tb);
                                    }
                                });
                            });
                            reservationData['tbName']=tbname
                            this.dataService.selectedReservation.next(reservationData);
                        this.router.navigateByUrl('/pages/reserve/reservation/view-device');
                                      
                       
                      //window.location.reload();
                    }
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Reservation Cancellation Failed', 'Try Again', {
                        duration: 5000
                    });
                }

            );
        } else {
            this.sub6=this.reservationService.cancelReservation(this.selectedReservation._id).subscribe(
                (data: any) => {
                    this.dataService.loading.next(false);
                 
                    if (data.length >= 0) {
                        this.snackBar.open('Reservation Cancelled Successfully', 'OK', {
                            duration: 5000
                        });
                       
                        const reservationData = _.find(data, { _id: this.selectedReservation._id });
                        this.dataService.selectedReservation.next(reservationData);
                        this.reservedDevices.forEach((device) => {
                            device.available = true;
                          });
                        this.sub4 = this.dInventoryService
                            .getAllData()
                            .subscribe((data) => {
                                if (data) {
                                    this.dataService.getDeviceInventoryData().next(data);
                                }
                            });
                        if (this.selectedReservation.reservationType === 'TESTBED') {
                            let tbname = []
                            this.testbedService.getTestBed().subscribe(data => {
                                this.dataService.getTestBedData().next(data);
                                this.dataService.getTestBed().subscribe(tb => {

                                    if (tb) {
                                        this.testbedData = _.cloneDeep(tb);
                                    }
                                });
                            });
                            reservationData['tbName'] = tbname;
                        }
                        this.router.navigateByUrl('/pages/reserve/reservation/view-device');
                                      
                    }
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Reservation Cancellation Failed', 'Try Again', {
                        duration: 5000
                    });
                }
            );
        }
    }

}
