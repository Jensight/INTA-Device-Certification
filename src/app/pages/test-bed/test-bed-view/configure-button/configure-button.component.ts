import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';
import { TestBedConfigureComponent } from '../../test-bed-configure/test-bed-configure.component';
import * as _ from 'lodash';
import { TestBedService } from "../../../../@core/services/test-bed.service";
@Component({
    selector: 'app-configure-button',
    templateUrl: './configure-button.component.html',
    styleUrls: ['./configure-button.component.scss']
})
export class ConfigureButtonComponent implements OnInit, OnDestroy {
    configuredStatus = false;
    renderValue: string;
    sub1;
    @Input()
    value: string | number;
    @Input()
    rowData: any;

    @Output()
    save: EventEmitter<any> = new EventEmitter();
    static componentInit(instance: ConfigureButtonComponent, cell: Cell) {
        instance.renderValue = cell.getValue().toUpperCase();
      }
    constructor(private router: Router, private testbedService: TestBedService) {}

    ngOnInit() {
        if (this.rowData.isConfigured === 'Yes') {
            this.configuredStatus = true;
        } else {
            this.configuredStatus = false;
        }
    }

    onClick() {
        this.testbedService.configureTestbed.next(this.rowData);
        this.router.navigateByUrl('/pages/test-bed/view/configure')
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
