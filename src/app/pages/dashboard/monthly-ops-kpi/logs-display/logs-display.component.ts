import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservationService } from './../../../../@core/services/reservation.service';
import { TestBedService } from './../../../../@core/services/test-bed.service';
import { DataService } from './../../../../@core/services/data.service';
import { DeviceInventoryService} from './../../../../@core/services/device-inventory.service';
import { TestLabService } from '../../../../@core/services/test-lab.service';
@Component({
  selector: 'app-logs-display',
  templateUrl: './logs-display.component.html',
  providers: [LimitToPipe]
})
export class LogsDisplayComponent implements OnInit {
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;
  @Input() numberLimit: any;
  public tooltipValue;


  @Output() save: EventEmitter<any> = new EventEmitter();
  constructor(private limitTo: LimitToPipe,private router: Router, private activatedRoute: ActivatedRoute,       private tlService: TestLabService,) { }

  ngOnInit(): void {
    // this.renderValue = this.limitTo.transform(this.value, this.numberLimit);
    //   this.tooltipValue = this.value;
  }

  static componentInit(instance: LogsDisplayComponent, cell: Cell, numberLimit: any) {
    const row = cell.getRow().getData();
    instance.rowData = row; 
    instance.renderValue = row.tagName ? row.tagName : row.run_id;    
    instance.renderValue = instance.limitTo.transform(instance.renderValue, numberLimit);
    instance.tooltipValue = instance.renderValue;
}

  redirectTo():any{    
    // this.logDetails()
    this.tlService.viewHTMLLogsForJob(this.renderValue, null);
  }
  
  // logDetails(){
  //   console.log("inside^^");
  //   console.log(this.rowData, this.rowData['job_id'], "this.rowData['reg_download_id']");
    
  //   if (this.rowData && this.rowData['job_id']) {
  //     this.tlService.viewHTMLLogsForJob(this.rowData['job_id']);
  //   }    
  // }

}
