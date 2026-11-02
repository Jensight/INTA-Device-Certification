import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToolTipDisplayComponent } from '../../tooltip-component/tooltip.component';
import { LocalDataSource } from 'angular2-smart-table';

@Component({
    selector: 'app-view-target',
    templateUrl: './view-target.component.html',
    styleUrls: ['./view-target.component.scss']
})
export class ViewTargetComponent implements OnInit {
    public settings: any;
    source: LocalDataSource = new LocalDataSource();
    
    // Properties for testbed view
    testbedList: any[] = [];
    selectedTestbed: any = null;
    tcSuitesData: any[] = [];
    showtestSuiteOnly: boolean = false;
    
    constructor(public dialogRef: MatDialogRef<ViewTargetComponent>, @Inject(MAT_DIALOG_DATA) public data) {
        // Initialize settings in constructor
        this.settings = {
            attr: {
                class: 'text-center'
            },
            noDataMessage: 'No Data Found',
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
            columns: {}
        };
    }

    ngOnInit(): void {
        if (this.data.isTestbedView && this.data.testbedData) {
            this.settings = {
                attr: {
                    class: 'text-center'
                },
                noDataMessage: 'No Data Found',
                pager: {
                    perPage: 5
                },
                mode: 'inline',
                actions: false,
                columns: {
                    testSuiteName: {
                        title: 'Test Suite Name',
                        type: 'string',
                        class: 'text-center',
                        renderComponent: ToolTipDisplayComponent
                    },
                    testCaseName: {
                        title: 'Test Case Name',
                        type: 'string',
                        class: 'text-center',
                        renderComponent: ToolTipDisplayComponent
                    }
                }
            };
            
            this.testbedList = this.data.testbedData;
            this.selectedTestbed = this.testbedList[0];
            this.loadTestbedData();
        } else {
            this.data['targetFields'].forEach(element => {
                this.settings['columns'][element] = {
                    title: element.charAt(0).toUpperCase() + element.slice(1),
                    type: 'string',
                    class: 'text-center',
                    renderComponent: ToolTipDisplayComponent
                };
            });
            this.source.load(this.data.data);
        }
    }
    
    onTestbedChange(testbed: any): void {
        this.selectedTestbed = testbed;
        this.loadTestbedData();
    }
    
    restoreView(): void {
        this.showtestSuiteOnly = !this.showtestSuiteOnly;
        if (this.showtestSuiteOnly) {
            this.settings = {
                attr: {
                    class: 'text-center'
                },
                noDataMessage: 'No Data Found',
                pager: {
                    perPage: 5
                },
                mode: 'inline',
                actions: false,
                columns: {
                    testSuiteName: {
                        title: 'Test Suite Name',
                        type: 'string',
                        class: 'text-center',
                        renderComponent: ToolTipDisplayComponent
                    }
                }
            };
            
            const testbedName = this.selectedTestbed.testbedName;
            this.tcSuitesData = this.data.testsuiteDetails.filter(
                suite => suite.testbedName === testbedName
            );
            
            this.source.load(this.tcSuitesData);
        } else {
            this.loadTestbedData();
        }
    }
    
    loadTestbedData(): void {
        this.settings = {
            attr: {
                class: 'text-center'
            },
            noDataMessage: 'No Data Found',
            pager: {
                perPage: 5
            },
            mode: 'inline',
            actions: false,
            columns: {
                testSuiteName: {
                    title: 'Test Suite Name',
                    type: 'string',
                    class: 'text-center',
                    renderComponent: ToolTipDisplayComponent
                },
                testCaseName: {
                    title: 'Test Case Name',
                    type: 'string',
                    class: 'text-center',
                    renderComponent: ToolTipDisplayComponent
                }
            }
        };
        
        const testbedName = this.selectedTestbed.testbedName;
        this.tcSuitesData = this.data.testcaseDetails.filter(
            testcase => testcase.testbedName === testbedName
        );
        
        this.source.load(this.tcSuitesData);
    }
}
