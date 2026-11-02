import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';



@Component({
  selector: 'app-lab-overview',
  templateUrl: './lab-overview.component.html',
  styleUrls: ['./lab-overview.component.scss']
})
export class LabOverviewComponent implements OnInit {

  selectedConfig: string = 'dut';
  displayedColumns: string[] = ['deviceName', 'partition', 'status', 'comments'];
  selectedStatus = 'Online'
   // Sample data for the table
  tableData1 = [
    { deviceName: 'DUT-01', partition: 'CTR1-CH1-C1', status: 'Online', comments: 'No Issues' },
    { deviceName: 'DUT-02', partition: 'CTR1-CH1-C2', status: 'Online', comments: 'No Issues' }
  ];

  tableData2 = [
    { deviceName: 'Client-01', partition: 'CTR1-CH1-C1', status: 'Online', comments: 'No Issues' },
    { deviceName: 'Client-02', partition: 'CTR1-CH1-C2', status: 'Online', comments: 'No Issues' }
  ];

  dataSource = new MatTableDataSource(this.tableData1);

  constructor() { }

  ngOnInit(): void {
  }

  showDetails(status: string): void {
    console.log('Showing details for status:', status);
    this.selectedStatus = status;
  }

  setView(viewType: string): void {
    console.log('Switching to view:', viewType);
    this.selectedConfig = viewType;
    if (viewType === 'dut') {
      this.dataSource = new MatTableDataSource(this.tableData1);
    } else if (viewType === 'clients') {
      console.log('Loading clients data', this.tableData2);
      this.dataSource = new MatTableDataSource(this.tableData2);
    }
  }

}
