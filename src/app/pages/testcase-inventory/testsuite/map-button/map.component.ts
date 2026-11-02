import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';

import * as _ from 'lodash';
import { MapTestCaseComponent } from '../map-testcase/map-testcase.component';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { Router } from '@angular/router';
import { TableStateService } from 'src/app/@core/services/table-state.service';
@Component({
    selector: 'app-map-button',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapButtonComponent implements OnInit, OnDestroy {
    renderValue: string;

    @Input()
    value: string | number;
    @Input()
    rowData: any;
    @Input() source: any;
    public savedTableState: any;

    @Output()
    save: EventEmitter<any> = new EventEmitter();
    sub1;

    static componentInit(instance: MapButtonComponent, cell: Cell) {
        const row = cell.getRow().getData();
        instance.rowData = row;
        instance.save.subscribe(row => {
        console.log('Row', row);
        });
      }

    constructor(
        private modal: MatDialog,
        private testCaseInventoryService:TestCaseInventoryService,
        private router: Router,
        private tableStateService: TableStateService
    ) {}

    ngOnInit() {}

    onClick(event) {
        // let dialogRef = this.modal.open(MapTestCaseComponent, {
        //     width: '850px',
        //     height: '480px',
        //     maxHeight: '480px',
        //     data: _.cloneDeep(this.rowData),
        //     panelClass: 'topFix'
        // });

        // this.sub1 = dialogRef.afterClosed().subscribe(data => {
        //     dialogRef = null;
        // });
        const key = 'testSuiteTableState';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.testCaseInventoryService.configureTestsuite.next(this.rowData);
        this.router.navigateByUrl('pages/testcase-inventory/testsuite/maptestcases')
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
