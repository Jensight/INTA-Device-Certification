import { Component, OnInit, OnDestroy, ElementRef, Renderer2 } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { StatusDisplayComponent } from './status-display/status.display.component';
import { DatePipe, formatDate } from '@angular/common';
import { ActionButtonsComponent } from './action-buttons/action-buttons.component';
import { TestcaseStatusCountComponent } from './testcase-status-count/testcase-status-count.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { RegressionDisplayComponent } from './regression-name-display/regression-name-display.component';
import { TestLabService } from '../../../@core/services/test-lab.service';
import * as _ from 'lodash';
import { RegressionDeleteComponent } from '../../../@shared/components/regression-delete/regression-delete.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableStateService } from '../../../@core/services/table-state.service'

import * as moment from 'moment';
import { DashboardConfigComponent } from '../../settings/system-configuration/dashboard-config/dashboard-config.component';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { ViewTargetComponent } from '../../../@shared/components/api-inventory-delete/view-target/view-target.component';
import { ReservationService } from '../../../@core/services/reservation.service';
@Component({
    selector: 'app-regression-list',
    templateUrl: './regression-list.component.html',
    styleUrls: ['./regression-list.component.scss'],
    providers: [DatePipe]
})
export class RegressionListComponent implements OnInit, OnDestroy {
    public allRegressions: any[] = [];

    public userData: any;
    selectedTeam: any;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Regressions Found',
        pager: {
            perPage: 10
        },

        mode: 'external',
        actions: false,
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


