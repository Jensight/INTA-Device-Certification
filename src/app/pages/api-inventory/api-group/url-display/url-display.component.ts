import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';

@Component({
    selector: 'app-url-display',
    templateUrl: './url-display.component.html',
    providers: [LimitToPipe]
})
export class URLDisplayComponent implements OnInit {
    renderValue: string;

    @Input() value: string | number;
    @Input() rowData: any;

    @Output() save: EventEmitter<any> = new EventEmitter();
    tooltipValue: string;

    constructor(private limitTo: LimitToPipe) { }

    static componentInit(instance: URLDisplayComponent, cell: Cell) {
        // const row = cell.getRow().getData();
        // instance.rowData = row.name;        
        instance.renderValue = instance.limitTo.transform(String((cell as Cell).getValue()), '40');
        instance.tooltipValue = cell.getValue(); 
}

    ngOnInit() {
        // this.renderValue = this.limitTo.transform(String(this.value), '40');
    }
}
