import { Component, OnInit, Input, Output } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { DataService } from '../../../../../@core/services/data.service';
import { TestLabService } from '../../../../../@core/services/test-lab.service';
import { formatDate } from '@angular/common';
@Component({
    selector: 'app-testcase-status',
    templateUrl: './testcase-status.component.html',
    styleUrls: ['./testcase-status.component.scss'],
})
export class TestCaseStatusComponent implements OnInit{
    @Input()
    value;
    @Input()
    rowData;
    @Input()
    jobData;
    @Input()
    regStatus;
    @Input() runId;
    pass = false;
    fail = false;
    excluded = false;
    warning = false;
    renderValue: string;
    editFlag: boolean = false;

    static componentInit(instance: TestCaseStatusComponent, cell: Cell, jobData: any, regStatus: any, runId: any) {
    const row = cell.getRow().getData();
    instance.rowData = row; 
    instance.renderValue = cell.getValue();
    instance.jobData = jobData;
    instance.regStatus = regStatus;
    instance.editFlag = false;
    instance.runId = runId;
  }

    constructor(private dataService: DataService,private tlService:TestLabService) {
    }

    ngOnInit(): void {
        console.log("rowData", this.rowData);
        if (this.rowData['tcStatus'] && this.rowData['tcStatus'] === 'Pass') {
            // console.log('this.rowDatap[tcststus]', this.rowData['tcStatus']);
            console.log("inside if")
            this.pass = true;
            this.fail = false;
            this.excluded = false;
            this.warning = false;
        } else if (this.rowData['tcStatus'] && (this.rowData['tcStatus'] === 'Fail' || this.rowData['tcStatus'] === 'Rerun-Fail' )) {
            this.fail = true;
            this.pass = false;
            this.excluded = false;
             this.warning = false;
        } else if (this.rowData['tcStatus'] && this.rowData['tcStatus'] === 'Excluded'){
            this.fail = false;
            this.pass = false;
            this.excluded = true;
            this.warning = false; 
        } 
        else if (this.rowData['tcStatus'] && this.rowData['tcStatus'] === 'Warning' ){
        console.log("inside warning")
        console.log("inside else if")
            this.fail = false;
            this.pass = false;
            this.excluded = false;
            this.warning = true;
        } 
        else {
            this.fail = false;
            this.pass = false;
            this.excluded = false;
            this.warning = false;
        }
    }

    showLogs() {
        console.log(this.jobData,"this.jobdata");
        console.log(this.runId,"this.runId***");

        this.tlService.viewHTMLLogsForTestcase(this.jobData['job_id'],this.rowData['testSuiteName'], this.rowData['tcName'], this.runId)
    }

    downloadFile(data) {
    }
}