        selectMode: '',
        columns: {
            regName: {
                title: 'Regression Name',
                type: 'custom',
                class: 'text-center',
                // width: '380px',
                renderComponent: RegressionDisplayComponent,
                componentInitFunction: (instance: RegressionDisplayComponent, cell: Cell) => {
                    instance.rowData = cell.getRow().getData();
                    instance.source = this.source; 
                    RegressionDisplayComponent.componentInit(instance, cell, 60, 'view-regression');
                }
            },
            user: {
                title: 'User',
                type: 'custom',
                class: 'text-center',
                filter: {
                    type: 'list',
                    config: {
                        selectText: 'Select',
                        list: [] as any[],
                    },
                },
                // class: 'text-center',
                // width: '140px',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 10);
                }

            },
            regStatus: {
                title: 'Status',
                type: 'custom',
                // width: '120px',
                class: 'text-center',
                renderComponent: StatusDisplayComponent,
                componentInitFunction: (instance: StatusDisplayComponent, cell: Cell) => {
                    StatusDisplayComponent.componentInit(instance, cell);
                    instance.openTestSuite = (row: any) => this.openTestSuiteDetails(row);
                },
                filterFunction: (cell?: any, search?: any) => {
                    if (!search) return true;
                    const cellValue = (cell || '').toString().toLowerCase().trim();
                    const searchWords = search.toString().toLowerCase().trim().split(/\s+/);
                    return searchWords.every((word: string) => cellValue.includes(word));
                },
                onComponentInitFunction: (instance: any) => {
                    instance.openTestSuite = (row: any) => this.openTestSuiteDetails(row);
                }
            },
            passTC: {
                title: 'TC',
                type: 'custom',
                // width: '100px',
                class: 'text-center',
                isFilterable: false,
                renderComponent: TestcaseStatusCountComponent,
                componentInitFunction: TestcaseStatusCountComponent.componentInit,
            },
            startTime: {
                title: 'Start Time (UTC)',
                type: 'string',
                width: '180px',
                class: 'text-center',
                sort: false, // disable built-in sort so custom ordering keeps Scheduled at end
                valuePrepareFunction: (data: any) => {
                    return formatDate(data, 'dd, MMM, yyyy h:mm:ss a', 'en_US')
                }, filterFunction: (data?: any, search?: any) => {
                    if (formatDate(data, 'dd, MMM, yyyy h:mm:ss a', 'en_US').toLowerCase().indexOf(search.toLowerCase()) > -1) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            options: {
                title: 'Options',
                filter: false,
                // width: '220px',
                sort: false,
                type: 'custom',
                class: 'text-center',
                isFilterable: false,
                renderComponent: ActionButtonsComponent,
                componentInitFunction: (instance: ActionButtonsComponent, cell: Cell) => {
                    ActionButtonsComponent.componentInit(instance, cell, this.startdt, this.enddt);
                }
            }
        }
    };
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/regression/list',
            label: 'Regression List'
        },
    ]
    source: LocalDataSource = new LocalDataSource();
    sub1: any;
    sub2: any;
    sub3: any;
    sub4: any;
    filterState: any[] = [];
    currentPage: number = 1;
    userList: any[] = [];
    multiDelete: any;
    selectedRows: any;
    allYears: any[] = [];
    private savedTableState: any = null; // To store filter and pagination state
    private initialStateApplied: boolean = false; // Flag to apply saved table state only once
    selectedTimeFrame: any = 'current';
    startdt: any;
    enddt: any;
    currYrStart: any;
    currYrEnd: any;
    inProgressRegs: any;
    isDeleteInProgressReg: boolean = false;
    showMultiDelButton: boolean = false;
    allTestCases: any[] = [];
    allTestSuites: any[] = [];
    scheduledRegressionCount: number = 0;
    constructor(private tlService: TestLabService, private dataService: DataService, private datePipe: DatePipe, private router: Router,
        private dialog: MatDialog, private snackBar: MatSnackBar, private e: ElementRef, private renderer2: Renderer2,
     private reservationService: ReservationService, private tableStateService: TableStateService) {
        const userDetails = this.dataService.getCurrentUser();
        this.userData = userDetails;
        // let settingsData = this.dataService.getSettingsData().value;
        // if(settingsData) {
        //     if(settingsData.dashboardConfig && settingsData.dashboardConfig.length > 0) {
        //         this.isDeleteInProgressReg = settingsData.dashboardConfig[0]?.deleteInProgressReg;
        //     }
        // };
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;

                //to get all the existing data 
                this.currYrStart = new Date();
                this.currYrStart.setFullYear(this.currYrStart.getFullYear() - 1);
                // this.currYrStart.setHours(0, 0, 0, 0);
                this.currYrEnd = new Date();
                this.currYrEnd.setDate(this.currYrEnd.getDate() + 1);
                console.log('curr yr end', this.currYrEnd);
                // this.currYrEnd.setHours(0, 0, 0, 0);
                this.startdt = this.currYrStart;
                this.enddt = this.currYrEnd;
                this.getAllRegression(this.currYrStart, this.currYrEnd);
            }
        });
        if (!this.allYears || this.allYears.length === 0) {
            this.dataService.getAllYears().subscribe(data => {
                this.allYears = data || [];
            });
        }
        this.multiDelete = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                var confd = this.dataService.getMultiDeleteRegData(team);
                if (confd && confd.multi_delete_regressions && confd.multi_delete_regressions == true) {
                    // this.updateJiraFlag = true
                    this.showMultiDelButton = true;
                    this.settings.selectMode = 'multi';
                    if (confd.deleteInProgressReg && confd.deleteInProgressReg == true) {
                        this.isDeleteInProgressReg = true;
                    } else {
                        this.isDeleteInProgressReg = false;
                    }
                } else {
                    this.showMultiDelButton = false;
                    this.settings.selectMode = '';
                    this.isDeleteInProgressReg = false;
                    // this.updateJiraFlag = false;
                }
                // Reassign settings to trigger change detection
                this.settings = Object.assign({}, this.settings);
            }
        });
        this.sub2 = this.dataService.getRegressionData().subscribe(data => {
            if (data) {
                this.allRegressions = this.scheduledRegressions(data);
                this.getAllScheduledRegressions();
                this.userList = this.allRegressions.map(function (el) { return el.user; }).filter(function (item, index, inputArray) {
                    return inputArray.indexOf(item) == index;
                });
                this.userList.forEach((el, index) => {
                    if (el == 'null' || el == null) {
                        this.userList.splice(index, 1);

                    }
                });
                this.userList.sort((a, b) => {
                    if (a.toLowerCase() > b.toLowerCase()) {
                        return 1;
                    }
                    if (a.toLowerCase() < b.toLowerCase()) {
                        return -1;
                    }
                    return 0;
                });
                this.userList = this.userList.map(data => {
                    return { 'value': data, 'title': data }
                });
                this.settings.columns.user.filter.config.list = this.userList;
                this.settings = Object.assign({}, this.settings);
                this.allRegressions.forEach((regData, index) => {
                    regData['sNo'] = index + 1;
                    regData.reg_download_id = regData.run_id;
                    // Set firstJobId from the first job's job_id for HTML logs view
                    if (regData.job && regData.job.length > 0 && regData.job[0].job_id) {
                        regData.firstJobId = regData.job[0].job_id;
                    }
                    if (regData.hasOwnProperty('tagName') && regData.tagName != '') {
                        regData['regName'] = regData.tagName;
                    } else {
                        regData['regName'] = regData.run_id;
                    }
                });
                this.source.load(this.allRegressions).then(() => {
                    // Apply saved table state (filter, pagination) only once after initial data load
                    if (!this.initialStateApplied) {
                        this.initialStateApplied = true;
                        const key = 'regression-list';
                        const { filterState, currentPage } = this.tableStateService.getState(key);
                        this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
                        if (filterState.length > 0) {
                            this.source.setFilter(filterState, true);
                        }
                    }
                });
            }
        });

        //Sort Data
        const sortData = this.dataService.getRegressionSort();
        if (sortData) {
            this.source.setSort(sortData);
        }
        // console.log(sortData,"sortdata")
        // this.source.setSort(sortData);

        this.source.onChanged().subscribe((changes) => { 
            if (changes.action === 'page' || changes.action === 'filter' || changes.action === 'sort') {
                console.log('page changed', changes.paging);
                var checkboxes = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
                checkboxes.forEach((ele: any, index: number) => {
                    ele.checked = false;
                });
                this.selectedRows = [];
                this.source.selectAllItems(false);
            }
        });
    }

    /**
     * Set Sort Data
     */

    setSortData() {
        this.dataService.storeRegressionSort(this.source.getSort());
    }

    getRegressionIntitalData() {
        this.dataService.loading.next(true)

        this.sub2 = this.tlService.getRegressionInitialData().subscribe(regressionData => {

            if (regressionData) {

                (this.dataService.getRegressionData() as any).next(regressionData);
            }
            this.dataService.loading.next(false);
        });
    }

    getAllRegression(startDate: any, endDate: any): void {
    this.dataService.loading.next(true);
    const stDate = new DatePipe('en-US').transform(startDate, 'yyyy-MM-ddTHH:mm:ss');
    const eDate = new DatePipe('en-US').transform(endDate, 'yyyy-MM-ddTHH:mm:ss');
    this.sub3 = this.tlService.getRegressionData(stDate, eDate, 'All').subscribe(regressionData => {
        if (regressionData) {
            let filteredData = Array.isArray(regressionData) ? regressionData : [];
            if (
                this.selectedTimeFrame !== 'current' &&
                this.selectedTimeFrame !== new Date().getFullYear().toString()
            ) {
                filteredData = filteredData.filter((reg: any) => reg.regStatus !== 'Scheduled');
            }
            // move Scheduled regressions to end before emitting
            filteredData = this.scheduledRegressions(filteredData);
            (this.dataService.getRegressionData() as any).next(filteredData);
            this.dataService.getRegressionData().subscribe(data => {
                if (data) {
                    this.inProgressRegs = this.allRegressions.filter(ele => {
                        return (ele['regStatus'] === 'in progress');
                    });
                    if (!(this.userData.username === "sysadmin" && this.isDeleteInProgressReg)) {
                        this.disableInProgressRegs();
                    }
                }
            });
        }
        this.dataService.loading.next(false);
    });
}

    private disableInProgressRegs(): void {
        setTimeout(() => {
            const checkboxes = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
            this.source.getElements().then(res => {
                res.forEach((ele: any, index: number) => {
                    if (ele['regStatus'] === 'in progress') {
                        checkboxes[index + 1].disabled = true;
                    }
                });
            });
        }, 200);
    }

    private scheduledRegressions(list: any[]): any[] {
        if (!Array.isArray(list)) return list;
        const scheduled: any[] = [];
        const otherRegressions: any[] = [];
        list.forEach(item => ((item?.regStatus || '').toLowerCase() === 'scheduled' ? scheduled : otherRegressions).push(item));
        otherRegressions.sort((a, b) => {
            const at = new Date(a.startTime || a.start_time || a.start_time_utc || 0).getTime();
            const bt = new Date(b.startTime || b.start_time || b.start_time_utc || 0).getTime();
            return bt - at;
        });
        scheduled.sort((a, b) => {
            const at = new Date(a.startTime || a.start_time || a.start_time_utc || 0).getTime();
            const bt = new Date(b.startTime || b.start_time || b.start_time_utc || 0).getTime();
            return at - bt; 
        });

        return [...otherRegressions, ...scheduled];
    }

        private getAllScheduledRegressions(): void {
        this.sub4 = this.reservationService.getScheduledRegressions().subscribe((response: any) => {
       
           if(response && response.status){
                console.log('scheduledReservations', response);
                this.scheduledRegressionCount = response.count;
           } else {
                this.scheduledRegressionCount = 0;
           }
        });
    }

    onMultiDelete(): void {
         var checkboxes = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
         //console.log('checkboxes', checkboxes);
            this.source.getElements().then(res => {
               // console.log('res', res);
            });
     //   console.log('selected rows', this.selectedRows);
        const inProgressRegs = this.selectedRows.filter((ele: any) => {
            return ele.regStatus === 'in progress';
        });
        const otherUserRegs = this.selectedRows.filter((ele: any) => {
            return (ele['user'] !== this.userData.username);
        });
        if ((inProgressRegs && inProgressRegs.length > 0) && !(this.userData.username === "sysadmin" && this.isDeleteInProgressReg)) {
            this.dialog.open(RegressionDeleteComponent, {
                width: '400px',
                data: {
                    name: 'Regression',
                    successText: `Selected Regression List contains In Progress Regression(s).
                    Please Unselect In Progress Regression(s)`,
                    action: 'Delete',
                    alert: true
                },
                minWidth: '700px',
                panelClass: 'app-full-bleed-dialog'
            });
        } else if (this.selectedRows.length > 10) {
            this.dialog.open(DashboardConfigComponent, {
                width: '400px',
                data: {
                    name: 'Dashboard',
                    successText: `You have selected more than 10 regression records.
                    Please revisit your selected records.`,
                    action: 'Delete',
                    alert: true
                },
                minWidth: '700px',
                panelClass: 'app-full-bleed-dialog'
            });    
        } else if (otherUserRegs && otherUserRegs.length > 0 && !(this.userData.username === "sysadmin")) {
            this.dialog.open(RegressionDeleteComponent, {
                width: '400px',
                data: {
                    name: 'Regression',
                    successText: `Selected Regression List contains Regression(s) owned by other users.
                    Please Unselect Regression(s) owned by other users`,
                    action: 'Delete',
                    alert: true
                },
                minWidth: '700px',
                panelClass: 'app-full-bleed-dialog'
            });
        } else {
            const dialogRef = this.dialog.open(RegressionDeleteComponent, {
                width: '400px',
                data: {
                    name: 'Regression',
                    successText: `Deleting will remove the Regression List and this action can't be reversed.
            Are you sure to delete <span class="bold-red">${this.selectedRows.length}</span> regression record(s)?`,
                    action: 'Delete',
                    alert: false
                },
                minWidth: '700px',
                panelClass: 'app-full-bleed-dialog'
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result === true) {
                    this.deleteRegression();
                }
            });
        }
    }

    deleteRegression(): void {
        this.dataService.loading.next(true);
        const reservationdetails = this.selectedRows.filter((ele: any) => {
            return (ele['regStatus'] === 'Scheduled');
        });
        const regressiondetails = this.selectedRows.filter((ele: any) => {
            return (ele['regStatus'] !== 'Scheduled');
        });
        const reservationIds = reservationdetails.map((ele: any) => ele._id);
        const regressiondIds = regressiondetails.map((ele: any) => ele._id);
        const startDate = moment().subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss');
        const endDate = moment().format('YYYY-MM-DDTHH:mm:ss');;
        const data = { regression: [], reservation: [], startDate, endDate };
        if (reservationIds && reservationIds.length > 0) {
            data.reservation = reservationIds;
        }
        if (regressiondIds && regressiondIds.length > 0) {
            data.regression = regressiondIds;
        }
        this.tlService.deleteMutliRegression(data).subscribe(
            d => {
                if (d) {
                    this.snackBar.open('Regressions Deleted Successfully', 'ok', { duration: 5000 });
                    (this.dataService.getRegressionData() as any).next(d);
                    this.tlService.getStuckedRegression().subscribe((res: any) => {
                        if (res && res.data && res.data.length > 0) {
                            this.dataService.hasStuckRegression.next(true);
                        } else {
                            this.dataService.hasStuckRegression.next(false);
                        }
                    });
                    this.disableCheckboxes();
                } else {
                    this.snackBar.open('Failed Deleting Regressions.', 'Try Again', { duration: 5000 });
                }
                this.dataService.loading.next(false);
            },
            e => {
                this.snackBar.open('Failed Deleting Regressions.', 'Try Again', { duration: 5000 });
                this.dataService.loading.next(false);
            },
        );

    }
    // UserRowSelected Event handler
    onRowSelect(event: any): void {
        setTimeout(() => {
           // console.log('event sel', event.selected);
            var checkboxes = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
            this.source.getElements().then(async (res: any) => {
                const currentPageRunIds = res.map((el: any) => el.run_id);
                event.selected = event.selected.filter((sel: any) => currentPageRunIds.includes(sel.run_id));
                await this.source.selectAllItems(false);
                event.selected.forEach((item: any) => this.source.toggleItem(item, true));
                if (checkboxes.length > 0 && event.selected.length < res.length) {
                    checkboxes[0].checked = false;
                }

                res.forEach((ele: any, index: number) => {
                    if (ele['regStatus'] === 'in progress' && !(this.userData.username === "sysadmin" && this.isDeleteInProgressReg)) {
                        checkboxes[index + 1].checked = false;
                        this.source.toggleItem(ele, false);
                    }
                });

                if (!(this.userData.username === "sysadmin" && this.isDeleteInProgressReg)) {
                    event.selected = event.selected.filter((el: any) => el.regStatus !== 'in progress');
                    this.selectedRows = event.selected;
                }
                else {
                    this.selectedRows = event.selected;
                }
            });
        }, 50);
    }

    onTimeFrameChange(): void {
        var checkboxes = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
        checkboxes.forEach((ele: any, index: number) => {
            ele.checked = false;
        });
        this.selectedRows = [];
        if (this.selectedTimeFrame === 'current') {
            this.getAllRegression(this.currYrStart, this.currYrEnd);
        }
        else if (this.selectedTimeFrame === new Date().getFullYear().toString()) {
            this.startdt = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
            this.enddt = new Date();
            this.enddt.setDate(this.enddt.getDate() + 1);
            console.log('end date', this.enddt);
            this.getAllRegression(this.startdt, this.enddt);
        }
        else {
            this.startdt = new Date(parseInt(this.selectedTimeFrame), 0, 1);
            this.startdt.setHours(0, 0, 0, 0);
            this.enddt = new Date(parseInt(this.selectedTimeFrame), 11, 31);
            this.enddt.setHours(0, 0, 0, 0);
            this.getAllRegression(this.startdt, this.enddt);
        }

    }
    disableCheckboxes() {
        var checkbox = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
        checkbox[0].checked = false;
        this.dataService.getRegressionData().subscribe(data => {
            if (data) {
                const rowData = data;
                 this.selectedRows = [];
                // console.log('selected rows after delete', this.selectedRows, rowData);
                if (rowData['regStatus'] && rowData['regStatus'] === 'in progress') {
                    checkbox[0].disabled = true;
                }
            }
        })
    }

    ngOnInit(): void {
        this.dataService.getTestCases().subscribe(tc => { if (tc) { this.allTestCases = tc; } });
        this.dataService.getTestSuites().subscribe(ts => { if (ts) { this.allTestSuites = ts; } });
       const userRole = this.userData?.role;
        const confd = this.dataService.getMultiDeleteRegData(this.selectedTeam);
        const isMultiDeleteEnabled = confd && confd.multi_delete_regressions === true;
        if ((userRole === 'lead' || userRole === 'admin') && isMultiDeleteEnabled) {
            this.settings.selectMode = 'multi';
            this.showMultiDelButton = true;
        } else {
            this.settings.selectMode = '';
            this.showMultiDelButton = false;
        }
        this.settings = Object.assign({}, this.settings);
        
        // Initialize scheduled regression count from all years
        this.getAllScheduledRegressions();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                console.log('NavigationStart event.url:', event.url);
                if (!(event.url.startsWith('/pages/regression/')) || event.url === '/pages/regression/analysis') {                    
                    const key = 'regression-list'; 
                    this.tableStateService.clearState(key);
                }
            }
        });
        
        this.selectedTimeFrame = 'current';
        this.source.onChanged().subscribe((change) => {
            if (change.action === 'filter') {
                change.filter.forEach((ele) => {
                    const users = this.userList.map(function (el: any) { return el.value; })
                    if (ele.field === 'user' && !users.includes(ele.search)) {
                        ele.search = ''
                    }
                });

            }
            if (!(this.userData.username === "sysadmin" && this.isDeleteInProgressReg)) {
                this.disableInProgressRegs();
            }

        });
    }

    openTestSuiteDetails(row: any) {
        const details = (jobDetails: any[]) => {
            const testbedData = (jobDetails || []).map(j => ({ testbedName: j.testBedName, testCases: j.onExecution || [] }));
            const testcaseDetails: any[] = [];
            const suiteKeySet = new Set<string>();
            jobDetails.forEach(j => {
                (j.onExecution || []).forEach((tc: any) => {
                    const testCaseObj = !tc.tcName && tc.tcId ? this.allTestCases.find(t => t._id === tc.tcId) : null;
                    const testSuiteObj = this.allTestSuites.find(s => s._id === (tc.testSuiteId || tc.suiteId));
                    const testCaseName = tc.tcName || testCaseObj?.testCaseName || testCaseObj?.tcName || tc.tcId;
                    const testSuiteName = tc.testSuiteName || testSuiteObj?.testSuiteName;
                    testcaseDetails.push({ testbedName: j.testBedName, testSuiteName, testCaseName });
                    if (testSuiteName) suiteKeySet.add(j.testBedName + '||' + testSuiteName);
                });
            });
            const testsuiteDetails = Array.from(suiteKeySet).map(k => {
                const [testbedName, testSuiteName] = k.split('||');
                return { testbedName, testSuiteName };
            });
            this.dialog.open(ViewTargetComponent, {
                data: {
                    targetName: 'TestSuite Details',
                    testbedData,
                    testcaseDetails,
                    testsuiteDetails,
                    isTestbedView: true
                },
                width: '900px',
                autoFocus: false,
                panelClass: 'app-full-bleed-dialog'
            });
        };
        // if (row.jobDetails) {
        //     details(row.jobDetails);
        // } else {
            this.tlService.getFullRegression(row._id).subscribe((reg: any) => {
                const jobDetails = reg?.jobData?.job || reg?.job
                row.jobDetails = jobDetails;
                details(jobDetails);
            });
        // }
    }

    clearSavedTableState(): void {
        console.log('Clearing saved table state...');
        localStorage.removeItem('savedTableState');
        this.savedTableState = null;
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

    }
}
