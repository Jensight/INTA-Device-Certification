import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EditVendorComponent } from './edit-vendor/edit-vendor.component';
import { AddVendorComponent } from './add-vendor/add-vendor.component';
import * as _ from 'lodash';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { Router } from '@angular/router';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';

@Component({
  selector: 'app-vendor',
  templateUrl: './vendor.component.html',
  styleUrls: ['./vendor.component.scss']
})
export class VendorComponent implements OnInit, OnDestroy {
  private selectedTeam;
  public allVendors = [];
  public allModels;
  private vendorSubscription;
  private dataSubscription;
  private dInventorySubscription;
  private modelSubscription;
  deleteVendorValue:boolean=false;
  public settings = {
    attr: {
      class: 'text-center'
    },
    noDataMessage: 'No Vendors Found',
    pager: {
      perPage: 10
    },
    mode: 'external',
    actions: {
      add: false,
      delete:this.deleteVendorValue,
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
        title: 'Vendor Name',
        type: 'custom',
        width: '400px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 1000);
        },
        valuePrepareFunction: data => {

          return data;
        }
      },
      noModel: {
        title: 'Number of Models',
        type: 'string',
        width: '200px',
        class: 'text-center',

      }
    }
  };
  source: LocalDataSource = new LocalDataSource();
  sub;
  sub1;
  sub2;
  sub3;
  constructor(
    private dataService: DataService,
    private dInventoryService: DeviceInventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.dataSubscription = this.dataService.selectedTeam.subscribe(
      team => {
        if (team) {
          this.selectedTeam = team;
          // this.getData(team);
        }
      }
    );
    this.deleteVendorValue=this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteVendorValue;
    this.settings = Object.assign({}, this.settings);
  }

  /**
   * Get Data function to get all available data for the team
   * @param team .
   */

  getData() {
    this.dInventorySubscription = this.dInventoryService
      .getAllData()
      .subscribe(allData => {
        if (allData) {
          this.dataService.getDeviceInventoryData().next(allData);
        }
      });
  }

  ngOnInit() {
    // this.modelSubscription = this.dataService
    //   .getAllModels()
    //   .subscribe(model => {
    //     if (model) {
    //       this.allModels = model;
    //       this.getVendorDetails();
    //     }
    //   });
  //    if(this.allModels == undefined){
     this.sub3 = this.dInventoryService.getAllData().subscribe(data => {
          if (data) {
      
              this.dataService.getDeviceInventoryData().next(data);
          }
          this.modelSubscription = this.dataService
      .getAllModels()
      .subscribe(model => {
        if (model) {
          this.allModels = model;
          this.getVendorDetails();
        }
      });
      });
   //   }
    //Sort Data
    const sortData = this.dataService.getVendorSort();

    if(sortData){
      this.source.setSort(sortData);
      }
      }

  /**
   * Set Sort Data
   */

  setSortData() {
    this.dataService.storeVendorSort(this.source.getSort());
  }

  /**
   * Vendor details function
   */

  getVendorDetails() {
    this.vendorSubscription = this.dataService
      .getAllVendors()
      .subscribe(vendors => {
        if (vendors) {
          const duplicateVendors = _.cloneDeep(vendors);
          // const index = duplicateVendors.indexOf('vAUTO');
          // if (index > -1) {
          //     duplicateVendors.splice(index, 1)
          // }
          this.allVendors = [];
          duplicateVendors.forEach(ven => {
            const tempVendor = {};
            tempVendor['name'] = ven;
            const modelsOfVendor = _.filter(
              this.allModels,
              function (model) {
                if (model.deviceVendor === ven) {
                  return model;
                }
              }
            );
            tempVendor['noModel'] = modelsOfVendor.length;
            tempVendor['count'] = modelsOfVendor.length;
            tempVendor['target'] = modelsOfVendor;
            this.allVendors.push(tempVendor);
          });
          this.source.load(this.allVendors.reverse());
        }
      });
  }

  /**
   * Function to open edit vendor form component
   * @param updateEvent .
   */

  editVendor(updateEvent) {
    const dialogRef = this.dialog.open(EditVendorComponent, {
      width: '400px',
      data: {
        data: updateEvent.data,
        selectedTeam: this.selectedTeam
      }
    });
    this.sub = dialogRef.afterClosed().subscribe(result => {
      // this.data = this.dataService.getTeams();
      // console.log(this.dataService.getTeams());
      // this.source.load(this.data);
    });
  }

  ngOnDestroy() {
    if (this.vendorSubscription) {
      this.vendorSubscription.unsubscribe();
    }
    if (this.dInventorySubscription) {
      this.dInventorySubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
    if (this.sub3) {
      this.sub3.unsubscribe();
    }
  }

  /**
   * Confirmation function for delete vendor.
   * @param deleteEvent .
   */

  deleteVendorConfirmation(deleteEvent) {
    const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
      width: '400px',
      data: {
        name: 'Vendor Name',
        successText: `Deleting will remove the Vendor Name. This action can't be reversed. Are you want to Proceed?`,
        action: 'Delete',
        errorText: `Cannot delete Vendor Name as ${deleteEvent.data.count
          } Model(s) are from this vendor Name. Remove those Models(s) to proceed. `,
        data: deleteEvent.data,
        targetName: 'Model',
        targetFields: ['modelName', 'profileName']
      },
      minWidth: '700px',
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub1 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteVendor(deleteEvent);
      }
    });
  }

  /**
   * Delete Vendor to delete vendor from backend
   * @param deleteEvent .
   */

  deleteVendor(deleteEvent) {
    this.dataService.loading.next(true)
    this.sub2 = this.dInventoryService
      .deleteVendor({ name: deleteEvent.data.name })
      .subscribe(
        result => {
          this.dataService.loading.next(false)
          if (result) {
            this.dataService.getDeviceInventoryData().next(result);
            this.snackBar.open(
              'Vendor Deleted Successfully',
              'OK',
              {
                duration: 5000
              }
            );
          }
        },
        error => {
          this.dataService.loading.next(false)
          this.snackBar.open('Error Deleting Vendor', 'Try Again', {
            duration: 5000
          });
        }
      );
  }

  /**
   * Add Vendor Function to open Add vendor Form
   */
  addVendor() {
    const dialogRef = this.dialog.open(AddVendorComponent, {
      width: '400px',
      data: this.selectedTeam
    });

  }
}
