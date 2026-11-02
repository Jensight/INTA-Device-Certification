import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../../@core/services/api.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { URLDisplayComponent } from './url-display/url-display.component';
import * as _ from 'lodash';
import { NameFromIdPipe } from '../../../@shared/pipes/name-from-id.pipe';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { Router, ActivatedRoute, NavigationStart } from '../../../../../node_modules/@angular/router';
import { APIStatusDisplayComponent } from './api-status-display/api-status-display.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';
@Component({
    selector: 'app-api-group',
    templateUrl: './api-group.component.html',
    styleUrls: ['./api-group.component.scss'],
    providers: [NameFromIdPipe]
})
export class APIGroupComponent implements OnInit, OnDestroy {
    private selectedTeam;
    private allAPIGroup = [];
    public allGroupName = [];
    public allAPI = [];
    public APIofGroup = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    deleteApigroupValue: boolean = false;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No API Group Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete: this.deleteApigroupValue,
            edit: true,
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
            name: {
                title: 'Group Name',
                type: 'custom',
                class: 'text-center',
                width: '300px',
                renderComponent: APIStatusDisplayComponent,
                componentInitFunction: (instance: APIStatusDisplayComponent, cell: Cell) => {
                    APIStatusDisplayComponent.componentInit(instance, cell, 100);
                },

                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    if (a.localeCompare(b) < 0) {
                        return -1 * direction;
                    }
                    if (a.localeCompare(b) > 0) {
                        return direction;
                    }
                    return 0;
                }
            },

            primaryURL: {
                title: 'Primary URL',
                type: 'custom',
                class: 'text-center',
                // width: '18%',
                renderComponent: URLDisplayComponent,
                componentInitFunction: URLDisplayComponent.componentInit,
            },
            secondaryURL: {
                title: 'Secondary URL',
                type: 'custom',
                class: 'text-center',
                // width: '17%',
                renderComponent: URLDisplayComponent,
                componentInitFunction: URLDisplayComponent.componentInit,

            },
            // preExecution: {
            //     title: 'PreExecution API',
            //     type: 'custom',
            //     class: 'text-center',
            //     width: '21%',
            //     valuePrepareFunction: data => {
            //         const name = [];
            //         data.forEach(element => {
            //             name.push(element.apiName);
            //         });
            //         return name.length > 0 ? name : 'Null';
            //     },
            //     filterFunction(cell?: any, search?: string): boolean {
            //         const apiname = [];
            //         cell.forEach(elements => {
            //             apiname.push(elements.apiName);
            //         });

            //         const searchString = search
            //             .split(',')
            //             .map(a => a.trim())
            //             .filter(b => b != '');
            //         if (searchString.length == 0) {
            //             return true;
            //         }
            //         const interSectArray = _.intersectionWith(apiname, searchString, (c, d) => {
            //             if (c.toLowerCase().includes(d.toLowerCase())) {
            //                 return true;
            //             }
            //             return false;
            //         });
            //         if (interSectArray.length == searchString.length) {
            //             return true;
            //         }
            //         return false;
            //     },
            //     renderComponent: ToolTipDisplayComponent,
            //     onComponentInitFunction: instance => {
            //         instance['numberLimit'] = '9';
            //     }
            // },
            // postExecution: {
            //     title: 'PostExecution API',
            //     type: 'custom',
            //     class: 'text-center',
            //     width: '21%',
            //     valuePrepareFunction: data => {
            //         const name = [];
            //         data.forEach(element => {
            //             name.push(element.apiName);
            //         });
            //         return name.length > 0 ? name : 'Null';
            //     },
            //     filterFunction(cell?: any, search?: string): boolean {
            //         const apiname = [];
            //         cell.forEach(elements => {
            //             apiname.push(elements.apiName);
            //         });

            //         const searchString = search
            //             .split(',')
            //             .map(a => a.trim())
            //             .filter(b => b != '');
            //         if (searchString.length == 0) {
            //             return true;
            //         }
            //         const interSectArray = _.intersectionWith(apiname, searchString, (c, d) => {
            //             if (c.toLowerCase().includes(d.toLowerCase())) {
            //                 return true;
            //             }
            //             return false;
            //         });
            //         if (interSectArray.length == searchString.length) {
            //             return true;
            //         }
            //         return false;
            //     },
            //     renderComponent: ToolTipDisplayComponent,
            //     onComponentInitFunction: instance => {
            //         instance['numberLimit'] = '9';
            //     }
            // },
            count: {
                title: 'Api Count',
                type: 'custom',
                class: 'text-center',
                // width: '10%'
                valuePrepareFunction: data => {
                    return data;
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'isApiGroup');
                },
            }
        }
    };
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
        private activeUrl: ActivatedRoute,
        private cd: ChangeDetectorRef,
        private tableStateService: TableStateService,

    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub2 = this.dataService.getAllAPI().subscribe(apiData => {
            if (apiData) {
                this.allAPI = apiData;

                this.loadData();
            }
        });
        this.deleteApigroupValue = this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteApigroupValue;
        this.settings = Object.assign({}, this.settings);



        //Sort Data

        const sortData = this.dataService.getApiGroupSort();
        if (sortData) {
            this.source.setSort(sortData);
        }
    }

    setSortData() {
        this.dataService.storeApiGroupSort(this.source.getSort());
    }

    /**
     * Loads form with available API data
     */

    loadData() {
        console.log('Get All API Data in loadData************', this.dataService.getAllAPIGroup());
        this.sub3 = this.dataService.getAllAPIGroup().subscribe({
            next: (group) => {
                console.log('group in loadData************', group);
                if (group) {
                    console.log('group************', group);
                    this.allAPIGroup = group;
                    const tempGroup = _.cloneDeep(this.allAPIGroup);
                    _.map(tempGroup, apiGroup => {
                        const temp = apiGroup['preExecution'];
                        for (let i = 0; i < temp.length; i++) {
                            apiGroup['preExecution'][i] = {
                                apiId: apiGroup['preExecution'][i],
                                apiName: this.nameFromId.transform(
                                    apiGroup['preExecution'][i],
                                    this.allAPI,
                                    '_id',
                                    'apiName'
                                )
                            };
                        }
                    });

                    _.map(tempGroup, apiGroup => {
                        const temp1 = apiGroup['postExecution'];
                        for (let j = 0; j < temp1.length; j++) {
                            apiGroup['postExecution'][j] = {
                                apiId: apiGroup['postExecution'][j],
                                apiName: this.nameFromId.transform(
                                    apiGroup['postExecution'][j],
                                    this.allAPI,
                                    '_id',
                                    'apiName'
                                )
                            };
                        }
                    });
                    this.allAPIGroup = _.cloneDeep(tempGroup);

                    this.allGroupName = [];
                    const apiCount = _.countBy(this.allAPI, 'apiGroupId');
                    console.log("apllapi>>>>>>", this.allAPI);
                    this.allAPIGroup.forEach(apiGroup => {
                        console.log('==========================');
                        console.log('apiGroup=================', apiGroup);
                        let temp = this.allAPI.filter(api => {


                            return api['apiGroupId'] == apiGroup['_id']
                        });
                        console.log('temp************', temp);
                        let apiNames = temp.map(api => api['apiName']);
                        console.log('apiNames************', apiNames);
                        apiGroup['apiNames'] = [];
                        apiNames.forEach(apiName => {
                            apiGroup['apiNames'].push({ "No": 1, "apiName": apiName });
                        });
                        apiGroup['count'] = apiNames.length;
                        apiGroup['target'] = temp;
                        this.allGroupName.push(apiGroup['name']);
                    });

                    const reversedData = [...this.allAPIGroup].reverse();
                    console.log('Reversed allAPIGroup:', reversedData, typeof reversedData);
                    console.log('source:', this.source, typeof this.source);
                    if (this.source && reversedData.length > 0) {
                        this.source.load(reversedData);
                    } else {
                        console.error('source is not initialized or reversedData is empty');
                    }
                    this.cd.detectChanges();
                }
            }
            ,
            error: (err) => {
                console.error('Error:::::', err);
            },
            complete: () => {
                console.log('Complete');
            }
        });
    }

    /**
     * Renewal function
     */
    refresh() {
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        this.source.load(this.allAPIGroup);
    }


    /**
     * Add Group Form
     */

    addGroup() {
        // this.dialog.open(AddAPIGroupComponent, {
        //     width: '750px',
        //     data: {
        //         selectedTeam: this.selectedTeam,
        //         allAPIGroup: this.allAPIGroup,
        //         allAPIGroupName: this.allGroupName
        //     }
        // });
        // this.apiService.selectedTeam.next(this.selectedTeam);
        // this.apiService.allAPIGroup.next(this.allAPIGroup);
        // this.apiService.allAPIGroupName.next(this.allGroupName);
        this.router.navigate(['./add'], { relativeTo: this.activeUrl });
    }

    /**
     * Edit group form
     * @param event .
     */

    editAPIGroup(event) {
        // this.dialog.open(EditAPIGroupComponent, {
        //     width: '750px',
        //     data: {
        //         selectedAPIGroup: event.data,
        //         selectedTeam: this.selectedTeam,
        //         allAPIGroup: this.allAPIGroup,
        //         allAPIGroupName: this.allGroupName
        //     },
        //     height: '500px'
        // });
        const key = 'api-group';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.apiService.selectedAPIGroup.next(event.data);
        this.apiService.selectedTeam.next(this.selectedTeam);
        this.apiService.allAPIGroup.next(this.allAPIGroup);
        this.apiService.allAPIGroupName.next(this.allGroupName);
        this.router.navigate(['./edit'], { relativeTo: this.activeUrl });
    }

    /**
     * Delete Group Confirmation API
     * @param deleteEvent .
     */

    deleteGroupConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'API Group',
                successText: `Deleting will remove the API Group and this action can't be reversed.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot delete API Group as ${deleteEvent.data.count} API(s) using this group. Remove those API(s) to proceed. `,
                data: deleteEvent.data,
                targetName: 'API',
                targetFields: ['apiName', 'apiId']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub4 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteGroup(deleteEvent);
            }
        });
    }

    /**
     * Delete a group
     * @param deleteEvent .
     */

    deleteGroup(deleteEvent) {
        this.dataService.loading.next(true);
        this.sub5 = this.apiService.deleteAPIGroup(deleteEvent.data).subscribe(
            data => {
                this.dataService.loading.next(false);
                if (data) {
                    this.dataService.getAPIData().next(data);
                    this.snackBar.open('API Group Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Deleting API Group', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                if (!event.url.startsWith('/pages/api-inventory/group')) {
                    const key = 'api-group';
                    this.tableStateService.clearState(key);
                }
            }
        });
        const key = 'api-group';
        const { filterState, currentPage } = this.tableStateService.getState(key);
        this.source.load(this.allAPIGroup).then(() => {
            this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
        });
        if (filterState.length > 0) {
            this.source.setFilter(filterState, true);
        }
        const currentUser = this.dataService.getCurrentUser();
        if (currentUser && (currentUser['role'] === 'user' || currentUser['role'] === 'guest')) {
            this.permissionDenied = true;
            this.settings.actions.delete = false;
            this.settings.actions.edit = false;
        }
    }

    ngOnDestroy() {
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
