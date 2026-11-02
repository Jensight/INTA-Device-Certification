import { ReserveTestbedDialogComponent } from './reserve-testbed/reserve-testbed.component';
import { TestBedService } from './../../../@core/services/test-bed.service';
import { DeviceInventoryService } from './../../../@core/services/device-inventory.service';
// import { ReserveDeviceDialogComponent } from './reserve-devices/reserve-devices.component';
import * as _ from 'lodash';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { debounceTime, distinctUntilChanged, mergeMap, switchMap, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from './../../../@core/services/data.service';
import { Component, OnInit } from '@angular/core';
import { transition, trigger, style, animate, state } from '@angular/animations';

@Component({
    selector: 'app-reserve-testbed',
    templateUrl: './testbed.component.html',
    styleUrls: ['./testbed.component.scss'],
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
export class ReserveTestbedComponent implements OnInit {
    private testBedSubscription;
    public allTestbed = [];
    public allTestbedDuplicate = [];
    public className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    public testbedSearchValue = '';
    public testbedSearchPipe = '';
    public onlyAvailable = false;
    public yAvailable = false;
    public testbedSearch = new BehaviorSubject('');
    public selectedTestbed;
    public selectedTestbeds = [];
    public selectedTeam;
    public allDevices;
    public allNodes;
    public allVariables;
    public testbedAllData;
    public reservedTestbedCount = 0;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;
    constructor(
        private dataService: DataService,
        private dialog: MatDialog,
        private testbedService: TestBedService,
        private deviceInventoryService: DeviceInventoryService


    ) {

        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
                if (team) {
                    this.getAllData(team);
                }
            });

        this.sub2 = this.dataService.getAllDevices().subscribe(device => {
                if (device) {
                    this.allDevices = device;
                }
            });

        this.sub3 = this.dataService.getNodes().subscribe(nodes => {
                if (nodes){
                    this.allNodes = nodes;
                }
            });
        this.sub4 = this.dataService.getTestbedVariables().subscribe(vb => {
                if (vb){
                    this.allVariables = vb;
                }
            });
    }

    getAllData(team: any): any {
        this.sub5 = this.deviceInventoryService.getAllData().pipe(
           mergeMap((deviceData) => {
                if (deviceData){
                    this.dataService.getDeviceInventoryData().next(deviceData);
                }
                return this.testbedService.getTestBed();
           })
        ).subscribe(data => {
            this.dataService.getTestBedData().next(data);
            this.testBedSubscription = this.dataService
            .getTestBed()
            .subscribe(tb => {
                if (tb) {
                    this.allTestbed = _.cloneDeep(tb);
                    this.loadTestbedData();
                }
            });
        });
    }

    ngOnInit() {
        this.sub6; this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub7 = this.testbedSearch.pipe(debounceTime(300)).subscribe(data => {
            this.testbedSearchPipe = data;
        });
    }

    loadTestbedData() {

        this.allTestbed.forEach(data => {
             data.nodes.forEach(element => {
                 element.device =  _.find(this.allDevices, {_id: element.deviceId});
            });
        });
        const temp =  _.cloneDeep(this.allTestbed);
        this.allTestbedDuplicate = temp;
        this.getReservedTestbedCount();
    }

    ngOnDestroy() {
        if (this.testBedSubscription) {
            this.testBedSubscription.unsubscribe();
        }
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
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }

    }

    clearAllFilters() {
        this.testbedSearch.next('');
        this.testbedSearchValue = '';
        this.onlyAvailable = false;
    }

    addDevice(event) {
        if (event.dragData && event.dragData.from === 'source') {
            this.selectedTestbeds.push(event.dragData.data);
            _.remove(this.allTestbedDuplicate, { _id: event.dragData.data._id });
            this.allTestbedDuplicate = [...this.allTestbedDuplicate];
            this.reservedTestbedCount = this.allTestbedDuplicate.filter(tb => tb.available === false).length;
        }
    }

    removeDevice(event) {
        if (event.dragData && event.dragData.from === 'destination') {
            this.allTestbedDuplicate.push(event.dragData.data);
            _.remove(this.selectedTestbeds, { _id: event.dragData.data._id });
            this.allTestbedDuplicate = [...this.allTestbedDuplicate];
            this.reservedTestbedCount = this.allTestbedDuplicate.filter(tb => tb.available === false).length;
        }
    }


    reserveDevices() {
        const dialogRef = this.dialog.open(ReserveTestbedDialogComponent, { data: { testbedIds: this.selectedTestbeds, selectedTeam: this.selectedTeam }, minHeight: 350, minWidth: 500 });
        this.sub8 = dialogRef.componentInstance.success.subscribe(data => {
            if (data){
                this.selectedTestbeds = [];
            }
        });
    }

    getReservedTestbedCount(){
        this.reservedTestbedCount = this.allTestbedDuplicate.filter(tb => tb.available === false).length;
    }

    selectReservedTestbed(){
        const reservedTestbeds = this.allTestbedDuplicate.filter(device => device.available === false);
        const reservedTestbedsIds = reservedTestbeds.map(dev => dev._id);
        this.selectedTestbeds = [ ...this.selectedTestbeds, ... reservedTestbeds];
        _.remove(this.allTestbedDuplicate, (tb) => reservedTestbedsIds.indexOf(tb._id) > -1);
        this.allTestbedDuplicate = [...this.allTestbedDuplicate];
        this.reservedTestbedCount = this.allTestbedDuplicate.filter(tb => tb.available === false).length;
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
