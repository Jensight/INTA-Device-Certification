import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';

@Component({
    selector: 'app-node-name-display',
    templateUrl: './node-name-display.component.html',
    styleUrls: ['./node-name-display.component.scss'],
    providers: [LimitToPipe]
})
export class NodeNameDisplayComponent implements OnInit {
    renderValue: string;
    @Input() value: string | number;
    @Input() rowData: any;
    @Output() save: EventEmitter<any> = new EventEmitter();
    tooltipValue: string;

    constructor(private limitTo: LimitToPipe) { }

    static componentInit(instance: NodeNameDisplayComponent, cell: Cell, numberLimit: any) {
        const row = cell.getRow().getData();
        instance.rowData = row;
        instance.renderValue = instance.limitTo.transform(String(cell.getValue()), '35');
        instance.tooltipValue = cell.getValue();
    }

    ngOnInit() {
        // this.renderValue = this.limitTo.transform(String(this.value), '35');
    }
}
