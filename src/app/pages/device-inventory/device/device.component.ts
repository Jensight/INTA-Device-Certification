import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { AddDeviceComponent } from './add-device/add-device.component';
import { TestBedService } from '../../../@core/services/test-bed.service';
import { switchMap, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/@core/services/user.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { RegressionDisplayComponent } from '../../regression/regression-list/regression-name-display/regression-name-display.component';
import { ViewTargetComponent } from 'src/app/@shared/components/api-inventory-delete/view-target/view-target.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';
import { TableStateService } from 'src/app/@core/services/table-state.service';
@Component({
    selector: 'app-device',
    templateUrl: './device.component.html',
    styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit, OnDestroy {
    private selectedTeam;
    private deviceSubscription;
    private allDevices;
    private teamSubsciption;
    deleteDeviceValue: boolean = false;
    public deviceForm: UntypedFormGroup;
    public selectedDevice;
    public selectedProfile;
    public selectedModel;
    public allModels = [];
    public allVendors = [];
    public allProfiles = [];
    //public allDevices = [];
    lbSetUp: any = [];
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Devices Found',
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
        //     delete:this.deleteDeviceValue,
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
            deviceName: {
                title: 'Device Name',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
            },
            // profileName: {
            //     title: 'Profile Name',
            //     type: 'custom',
            //     width: '200px',
            //     class: 'text-center',
            //     renderComponent: ToolTipDisplayComponent,
            //     onComponentInitFunction: instance => {
            //         instance['numberLimit'] = '100';
            //     },
            //     compareFunction: (direction: any, temp1: any, temp2: any) => {
            //         var a = temp1;
            //         var b = temp2;
            //         if (a.localeCompare(b) < 0) {
            //             return -1 * direction;
            //         }
            //         if (a.localeCompare(b) > 0) {

            //             return direction;
            //         }
            //         return 0;
            //     },


            // },
            model: {
                title: 'Device Model',
                type: 'custom',
                width: '200px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
            },
            deviceProfile: {
                title: 'Device Profile',
                type: 'custom',
                width: '200px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
            },
            vendor: {
                title: 'Vendor',
                type: 'custom',
                width: '200px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                },
            },
            testBedName: {
                title: 'TestBed Count',
                type: 'custom',
                width: '200px',
                class: 'text-center',

                valuePrepareFunction: data => {
                    return data;
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'none');
                }
            }
        }
    };
    source: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    sub3;
    sub4;
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
            link: '#/pages/device-inventory/device',
            label: 'Device'
        },


    ];
    modelSubscription: any;
    allProfileNames: any[];
    permissionDenied: boolean = false;
    sub10: any;
    constructor(
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private testbedService: TestBedService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private activeUrl: ActivatedRoute,
        private tableStateService: TableStateService,
        private userServices: UserService
    ) {
        this.deviceSubscription = this.dataService
            .getAllDevices()
            .pipe(
                switchMap(data => {
                    return this.dataService.getTestBed().pipe(
                        switchMap(node => {
                            return this.dataService.getAllProfiles().pipe(
                                map(profiles => {
                                    return { tb: node, devices: data, profiles: profiles };
                                })
                            );
                        })
                    );
                })
            )
            .subscribe(devices => {
                if (devices.devices && devices.tb) {
                    this.allDevices = devices.devices;
                    const profiles = devices.profiles || [];
                    this.allDevices.forEach(device => {
                        let nodeDevice = [];
                        devices.tb.forEach(tbData => {
                            if (_.filter(tbData.nodes, { deviceId: device._id }).length > 0) {
                                nodeDevice = [...nodeDevice, tbData];
                            }
                        });
                        device['count'] = nodeDevice.length;
                        device['target'] = nodeDevice;
                        const testbeds = [];
                        nodeDevice.forEach(node => {
                            testbeds.push(node['testBedName']);
                        });
                        device['testBedName'] = testbeds.length > 0 ? testbeds.length : ['0'];
                        // Resolve profile name from profileId
                        if (Array.isArray(device.profileId)) {
                            const profileNames = device.profileId.map(id => {
                                const p = _.find(profiles, { _id: id });
                                return p ? p.profileName : '';
                            }).filter(n => n);
                            device['deviceProfile'] = profileNames.join(', ');
                        } else {
                            const profile = _.find(profiles, { _id: device.profileId });
                            device['deviceProfile'] = profile ? profile.profileName : '';
                        }
                    });
                    this.source.load(this.allDevices);
                }
            });

        this.teamSubsciption = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.sub1 = this.testbedService.getTestBed().subscribe(data => {
                    if (data) {
                        this.dataService.getTestBedData().next(data);
                    }
                });
            }
        });
        this.deleteDeviceValue = this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteDeviceValue;
        this.settings = Object.assign({}, this.settings);

        //Added for test device clone
        if (this.deleteDeviceValue === true) {
            this.settings.actions.custom.push(
                {
                    name: 'Clone',
                    title: '<i class="fa fa-clone" style="font-size:15px" title="clone"></i>',
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
                    title: '<i class="fa fa-copy" style="font-size:15px" title="Copy"></i>',
                    class: 'Clone',

                },
                {
                    name: 'Edit',
                    title: '<i class="fa fa-pencil" title="edit"></i>'
                });
        }

        if (this.dataService.getCurrentUser()['role'] === 'lead') {
            this.deleteDeviceValue = true;
            this.settings.actions.delete = this.deleteDeviceValue;
        } else if (this.dataService.getCurrentUser()['role'] === 'user') {
            this.deleteDeviceValue = false;
        } else if (this.dataService.getCurrentUser()['role'] === 'guest') {
            this.deleteDeviceValue = false;
            this.permissionDenied = true;
            this.settings.actions.custom.pop();
        }

        this.lbSetUp = this.dataService.getLabSetUp();

    }

    ngOnInit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                if (!event.url.startsWith('/pages/device-inventory/device')) {
                    const key = 'device';
                    this.tableStateService.clearState(key);
                }
            }
        });
        const key = 'device';
        const { filterState, currentPage } = this.tableStateService.getState(key);
        if (this.allDevices) {
            this.source.load(this.allDevices).then(() => {
                this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
            });
        }
        if (filterState.length > 0) {
            this.source.setFilter(filterState, true);
        }
        //Sort Data
        const sortData = this.dataService.getDeviceSort();
        if (sortData) {
            this.source.setSort(sortData);
        }
    }

    /**
     * Set Sort Data
     */

    setSortData() {
        this.dataService.storeDeviceSort(this.source.getSort());
    }

    ngOnDestroy() {
        if (this.teamSubsciption) {
            this.teamSubsciption.unsubscribe();
        }
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
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
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
    }

    /**
     * remove device confirmation function
     * deleteDevice function called after deletion confirmation
     * @param deleteEvent contains params
     */
    deleteDeviceConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'Device',
                successText: `Deleting will remove the Device.
                This action can't be reversed. Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot delete Device as ${deleteEvent.data.count
                    } Testbed(s) using this Device. Remove the device from those Testbed(s) to proceed. `,
                data: deleteEvent.data,
                targetName: 'Testbed',
                targetFields: ['testBedName']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub2 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteDevice(deleteEvent);
            }
        });
    }

    /**
     * Called to remove device
     * @param deleteEvent contains params
     */
    deleteDevice(deleteEvent) {
        this.dataService.loading.next(true)
        this.sub3 = this.dInventoryService.deleteDevice({ _id: deleteEvent.data._id }).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.unpairedDevice(deleteEvent.data.columnName, deleteEvent.data.selfName, deleteEvent.data.rackName);
                    this.dataService.getDeviceInventoryData().next(result);
                    this.snackBar.open('Device Deleted Successfully', 'OK', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Deleting Device', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }
    columnArray: any = [];
    shelfArray: any = [];
    labSetUpSelect: any;
    unpairedDevice(columnName, selfName, rackName) {


        for (let i = 0; i < this.lbSetUp.length; i++) {
            if (this.lbSetUp[i].rackName.toUpperCase().replace(' ', '') == rackName) {
                this.labSetUpSelect = this.lbSetUp[i]
                for (let j = 0; j < this.labSetUpSelect.design.length; j++) {
                    for (let k = 0; k < this.labSetUpSelect.design[j].length; k++) {
                        if (this.labSetUpSelect.design[j][k].shelf == selfName && this.labSetUpSelect.design[j][k].coloum == columnName) {
                            this.labSetUpSelect.design[j][k].available = true;
                            this.labSetUpSelect.design[j][k].deviceId = '';
                            this.labSetUpSelect.design[j][k].teamName = '';
                            break;
                        }
                    }

                }
                break
            }
        }

        if (this.labSetUpSelect) {
            this.userServices.updateLabSetConf(this.labSetUpSelect).subscribe((data: any) => {
                this.dataService.getSettingsData().next(data[0]);
            }, err => {
                console.log(err)
            })
        }
        // console.log(JSON.stringify(temp));


    }

    /**
     * Functie die wordt gebruikt om ADD Device Form te openen
     */
    addDevice() {
        this.dialog.open(AddDeviceComponent, {
            width: '800px',
            height: '450px',
            data: this.selectedTeam
        });
    }

    /**
     * Functie die wordt gebruikt om EDIT Device Form te openen
     */
    editDevice(editevent) {
        const key = 'device';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
        this.dInventoryService.selectedDevice.next(_.cloneDeep(editevent));
        this.router.navigate(['./edit'], { relativeTo: this.activeUrl });

    }

    onCustom(event) {
        if (event.action == 'Clone') {
            this.editDevice(event)
        }
        else if (event.action == 'Edit') {
            this.editDevice(event);
        }
        else if (event.action == 'Delete') {
            this.deleteDeviceConfirmation(event)
        }
    }

    /**
     * Loads all available profiles
     * After the loadModels
     */

    loadProfile() {
        this.sub1 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
                this.allProfileNames = [];
                this.allProfiles.forEach(profile => {
                    this.allProfileNames.push(profile.profileName);
                });

            }
            this.loadModels();
        });
    }

    /**
     * Calls to get all models
     */

    loadModels() {
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
        }
        this.modelSubscription = this.dataService.getAllModels().subscribe(models => {
            if (models) {
                this.allModels = models;
            }
        });

    }


    copyDevice(event) {
        this.dInventoryService.selectedDevice.next(_.cloneDeep(event.data));
        this.sub4 = this.dInventoryService.selectedDevice.subscribe(device => {
            if (device) {
                this.selectedDevice = device;
            } else {
                this.router.navigate(['../'], { relativeTo: this.activeUrl });
            }
        });
        this.selectedDevice.deviceName = this.selectedDevice.deviceName + '_Copied';
        this.loadProfile();
        this.loadData();
        //this.router.navigate(['./clone'], { relativeTo: this.activeUrl });
    }

    copyDeviceDetail() {

        // this.dataService.loading.next(true);
        // this.sub1 = this.dInventoryService
        //   .addDevice(this.selectedTeam, this.deviceForm.value)
        //   .subscribe(
        //     (data) => {
        //         this.dataService.loading.next(false);
        //         if (data) {
        //             this.dataService.getDeviceInventoryData().next(data);
        //             this.snackBar.open('Device Added Succesfully.', 'Ok', {
        //             duration: 5000,
        //             });
        //             this.router.navigateByUrl('pages/device-inventory/device');
        //         } else {
        //             this.snackBar.open('Error Adding Device.', 'Try Again', {
        //             duration: 5000,
        //             });
        //         }
        //     },
        //     (error) => {
        //       console.log(error);
        //       this.dataService.loading.next(false);
        //       this.snackBar.open('Error Adding Device.', 'Try Again', {
        //         duration: 5000,
        //       });
        //     }
        //   );
    }

    loadData() {
        this.deviceForm = new UntypedFormGroup({

            deviceName: new UntypedFormControl(this.selectedDevice.deviceName, Validators.required),
            deviceMac: new UntypedFormControl(this.selectedDevice.deviceMac || null, Validators.required),
            deviceIp: new UntypedFormControl(this.selectedDevice.deviceIp || null, Validators.required),
            vendor: new UntypedFormControl(this.selectedDevice.vendor, Validators.required),
            model: new UntypedFormControl(this.selectedDevice.model, Validators.required),
            profileName: new UntypedFormControl(this.selectedDevice.profileName, Validators.required),
            profileId: new UntypedFormControl(this.selectedDevice.profileId),
            available: new UntypedFormControl(null),
            reservedBy: new UntypedFormControl(this.selectedDevice.reservedBy || null),
            reservedTill: new UntypedFormControl(this.selectedDevice.reservedTill || null),
            reservedAt: new UntypedFormControl(this.selectedDevice.reservedAt || null),
            reservedFor: new UntypedFormControl(this.selectedDevice.reservedFor || null),
            session: new UntypedFormControl(this.selectedDevice.session || null),
        });
        if (this.selectedDevice['reservedAPI']) {
            this.deviceForm.addControl('reservedAPI', new UntypedFormControl(this.selectedDevice['reservedAPI']));
        }
        else {
            this.deviceForm.addControl('reservedAPI', new UntypedFormControl([]));
        }

        if (this.selectedDevice.available) {
            this.deviceForm.get('available').setValue(this.selectedDevice.available);
        } else if (this.selectedDevice.available === false) {
            this.deviceForm.get('available').setValue(this.selectedDevice.available);
        } else {
            this.deviceForm.get('available').setValue(null);
        }
        this.loadForm();

    }

    /**
     * Called to initialize the device add form with all available validations
     */

    loadForm() {
        this.selectedModel = _.filter(this.allModels, model => {
            return model.modelName === this.deviceForm.get('model').value;
        })[0];
        this.selectedProfile = _.filter(this.allProfiles, profile => {
            return profile.profileName === this.selectedModel.profileName;
        })[0];
        this.deviceForm.get('profileName').setValue(this.selectedDevice.profileName);
        this.deviceForm.get('profileId').setValue(this.selectedDevice._id);
        this.selectedProfile.labels.forEach(element => {
            if (element.type === 'text') {
                if (element.textType === 'ip') {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], [
                            Validators.required,
                            Validators.pattern(
                                '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
                            )
                        ])
                    );
                } else if (element.textType === 'mac') {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], [
                            Validators.required,
                            Validators.pattern('^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$')
                        ])
                    );
                } else {
                    this.deviceForm.addControl(
                        element.name,
                        new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
                    );
                }
            }
            this.deviceForm.addControl(
                element.name,
                new UntypedFormControl(this.selectedDevice[element.name], Validators.required)
            );


        });

        setTimeout(() => {
            this.copyDeviceDetail();
        }, 200)

    }

    // viewTargets(event) {
    //     console.log("event",event);
    //    this.dialog.open(ViewTargetComponent, {
    //         data: {
    //             targetName: "Testbed",
    //             targetFields: ["testBedName"],
    //             data: [event.data],
    //         },
    //         width: '700px',
    //         autoFocus: false,
    //         panelClass: 'app-full-bleed-dialog'
    //     });
    // }





}