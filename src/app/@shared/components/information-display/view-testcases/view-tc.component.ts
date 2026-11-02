import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToolTipDisplayComponent } from '../../tooltip-component/tooltip.component';
import { Cell, LocalDataSource } from 'angular2-smart-table';

@Component({
    selector: 'app-view-edit-tc',
    templateUrl: './view-tc.component.html',
    styleUrls: ['./view-tc.component.scss']
})
export class ViewEditTestCaseComponent implements OnInit, OnDestroy {
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Testcases Found',
        pager: {
            perPage: 5
        },
        mode: 'external',
        actions: false,
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
            }
        }
    };
    source: LocalDataSource = new LocalDataSource();
    constructor(public dialogRef: MatDialogRef<ViewEditTestCaseComponent>, @Inject(MAT_DIALOG_DATA) public data) {}

    ngOnInit(): void {
        this.source.load(this.data);
    }

    ngOnDestroy(): void {
        this.dialogRef = null;
    }
}
