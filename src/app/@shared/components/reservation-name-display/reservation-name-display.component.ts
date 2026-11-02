import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { LimitToPipe } from '../../pipes/limit-to.pipe';
import { Router } from '@angular/router';
import { DataService } from '../../../@core/services/data.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-reservation-name-display',
    templateUrl: './reservation-name-display.component.html',
    styleUrls: ['./reservation-name-display.component.scss'],
    providers: [LimitToPipe]
})
export class ReservationNameDisplayComponent implements OnInit {
    renderValue: string;
    allTestCases: any[] = [];
    allTestSuites: any[] = [];

    @Input() value: any;
    @Input() rowData: any;
    @Input() numberLimit: any;
    @Input() testbedData: any;
    
    public tooltipValue;
    
    @Output() save: EventEmitter<any> = new EventEmitter();

    constructor(
        private limitTo: LimitToPipe,
        private router: Router,
        private dataService: DataService,
        private dialog: MatDialog
    ) {}

    static componentInit(instance: ReservationNameDisplayComponent, cell: Cell, numberLimit: any, testbedData: any) {
        const row = cell.getRow().getData();
        instance.rowData = row;
        instance.value = cell.getValue();
        instance.numberLimit = numberLimit;
        instance.testbedData = testbedData;
        instance.renderValue = instance.limitTo.transform(instance.value, instance.numberLimit);
        instance.tooltipValue = instance.value;
    }

    ngOnInit() {
        if (!this.renderValue) {
            this.renderValue = this.limitTo.transform(this.value, this.numberLimit);
            this.tooltipValue = this.value;
        }
    }

    redirectTo() {
        let tbname = [];
        if (this.rowData) {
            // Check if testbedIds exist, regardless of reservation type
            if (this.rowData.testbedIds && this.testbedData) {
                this.rowData.testbedIds.forEach((tbId: any) => {
                    this.testbedData.forEach((tb) => {
                        if (tb._id === tbId) {
                            tbname.push(tb.testBedName);
                        }
                    });
                });
                this.rowData['tbName'] = tbname;
            }
            this.dataService.selectedReservation.next(this.rowData);
            this.router.navigateByUrl('/pages/reserve/reservation/view-device', { state: { fromScreen: 'reserve' } });
        }
    }
}
