import { Component, OnInit, OnDestroy } from '@angular/core';
import { TestBedService } from '../../../@core/services/test-bed.service';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { TestbedNamePipe } from '../../../@shared/pipes/testbed-name.pipe';
import { TestbedConfigureCheckPipe } from '../../../@shared/pipes/testbed-configure-check.pipe';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { AddTestBedComponent } from './add-test-bed/add-test-bed.component';
// import { ConfigureButtonComponent } from './configure-button/configure-button.component';
// import { NodeNameDisplayComponent } from './node-name-display/node-name-display.component';
// import { EditTestBedComponent } from './edit-test-bed/edit-test-bed.component';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { NameFromIdPipe } from '../../../@shared/pipes/name-from-id.pipe';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';

import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { APIInventoryDeleteComponent } from 'src/app/@shared/components/api-inventory-delete/api-inventory-delete.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';

@Component({
  selector: 'app-profile-name',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [TestbedNamePipe, TestbedConfigureCheckPipe, NameFromIdPipe],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private testbedDataSubsciption;
  private teamSubsciption;
  private allTestbed = [];
  private selectedTeam;
  private tbProfiles = [];
  private savedTableState: any = null;
  private tableStateKey: string = 'profileTableState';
  allNodes = [];
  sub1;

  sub4;
  sub5;
  sub6;
  sub7;
  sub8;
  deleteTestbedValue: boolean = false;
  public settings = {
    attr: {
      class: 'text-center',
    },
    noDataMessage: 'No Testbed Found',
    pager: {
      perPage: 10,
    },
    mode: 'external',
    actions: {
      add: false,
      delete: false,
      edit: false,
      // delete: this.deleteTestbedValue,
      position: 'right',
      custom: [

      ],
    },
    
    columns: {
      testBedProfileName: {
        title: 'Testbed Profile Name',
        type: 'custom',
        width: '350x',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 200);
        }
      },
      count: {
        title: 'Testbed Count',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        valuePrepareFunciton: (value) => {
          return value;
        },
        resetText: Number,
        renderComponent: TestbedlistPopupComponent,
        componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
          TestbedlistPopupComponent.componentInit(instance, cell, 100, 'none');
        }
      },
      testsetCount: {
        title: 'TestSet Count',
        type: 'custom',
        width: '200px',
        class: 'text-left',
        valuePrepareFunciton: (value) => {
          return value;
        },
        resetText: Number,
        renderComponent: TestbedlistPopupComponent,
        componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
          TestbedlistPopupComponent.componentInit(instance, cell, 100, 'profile');
        }
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();
  sub10: any;
  originalAllTestSets: any;
  permissionDenied: boolean = false;
  constructor(
    private testBedService: TestBedService,
    private dataService: DataService,
    private testbedNamePIpe: TestbedNamePipe,
    private testbedConfig: TestbedConfigureCheckPipe,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private dInventoryService: DeviceInventoryService,
    private nameFromId: NameFromIdPipe,
    private router: Router,
    private activeUrl: ActivatedRoute,
    private tableStateService: TableStateService,
    
  ) {
    this.deleteTestbedValue = this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteTestbedValue;
    this.settings = Object.assign({}, this.settings);
    this.sub6 = this.dataService.getTestBed().subscribe((testbed) => {
      if (testbed) {
        this.allTestbed = testbed;
      }
    });
    
    if (this.dataService.getCurrentUser()['role'] === 'guest') {
      this.permissionDenied = true;
      this.settings.actions.edit = false;
      this.settings.actions.delete = false;
    } else {
      this.settings.actions.custom.push(
        {
            name: 'Clone',
            title: '<i class="fa fa-clone"  title="clone"></i>',
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
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!event.url.startsWith('/pages/test-bed/testbed-profile')) {
          this.clearSavedTableState();
        }
      }
    });
     const savedState = localStorage.getItem(this.tableStateKey);
                if (savedState) {
                    this.savedTableState = JSON.parse(savedState);
                    if (this.savedTableState.filter) {
                        this.source.setFilter(this.savedTableState.filter.filters, this.savedTableState.filter.andOperator);
                    }
        
                    if (this.savedTableState.pagination) {
                        this.source.load(this.tbProfiles).then(() => {
                            this.source.setPaging(this.savedTableState.pagination.page, this.savedTableState.pagination.perPage, false);
                        });
                    }
        
                    if (this.savedTableState.sort) {
                        this.source.setSort(this.savedTableState.sort);
                    }
                }
    this.sub1 = this.dataService.getNodes().subscribe((nodes) => {
      if (nodes) {
        this.allNodes = nodes.slice();
      }
    });
    this.teamSubsciption = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.getAllTestbedProfile();
      }
    });
     this.router.events.subscribe((event) => {
                if (event instanceof NavigationStart) {
                    if (!event.url.startsWith('/pages/test-bed/testbed-profile')) {
                      const key = 'testbed-profile';
                      this.tableStateService.clearState(key);                    }
                }
            });

           



    //Sort Data
    const sortData = this.dataService.getTestbedSort();
    if (sortData) {
      this.source.setSort(sortData);
    }
  }
 clearSavedTableState(): void {
        localStorage.removeItem(this.tableStateKey);
        this.savedTableState = null;
    }
    saveTableState(): void {
        const savedTableState = {
            filter: this.source.getFilter(),
            pagination: this.source.getPaging(),
            sort: this.source.getSort(),
        };
        localStorage.setItem(this.tableStateKey, JSON.stringify(savedTableState));
    }
  /**
   * Set Sort Data
   */

  setSortData() {
    this.dataService.storeTestbedSort(this.source.getSort());
  }

  /**
   * Get All Testbed Function
   */

  getAllTestbedProfile() {
    this.sub4 = this.dataService
      .getTestbedProfile()
      .subscribe((testbedProfile) => {
        if (testbedProfile) {
          this.tbProfiles = testbedProfile;
          this.sub10 = this.dataService.getTCModules().subscribe(modules => {
            if (modules) {
              this.originalAllTestSets = modules;
              console.log("this.originalAllTestSets163", this.originalAllTestSets)
            
            }
          });
        }
        
      });
    this.tbProfiles.forEach((tbProfiles) => {
      tbProfiles['count'] = this.getCountofProfile(tbProfiles['_id']);
      tbProfiles['target'] = this.getNameofProfile(tbProfiles['_id']);
      tbProfiles['testsetTarget'] = this.getNameofTestSets(tbProfiles);
      tbProfiles['testsetCount'] = tbProfiles['mappedTestSets'] ? tbProfiles['mappedTestSets'].length : 0;
    });
    console.log("this.tbProfiles171", this.tbProfiles)
    // this.source.load(this.tbProfiles);
    const key = 'testbed-profile';
        const { filterState, currentPage } = this.tableStateService.getState(key);
        this.source.load(this.tbProfiles).then(() => {
            this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
        });
        if (filterState.length > 0) {
            this.source.setFilter(filterState, true);
        }
  }

  getCountofProfile(idd) {
    let countVal = 0;

    const arrayTb = this.allTestbed.filter((pro) => {
      return pro.testBedProfileId === idd;
    });
    countVal = arrayTb.length;
    return countVal;
  }
  getNameofProfile(idd) {
    const nameVal = [];
    const arrayTb = this.allTestbed.filter((pro) => {
      return pro.testBedProfileId === idd;
    });
    arrayTb.forEach((tb, i) => {
      nameVal.push({
        No: i + 1,
        'testBedName': tb.testBedName,
      });
    });

    return nameVal;
  }
  getNameofTestSets(testBedProfile) {
    const nameVal = [];
    if(testBedProfile.mappedTestSets){
    testBedProfile.mappedTestSets.forEach((tb, i) => {
      const arrayTb = this.originalAllTestSets.filter((pro) => {
         
        return pro._id === tb;
      });   
      if (arrayTb?.length > 0 && arrayTb[0].moduleName) {
        nameVal.push({
          No: i + 1,
          'testSetName': arrayTb[0].moduleName,
        });
      }        
    
    })
  }

    return nameVal;
  }

  onCustom(event) {
    if (event.action == 'Clone') {
        this.cloneTestBedProfile(event)
    }
    else if (event.action == 'Edit') {
        this.editTestBed(event);
    }
    else if (event.action == 'Delete') {
        this.deleteTestbedConfirmation(event)
    }
  }
  /**
   * Delete Confirmation For delete confirmation
   * @param deleteEvent .
   */

  deleteTestbedConfirmation(deleteEvent) {
    const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
      width: '400px',
      data: {
        name: 'Test Profile',
        successText: `Deleting will remove the Test Profile and this action can't be reversed.
          Are you want to Proceed?`,
        action: 'Delete',
        errorText: `Cannot delete Test Profile as ${deleteEvent.data.count} Testbed(s) using this Profile. Remove those Testbed(s) to proceed. `,
        data: deleteEvent.data,
        targetName: 'TestBed',
        targetFields: ['No', 'testBedName'],
      },
      minWidth: '700px',
      panelClass: 'app-full-bleed-dialog',
    });
    this.sub7 = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteTestbedProfile(deleteEvent);
      }
    });
  }

  /**
   * Delete Testbed Function
   * @param deleteEvent .
   */

  deleteTestbedProfile(deleteEvent) {
    this.dataService.loading.next(true);
    this.sub8 = this.testBedService
      .deleteTestbed(deleteEvent.data._id)
      .subscribe(
        (result) => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getTestbedProfile().next(result);
            this.dataService.getTestBedData().next(result);
            this.snackBar.open('Testbed Profile Deleted Successfully', 'OK', {
              duration: 5000,
            });
            this.getAllTestbedProfile();
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Deleting Testbed Profile', 'Try Again', {
            duration: 5000,
          });
        }
      );
  }

  /**
   * Add Testbed function
   */

  addTestBed() {
    this.testBedService.selectedTeam.next(this.selectedTeam);
    this.router.navigate(['./add'], { relativeTo: this.activeUrl });
  }

  cloneTestBedProfile(event) {
    const key = 'testbed-profile';
    if (this.source) {
      const filters = this.source.getFilter();
      const page = this.source.getPaging().page;
      this.tableStateService.saveState(key, filters, page);
    }
    this.testBedService.selectedTeam.next(this.selectedTeam);
    this.testBedService.selectedTestbed.next(event.data);
    this.router.navigate(['./clone'], { relativeTo: this.activeUrl });
  }

  /**
   * Edit Testbed function to open edit form
   * @param event .
   */

  editTestBed(event) {
    const key = 'testbed-profile';
    if (this.source) {
      const filters = this.source.getFilter();
      const page = this.source.getPaging().page;
      this.tableStateService.saveState(key, filters, page);
    }
    this.testBedService.selectedTeam.next(this.selectedTeam);
    this.testBedService.selectedTestbed.next(event.data);

    // if (event.data.count > 0) {
    //   this.snackBar.open(
    //     'Testbed Profile cannot Edit, Testbed Profile using '+event.data.count+' Testbed(s),. Please unMapped!',
    //     'OK',
    //     {
    //       duration: 5000,
    //     }
    //   );
    // }

    this.router.navigate(['./edit'], { relativeTo: this.activeUrl });
  }

  ngOnDestroy() {
    if (this.teamSubsciption) {
      this.teamSubsciption.unsubscribe();
    }
    if (this.testbedDataSubsciption) {
      this.testbedDataSubsciption.unsubscribe();
    }
    if (this.sub1) {
      this.sub1.unsubscribe();
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
  }
}
