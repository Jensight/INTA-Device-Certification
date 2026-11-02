import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestCaseInventoryService } from '../../../@core/services/testcase-inventory.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from '../../../@core/services/data.service';
import * as _ from 'lodash';
import { AddModuleComponent } from './add-module/add-module.component';
import { EditModuleComponent } from './edit-module/edit-module.component';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { Action } from 'rxjs/internal/scheduler/Action';
import { APIInventoryDeleteComponent } from 'src/app/@shared/components/api-inventory-delete/api-inventory-delete.component';
@Component({
    selector: 'app-module',
    templateUrl: './module.component.html',
    styleUrls: ['./module.component.scss']
})
export class ModuleComponent implements OnInit, OnDestroy {
    @Input() rowData: any;
    public selectedTeam;
    public allModules = [];
    public allTestsuite = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    deleteModuleValue:boolean=false;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Modules Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete:this.deleteModuleValue,
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
            moduleName: {
                title: 'Testset Name',
                type: 'custom',
                width: '500px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                  },
            },
            count: {
                title: 'Testsuite Count',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                valuePrepareFunciton: value => {
                    return value;
                 
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'module');
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
        private dataService: DataService
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub2 = this.dataService.getTCModules().subscribe(modules => {
            if (modules) {
                this.allModules = modules;
                this.loadTestSuite();
            }
        });
        this.deleteModuleValue=this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteModuleValue;
        this.settings = Object.assign({}, this.settings);

        if(this.dataService.getCurrentUser()['role'] === 'lead') {
            this.settings.actions.delete = false;
        } else if(this.dataService.getCurrentUser()['role'] === 'user' || this.dataService.getCurrentUser()['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.edit = false;
            this.settings.actions.delete = false;
        }
    }

    ngOnInit() {
        //Sort Data
        const sortData = this.dataService.getModuleSort();
        if(sortData){
            this.source.setSort(sortData);
            }
            }

    /**
* Set Sort Data
*/

    setSortData() {
        this.dataService.storeModuleSort(this.source.getSort());
    }

    /**
     * Load Test Suit Function
     */

    loadTestSuite() {
        this.sub3 = this.dataService.getTestSuites().subscribe(ts => {
            if (ts) {
                this.allTestsuite = ts;
                this.loadModule();
            }
        });
    }

    /**
     * Load Module Function
     */

    loadModule() {
        this.allModules.forEach(module => {
            /*module['count'] = _.filter(this.allTestsuite, function (ts) {
                if (ts['moduleId'] === module['_id']) {
                    return ts;
                }
            }).length;*/
            module['count'] = 0;
            this.allTestsuite.forEach(ele => {
                if(typeof ele['moduleId'] == 'string') {
                    if(ele['moduleId'] == module['_id']) {
                        if(module['count']) {
                            module['count'] ++;
                        } else {
                            module['count'] = 1;
                        }
                    } 
                } else {
                    ele['moduleId'].forEach(el => {
                        if(el == module['_id']) {
                            if(module['count']) {
                                module['count'] ++;
                            } else {
                                module['count'] = 1;
                            }
                        }
                    });
                }
            });

        });
        this.allModules.forEach(module => {
            let temp  = this.allTestsuite.filter(ts => { return ts['moduleId'].includes(module['_id'])});
            let testSuiteNames = temp.map(ts => ts['testSuiteName']);
            module['testSuiteNames'] = [];
            testSuiteNames.forEach((ts) => {
                module['testSuiteNames'].push({ "No" : 1, "testSuiteName" : ts});
            });
            module['testSuiteCount'] = testSuiteNames.length;
            // module['testSuiteNames'] = testSuiteNames;

        });
        this.source.load(this.allModules);
      
    }

    /**
     * Add Module Function used to open Add Module form
     */

    addModule() {
        this.dialog.open(AddModuleComponent, {
            data: this.selectedTeam,
            width: '450px',
            panelClass: 'dynamic-theme'
        });
    }

    /**
     * Edit Module Function used to open Edit Module form
     */

    editModule(event) {
        this.dialog.open(EditModuleComponent, {
            data: {
                selectedTeam: this.selectedTeam,
                selectedModule: _.cloneDeep(event.data)
            },
            width: '450px'
        });
    }

    /**
     * Delete Module Confirmation Function
     * @param deleteEvent .
     */

    deleteModuleConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'Testset',
                successText: `Are you sure you want to delete this Testset?.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot delete TestSet as ${deleteEvent.data.count} TestSuite(s) using this TestSet. Remove those TestSuite(s) to proceed. `,
                 data: deleteEvent.data,
                 
                targetName: 'TestSuites',
                targetFields: ['testSuiteName'],
                moduleDelete: true
                 
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub4 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteModule(deleteEvent);
            }
        });
    }
    /**
     * Delete Module Function
     * @param deleteEvent .
     */

    deleteModule(deleteEvent) {
        this.dataService.loading.next(true)
        this.sub5 = this.tcInventoryService
            .delete( { _id: deleteEvent.data._id })
            .subscribe(
                result => {
                    if (result) {
                        this.dataService.loading.next(false)
                        this.dataService.getTcInventoryData().next(result);
                        this.snackBar.open(
                            'Testset Deleted Successfully',
                            'OK',
                            {
                                duration: 5000
                            }
                        );
                    }
                },
                error => {
                    this.dataService.loading.next(false)
                    this.snackBar.open('Error Deleting Testset', 'Try Again', {
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
