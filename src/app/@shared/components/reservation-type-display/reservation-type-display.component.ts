import { Component, Input, OnInit } from '@angular/core';
import { Cell } from 'angular2-smart-table';

@Component({
  selector: 'app-reservation-type-display',
  templateUrl: './reservation-type-display.component.html',
  styleUrls: ['./reservation-type-display.component.scss']
})
export class ReservationTypeDisplayComponent implements OnInit {
  @Input() value: any; 
  @Input() rowData: any; 
  @Input() openRegression: (row: any) => void;

  isRegression = false;
  displayValue: string = '';

  ngOnInit(): void {
    this.displayValue = this.value || '';
    this.isRegression = (this.value || '').toUpperCase() === 'REGRESSION';
  }

  static componentInit(instance: ReservationTypeDisplayComponent, cell: Cell, openRegressionCallback?: (row: any) => void) {
    const row = cell.getRow().getData();
    instance.rowData = row;
    instance.value = cell.getValue();
    instance.displayValue = instance.value || '';
    instance.isRegression = (instance.value || '').toUpperCase() === 'REGRESSION';
    if (openRegressionCallback) {
      instance.openRegression = openRegressionCallback;
    }
  }

  handleClick(event: MouseEvent) {
    event.stopPropagation(); 
    if (this.isRegression && this.openRegression) {
      this.openRegression(this.rowData);
    }
  }
}
