import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';

@Component({
    selector: 'app-variable-display',
    templateUrl: './variable-display.component.html',
    styleUrls: ['./variable-display.component.scss']
})
export class VariableDisplayComponent implements OnInit {
    renderValue: any[] = [];
    stringValue;
    @Input() value;
    @Input() rowData: any;
    static componentInit(instance: VariableDisplayComponent, cell: Cell) {
        instance.renderValue = cell.getValue().toUpperCase().split('');
      }
    constructor() {}
    ngOnInit() {
        this.renderValue = [];
        this.value.forEach(element => {
            this.renderValue.push(element.variableName);
        });
        this.stringValue = String(this.renderValue);
    }
}
