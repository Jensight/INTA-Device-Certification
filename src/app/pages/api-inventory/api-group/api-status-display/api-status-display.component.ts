import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Cell } from 'angular2-smart-table';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../../@core/services/api.service';
// import 'rxjs/add/operator/catch';
@Component({
    selector: 'api-status-display',
    templateUrl: './api-status-display.component.html',
    styleUrls: ['api-status-display.component.scss'],
    providers: [LimitToPipe]

})
export class APIStatusDisplayComponent implements OnInit {
    renderValue: string;
    public className = '';
    classNameduplicate = [];
    @Input() value: string | number;
    @Input() rowData: any;
    public statuscode: any;
    @Output() save: EventEmitter<any> = new EventEmitter();
    sub;
    @Input() numberLimit: any;
    public active = false
    tooltipValue: string;

    constructor(private apiService: ApiService, private limitTo: LimitToPipe, private http: HttpClient, private cd: ChangeDetectorRef) {

    }

    static componentInit(instance: APIStatusDisplayComponent, cell: Cell, numberLimit: any) {
        const row = cell.getRow().getData();
        instance.rowData = row;
        instance.renderValue = instance.limitTo.transform(String(cell.getValue()), '50');
        instance.tooltipValue = cell.getValue();
        if (instance.rowData && instance.rowData['primaryURL']) {
            // instance.renderValue = String(instance.value);            
            instance.sub = instance.apiService.ping(instance.rowData['primaryURL'] + instance.rowData['name'] + '/')
                .subscribe(
                    (data: any) => {
                        if (data.status == 200 || data.status == 304) {
                            instance.active = true;
                            instance.cd.detectChanges();
                        }
                    },
                    (err) => {
                        instance.active = false;
                        instance.cd.detectChanges();
                    }
                );
        }
    }


    ngOnInit() {}

    ngOnDestroy(): void {
        if (this.sub) {
            this.sub.unsubscribe();
        }

    }
}
