import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../pipes/limit-to.pipe';


@Component({
    selector: 'app-name-display',
    templateUrl: './api-name-display.component.html',
    providers: [LimitToPipe]
})
export class APINameDisplayComponent implements OnInit {
    renderValue: string;

    @Input() value: any;
    @Input() rowData: any;
    @Input() numberLimit: any;
    public name = "";
    public apiNameDisplayValue;
    public commString = ",";
    @Output() save: EventEmitter<any> = new EventEmitter();
    constructor(private limitTo: LimitToPipe) { }

    ngOnInit() { }

    static componentInit(instance: APINameDisplayComponent, cell: Cell, numberLimit: any) {
        const cellValue = cell.getValue();
        instance.name = '';
        instance.commString = ',';
        if (Array.isArray(cellValue)) {
            for (let i = 0; i < cellValue.length; i++) {
                if (i === cellValue.length - 1) {
                    instance.commString = '';
                }
                instance.name += cellValue[i] + instance.commString;
            }
        }
        instance.renderValue = instance.limitTo.transform(instance.name, numberLimit);
        instance.apiNameDisplayValue = instance.name;
    }
}
