import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../@core/services/api.service';

import { Cell, LocalDataSource } from 'angular2-smart-table';
import { NameFromIdPipe } from '../../../@shared/pipes/name-from-id.pipe';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { TestCaseInventoryService } from '../../../@core/services/testcase-inventory.service';
import { mergeMap } from 'rxjs/operators';
import * as _ from 'lodash';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { APINameDisplayComponent } from '../../../@shared/components/api-name-display/api-name-display.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';

@Component({
    selector: 'app-api',
    templateUrl: './api.component.html',
    styleUrls: ['./api.component.scss'],
    providers: [NameFromIdPipe]
})
export class APIComponent implements OnInit, OnDestroy {
    private selectedTeam;
    private allAPIGroup = [];
    private allGroupName = [];
    private allAPI = [];
    private allAPINames = [];
    private allTestCases;
    deleteApiValue: boolean;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No API Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            edit: false,
            delete: false,
            position: 'right',
            custom: [

            ]
        },
        columns: {
            apiName: {
                title: 'API Name',
                type: 'custom',
                class: 'text-center',
                width: '200px',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
            },
            apiGroupId: {
                title: 'API Group',
                type: 'custom',
                class: 'text-center',
                valuePrepareFunction: data => {
                    return this.nameFromId.transform(data, this.allAPIGroup, '_id', 'name');
                },
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;

                    if (
                        this.nameFromId
                            .transform(a, this.allAPIGroup, '_id', 'name')
                            .localeCompare(this.nameFromId.transform(b, this.allAPIGroup, '_id', 'name')) < 0
                    ) {
                        return -1 * direction;
                    }
                    if (
                        this.nameFromId
                            .transform(a, this.allAPIGroup, '_id', 'name')
                            .localeCompare(this.nameFromId.transform(b, this.allAPIGroup, '_id', 'name')) > 0
                    ) {
                        return direction;
                    }
                    return 0;
                },
                filterFunction: (cell, search) => {
                    let temp = cell;

                    if (
                        this.nameFromId
                            .transform(cell, this.allAPIGroup, '_id', 'name')
                            .toLowerCase()
                            .includes(search.toLowerCase())
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                },

                width: '200px'
            },
            arguments: {
                title: 'Variable Names',
                type: 'custom',
                class: 'text-center',
                width: '450px',
                renderComponent: APINameDisplayComponent,
                componentInitFunction: (instance: APINameDisplayComponent, cell: Cell) => {
                    APINameDisplayComponent.componentInit(instance, cell, 150);
                },

                valuePrepareFunction: data => {
                    const argumens = [];
                    data.forEach(element => {
                        argumens.push(element['argumentName']);
                    });
                    return argumens;
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    var st = '';
                    var st1 = '';
                    for (var i = 0; i < a.length; i++) {
                        st = st + a[i]['argumentName'];
                    }
                    for (var i = 0; i < b.length; i++) {
                        st1 = st1 + b[i]['argumentName'];
                    }
                    if (st.localeCompare(st1) < 0) {
                        return -1 * direction;
                    }
                    if (st.localeCompare(st1) > 0) {
                        return direction;
                    }
                    return 0;
                },
                filterFunction: (cell, search) => {
                    let temp = cell;
                    var st = '';
                    for (var i = 0; i < cell.length; i++) {
                        st = st + cell[i]['argumentName'];
                    }
                    if (st.toLowerCase().includes(search.toLowerCase())) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            count: {
                title: 'TC Count',
                class: 'text-center',
                type: 'custom',
                width: '15%',
                valuePrepareFunction: data => {
                    return data;
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'isApi');
                },
            }
        }
    };
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;

    source: LocalDataSource = new LocalDataSource();
    permissionDenied: boolean = false;
    constructor(
        private dataService: DataService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private apiService: ApiService,
        private nameFromId: NameFromIdPipe,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private tcInventoryService: TestCaseInventoryService,
        private tableStateService: TableStateService,
    ) { }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                if (!event.url.startsWith('/pages/api-inventory/api')) {
                    const key = 'api';
                    this.tableStateService.clearState(key);
                }
            }
        });
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.sub2 = this.tcInventoryService.getAllData().subscribe(data => {
                    if (data) {
                        this.dataService.getTcInventoryData().next(data);
                    }
                });
            }
        });

        this.sub3 = this.dataService.getAllAPIGroup().subscribe(group => {
            if (group) {
                this.allAPIGroup = group;
            }
        });

        this.sub4 = this.dataService
            .getAllAPI()
            .pipe(
                mergeMap(data => {
                    if (data) {
                        this.allAPI = data;
                    }
                    return this.dataService.getTestCases();
                })
            )
            .subscribe(tc => {
                if (tc) {
                    this.allTestCases = tc;
                    this.checkNoOfTestcases();
                    const key = 'api';
                    const { filterState, currentPage } = this.tableStateService.getState(key);
                    this.source.load(this.allAPI).then(() => {
                        this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
                    });
                    if (filterState.length > 0) {
                        this.source.setFilter(filterState, true);
                    }
                    // this.source.load(this.allAPI);
                    this.allAPINames = [];
                    this.allAPI.forEach(element => {
                        this.allAPINames.push(element.name);
                    });
                }
            });


        //Sort Data
        const sortData = this.dataService.getApiSort();
        if (sortData) {
            this.source.setSort(sortData);
        }
        this.deleteApiValue = this.dataService.deleteActions();
        if (this.deleteApiValue === true) {
            this.settings.actions.custom.push({
                name: 'Clone',
                title: '<i class="fa fa-clone" title="clone"></i>',
                class: 'Clone'
            },
                {
                    name: 'Edit',
                    title: '<i class="fa fa-pencil" title="edit"></i>'
                },
                {
                    name: 'Delete',
                    title: '<i class="fa fa-trash-o" title="delete"></i>',
                    confirmDelete: true
                });

        }
        else {
            this.settings.actions.custom.push({
                name: 'Clone',
                title: '<i class="fa fa-clone" title="clone"></i>',
                class: 'Clone'
            },
                {
                    name: 'Edit',
                    title: '<i class="fa fa-pencil" title="edit"></i>'
                });
        }

        const currentUser = this.dataService.getCurrentUser();
        if (currentUser && currentUser['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.delete = false;
            this.settings.actions.edit = false;
            this.settings.actions.custom = [];
        }
    }

    /**
* Set Sort Data
*/

    setSortData() {
        this.dataService.storeApiSort(this.source.getSort());
    }

    /**
     * Called to open the API form for editing
     * @param event .
     */

    editAPI(event) {
        const key = 'api';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.apiService.selectedAPI.next(event['data']);
        this.router.navigate(['./edit'], { relativeTo: this.activatedRoute });
    }

    /**
     * remove device confirmation function
     * deleteDevice function called after deletion confirmation
     * @param deleteEvent contains params
     */

    deleteAPIConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'API',
                successText: `Deleting will remove the API  and this action can't be reversed.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot delete API as ${deleteEvent.data.count} Testcase(s) using this API. Remove those Testcase(s) to proceed. `,
                data: deleteEvent.data,
                targetName: 'Testcase',
                targetFields: ['tcId', 'tcName']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub5 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteAPI(deleteEvent);
            }
        });
    }

    /**
     * Called to remove API via deleteAPI API call to the backend
     * @param deleteEvent contains params
     */

    deleteAPI(deleteEvent) {
        this.dataService.loading.next(true);
        this.sub6 = this.apiService.deleteAPI(deleteEvent.data).subscribe(
            data => {
                this.dataService.loading.next(false);
                if (data) {
                    this.dataService.getAPIData().next(data);
                    this.snackBar.open('API Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Deleting API', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    /**
     * Called to open clone, edit API and delete
     * @param event .
     */
    onCustom(event) {
        if (event.action == 'Clone') {
            this.cloneAPI(event);
        } else if (event.action == 'Edit') {
            this.editAPI(event);
        } else if (event.action == 'Delete') {
            this.deleteAPIConfirmation(event);
        }
    }

    /**
     * Called to open the clone API
     * @param event .
     */
    cloneAPI(event) {
        const key = 'api';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.apiService.selectedAPI.next(event['data']);
        this.router.navigate(['./clone'], { relativeTo: this.activatedRoute });
    }

    /**
     * Gets Number of test cases to the API
     */
    checkNoOfTestcases() {
        //     this.allAPI.forEach(api => {
        // console.log("this.allApi", this.allAPI);
        //         let tcCount = 0;
        //         const tcId = [];
        //         this.allGroupName = [];
        //         this.allGroupName.push(api['name']);
        //         this.allTestCases.forEach(tc => {
        //             if (_.find(tc.testSteps, { api_id: api._id })) {
        //                 tcCount++;
        //                 tcId.push(tc._id);
        //             }
        //         });
        //         const target = [];
        //         tcId.forEach(tc => {
        //             tc = _.find(this.allTestCases, { _id: tc });
        //             if (tc) {
        //                 target.push(tc);
        //             }

        //         });
        //         api['target'] = target;
        //         api['count'] = tcCount;
        //         api['tcId'] = tcId;
        //     });
        this.allAPI.forEach(api => {

            let temp = this.allTestCases.filter(tc => { return _.find(tc.testSteps, { api_id: api._id }) });
            let testCaseNames = temp.map(tc => tc['tcName']);
            api['testCaseNames'] = [];
            testCaseNames.forEach(tcName => {
                api['testCaseNames'].push({ "No": 1, "testCaseName": tcName });
            });
            api['target'] = temp;
            api['count'] = testCaseNames.length;
            api['tcId'] = temp.map(tc => tc._id);
            this.allGroupName.push(api['name']);
        });
    }

    /**
     * Used to get variable details of ID
     */
    getVariableFromId(id) {
        this.allAPI.forEach(api => {
            return _.filter(this.allTestCases, function (data) {
                return data['tcId'] === id;
            })[0];
        });
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
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
    }
}
