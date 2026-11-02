import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DataService } from '../../../@core/services/data.service';
import * as _ from 'lodash';
import { ToolTipDisplayComponent } from '../tooltip-component/tooltip.component';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { ViewEditTestCaseComponent } from './view-testcases/view-tc.component';
@Component({
    selector: 'app-information-display',
    templateUrl: './information-display.component.html',
    styleUrls: ['./information-display.component.scss']
})
export class InformationDisplayComponent implements OnInit, OnDestroy {
    allTestcases = [];
    apiTestcases = [];
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Testcases Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            position: 'right'
        },
        edit: {
            editButtonContent: '<i class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i class="fa fa-trash-o"></i>',
            confirmDelete: true
        },
        columns: {
            tcId: {
                title: 'Id',
                type: 'string',
                width: '100px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent
            },
            tcName: {
                title: 'Name',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 20);
                  },
            },
            // tcGroupId: {
            //     title: 'Test Group',
            //     type: 'custom',
            //     width: '350px',
            //     class: 'text-center',
            //     renderComponent: ToolTipDisplayComponent,
            //     onComponentInitFunction: instance => {
            //         instance['numberLimit'] = '20';
            //     },
            //     valuePrepareFunction: data => {
            //         return this.getGroupFromId(data);
            //     }
            // },
            // autoExectime: {
            //     title: 'Execution Time',
            //     type: 'custom',
            //     width: '350px',
            //     class: 'text-center',
            //     renderComponent: ToolTipDisplayComponent
            // },
            testSteps: {
                title: 'No Steps',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                valuePrepareFunction: data => {
                    return data['length'];
                }
            }
            // testCases: {
            //     title: 'No of Testcases',
            //     type: 'string',
            //     width: '350px',
            //     class: 'text-center',
            //     valuePrepareFunction: data => {
            //         return data.length;
            //     }
            // }
        }
    };

    source: LocalDataSource = new LocalDataSource();
    public subscription;
    public sub1;
    constructor(
        public dialogRef: MatDialogRef<InformationDisplayComponent>,
        private modal: MatDialog,
        private dataService: DataService,
        @Inject(MAT_DIALOG_DATA) public data: { action: string; text: string; name: string }
    ) {}

    ngOnInit() {}
    viewTestCases() {
        this.subscription = this.dataService.getTestCases().subscribe(data => {
            if (data) {
                this.allTestcases = data;
                this.apiTestcases = _.filter(this.allTestcases, apiTc => {
                    return this.data['data']['tcId'].indexOf(apiTc._id) > -1;
                });
                let dial = this.modal.open(ViewEditTestCaseComponent, {
                    data: this.apiTestcases,
                    width: '700px',
                    autoFocus: false,
                    panelClass: 'app-full-bleed-dialog'
                });

                this.sub1=dial.afterClosed().subscribe(x => {
                    dial = null;
                });
            }
        });
    }

    close() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
