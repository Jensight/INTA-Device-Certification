import { Component, OnInit, OnDestroy } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestCaseInventoryService } from '../../../@core/services/testcase-inventory.service';
import { DataService } from '../../../@core/services/data.service';
import * as _ from 'lodash';
import { AddTestGroupComponent } from './add-testgroup/add-testgroup.component';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { EditTestGroupComponent } from './edit-testgroup/edit-testgroup.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { Router } from '@angular/router';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
@Component({
    selector: 'app-testgroup',
    templateUrl: './testgroup.component.html',
    styleUrls: ['./testgroup.component.scss']
})
export class TestGroupComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public allTestGroup = [];
    public allTestCase = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    deleteTestgroupValue: boolean = false;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Testgroup Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete: this.deleteTestgroupValue,
            edit: true,
            position: 'right'
        },
        // add: {
        //     addButtonContent: '<i class="btn-small-font" style="font-size:  10px;">Add Testbed</i>'
        // },
        edit: {
            editButtonContent: '<i class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i class="fa fa-trash-o"></i>',
            confirmDelete: true
        },
        columns: {
            testGroupName: {
                title: 'TestGroup Name',
                type: 'custom',
                width: '450px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 40);
                }
            },
            count: {
                title: 'Testcase Count',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                valuePrepareFunciton: value => {
                    return value;

                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'testgroup');
                },
            }
        }
    };

    source: LocalDataSource = new LocalDataSource();
    permissionDenied: boolean = false;
    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private tcInventoryService: TestCaseInventoryService,
        private dataService: DataService,
        private router: Router
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub2 = this.dataService.getTestGroup().subscribe(allTestGroup => {
            if (allTestGroup) {
                this.allTestGroup = allTestGroup;
                this.loadTestCase();
            }
        });
        this.deleteTestgroupValue = this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteTestgroupValue;
        this.settings = Object.assign({}, this.settings);

        if (this.dataService.getCurrentUser()['role'] === 'lead' || this.dataService.getCurrentUser()['role'] === 'user') {
            this.settings.actions.delete = false;
        } else if (this.dataService.getCurrentUser()['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.edit = false;
            this.settings.actions.delete = false;
        }
    }

    ngOnInit() {
        //Sort Data
        const sortData = this.dataService.getTestGroupSort();
        if(sortData){
            this.source.setSort(sortData);
            }
            }

    /**
* Set Sort Data
*/

    setSortData() {
        this.dataService.storeTestGroupSort(this.source.getSort());
    }
    /**
     * Load Test Case function
     */

    loadTestCase() {
        this.sub3 = this.dataService.getTestCases().subscribe(tc => {

            if (tc) {
                this.allTestCase = tc;
                this.loadTestGroup();
            }
        });
    }

    /**
     * Load Test Group Function
     */

    loadTestGroup() {
        // let tgData = JSON.parse(JSON.stringify(this.allTestGroup));
        this.allTestGroup.forEach(tg => {
            tg['count'] = _.filter(this.allTestCase, function (tc) {
                if (tc['tcGroupId'] === tg['_id']) {
                    if (!tg.tcList) {
                        tg.tcList = [];
                    }
                    else {
                        tg.tcList.push(tc['_id']);

                    }
                    return tc;
                }
            }).length;

        });

        this.allTestGroup.forEach(tg => {
            let temp = this.allTestCase.filter(tc => { return tc['tcGroupId'] == tg['_id'] });
            let testcaseNames = temp.map(tc => tc['tcName']);
            tg['testCaseNames'] = [];
            testcaseNames.forEach(tc => {
                tg['testCaseNames'].push({ "No": 1, "testCaseName": tc });
            });
            // tg['testCaseNames'] = testcaseNames;
        });
        this.source.load(this.allTestGroup);
    }

    /**
     * Add Test group function to open add testgroup form
     */

    addTestgroup() {
        this.dialog.open(AddTestGroupComponent, {
            data: this.selectedTeam,
            width: '450px',
            panelClass: 'dynamic-theme'
        });
    }

    /**
     * Edit Test group function to open edit testgroup form
     */

    editTestgroup(event) {
        this.tcInventoryService.selectedTestGroup.next(event.data)
        this.dialog.open(EditTestGroupComponent, {
            data: {
                selectedTeam: this.selectedTeam,
                selectedTestgroup: _.cloneDeep(event.data)
            },
            width: '450px'
        });
    }

    /**
     * Delete test group confirmation function
     * @param deleteEvent .
     */

    deleteTestgroupConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            data: {
                name: 'Test Group',
                text:
                    'Deleting will remove the  Testgroup and Testcases assosciated with it. ' +
                    "This action can't be reversed. Are you want to Proceed?",
                action: 'Delete'
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub4 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteTestgroup(deleteEvent);
            }
        });
    }

    /**
     * Delete testgroup function
     * @param deleteEvent .
     */

    deleteTestgroup(deleteEvent) {
        this.dataService.loading.next(true)
        this.sub5 = this.tcInventoryService.deleteTestGroup({ _id: deleteEvent.data._id }).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('TestGroup Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Deleting TestGroup', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    ngOnDestroy(): void {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
    }
}
