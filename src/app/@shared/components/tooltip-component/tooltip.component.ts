import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../pipes/limit-to.pipe';

@Component({
    selector: 'app-tooltip-display',
    templateUrl: './tooltip.component.html',
    providers: [LimitToPipe]
})
export class ToolTipDisplayComponent implements OnInit {
    renderValue: string;

    @Input() value: any;
    @Input() rowData: any;
    @Input() numberLimit: any;
    public tooltipValue;
    @Output() save: EventEmitter<any> = new EventEmitter();
    constructor(private limitTo: LimitToPipe) {}
    ngOnInit() {
        // this.renderValue = this.limiTo.transform(this.value, this.numberLimit);
        // this.tooltipValue = this.value;
    }
    static componentInit(instance: ToolTipDisplayComponent, cell: Cell, numberLimit: any) {
    const row = cell.getRow().getData();
    instance.rowData = row; 
    instance.renderValue = instance.limitTo.transform(cell.getValue(), numberLimit);
    instance.tooltipValue = cell.getValue(); 
    }
}
