import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as _ from 'lodash';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from '../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit, OnDestroy {
  public selectedTeam;
  public modelData = [];
  public allModels = [];
  public allVendors = [];
  public allProfiles = [];
  public allDevices = [];
  private vendorSubscription;
  private teamSubscription;
  private deviceSubscription;
  private modelSubscription;
  private savedTableState: any = null;
  private tableStateKey: string = 'deviceModelTableState';

  sub1;
  sub2;
  sub5;
  private allProfileNames = [];
  deleteModelValue: boolean = false;
  public settings = {
    attr: {
      class: 'text-center'
    },
    noDataMessage: 'No Models Found',
    pager: {
      perPage: 10
    },
    mode: 'external',
    actions: {
      add: false,
      edit: true,
      delete: this.deleteModelValue,
      position: 'right'
    },
    edit: {
      editButtonContent: '<i class="fa fa-pencil" style="color: #424242;"></i>'
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-trash-o" style="color: #424242;"></i>',
      confirmDelete: true
    },
    columns: {
      modelName: {
        title: 'Model Name',
        type: 'custom',
        width: '300px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 100);
        }
      },
      profileNameDisplay: {
        title: 'Profile Name',
        type: 'custom',
        width: '300px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 70);
        },
        compareFunction: (direction: any, temp1: any, temp2: any) => {
          var a = temp1 || '';
          var b = temp2 || '';
          if (a.localeCompare(b) < 0) {
            return -1 * direction;
          }
          if (a.localeCompare(b) > 0) {
            return direction;
          }
          return 0;
        }
      },

      deviceVendor: {
        title: 'Vendor',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 70);
        },
      },
      count: {
        title: 'No of Devices',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        valuePrepareFunciton: value => {
          return value;

        },
        resetText: Number,
        renderComponent: TestbedlistPopupComponent,
        componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
          TestbedlistPopupComponent.componentInit(instance, cell, 100, 'devicemodel');
        },
      }
    }
  };
  source: LocalDataSource = new LocalDataSource();
  permissionDenied: boolean = false;
  constructor(
    private dataService: DataService,
    private dInventoryService: DeviceInventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private activeUrl: ActivatedRoute,
    private tableStateService: TableStateService
  ) {
    this.vendorSubscription = this.dataService.getAllVendors().subscribe(vendors => {
      if (vendors) {
        this.allVendors = vendors;
        this.loadDevices();
      }
    });
    this.teamSubscription = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.deleteModelValue = this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteModelValue;
    this.settings = Object.assign({}, this.settings);

    if (this.dataService.getCurrentUser()['role'] === 'user' || this.dataService.getCurrentUser()['role'] === 'guest') {
      this.permissionDenied = true;
      this.settings.actions.delete = false;
      this.settings.actions.edit = false;
    }
  }

  /**
   * Gets available devices from the dataService method and calls the loadProfile method
   */

  loadDevices() {
    this.deviceSubscription = this.dataService.getAllDevices().subscribe(devices => {
      if (devices) {
        this.allDevices = devices;
        const key = 'device-model';
        const { filterState, currentPage } = this.tableStateService.getState(key);
        if (this.allDevices) {
            this.source.load(this.allDevices).then(() => {
              this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
            });
        }
        if (filterState.length > 0) {
          this.source.setFilter(filterState, true);
        }
        this.loadProfile();
      }
    });
  }

  /**
   * Called to get all available profiles and calls the loadModules method
   */

  loadProfile() {
    this.sub1 = this.dataService.getAllProfiles().subscribe(profiles => {
      if (profiles) {
        this.allProfiles = profiles;
        this.allProfileNames = [];
        this.allProfiles.forEach(profile => {
          this.allProfileNames.push(profile.profileName);
        });
        this.loadModels();
      }
    });
  }

  /**
   * will get all available models for list.
   */

  loadModels() {
    this.modelData = [];
    this.modelSubscription = this.dataService.getAllModels().subscribe(models => {
      if (models) {
        this.allModels = models;
        this.allModels.forEach(model => {
          let temp = this.allDevices.filter(device => { return device['model'] == model['modelName'] });
          let deviceNames = temp.map(device => device['deviceName']);
          model['deviceNames'] = [];
          deviceNames.forEach(deviceName => {
            model['deviceNames'].push({ "No": 1, "deviceName": deviceName });
          });
          model['count'] = deviceNames.length;
          model['target'] = temp;
          // Convert profileName array to string for table display
          if (Array.isArray(model['profileName'])) {
            model['profileNameDisplay'] = model['profileName'].join(', ');
          } else {
            model['profileNameDisplay'] = model['profileName'] || '';
          }
        });
        this.dataService.getvendorModelDetails().next(this.allModels);
        this.source.load(this.allModels);
      }
    });
  }

  /**
   * Confirmation function for removing the model
   * deleteModel function called after deletion is confirmed
   * @param deleteEvent params
   * @param deleteEvent params
   */

  deleteModelConfirmation(deleteEvent) {

    const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
      width: '400px',
      data: {
        name: 'Model',
        successText: `Deleting will remove the Model.
            This action can't be reversed. Are you want to Proceed?`,
        action: 'Delete',
        errorText: `Cannot delete Model as ${deleteEvent.data.count
          } Device(s) using this model. Remove those Device(s) to proceed. `,
        data: deleteEvent.data,
        targetName: 'Device',
        targetFields: ['deviceName', 'vendor']
      },
      minWidth: '700px',
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub5 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteModel(deleteEvent);
      }
    });
  }

  /**
   * Called to delete a model
   * @param deleteEvent params
   */

  deleteModel(deleteEvent) {
    this.dataService.loading.next(true);
    delete deleteEvent.data['count'];
    delete deleteEvent.data['target'];
    this.sub2 = this.dInventoryService.deleteModel(deleteEvent.data).subscribe(
      result => {
        this.dataService.loading.next(false);
        if (result) {
          this.dataService.getDeviceInventoryData().next(result);
          this.snackBar.open('Model Deleted Successfully', 'OK', {
            duration: 5000
          });
        } else {
          this.snackBar.open('Error Deleting Model', 'Try Again', {
            duration: 5000
          });
        }
      },
      error => {
        this.dataService.loading.next(false);
        this.snackBar.open('Error Deleting Model', 'Try Again', {
          duration: 5000
        });
      }
    );
  }

  /**
   * Opens the Add Model Form component to get details for creating a new model
   */

  addModel() {
    this.router.navigateByUrl('/pages/device-inventory/vendor-model/add')
  }

  /**
   * used to navigate the model change edit form
   * @param event params
   */

  editModel(editEvent) {
    const key = 'device-model';
    if (this.source) {
      const filters = this.source.getFilter();
      const page = this.source.getPaging().page;
      this.tableStateService.saveState(key, filters, page);
    }
    this.dInventoryService.selectedModel.next(editEvent.data)
    this.router.navigateByUrl('/pages/device-inventory/vendor-model/edit')
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!event.url.startsWith('/pages/device-inventory/vendor-model')) {
          const key = 'device-model';
          this.tableStateService.clearState(key);
        }
      }
    });
    //Sort Data
    const sortData = this.dataService.getModelSort();
    if (sortData) {
      this.source.setSort(sortData);
    }
  }
 
  /**
   * Set Sort Data
   */

  setSortData() {
    this.dataService.storeModelSort(this.source.getSort());
  }

  ngOnDestroy() {
    if (this.deviceSubscription) {
      this.deviceSubscription.unsubscribe();
    }
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
    }
    if (this.teamSubscription) {
      this.teamSubscription.unsubscribe();
    }
    if (this.vendorSubscription) {
      this.vendorSubscription.unsubscribe();
    }
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
    if (this.sub5) {
      this.sub5.unsubscribe();
    }

  }
}
