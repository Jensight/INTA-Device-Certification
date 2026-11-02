import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import * as _ from 'lodash';
import { ApiService } from '../../../@core/services/api.service';
import { DataService } from '../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../@core/services/testcase-inventory.service';
import { LimitToPipe } from '../../../@shared/pipes/limit-to.pipe';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { APINameDisplayComponent } from '../../../@shared/components/api-name-display/api-name-display.component';
import { ToastrService } from 'ngx-toastr';
import { TableStateService } from 'src/app/@core/services/table-state.service';



@Component({
    selector: 'app-testcase',
    templateUrl: './testcase.component.html',
    styleUrls: ['./testcase.component.scss'],
    providers: [LimitToPipe]
})
export class TestCaseComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public allModules = [];
    public allTestsuite = [];
    public allTestgroup = [];
    public allTestcases = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;
    sub9;
    sub10;
    allAPI = [];
    deleteTestcaseValue: boolean;
    selectedRows: any;
    updateJiraFlag: boolean = false;
    public settings = {
        selectMode: '',//this.dataService.getTeamDashBoardConfJira() , //'multi'
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
            edit: false,
            delete: false,
            position: 'right',
            custom: [
            ],
        },
        columns: {
            displayId: {
                title: 'Id',
                type: 'string',
                class: 'text-center',
                width: '100px',
                renderComponent: ToolTipDisplayComponent,
                filterFunction(cell: string, search: string): boolean {
                    if (!search || search.trim() === '') {
                        return true;
                    }
                    const searchTerm = search.trim();
                    if (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 1) {
                        const exactTerm = searchTerm.substring(1, searchTerm.length - 1);
                        return cell.toLowerCase() === exactTerm.toLowerCase();
                    }
                    return cell.toLowerCase().includes(searchTerm.toLowerCase());
                },
            },            tcName: {
                title: 'Name',
                type: 'custom',
                class: 'text-center',
                width: '140px',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                },
                valuePrepareFunction: data => {
                    return data;
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
                },
                filterFunction(cell: string, search: string): boolean {
                    if (cell.toLowerCase().includes(search.toLowerCase())) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            testSuiteName: {
                title: 'Test Suite',
                type: 'string',
                class: 'text-center',
                width: '120px',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                },
                valuePrepareFunction: data => {
                    return data;
                },
                filterFunction: (cell: any, search: any) => {
                    const searchString = search
                        .split(',')
                        .map(a => a.trim())
                        .filter(b => b != '');
                    if (searchString.length == 0) {
                        return true;
                    }
                    const interSectArray = _.intersectionWith(cell, searchString, (c, d) => {
                        if (typeof c === 'string' && typeof d === 'string') {
                            if (c.toLowerCase().includes(d.toLowerCase())) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (interSectArray.length == searchString.length) {
                        return true;
                    }
                    return false;
                }
            },
            tcGroupId: {
                title: 'Test Group',
                type: 'custom',
                class: 'text-center',
                width: '115px',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                },
                valuePrepareFunction: data => {
                    return this.getGroupFromId(data);
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    if (this.getGroupFromId(a).localeCompare(this.getGroupFromId(b)) < 0) {
                        return -1 * direction;
                    }
                    if (this.getGroupFromId(a).localeCompare(this.getGroupFromId(b)) > 0) {
                        return direction;
                    }
                    return 0;
                },
                filterFunction: (cell: any, search: string) => {
                    let id = this.getGroupFromId(cell);

                    if (id.toLowerCase().includes(search.toLowerCase())) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            apiName: {
                title: 'API Names',
                type: 'custom',
                class: 'text-center',
                renderComponent: APINameDisplayComponent,
                componentInitFunction: (instance: APINameDisplayComponent, cell: Cell) => {
                    APINameDisplayComponent.componentInit(instance, cell, 150);
                },
                valuePrepareFunction: data => {
                    return data;
                },
                filterFunction: (cell: any, search: any) => {
                    const searchString = search
                        .split(',')
                        .map(a => a.trim())
                        .filter(b => b != '');
                    if (searchString.length == 0) {
                        return true;
                    }
                    const interSectArray = _.intersectionWith(cell, searchString, (c, d) => {
                        if (typeof c === 'string' && typeof d === 'string') {
                            if (c.toLowerCase().includes(d.toLowerCase())) {
                                return true;
                            }
                        }
                        return false;
                    });
                    if (interSectArray.length == searchString.length) {
                        return true;
                    }
                    return false;
                }
            }
        }
    };

    source: LocalDataSource = new LocalDataSource();
    permissionDenied: boolean = false;
    constructor(
        private limitTo: LimitToPipe,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private apiService: ApiService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private activeUrl: ActivatedRoute,
        private toastr: ToastrService,
        private tableStateService: TableStateService,

    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                var confd = this.dataService.getTeamDashBoardConfig(team);
                if (confd.enable_jira_key_issue_update && confd.enable_jira_key_issue_update == true) {
                    this.updateJiraFlag = true
                    this.settings.selectMode = 'multi';
                } else {
                    this.updateJiraFlag = false;
                }
            }
        });

        this.sub2 = this.dataService.getTCModules().subscribe(module => {
            if (module) {
                this.allModules = module;
                this.loadTestSuite();
            }
        });
        this.deleteTestcaseValue = this.dataService.deleteActions();
        if (this.deleteTestcaseValue === true) {
            this.settings.actions.custom.push(
                {
                    name: 'Download',
                    title: '<i class="fa fa-download"  title="download"></i>',
                    class: 'Download',
                },
                {
                    name: 'Clone',
                    title: '<i class="fa fa-clone"  title="clone"></i>',
                    class: "Clone",

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
            this.settings.actions.custom.push(
                {
                    name: 'Download',
                    title: '<i class="fa fa-download"  title="download"></i>',
                    class: 'Download',
                },
                {
                    name: 'Clone',
                    title: '<i class="fa fa-clone"  title="clone"></i>',
                    class: "Clone",

                },
                {
                    name: 'Edit',
                    title: '<i class="fa fa-pencil" title="edit"></i>'
                });

        }
        this.settings = Object.assign({}, this.settings);
        if (this.dataService.getCurrentUser()['role'] === 'user') {
            this.settings.actions.delete = true;
            this.settings.actions.custom.push({
                name: 'Delete',
                title: '<i class="fa fa-trash-o" title="delete"></i>',
                confirmDelete: true
            });
        } else if (this.dataService.getCurrentUser()['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.edit = false;
            this.settings.actions.delete = false;
            this.settings.actions.custom.splice(1, 3);
        }
    }

    /**
     * Get All Data Function used to get all available testcase data from backend
     * @param team .
     */

    getAllData(team) {
        this.sub10 = this.apiService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getAPIData().next(data);
            }
        });
    }

    /**
     * Load Test suit function
     */

    loadTestSuite() {
        this.sub3 = this.dataService.getTestSuites().subscribe(ts => {
            if (ts) {
                this.allTestsuite = ts;
                this.loadTestGroup();
            }
        });

    }

    /**
     * Load Test group function
     */

    loadTestGroup() {
        this.sub4 = this.dataService.getTestGroup().subscribe(tg => {
            if (tg) {
                this.allTestgroup = tg;
                this.loadAPI();
            }
        });
    }

    /**
     * Load API Function
     */

    loadAPI() {
        if (this.sub8) {
            this.sub8.unsubscribe();
        }

        this.sub8 = this.dataService.getAllAPI().subscribe(apiData => {
            if (apiData) {
                this.allAPI = apiData;
                this.loadTestCase();
            } else {

                if (this.sub9) {
                    this.sub9.unsubscribe();
                }
                this.sub9 = this.dataService.selectedTeam.subscribe(team => {
                    if (team) {
                        this.getAllData(team);

                    }
                });
            }
        });
    }

    onCustom(event) {

        if (event.action == 'Download') {
            this.downloadTestcase(event)
        }
        else if (event.action == 'Clone') {
            this.cloneTestcase(event)
        }
        else if (event.action == "Edit") {
            this.editTestcase(event);
        }
        else if (event.action == "Delete") {
            this.deleteTestcaseConfirmation(event)
        }
    }

    /**
     * Load testcase function
     */

    loadTestCase() {
        this.sub5 = this.dataService.getTestCases().subscribe(tc => {
            if (tc) {
                const testCaseTestSuiteNames = [];
                this.allTestcases = _.cloneDeep(tc);
                // this.allTestsuite.forEach(testSuite => {
                //     testSuite.testCases.forEach(testcaseid => {
                //         const testcase = _.find(this.allTestcases, { _id: testcaseid });
                //         testcase.testSuiteName = testSuite.testSuiteName;
                //     });
                // });

                this.allTestcases.forEach(element => {
                    element.displayId = element.jiraKey ? element.jiraKey : element.tcId
                    const testCaseTestSuiteNames = [];
                    this.allTestsuite.forEach(testSuite => {
                        if (testSuite.testCases.includes(element._id)) {
                            testCaseTestSuiteNames.push(testSuite.testSuiteName);
                        }

                    });
                    element.testSuiteName = testCaseTestSuiteNames.length > 0 ? _.uniq(testCaseTestSuiteNames) :
                        ['Not Mapped'];
                });
                this.loadAPIName();
                const key = 'testcase';
                    const { filterState, currentPage } = this.tableStateService.getState(key);
                    this.source.load(this.allTestcases).then(() => {
                        this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
                    });
                    if (filterState.length > 0) {
                        this.source.setFilter(filterState, true);
                    }
                // this.source.load(this.allTestcases);
            }

        });
    }

    /**
     * Load API Name function
     */
    loadAPIName() {
        this.allTestcases.forEach(element => {
            const testCaseAPINames = [];
            for (let i = 0; i < element['testSteps'].length; i++) {
                // Skip comment steps - they don't have api_id
                if (element['testSteps'][i]['isComment'] === true) {
                    continue;
                }
                
                this.allAPI.forEach(apiAvailable => {
                    if (element['testSteps'][i]['api_id'] && element['testSteps'][i]['api_id'].includes(apiAvailable['_id'])) {
                        element['testSteps'][i].apiName = apiAvailable['apiName'];
                        testCaseAPINames.push(apiAvailable['apiName']);
                    }
                });
            }
            element.apiName = _.uniq(testCaseAPINames);
        });
    }

    /**
     * Get Group From ID Function
     * @param id .
     */

    getGroupFromId(id) {
        return _.filter(this.allTestgroup, function (data) {
            return data['_id'] === id;
        })[0]['testGroupName'];
    }
    /**
     * Clone Testcase function
     * @param event .
     */
    cloneTestcase(event) {
        const key = 'testcase';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.tcInventoryService.selectedTestcase.next(_.cloneDeep(event.data));
        this.router.navigate(['./clone'], { relativeTo: this.activeUrl });
    }
    /**
     * Edit Testcase function to modify testcase
     * @param event .
     */
    editTestcase(event) {
        const key = 'testcase';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.tcInventoryService.selectedTestcase.next(_.cloneDeep(event.data));
        this.router.navigate(['./edit'], { relativeTo: this.activeUrl });
    }

    /**
 * Clone Testcase function
 * @param event .
 */
    downloadTestcase(event) {
        this.tcInventoryService.downloadLogsForTestcase(event.data);
    }

    /**
     * Delete Testcase confirmation.
     * @param deleteEvent .
     */

    deleteTestcaseConfirmation(deleteEvent) {
        console.log('delete event', deleteEvent);
        const testcaseId = deleteEvent.data._id;
        const mappedSuites = this.allTestsuite.filter(suite =>
            suite.testCases && suite.testCases.some(tc => {
                const tcId = typeof tc === 'string' ? tc : tc?._id;
                return tcId === testcaseId;
            })
        );
        const isMappedToSuite = mappedSuites.length > 0;

        let message;
        let mappedSuiteNames = null;
        if (isMappedToSuite) {
            mappedSuiteNames = mappedSuites.map(s => s.testSuiteName);
            message = 'Cannot delete Testcase as it is mapped to Test Suite(s):';
        } else if (deleteEvent.data.jiraKey) {
            message = "The Automated Testcase being deleted seems to be part of Jira Test Case Inventory, kindly ensure to remove the corresponding Jira Test Case if required"
        } else {
            message = 'Deleting will remove the  Testcase. ' + "This action can't be reversed. Are you want to Proceed?";
        }
        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            maxHeight: '80vh',
            data: {
                name: 'Testcase',
                text: message,
                action: 'Delete',
                showCloseButton: isMappedToSuite,
                mappedSuiteNames: mappedSuiteNames
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub6 = dialogRef.afterClosed().subscribe(result => {
            if (result === true && !isMappedToSuite) {
                this.deleteTestcase(deleteEvent);
            }
        });
    }

    /**
     * Delete testcase from backend using API call
     * @param deleteEvent .
     */

    deleteTestcase(deleteEvent) {
        this.dataService.loading.next(true);
        this.sub7 = this.tcInventoryService.deleteTestcase({ _id: deleteEvent.data._id }).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testcase Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Deleting Testcase', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                if (!event.url.startsWith('/pages/testcase-inventory/testcase')) {
                    const key = 'api';
                    this.tableStateService.clearState(key);
                }
            }
        });

        //Sort Data
        const sortData = this.dataService.getTestcaseSort();
        if (sortData) {
            this.source.setSort(sortData);
        }
    }

    /*
* Set Sort Data
*/

    setSortData() {
        this.dataService.storeTestcaseSort(this.source.getSort());
    }


    destroy() {
    }

    // UserRowSelected Event handler
    onRowSelect(event) {
        this.selectedRows = event.selected;
    }

    loading: boolean = false;
    // Get Selected button click handler
    onClick() {
        // It will console all the selected rows
        this.loading = true;
        let selectedTC = [];
        selectedTC = this.selectedRows;
        selectedTC.forEach((el: any) => {
            delete el['apiName'];
            delete el['testSuiteName'];
        })
        this.tcInventoryService.updateTCForJiraIssueID(selectedTC).subscribe((data: any) => {
            //console.log('data => ', data);
            if (data.length > 0) {
                data.forEach(el => {
                    this.loading = false;
                    if (el.status == 'pass') {
                        this.toastr.success(el.key + ' Usecase Jira Issue id updated Successfully', "Success", {
                            timeOut: 5000,
                            closeButton: true,
                        })
                    } else {
                        this.toastr.error(el.key + ' ' + el.err, 'Error', {
                            timeOut: 5000,
                            closeButton: true,
                        })
                    }
                });
            } else {
                this.loading = false;
                this.toastr.error('Not possible to update because of Network Connection Issue', 'Error');
            }
        }, err => {
            this.loading = false;
            console.log('err => ', err);
            this.toastr.error('Not possible to update because of Network Connection Issue', 'Error');
        })
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
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
        if (this.sub9) {
            this.sub9.unsubscribe();
        }
        if (this.sub10) {
            this.sub10.unsubscribe();
        }
    }
}
