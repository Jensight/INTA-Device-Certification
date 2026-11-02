import { EditScheduledRegressionComponent } from './edit-scheduled-regressions/edit-scheduled-regression.component';
import { TimeDifferencePipe } from './../../../@shared/pipes/time-diffrence.pipe';
import { Router } from '@angular/router';
import { ConfirmationDiaogComponent } from './../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { EditReservationComponent } from './edit-reservations/edit-reservation.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import * as _ from 'lodash';
import { DataService } from './../../../@core/services/data.service';
import { ReservationService } from './../../../@core/services/reservation.service';
import { Component, OnInit } from '@angular/core';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { APINameDisplayComponent } from '../../../@shared/components/api-name-display/api-name-display.component';
import { ReservationNameDisplayComponent } from '../../../@shared/components/reservation-name-display/reservation-name-display.component';
import { TestBedService } from './../../../@core/services/test-bed.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DeviceInventoryService } from './../../../@core/services/device-inventory.service';
import { ViewTargetComponent } from '../../../@shared/components/api-inventory-delete/view-target/view-target.component';
import { ReservationTypeDisplayComponent } from '../../../@shared/components/reservation-type-display/reservation-type-display.component';

@Component({
    selector: 'app-reserve-view',
    templateUrl: './view-reservations.component.html',
    styleUrls: ['./view-reservations.component.scss'],
    providers: [TimeDifferencePipe]
})
export class ViewReservationsComponent implements OnInit {
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/reserve/view',
            label: 'Reservation List'
        }
    ];
    public selectedTeam;
    selectedTestbeds = []
    testbedData = []
    source: LocalDataSource = new LocalDataSource();
    allReservations = [];
    //testbedReservations = [];
    //deviceReservations = [];
    //regressionSchedules = [];
    //filterType = 'all';
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;
    userList;
    allUsers: any;
    allUserNames = [];
    toggleValue: boolean = true;
    activeReservations = [];
    searchValue = "";
    devicesSub;
    deviceNames = [];
    searchFormControl = new FormControl('');
    filteredDevices: Observable<string[]>;
    allTestCases: any[] = [];
    allTestSuites: any[] = [];
    public settings = {
        attr: {
            class: 'text-center'
        },
        rowClassFunction: row => {
            if (!row.data.active || row.data.reservedUser !== this.dataService.getCurrentUser().username) {
                return 'disable-actions';
            } else {
                return '';
            }
        },
        noDataMessage: 'No Reservations Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            position: 'right'
        },
        edit: {
            editButtonContent: '<i title="Edit" class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i title="Cancel" class="fa fa-times"></i>',
            confirmDelete: true
        },
        columns: {
            reservationName: {
                title: 'Reservation Name',
                class: 'text-center',
                type: 'custom',
                // width: '330px',
                renderComponent: ReservationNameDisplayComponent,
                componentInitFunction: (instance: ReservationNameDisplayComponent, cell: Cell) => {
                    ReservationNameDisplayComponent.componentInit(instance, cell, '30', this.testbedData);
                },
                valuePrepareFunction: data => {
                  
                    return data;
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    if (a.toLowerCase().localeCompare(b.toLowerCase())<0) {
                        return -1 * direction;
                    }
                    if (a.toLowerCase().localeCompare(b.toLowerCase())>0) {
                       
                        return direction;
                    }
                    return 0;
                }
            },
            reservationType: {
                title: 'Reservation Type',
                class: 'text-center',
                type: 'custom',
                width: '158px',
                renderComponent: ReservationTypeDisplayComponent,
                componentInitFunction: (instance: ReservationTypeDisplayComponent, cell: Cell) => {
                    ReservationTypeDisplayComponent.componentInit(instance, cell, (row) => this.showRegressionDetails(row));
                }
            },
            users: {
                title: 'Users',
                class: 'text-center',
                type: 'custom',
                filter: {
                    type: 'list',
                    config: {
                        selectText: 'Select',
                        list: [

                        ],
                    },
                },
                renderComponent: APINameDisplayComponent,
                componentInitFunction: (instance: APINameDisplayComponent, cell: Cell) => {
                    APINameDisplayComponent.componentInit(instance, cell, 12);
                },
                valuePrepareFunction: data => {
                   
                    return data;
                },
                // compareFunction: (direction: any, temp1: any, temp2: any) => {
                //     var a = temp1;
                //     var b = temp2;
                //     if (a[0].localeCompare(b[0])<0) {
                //         return -1 * direction;
                //     }
                //     if (a[0].localeCompare(b[0])>0) {
                       
                //         return direction;
                //     }
                //     return 0;
                // }
          
            },
            reserveTime: {
                title: 'Start Time',
                class: 'text-center',
                type: 'custom',
                sortDirection: 'desc',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 15);
                },
                valuePrepareFunction: data => {
                    return new Date(data).toDateString() + ' - ' + new Date(data).toLocaleTimeString();
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(temp)
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            releaseAt: {
                title: 'End Time',
                class: 'text-center',
                type: 'custom',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 15);
                },
                valuePrepareFunction: data => {
                    return new Date(data).toDateString() + ' - ' + new Date(data).toLocaleTimeString();
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(temp)
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            duration: {
                title: 'Duration',
                class: 'text-center',
                type: 'string',
                valuePrepareFunction: data => {
                    return this.timeDifference.transform(Math.ceil(data));
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(this.timeDifference.transform(cell))
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    const a = Math.ceil(temp1);
                    const b = Math.ceil(temp2);
                    if (a < b) {
                        return -1 * direction;
                    }
                    if (a > b) {
                        return direction;
                    }
                    return 0;
                }
            }
        }
    };
    public settings2 = {
        attr: {
            class: 'text-center'
        },
        actions: false,
        noDataMessage: 'No Reservations Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        edit: {
            editButtonContent: '<i title="Edit" class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i title="Cancel" class="fa fa-times"></i>',
            confirmDelete: true
        },
        columns: {
            reservationName: {
                title: 'Reservation Name',
                class: 'text-center',
                type: 'custom',
                // width: '330px',
                renderComponent: ReservationNameDisplayComponent,
                componentInitFunction: (instance: ReservationNameDisplayComponent, cell: Cell) => {
                    ReservationNameDisplayComponent.componentInit(instance, cell, '30', this.testbedData);
                },
                valuePrepareFunction: data => {
                    return data;
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1 || '';
                    var b = temp2 || '';
                    if (a.toLowerCase().localeCompare(b.toLowerCase())<0) {
                        return -1 * direction;
                    }
                    if (a.toLowerCase().localeCompare(b.toLowerCase())>0) {
                       
                        return direction;
                    }
                    return 0;
                }
            },
            reservationType: {
                title: 'Reservation Type',
                class: 'text-center',
                type: 'custom',
                width: '158px',
                renderComponent: ReservationTypeDisplayComponent,
                componentInitFunction: (instance: ReservationTypeDisplayComponent, cell: Cell) => {
                    ReservationTypeDisplayComponent.componentInit(instance, cell, (row) => this.showRegressionDetails(row));
                }
            },
            users: {
                title: 'Users',
                class: 'text-center',
                type: 'custom',
                filter: {
                    type: 'list',
                    config: {
                        selectText: 'Select',
                        list: [

                        ],
                    },
                },
                renderComponent: APINameDisplayComponent,
                componentInitFunction: (instance: APINameDisplayComponent, cell: Cell) => {
                    APINameDisplayComponent.componentInit(instance, cell, 12);
                },
                valuePrepareFunction: data => {
                   
                    return data;
                },
                // compareFunction: (direction: any, temp1: any, temp2: any) => {
                //     var a = temp1;
                //     var b = temp2;
                //     if (a[0].localeCompare(b[0])<0) {
                //         return -1 * direction;
                //     }
                //     if (a[0].localeCompare(b[0])>0) {
                       
                //         return direction;
                //     }
                //     return 0;
                // }
          
            },
            reserveTime: {
                title: 'Start Time',
                class: 'text-center',
                type: 'custom',
                sortDirection: 'desc',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 15);
                },
                valuePrepareFunction: data => {
                    return new Date(data).toDateString() + ' - ' + new Date(data).toLocaleTimeString();
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(temp)
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            releaseAt: {
                title: 'End Time',
                class: 'text-center',
                type: 'custom',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 15);
                },
                valuePrepareFunction: data => {
                    return new Date(data).toDateString() + ' - ' + new Date(data).toLocaleTimeString();
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(temp)
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            duration: {
                title: 'Duration',
                class: 'text-center',
                type: 'string',
                valuePrepareFunction: data => {
                    return this.timeDifference.transform(Math.ceil(data));
                },
                filterFunction: (cell, search) => {
                    let temp = new Date(cell).toDateString() + ' - ' + new Date(cell).toLocaleTimeString();
                    if (
                        String(this.timeDifference.transform(cell))
                            .toLowerCase()
                            .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    const a = Math.ceil(temp1);
                    const b = Math.ceil(temp2);
                    if (a < b) {
                        return -1 * direction;
                    }
                    if (a > b) {
                        return direction;
                    }
                    return 0;
                }
            },
            status: {
                title: 'Status'
            }
        }
    };
    constructor(
        private dataService: DataService,
        private reservationService: ReservationService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        private timeDifference: TimeDifferencePipe,
        private testbedService: TestBedService,
        private dInventoryService: DeviceInventoryService
    ) {

    }

    ngOnInit(): void {
        this.dataService.getTestCases().subscribe(tc => { if (tc) { this.allTestCases = tc; } });
        this.dataService.getTestSuites().subscribe(ts => { if (ts) { this.allTestSuites = ts; } });
        this.sub1=this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.getAllData(team);
                this.selectedTeam = team;
                this.sub7 = this.dataService.getSettingsData().subscribe(data => {
                    if (data) {
                        console.log("data>>>>", data);
                        this.allUsers = data.users;
                        this.allUsers.forEach(element => {
                            this.allUserNames.push(element.username);
                        });
                        //this.allUserNames.sort();
                        this.allUserNames = this.allUserNames.map(name => name.toString());
                        this.allUserNames.sort((a, b) => {
                            if (a.toLowerCase() > b.toLowerCase()) {
                                return 1;

                            }
                            if (a.toLowerCase() < b.toLowerCase()) {
                                return -1;

                            }

                            return 0;
                        });
                    }
                });

                console.log("userList>>>>", this.allUserNames);
                this.allUserNames = this.allUserNames.map(data => {
                    return { 'value': data, 'title': data }
                });
                this.settings.columns.users.filter.config.list = this.allUserNames;
                this.settings2.columns.users.filter.config.list = this.allUserNames;

                this.getAllReservations();
            }
        });

        this.testbedService.getTestBed().subscribe(data => {
            this.dataService.getTestBedData().next(data);
            this.dataService.getTestBed().subscribe(tb => {

                if (tb) {
                    this.testbedData = _.cloneDeep(tb);
                }
            });
        });
        this.devicesSub = this.dataService.getAllDevices().subscribe(devices => {
            if (devices) {
                this.deviceNames = devices.map(data => { return { id: data._id, deviceName: data.deviceName } });
            }
            this.filteredDevices = this.searchFormControl.valueChanges.pipe(
                startWith(''),
                map(value => this._filter(value || '')),
            );
        });
    }

    // Open TestSuite/TestCase details dialog
    showRegressionDetails(reservation: any) {
        // if (!reservation) return;
        const openDialog = (jobs: any[]) => {
            const Jobs = Array.isArray(jobs) ? jobs : [];
            const testcaseDetails: any[] = [];
            const suiteKeys = new Set<string>();
            const testbedData = Jobs.map(j => ({
                testbedName: j.testBedName || j.testbedName,
                testCases: j.onExecution || []
            }));
            Jobs.forEach(j => {
                const tb = j.testBedName || j.testbedName;
                (j.onExecution || []).forEach(tc => {
                    const tcObj = (!tc.tcName && tc.tcId) ? this.allTestCases.find(t => t._id === tc.tcId) : null;
                    const suiteObj = this.allTestSuites.find(s => s._id === (tc.testSuiteId || tc.suiteId));
                    const testCaseName = tc.tcName || tcObj?.testCaseName || tcObj?.tcName || tc.tcId;
                    const testSuiteName = tc.testSuiteName || suiteObj?.testSuiteName;
                    testcaseDetails.push({ testbedName: tb, testSuiteName, testCaseName });
                    if (tb && testSuiteName) suiteKeys.add(`${tb}||${testSuiteName}`);
                });
            });
            const testsuiteDetails = Array.from(suiteKeys).map(k => {
                const [testbedName, testSuiteName] = k.split('||');
                return { testbedName, testSuiteName };
            });
            this.dialog.open(ViewTargetComponent, {
                data: {
                    targetName: 'TestSuite Details',
                    testbedData,
                    testcaseDetails,
                    testsuiteDetails,
                    isTestbedView: true
                },
                width: '900px',
                autoFocus: false,
                panelClass: 'app-full-bleed-dialog'
            });
        };
        return Array.isArray(reservation.jobDetails)
            ? openDialog(reservation.jobDetails)
            : this.reservationService.getTestCasesOfReservation(reservation._id).subscribe((data: any) => {
                  const jobs = data.data?.[0].jobData.job || [];
                  reservation.jobDetails = jobs;
                  openDialog(jobs);
              });
    }

    getAllData(team) {
        this.sub8 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getDeviceInventoryData().next(data);
            }
        });
    }

    private _filter(value: string) {
        const filterValue = value.toLowerCase();
        return this.deviceNames.filter(option => option.deviceName.toLowerCase().includes(filterValue));
    }

    filterSearchResults(searchString: string) {
        if (searchString) {
            let temp;
            temp = this.deviceNames.filter(data => data.deviceName == searchString);
            if (temp && temp.length) {
                let filteredList = this.allReservations.filter(data => data?.deviceIds?.includes(temp[0].id));
                if (this.toggleValue) {
                    filteredList = this.activeReservations.filter(data => data?.deviceIds?.includes(temp[0].id));
                }
                this.source.load(filteredList);
            } else {
                this.source.load([]);
                //this.getAllReservations();
            }
        } else {
            this.getAllReservations();
        }
    }

    clearSearchField() {
        this.searchValue = '';
        this.getAllReservations();
    }

    getAllReservations() {
        this.dataService.loading.next(true);
        this.sub2 = this.reservationService.getAllReservations().subscribe((data: any) => {

            if (data) {
                this.dataService.allReservation.next(data)
            }
            this.dataService.loading.next(false);
        });

        this.sub3 = this.dataService.allReservation.subscribe((data: any) => {

            if (data) {
                const temp = data.map(reservation => {
                    const startTimeObj = new Date(reservation.reserveTime);
                    const endTimeObj = new Date(reservation.releaseAt);
                    //const duration: any = (endTimeObj.getTime() - startTimeObj.getTime()) / 1000;
                    const duration: any = Math.abs((endTimeObj.getTime() - startTimeObj.getTime()) / 1000);

                    return { ...reservation, duration };
                });
                //this.testbedReservations = temp.filter(r => r.reservationType === 'TESTBED');
                //this.deviceReservations = temp.filter(r => r.reservationType === 'DEVICES');
                //this.regressionSchedules = temp.filter(r => r.reservationType === 'REGRESSION');
                this.activeReservations = temp.filter(r => r.active === true);
                this.allReservations = temp;
                if (this.searchValue) {
                    this.filterSearchResults(this.searchValue);
                } else {
                    if (this.toggleValue === true) {
                        this.source.load(this.activeReservations);
                    } else {
                        this.source.load(this.allReservations);
                    }
                }
            }
        });
    }

    editResevation(event) {
        if (event.data.reservationType === 'REGRESSION') {
            const dialogRef = this.dialog.open(EditScheduledRegressionComponent, {
                data: { reservation: event.data, selectedTeam: this.selectedTeam },
                minHeight: 100,
                minWidth: 500
            });
        } else {
            const dialogRef = this.dialog.open(EditReservationComponent, {
                data: { reservation: event.data, selectedTeam: this.selectedTeam },
                minHeight: 450,
                minWidth: 500
            });
            this.sub4 = dialogRef.componentInstance.success.subscribe(data => {
                const temp = data.map(reservation => {
                    const startTimeObj = new Date(reservation.reserveTime);
                    const endTimeObj = new Date(reservation.releaseAt);
                    //const duration: any = (endTimeObj.getTime() - startTimeObj.getTime()) / 1000;
                    const duration: any = Math.abs((endTimeObj.getTime() - startTimeObj.getTime()) / 1000);

                    return { ...reservation, duration };
                });
                this.activeReservations = temp.filter(r => r.active === true);
                this.allReservations = temp;
                if (this.searchValue) {
                    this.filterSearchResults(this.searchValue);
                } else {
                    if (this.toggleValue === true) {
                        this.source.load(this.activeReservations);
                    } else {
                        this.source.load(this.allReservations);
                    }
                }
                this.source.refresh();
            });
        }
    }

    cancelReservationConfirmation(event) {
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
        this.sub5 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.cancelReservation(event);
            }
        });
    }

    cancelReservation(event) {
        this.dataService.loading.next(true);
        if (event.data.reservationType === 'REGRESSION') {
            this.sub6 = this.reservationService.cancelScheduledRegression(event.data._id).subscribe(
                (data: any) => {
                    this.dataService.loading.next(false);
                    if (data.length >= 0) {
                        this.snackBar.open('Reservation Cancelled Successfully', 'OK', {
                            duration: 5000
                        });
                        const temp = data.map(reservation => {
                            const startTimeObj = new Date(reservation.reserveTime);
                            const endTimeObj = new Date(reservation.releaseAt);
                            // const duration: any = (startTimeObj.getTime() - endTimeObj.getTime()) / 1000;
                            const duration: any = Math.abs((endTimeObj.getTime() - startTimeObj.getTime()) / 1000);
                            return { ...reservation, duration };
                        });
                        this.activeReservations = temp.filter(r => r.active === true);
                        this.allReservations = temp;
                        if (this.searchValue) {
                            this.filterSearchResults(this.searchValue);
                        } else {
                            if (this.toggleValue === true) {
                                this.source.load(this.activeReservations);
                            } else {
                                this.source.load(this.allReservations);
                            }
                        }
                        this.source.refresh();
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
            this.sub6 = this.reservationService.cancelReservation(event.data._id).subscribe(
                (data: any) => {
                    this.dataService.loading.next(false);
                    if (data.length >= 0) {
                        this.snackBar.open('Reservation Cancelled Successfully', 'OK', {
                            duration: 5000
                        });
                        const temp = data.map(reservation => {
                            const startTimeObj = new Date(reservation.reserveTime);
                            const endTimeObj = new Date(reservation.releaseAt);
                            // const duration: any = ( endTimeObj.getTime() - startTimeObj.getTime() ) / 1000;
                            const duration: any = Math.abs((endTimeObj.getTime() - startTimeObj.getTime()) / 1000);
                            return { ...reservation, duration };
                        });
                        this.activeReservations = temp.filter(r => r.active === true);
                        this.allReservations = temp;
                        if (this.searchValue) {
                            this.filterSearchResults(this.searchValue);
                        } else {
                            if (this.toggleValue === true) {
                                this.source.load(this.activeReservations);
                            } else {
                                this.source.load(this.allReservations);
                            }
                        }
                        this.source.refresh();
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

    rowClicked(event) {
        let tbname = []
        if (event.data) {
            if (event.data.reservationType == "TESTBED" || event.data.reservationType == "REGRESSION") {
                event.data.testbedIds.forEach((tbId: any) => {
                    this.testbedData.forEach((tb) => {
                        if (tb._id == tbId) {
                            tbname.push(tb.testBedName)
                        }
                    })
                })
                event.data['tbName'] = tbname
            }
            this.dataService.selectedReservation.next(event.data);
            this.router.navigateByUrl('/pages/reserve/reservation/view-device',{ state: { fromScreen: 'reserve'} });
        }
    }

    valueChange() {
        if (this.searchValue) {
            this.filterSearchResults(this.searchValue);
        } else {
            if (this.toggleValue === true) {
                this.source.load(this.activeReservations);
            } else {
                this.source.load(this.allReservations);
            }
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
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
        if (this.devicesSub) {
            this.devicesSub.unsubscribe();
        }
    }
}
