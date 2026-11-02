import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservationService } from './../../../../@core/services/reservation.service';
import { TestBedService } from './../../../../@core/services/test-bed.service';
import { DataService } from './../../../../@core/services/data.service';
import { DeviceInventoryService } from './../../../../@core/services/device-inventory.service';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { TableStateService } from 'src/app/@core/services/table-state.service';
import { log } from 'console';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
    selector: 'app-regression-name-display',
    templateUrl: './regression-name-display.component.html',
    styleUrls: ['./regression-name-display.component.scss'],
    providers: [LimitToPipe]
})
export class RegressionDisplayComponent implements OnInit {
    renderValue: string = '';
    sub1;
    selectedTeam;
    team;
    reseverationData;
    testBedData;
    @Input() source: LocalDataSource;
    @Input() value: any;
    @Input() rowData: any;
    @Input() numberLimit: any;
    @Input() viewHtmlLogs: boolean;
    public tooltipValue;
    @Output() save: EventEmitter<any> = new EventEmitter();
    constructor(private limiTo: LimitToPipe, private router: Router, private activatedRoute: ActivatedRoute,
        private reservationService: ReservationService, private dataService: DataService,
        private testbedService: TestBedService, private dInventoryService: DeviceInventoryService,
        private tlService: TestLabService, private tableStateService: TableStateService, public snackBar: MatSnackBar) {

    }
    ngOnInit() {
        // this.tooltipValue = this.value;
    }

    static componentInit(instance: RegressionDisplayComponent, cell: Cell, numberLimit: any, screenType: string) {
        const row = cell.getRow().getData();
        instance.rowData = row;
        const fullName = row.tagName ? row.tagName : row.run_id;
        instance.tooltipValue = fullName;
        instance.renderValue = instance.limiTo.transform(fullName, numberLimit);
        instance.viewHtmlLogs = screenType === 'regression-result-analysis';
    }

    redirectTo() {
        if (this.viewHtmlLogs) {
            this.viewDetails();
        } else {
            const key = 'regression-list'; 
            if (this.source) {
                const filters = this.source.getFilter();
                const page = this.source.getPaging().page;
                this.tableStateService.saveState(key, filters, page);
            }
            if (this.rowData['regStatus'] && this.rowData['regStatus'] !== 'Scheduled') {
                this.dataService.selectedRegressionData.next(null);
                // this.router.navigate(['../detail/' + this.rowData['_id']], { relativeTo: this.activatedRoute });
                this.router.navigate(
                    ['/pages/regression/detail', this.rowData['_id']],
                    { state: { fromScreen: 'view' } }
                );
            } else {
                let tbname: any = []
                this.dataService.selectedTeam.subscribe(data => {
                    if (data) {
                        this.selectedTeam = data
                    }
                }

                )
                this.dInventoryService.getAllData().subscribe(data => {
                    if (data) {
                        this.dataService.getDeviceInventoryData().next(data);
                    }
                });
                this.testbedService.getTestBed().subscribe(data => {
                    if (data) {
                        this.testBedData = data
                        console.log(data, "testbeddd")
                    }
                })

                this.dataService.getTestBedData().next(this.testBedData);
                this.sub1 = this.reservationService.getAllReservations().subscribe(data => {

                    if (data) {
                        console.log(data, "data insode if")
                        this.reseverationData = data
                    }
                    this.dataService.allReservation.next(this.reseverationData)
                    this.reseverationData.forEach((res) => {

                        if (res._id == this.rowData['_id']) {
                            console.log(res, "res")
                            this.testBedData.forEach((test) => {
                                res.testbedIds.forEach((tbId) => {
                                    if (test._id == tbId) {

                                        tbname.push(test.testBedName)

                                    }
                                })
                            })
                            res['tbName'] = tbname

                            this.dataService.selectedReservation.next(res);
                            this.router.navigateByUrl('/pages/reserve/reservation/view-device', { state: { fromScreen: 'view'} });

                        }


                    })
                })
            }
        }
    }

    viewDetails() {
        if (this.rowData && this.rowData['reg_download_id']) {
            console.log(this.rowData, this.rowData['reg_download_id'], "this.rowData['reg_download_id']");

            const jobId = this.rowData['firstJobId'];
            const runId = this.rowData['reg_download_id'];

            if (jobId) {
                this.tlService.viewHTMLLogsForJob(jobId, runId);
            } else {
                this.tlService.getRegression(this.rowData['_id']).subscribe((regData: any) => {
                    if (regData && regData.job && regData.job.length > 0 && regData.job[0].job_id) {
                        this.tlService.viewHTMLLogsForJob(regData.job[0].job_id, runId);
                    } 
                }, (err) => {
                    console.error('Error fetching regression data:', err);
                });
            }
        }
        // console.log("rowdata>>>>>", this.rowData);
    }
}