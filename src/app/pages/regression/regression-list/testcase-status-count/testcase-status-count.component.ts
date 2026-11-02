import { DataService } from '../../../../@core/services/data.service';
import { Component, OnInit, Input } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import * as _ from 'lodash';

@Component({
    selector: 'app-testcase-status-count',
    templateUrl: './testcase-status-count.component.html'
})
export class TestcaseStatusCountComponent implements OnInit {
    @Input()
    value;
    @Input()
    rowData;
    failTC = 0;
    norunTC = 0;
    passTC = 0;
    excludedTC = 0;
    warnTC = 0;
    renderValue: string;
    abortTC = 0;
    constructor(
        private dataService: DataService
    ) { }
    
    static componentInit(instance: TestcaseStatusCountComponent, cell: Cell) {
        const row = cell.getRow().getData();
        if (row['failTC']) {
            instance.failTC = row['failTC'];
        }
        if (row['norunTC']) {
            instance.norunTC = row['norunTC'];
        }
        if (row['passTC']) {
            instance.passTC = row['passTC'];
        }
        if(row['excludedTC']) {
            instance.excludedTC = row['excludedTC'];
        }
        if(row['warnTC']) {
            instance.warnTC = row['warnTC'];
        }
        if(row['abortTC']) {
            instance.abortTC = row['abortTC'];
        }
      }
  

    ngOnInit() {
      
    }
}
