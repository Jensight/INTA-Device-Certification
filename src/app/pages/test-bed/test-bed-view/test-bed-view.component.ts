import { Component, OnInit, OnDestroy } from '@angular/core';
import { TestBedService } from '../../../@core/services/test-bed.service';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { TestbedNamePipe } from '../../../@shared/pipes/testbed-name.pipe';
import { TestbedConfigureCheckPipe } from '../../../@shared/pipes/testbed-configure-check.pipe';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddTestBedComponent } from './add-test-bed/add-test-bed.component';
import { ConfigureButtonComponent } from './configure-button/configure-button.component';
import { NodeNameDisplayComponent } from './node-name-display/node-name-display.component';
import { EditTestBedComponent } from './edit-test-bed/edit-test-bed.component';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { NameFromIdPipe } from '../../../@shared/pipes/name-from-id.pipe';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { AddTestbedConfigComponent } from './add-testbed-config/add-testbed-config.component';
import { EditTestbedConfigComponent } from './edit-testbed-config/edit-testbed-config.component';
import { CloneTestBedComponent } from './clone-test-bed/clone-test-bed.component';
import { TestLabService } from 'src/app/@core/services/test-lab.service';

@Component({
  selector: 'app-test-bed-view',
  templateUrl: './test-bed-view.component.html',
  styleUrls: ['./test-bed-view.component.scss'],
  providers: [TestbedNamePipe, TestbedConfigureCheckPipe, NameFromIdPipe],
})
export class TestBedViewComponent implements OnInit, OnDestroy {
  private testbedDataSubsciption;
  private teamSubsciption;
  private allTestbed = [];
  private selectedTeam;
  private allTestbedProfiles = [];
  private allProfiles = [];
  allNodes = [];
  toggleFlag: boolean =true;
  sub1;

