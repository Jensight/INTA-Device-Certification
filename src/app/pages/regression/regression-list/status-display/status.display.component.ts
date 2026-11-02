import { Component, OnInit, Input } from '@angular/core';
import { Cell} from 'angular2-smart-table';

@Component({
    selector: 'app-status-display',
    styleUrls: ['./status-display.component.scss'],
    templateUrl: './status-display.component.html',
    standalone: false
})
export class StatusDisplayComponent implements OnInit {
  @Input() value!: any;
  @Input() rowData!: any;
  @Input() openTestSuite?: (row: any) => void;

  renderValue: string = '';

  constructor() {}

  ngOnInit(): void {
    this.renderValue = this.value ?? '';
  }

  // ensure both rowData and value are populated when smart-table creates the component
  static componentInit(instance: StatusDisplayComponent, cell: Cell): void {    
    instance.rowData = cell.getRow().getData();
    console.log(instance.rowData, "status display row");
    instance.value = cell.getValue();
    instance.renderValue = instance.value ?? '';
  }

  handleClick(): void {
    if (this.openTestSuite && this.rowData?.regStatus?.toLowerCase() === 'in progress') {
      this.openTestSuite(this.rowData);
    }
  }
}
