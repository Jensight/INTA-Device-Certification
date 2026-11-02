import { ConfirmationDiaogComponent } from './../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ReservationService } from './../../../@core/services/reservation.service';
import { DeviceInventoryService } from './../../../@core/services/device-inventory.service';
import { ReserveDeviceDialogComponent } from './reserve-devices/reserve-devices.component';
import * as _ from 'lodash';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from './../../../@core/services/data.service';
import { Component, OnInit, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { transition, trigger, style, animate, state } from '@angular/animations';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';


@Component({
    selector: 'app-reserve-device',
    templateUrl: './device.component.html',
    styleUrls: ['./device.component.scss'],
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
export class ReserveDeviceComponent implements OnInit, OnDestroy {
    @ViewChildren('vendorBox') vendorBox: QueryList<MatCheckbox>;
    @ViewChildren('modelBox') modelBox: QueryList<MatCheckbox>;
    private deviceSubscription;
    private modelSubscription;
    private vendorSubscription;
    public allDevices = []
    public allDevicesDuplicate = [];
    public allModels;
    public allVendors;
    public vendorSearch = '';
    public modelSearch = '';
    public className = ['green-color', 'pink-color', 'orange-color', 'red-color']
    public selectedVendors = [];
    public selectedModels = [];
    public deviceSearchValue = '';
    public deviceSearchPipe = '';
    public onlyAvailable = false;
    public deviceSearch = new BehaviorSubject('');
    public selectedDevice;
    public selectedDevices = [];
    public selectedTeam;
    reservedDeviceCount = 0;
    sub6;
    sub7;
    sub8;
    sub9;
    sub10;
    sub11;
    sub12;

    constructor(
        public dataService: DataService,
        private dialog: MatDialog,
        private dInventoryService: DeviceInventoryService,
        private reservationService: ReservationService,
        private snackBar: MatSnackBar
    ) {

        this.sub7=this.dataService.selectedTeam.subscribe(team => {
                if (team) {
                    this.getAllData();
                }
            });


        this.modelSubscription = this.dataService.getAllModels().subscribe(model => {
            if (model) {
                this.allModels = model;
            }
        });

        this.vendorSubscription = this.dataService.getAllVendors().subscribe(vendor => {
            if (vendor) {
                this.allVendors = vendor;
            }
        })
    }

    getAllData() {
         this.sub8=this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getDeviceInventoryData().next(data);
                this.deviceSubscription = this.dataService.getAllDevices().subscribe(devices => {
                if (devices) {
                    this.allDevices = _.cloneDeep(devices);
                    const temp =  _.cloneDeep(devices);
                    this.allDevicesDuplicate = temp;
                    this.findReservedDeviceCount()
                }
            });
            }
        });
    }

    ngOnInit() {
        
        this.sub9=this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        })
        this.sub10=this.deviceSearch.pipe(debounceTime(300)).subscribe(data => {
            this.deviceSearchPipe = data;
        })
    }

    ngOnDestroy() {
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
        }
        if (this. modelSubscription) {
            this. modelSubscription.unsubscribe();
        }
        
        if (this. vendorSubscription) {
            this. vendorSubscription.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
        if (this.sub9) {
            this.sub9.unsubscribe();
        }
        if (this.sub10) {
            this.sub10.unsubscribe();
        }
        if (this.sub11) {
            this.sub11.unsubscribe();
        }
        if (this.sub12) {
            this.sub12.unsubscribe();
        }
    }

    addVendor(vendor) {
        this.selectedVendors = [...this.selectedVendors, vendor]
    }

    removeVendor(vendor) {
        const vendorIndex = this.selectedVendors.indexOf(vendor);
        if (vendorIndex > -1) {
            this.selectedVendors.splice(vendorIndex, 1)
        }
        this.selectedVendors = [...this.selectedVendors]
    }

    addModel(model) {
        this.selectedModels = [... this.selectedModels, model]
    }

    removeModel(model) {
        const modelIndex = this.selectedModels.indexOf(model);
        if (modelIndex > -1) {
            this.selectedModels.splice(modelIndex, 1)
        }
        this.selectedModels = [... this.selectedModels]
    }

    checkModel(event, model) {
        if (event.checked) {
            this.addModel(model)
        } else {
            this.removeModel(model)
        }
    }

    checkVendor(event, vendor) {
        if (event.checked) {
            this.addVendor(vendor)
        } else {
            this.removeVendor(vendor)
        }

    }

    clearVendors() {
        this.selectedVendors = []
        this.vendorBox.forEach(check => {
            check.checked = false;
        })
    }

    clearModels() {
        this.selectedModels = [];
        this.modelBox.forEach(check => {
            check.checked = false;
        })
    }

    clearAllFilters() {
        this.selectedModels = [];
        this.selectedVendors = [];
        this.deviceSearch.next('');
        this.deviceSearchValue = '';
        this.vendorSearch = '';
        this.modelSearch = '';
        this.onlyAvailable = false;
    }

    addDevice(event) {
        if (event.dragData && event.dragData.from === 'source') {
            this.selectedDevices.push(event.dragData.data);
            _.remove(this.allDevicesDuplicate, { _id: event.dragData.data._id });
            this.reservedDeviceCount = this.allDevicesDuplicate.filter(device => device.available === false).length;
        }
    }

    removeDevice(event) {
        if (event.dragData && event.dragData.from === 'destination') {
            this.allDevicesDuplicate.push(event.dragData.data);
            _.remove(this.selectedDevices, { _id: event.dragData.data._id });
            this.reservedDeviceCount = this.allDevicesDuplicate.filter(device => device.available === false).length;
        }
    }


    reserveDevices() {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.panelClass = 'custom-dialog-container';
        const dialogRef = this.dialog.open(ReserveDeviceDialogComponent, { data: { selectedDevices: this.selectedDevices, selectedTeam: this.selectedTeam }, minHeight: 350, minWidth: 500 });
        this.sub12=dialogRef.componentInstance.success.subscribe(data => {
            if(data){
                this.selectedDevices = [];
            }
        });
    }

    findReservedDeviceCount() {
            this.reservedDeviceCount = this.allDevicesDuplicate.filter(device => device.available === false).length;
    }

    selectReserved(){
        const reservedDevices = this.allDevicesDuplicate.filter(device => device.available === false);
        const reservedDeviceIds = reservedDevices.map(dev => dev._id);
        this.selectedDevices = [ ...this.selectedDevices, ... reservedDevices];
        _.remove(this.allDevicesDuplicate,(device) => reservedDeviceIds.indexOf(device._id) > -1);
        this.reservedDeviceCount = this.allDevicesDuplicate.filter(device => device.available === false).length;
    }

    getUnavailableCount(){
        return this.selectedDevices.filter(a => {
            return a.available === false;
        }).length;
    }



    releaseConfirmation() {
        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            data: {
                name: 'Device',
                text:
                    'Releasing will unblock selected device immediately.' + "This action can't be reversed. Are you want to Proceed?",
                action: 'Release'
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub6 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.unreserveDevice();
            }
        });
    }

    unreserveDevice() {
        const devicesToBeUnreserved = this.selectedDevices.filter(a => {
            return a.available === false;
        });
        const deviceIds = devicesToBeUnreserved.map(d => d._id);
        this.sub11=this.reservationService.releaseDevices( {deviceIds}).subscribe(data => {
           if(data){
               this.dataService.getDeviceInventoryData().next(data);
               this.snackBar.open('Device Released Successfully', 'OK',{ duration:5000})
               this.selectedDevices = [];
           }else {
            this.snackBar.open('Failed Releasing Device', 'Try again',{ duration:5000})
           }
        }, err => {
            this.snackBar.open('Failed Releasing Device', 'Try again',{ duration:5000})
        });
    }
    drop(event: CdkDragDrop<any[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
    }


}
