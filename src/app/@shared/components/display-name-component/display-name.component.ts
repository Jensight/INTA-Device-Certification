import { Component, OnInit, Input } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../pipes/limit-to.pipe';
import * as _ from 'lodash';
@Component({
  selector: 'app-display-name',
  templateUrl: './display-name.component.html',
  styleUrls: ['./display-name.component.scss'],
  providers: [LimitToPipe],
})
export class DisplayNameComponent implements OnInit {
  renderValue: string;
  value: any;
  @Input() rowData: any;
  @Input() numberLimit: any;
  @Input() allData: any[];
  @Input() field: any;
  @Input() targetField: any;
  public tooltipValue;

  static componentInit(instance: DisplayNameComponent, cell: Cell, allData: any[], field: string, targetField: string, numberLimit: any) {
    const row = cell.getRow().getData();
    instance.rowData = row;
    instance.allData = allData;
    instance.field = field;
    instance.targetField = targetField;
    instance.numberLimit = numberLimit;

    if (instance.rowData[instance.field] !== null) {
      const temp = {};
      temp['_id'] = instance.rowData[instance.field];
      const selectedItem = _.find(instance.allData, temp);
      instance.value = selectedItem[instance.targetField];
      instance.renderValue = instance.limiTo.transform(instance.value, instance.numberLimit);
      instance.tooltipValue = instance.value;
    } else {
      instance.renderValue = instance.limiTo.transform(cell.getValue(), instance.numberLimit);
      instance.tooltipValue = cell.getValue();
    }
  }

  constructor(private limiTo: LimitToPipe) {}

  ngOnInit() {

    if (this.rowData[this.field] !==null) {
      const temp = {};
      temp['_id'] = this.rowData[this.field];
      const selectedItem = _.find(this.allData, temp);
      this.value = selectedItem[this.targetField];
      this.renderValue = this.limiTo.transform(this.value, this.numberLimit);
      this.tooltipValue = this.value;
    } else {
        this.tooltipValue = ('NA');
        this.value = ('NA');
        this.renderValue = ('NA');
    }
  }
}
