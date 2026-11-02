import { Component, OnInit, OnDestroy } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from '../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../@core/services/testcase-inventory.service';
import * as _ from 'lodash';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { LimitToPipe } from '../../../@shared/pipes/limit-to.pipe';
import { AddTestSuiteComponent } from './add-testsuite/add-testsuite.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { EditTestSuiteComponent } from './edit-testsuite/edit-testsuite.component';
import { MapButtonComponent } from './map-button/map.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { NavigationStart, Router } from '@angular/router';
import { TableStateService } from 'src/app/@core/services/table-state.service';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { APIInventoryDeleteComponent } from 'src/app/@shared/components/api-inventory-delete/api-inventory-delete.component';

@Component({
    selector: 'app-testsuite',
    templateUrl: './testsuite.component.html',
    styleUrls: ['./testsuite.component.scss'],
    providers: [LimitToPipe]
})
export class TestSuiteComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public allModules = [];
    public allTestsuite = [];
    deleteTestsuiteValue: boolean = false;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Testsuite Found',
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
        // actions: {
        //     add: false,
        //     delete: this.deleteTestsuiteValue,
        //     edit: true,
        //     position: 'right'
        // },
        
        // edit: {
        //     editButtonContent: '<i class="fa fa-pencil"></i>'
        // },
        // delete: {
        //     deleteButtonContent: '<i class="fa fa-trash-o"></i>',
        //     confirmDelete: true
        // },
        columns: {
            testSuiteName: {
                title: 'Testsuite Name',
                type: 'custom',
                width: '450px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                  },
            },
            moduleId: {
                title: 'Testset',
                type: 'custom',
                width: '300px',
                class: 'text-center',
                valuePrepareFunction: data => {
                    return this.getModuleNameFromId(data);
                },
                filterFunction: (cell, search) => {
                    let temp = this.getModuleNameFromId(cell);
                    if (temp
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                        search === ''
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                },
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 25);
                  }
            },
            testCasesCount: {
                title: 'No of Testcases',
                type: 'custom',
                width: '220px',
                class: 'text-center',
                valuePrepareFunction: data => {
                    return data;
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'testsuite');
                  },

            },
            map: {
                title: 'Add/Remove TC',
                type: 'custom',
                width: '200px',
                class: 'text-center',
                filter: false,
                renderComponent: MapButtonComponent,
                componentInitFunction: (instance: MapButtonComponent, cell: Cell) => {
                    MapButtonComponent.componentInit(instance, cell);
                    instance.source = this.source;
                  }
            }
        }
    };

    source: LocalDataSource = new LocalDataSource();
    private savedTableState: any = null;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    permissionDenied: boolean = false;
    constructor(
        private limitTo: LimitToPipe,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private tableStateService: TableStateService,
        private testLabService: TestLabService
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub2 = this.dataService.getTCModules().subscribe(module => {
            if (module) {
                this.allModules = module;
                this.loadTestSuite();
            }
        });
        this.deleteTestsuiteValue = this.dataService.deleteActions();
        // this.settings.actions.delete = this.deleteTestsuiteValue;
        this.settings = Object.assign({}, this.settings);

        //Added for test Suite clone
        if (this.deleteTestsuiteValue === true) {
            this.settings.actions.custom.push(
            {
                name: 'Clone',
                title: '<i class="fa fa-clone" title="clone"></i>',
                class: 'Clone',

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
                name: 'Clone',
                title: '<i class="fa fa-clone" title="clone"></i>',
                class: 'Clone',

            },
            {
                name: 'Edit',
                title: '<i class="fa fa-pencil" title="edit"></i>'
            });  
        }
        if(this.dataService.getCurrentUser()['role'] === 'lead') {
            this.settings.actions.delete = false;
            this.settings.actions.custom.pop();
        } else if(this.dataService.getCurrentUser()['role'] === 'user' || this.dataService.getCurrentUser()['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.edit = false;
            this.settings.actions.delete = false;
            this.settings.actions.custom = [];
        }
    }

    onCustom(event) {
        if (event.action == 'Clone') {
            this.editTestSuite(event)
        }
        else if (event.action == 'Edit') {
            this.editTestSuite(event);
        }
        else if (event.action == 'Delete') {
            this.deleteTestSuiteConfirmation(event)
        }
      }

    /**
     * Load Test Suit function
     */

    loadTestSuite() {
        this.dataService.getTcInventoryData().subscribe(data => {
            if (!data) {
                this.sub2 = this.tcInventoryService.getAllData().subscribe(allData => {
                    if (allData) {
                        const normalizedAllData = Array.isArray(allData) ? allData : [];
                        this.dataService.getTcInventoryData().next(normalizedAllData);
                        this.loadTestSuiteWithTestCases(normalizedAllData);
                    }
                });
            }
            else{
                const normalizedData = Array.isArray(data) ? data : [];
                this.loadTestSuiteWithTestCases(normalizedData);
            }
        });   
    }

    private loadTestSuiteWithTestCases(testCasesData: any[]) {
        this.sub3 = this.dataService.getTestSuites().subscribe(ts => {
            if (ts) {
                for (let i = 0; i < ts.length; i++) {
                    ts[i]['testCasesCount'] = ts[i]['testCases'] ? ts[i]['testCases'].length : 0;
                    ts[i]['testCaseNames'] = [];
                    ts[i]['testCaseIds'] = [];
                    for (let j = 0; j < ts[i]['testCases'].length; j++) {
                        const tcRef = ts[i]['testCases'][j];
                        const tcId = typeof tcRef === 'object' ? tcRef._id : tcRef;
                        let temp = testCasesData.filter(tc => tc['_id'] == tcId);
                        if (temp && temp.length > 0) {
                            const jiraKey = temp[0]['jiraKey'];
                            const displayId = (jiraKey && jiraKey !== null && jiraKey !== '' && jiraKey.toLowerCase() !== 'na') 
                                ? jiraKey 
                                : temp[0]['tcId'];
                            ts[i]['testCaseNames'].push({ "tcId": displayId, "testCaseName": temp[0]['tcName'] });
                            ts[i]['testCaseIds'].push({ "tcId": displayId });
                        }
                    }

                }
                  
                console.log("ts", ts)
                const key = 'testSuiteTableState';
                const { filterState, currentPage } = this.tableStateService.getState(key);
                this.source.load(ts).then(() => {
                    this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
                });
                if (filterState.length > 0) {
                    this.source.setFilter(filterState, true);
                }

                // this.source.load(ts);
            }
        });
    }

    /**
     * Get Module Name from ID
     * @param id .
     */

    getModuleNameFromId(id) {
        if(typeof id == 'string') {
            return _.filter(this.allModules, function (data) {
                return data['_id'] === id;
            })[0]['moduleName'];
        } else {
            var temp = '';
            var count = 0;
            id.forEach(e => {
                _.filter(this.allModules, function(data){
                    if(data['_id'] == e) {
                        if((id.length-1) == count){
                            temp = temp + data['moduleName']
                            return temp;
                        } else {
                            temp = temp + data['moduleName'] + ', ';
                            count++;
                        }
                    }
                    
                })
            });
            return temp;
        }
        
    }

    /**
     * Add testsuit function to open add testsuit form
     */

    addTestsuite() {
        this.dialog.open(AddTestSuiteComponent, {
            data: this.selectedTeam,
            width: '450px'
        });
    }

    /**
     * Edit testsuit function to open edit testsuit form
     */

    editTestSuite(event) {
        this.dialog.open(EditTestSuiteComponent, {
            data: {
                selectedTeam: this.selectedTeam,
                selectedTestSuite: _.cloneDeep(event.data),
                action: event.action
            },
            width: '450px'
        });
    }

    /**
     * Delete testsuit confirmation function
     * @param deleteEvent .
     */

    deleteTestSuiteConfirmation(deleteEvent) {
        this.testLabService.getAutoRegressionDataFromDB().subscribe(autoRegData => {
            const autoRegressionArray = autoRegData['autoRegressionData'] || [];
            const mappedTestBeds = autoRegressionArray.filter(record => {
                if (Array.isArray(record.TestSuiteId)) {
                    return record.TestSuiteId.includes(deleteEvent.data._id);
                }
                return record.TestSuiteId === deleteEvent.data._id;
            });
            const count = mappedTestBeds.length;
            const testBedNames = mappedTestBeds.map(tb => ({ testBedName: tb.TestBed }));
            const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
                width: '500px',
                data: {

                    name: 'Testsuite',
                    action: 'Delete',
                    successText: `Are you sure you want to delete the Testsuite "<strong>${deleteEvent.data.testSuiteName}</strong>"? This action can't be reversed. Do you want to proceed?`,
                    errorText: `Cannot delete Testsuite "<strong>${deleteEvent.data.testSuiteName}</strong>" as ${count} TestBed(s) are using this Testsuite. Remove those TestBed(s) to proceed.`,
                    data: {
                        ...deleteEvent.data,
                        count: count,
                        testBedNames: testBedNames
                    },
                    testSuiteDelete: true,
                    targetName: 'TestBed',
                    targetFields: ['testBedName'],
                },
                panelClass: 'app-full-bleed-dialog'
            });
            this.sub4 = dialogRef.afterClosed().subscribe(result => {
                if (result === true && count === 0) {
                    this.deleteTestSuite(deleteEvent);
                }
            });
        });
    }

    /**
     * Delete Test suit function
     * @param deleteEvent .
     */

    deleteTestSuite(deleteEvent) {
        this.dataService.loading.next(true)
        this.sub5 = this.tcInventoryService.delete( { _id: deleteEvent.data._id }).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testsuite Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Deleting Testsuite', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                console.log('NavigationStart event.url:', event.url);
                if (!event.url.startsWith('/pages/testcase-inventory/testsuite')) {
                    const key = 'testSuiteTableState';
                    this.tableStateService.clearState(key);
                }
            }
        });

        //Sort Data
        const sortData = this.dataService.getTestsuitSort();
        if(sortData){
            this.source.setSort(sortData);
            }
    }

    /**
     * Set Sort Data
     */
   

    setSortData() {
        this.dataService.storeTestsuitSort(this.source.getSort());
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