  sub4;
  sub5;
  sub6;
  sub7;
  sub8;
  sub9;
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
      edit: false,
      delete: false,
      position: 'right',
      custom: [

      ],
    },
    columns: {
      testBedName: {
        title: 'Testbed Name',
        type: 'custom',
        width: '300px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 200);
        }
      },
      profileName: {
        title: 'Profile Names',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: NodeNameDisplayComponent,
        componentInitFunction: NodeNameDisplayComponent.componentInit,

      },
      allNodes: {
        title: 'Network Element Names',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: NodeNameDisplayComponent,
        componentInitFunction: NodeNameDisplayComponent.componentInit,
      },
       labIndex: {
        title: 'Lab Index',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: NodeNameDisplayComponent,
        componentInitFunction: NodeNameDisplayComponent.componentInit,
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();
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
    private testLabService: TestLabService
  ) {
    this.deleteTestbedValue = this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteTestbedValue;
    this.settings = Object.assign({}, this.settings);
    this.sub9 = this.dataService.getTestbedProfile().subscribe((profiles) => {
      if (profiles) {
        this.allTestbedProfiles = profiles;
      }
    });
    
    if (this.dataService.getCurrentUser()['role'] === 'guest') {
      this.permissionDenied = true;
      this.settings.actions.edit = false;
      this.settings.actions.delete = false;
    } else if (this.deleteTestbedValue === true) {
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
      });
    }
  }

  ngOnInit() {
    this.sub1 = this.dataService.getNodes().subscribe((nodes) => {
      if (nodes) {
        this.allNodes = nodes.slice();
      }
    });
    this.teamSubsciption = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.getAllTestbed();
      }
    });

    this.testbedDataSubsciption = this.dataService
      .getTestBed()
      .subscribe((testbedData) => {
        if (testbedData) {
          this.allTestbed = testbedData.filter(function(item){
            return !item.testBedName.toLowerCase().includes('_reused');
          })
          //this.allTestbed = testbedData;
          this.extractTestbedData();
        }
      });

    //Sort Data
    const sortData = this.dataService.getTestbedSort();
    if(sortData){
    this.source.setSort(sortData);
  }
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
 toggleButtonChange(){
  if (this.allTestbed && this.allTestbed.length > 0) {
    const filteredTestbeds = this.allTestbed.filter((testbed) => {
      return this.toggleFlag ? !(testbed.status && testbed.status === 'inactive') : testbed.status && testbed.status === 'inactive';
    });
    filteredTestbeds.forEach((testbed) => {
      testbed.labIndex = testbed.labIndex ? testbed.labIndex : 'NA';
    });
    this.source.load(filteredTestbeds); 
  }
    }
  getAllTestbed() {
    this.sub4 = this.testBedService
      .getTestBed()
      .subscribe((testbed) => {
        if (testbed) {
          this.dataService.getTestBedData().next(testbed);
          this.getAllDeviceInventoryData();
        }
      });
  }

  /**
   * Get All Device Inventory Data
   */

  getAllDeviceInventoryData() {
    this.sub5 = this.dInventoryService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getDeviceInventoryData().next(data);
          this.getAllProfiles();
        }
      });
  }

  /**
   * Get All Profiles Function
   */

  getAllProfiles() {
    this.sub6 = this.dataService.getAllProfiles().subscribe((profiles) => {
      if (profiles) {
        this.allProfiles = profiles;
      }
    });
  }

  extractTestbedData() {
    this.allTestbed.forEach((testbed) => {
      testbed['status'] = testbed['status'] || 'active';
      testbed['isConfigured'] = this.testbedConfig.transform(testbed)
        ? 'Yes'
        : 'No';
      const allNodes = [];
      testbed['nodes'].forEach((element) => {
        allNodes.push(
          this.nameFromId.transform(
            element['nodeId'],
            this.allNodes,
            '_id',
            'nodeName'
          )
        );
      });
      // console.log(allNodes);
      testbed['profileName'] = this.nameFromId.transform(
        testbed['testBedProfileId'],
        this.allTestbedProfiles,
        '_id',
        'testBedProfileName'
      );

      testbed['allNodes'] = allNodes;
    });
    this.toggleButtonChange();

    // this.source.load(this.allTestbed);
  }

  /**
   * Delete Confirmation For delete confirmation
   * @param deleteEvent .
   */

  deleteTestbedConfirmation(deleteEvent) {
    this.testLabService.getAutoRegressionDataFromDB().subscribe(autoRegData => {
      const autoRegressionArray = autoRegData['autoRegressionData'] || [];
      const testBedId = deleteEvent.data._id;
      const isUsed = autoRegressionArray.some(record => {
        if (Array.isArray(record.TestBedId)) {
          return record.TestBedId.includes(testBedId);
        }
        return record.TestBedId === testBedId;
      });
      console.log('deleteEvent', deleteEvent); 
      const isMappedToLab = deleteEvent.data.labIndex && (deleteEvent.data.labIndex !== '' && deleteEvent.data.labIndex !== 'NA') ? true : false;
      let dialogText = '';
      if (isUsed) {
        dialogText = "Cannot delete Testbed as it is being used in Auto Regression. Remove the TestBed in Auto Regression to proceed.";
      } else if (isMappedToLab) {
        dialogText = "Cannot delete Testbed as it is mapped to Lab partition " + deleteEvent.data.labIndex + ". Unmap the TestBed from Lab to proceed.";
      } else {
        dialogText = "Deleting will remove the Testbed and all its details. This action can't be reversed";
      }

      const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
        width: '450px',
        data: {
          name: 'Testbed',
          text: dialogText,
          action: 'Delete',
          showCloseButton: isUsed || isMappedToLab ? true : false
        },
        panelClass: 'app-full-bleed-dialog',
      });      
      this.sub7 = dialogRef.afterClosed().subscribe((result) => {
        if (result === true && !isUsed) {
          this.deleteTestbed(deleteEvent);
        }
      });
    });
  }

  /**
   * Delete Testbed Function
   * @param deleteEvent .
   */

  deleteTestbed(deleteEvent) {
    this.dataService.loading.next(true);
    this.sub8 = this.testBedService
      .deleteTestbed( deleteEvent.data._id)
      .subscribe(
        (result) => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getTestBedData().next(result);
            this.snackBar.open('Testbed Deleted Successfully', 'OK', {
              duration: 5000,
            });
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Deleting Testbed', 'Try Again', {
            duration: 5000,
          });
        }
      );
  }

  /**
   * Add Testbed function
   */

  addTestBed() {
    this.dialog.open(AddTestbedConfigComponent, {
      width: '450px',
      data: this.selectedTeam,
      panelClass: 'dynamic-theme',
    });
  }

  /**
   * Edit Testbed function to open edit form
   * @param event .
   */

  editTestBed(event) {
    this.testBedService.selectedTeam.next(this.selectedTeam);
    
    this.dialog.open(EditTestbedConfigComponent, {
      width: '450px',
      data: {
        selectedTeam: this.selectedTeam,
        selectedTestbed: event.data,
      },
    });
    // this.testBedService.selectedTeam.next(this.selectedTeam);
    // this.testBedService.selectedTestbed.next(event.data);
    // this.router.navigate(['./edit'], { relativeTo: this.activeUrl });
  }

  onCustom(event) {
    if (event.action == 'Clone') {
        this.cloneTestBed(event)
    }
    else if (event.action == 'Edit') {
        this.editTestBed(event);
    }
    else if (event.action == 'Delete') {
        this.deleteTestbedConfirmation(event)
    }
  }

  cloneTestBed(event) {
    this.testBedService.selectedTestbed.next(_.cloneDeep(event.data));
    this.dialog.open(CloneTestBedComponent, {
        width: '450px',
        data: {
          selectedTeam: this.selectedTeam,
          selectedTestbed: event.data,
        },
    });
    //
    //this.router.navigate(['./clone'], { relativeTo: this.activeUrl });
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
    if (this.sub9) {
      this.sub9.unsubscribe();
    }
  }
}
