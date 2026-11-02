import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import * as _ from 'lodash';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddProfileComponent } from './add-profile/add-profile.component';
import { TestBedService } from '../../../@core/services/test-bed.service';
import { switchMap, map } from 'rxjs/operators';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ActivatedRoute, NavigationStart, Router } from '../../../../../node_modules/@angular/router';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';

@Component({
  selector: 'app-device-profile',
  templateUrl: './device-profile.component.html',
  styleUrls: ['./device-profile.component.scss'],
})
export class DeviceProfileComponent implements OnInit, OnDestroy {
  public allDevices;
  public selectedTeam;
  public allProfiles;
  public allNodes = [];
  deleteProfileValue: boolean = false;
  source: LocalDataSource = new LocalDataSource();
  public settings = {
    attr: {
      class: 'text-center'
    },
    noDataMessage: 'No Profiles Found',
    pager: {
      perPage: 10
    },
    mode: 'external',
    actions: {
      add: false,
      delete: this.deleteProfileValue,
      position: 'right'
    },
    edit: {
      editButtonContent: '<i class="fa fa-pencil" title="edit"></i>'
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-trash-o" title="delete"></i>',
      confirmDelete: true
    },
    columns: {
      profileName: {
        title: 'Profile Name',
        type: 'custom',
        class: 'text-center',
        width: '400px',
        valuePrepareFunction: data => {
          return data;
        },
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 35);
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

        // compareFunction: (direction: any, temp1: any, temp2: any) => {
        //   const a = temp1;
        //   const b = temp2;
        //   return a.localeCompare(b) * direction;
        // }
      },
      count: {
        title: 'No Devices',
        type: 'custom',
        class: 'text-center',
        width: '200px',
        valuePrepareFunciton: value => {
          return value;

        },
        resetText: Number,
        renderComponent: TestbedlistPopupComponent,
        componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
          TestbedlistPopupComponent.componentInit(instance, cell, 100, 'deviceprofile');
        },
      }
    }
  };
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard'
    },
    {
      link: '#/pages/device-inventory/',
      label: 'DeviceInventory'
    },
    {
      link: '#/pages/device-inventory/device-profile',
      label: 'DeviceProfile'
    },


  ];
  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  private savedTableState: any = null;
  constructor(
    private dataService: DataService,
    private dInventoryService: DeviceInventoryService,
    private testBedService: TestBedService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private activeUrl: ActivatedRoute,
    private tableStateService: TableStateService
  ) {
    this.sub1 = this.dataService.getAllDevices().subscribe(devices => {
      if (devices) {
        this.allDevices = devices;
        this.loadProfile();

      }
    });
    this.sub2 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
        this.sub3 = this.testBedService.getTestBed().subscribe(data => {
          if (data) {
            this.dataService.getTestBedData().next(data);
          }
        });
      }
    });
    this.deleteProfileValue = this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteProfileValue;
    this.settings = Object.assign({}, this.settings);
  }

  loadProfile() {
    this.sub4 = this.dataService
      .getAllProfiles()
      .pipe(
        switchMap(data => {
          return this.dataService.getNodes().pipe(
            map(node => {
              return { node: node, profiles: data };
            })
          );
        })
      )
      .subscribe(profiles => {
        if (profiles.profiles && (profiles?.node || profiles?.node?.length === 0)) {
          this.allProfiles = profiles.profiles;
          const profileData = [];
          this.allProfiles.forEach(profile => {
            let temp = this.allDevices.filter(device => { return device['profileName'] == profile['profileName'] });
            let deviceNames = temp.map(device => device['deviceName']);
            profile['deviceNames'] = [];
            deviceNames.forEach(deviceName => {
              profile['deviceNames'].push({ "No": 1, "deviceName": deviceName });
            });
            profile['count'] = deviceNames.length;
            profile['target'] = temp;
            profileData.push(profile);
          });
          this.source.load(profileData.reverse());
        }
      });
  }

  editProfile(event) {
    const key = 'device-profile';
    if (this.source) {
      const filters = this.source.getFilter();
      const page = this.source.getPaging().page;
      this.tableStateService.saveState(key, filters, page);
    }
    this.dInventoryService.selectedProfile.next(event.data);
    this.router.navigate(['./edit'], { relativeTo: this.activeUrl });
  }

  deleteProfileConfirmation(deleteEvent) {
    const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
      width: '400px',
      data: {
        name: 'Profile',
        successText: `Deleting will remove the Profile and its associated Device.
                This action can't be reversed. Are you want to Proceed?`,
        action: 'Delete',
        errorText: `Cannot delete Profile as ${deleteEvent.data.count
          } Node(s) using this profile. Remove those Node(s) to proceed. `,
        data: deleteEvent.data,
        targetName: 'Node',
        targetFields: ['deviceName']
      },
      minWidth: '700px',
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub5 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteProfile(deleteEvent);
      }
    });
  }

  deleteProfile(deleteEvent) {
    this.dataService.loading.next(true)
    // delete deleteEvent.data['deviceCount'];
    delete deleteEvent.data['count'];
    delete deleteEvent.data['target'];
    this.sub6 = this.dInventoryService.deleteProfile(deleteEvent.data).subscribe(
      result => {
        this.dataService.loading.next(false)
        if (result) {

          this.dataService.getDeviceInventoryData().next(result);
          this.snackBar.open('Profile Deleted Successfully', 'OK', {
            duration: 5000
          });
        }
      },
      error => {
        this.dataService.loading.next(false)
        this.snackBar.open('Error Deleting Profile', 'Try Again', {
          duration: 5000
        });
      }
    );
  }

  addProfile() {
    this.dialog.open(AddProfileComponent, {
      width: '1000px',
      data: this.selectedTeam,
      height: '450px'
    });
  }
  navigateToDetails(event: any) {
    this.editProfile(event);
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        console.log('Navigation event:', event.url);
        if (!event.url.startsWith('/pages/device-inventory/device-profile')) {
          const key = 'device-profile';
          this.tableStateService.clearState(key);
        }
      }
    });

    const key = 'device-profile';
    const { filterState, currentPage } = this.tableStateService.getState(key);

    if (this.allProfiles && this.allProfiles.length > 0) {
      this.source.load(this.allProfiles).then(() => {
        this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
      });
    }

    if (filterState.length > 0) {
      this.source.setFilter(filterState, true);
    }
    //Sort Data
    const sortData = this.dataService.getProfileSort();
    if (sortData) {
      this.source.setSort(sortData);
    }

  }
  /**
   * Set Sort Data
   */
  setSortData() {
    this.dataService.storeProfileSort(this.source.getSort());
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
  }
}