import { Component, OnInit, OnDestroy } from '@angular/core';
import { DeviceInventoryService } from '../../@core/services/device-inventory.service';
import { DataService } from '../../@core/services/data.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';
import { SideBarService } from '../../@core/services/sideBar.service';

@Component({
    selector: 'app-device-inventory',
    templateUrl: './device-inventory.component.html'
})
export class DeviceInventoryComponent implements OnInit, OnDestroy {
    currentHelpDoc = 'device-vendor';
    routerSub;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/device-inventory/',
            label: 'Device Inventory'
        }
    ]
    tabs = [
        // {
        //     title: 'Vendor Name',
        //     route: '/pages/device-inventory/vendor-name',
        //     helpDocument: 'device-vendor'
        // },
        {
            title: 'Device Variables',
            route: '#/pages/device-inventory/device-variables',
            helpDocument: 'device-variable'
        },
        {
            title: 'Device Profile',
            route: '#/pages/device-inventory/device-profile',
            helpDocument: 'device-profile'
        },
        {
            title: 'Device Model',
            route: '#/pages/device-inventory/vendor-model',
            helpDocument: 'device-model'
        },
        {
            title: 'Device',
            route: '#/pages/device-inventory/device',
            helpDocument: 'device-vendor'
        }
    ];
    sub1;
    sub2;
    currentPath = false;
    deviceCsv;
    activeLink;
    allProfiles;
    constructor(private dInventoryService: DeviceInventoryService, private dataService: DataService, private route: Router,
                private sideBarService: SideBarService) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.getAllData(team);
            }
        });
        this.routerSub = this.route.events.pipe(filter(url => url instanceof NavigationEnd)).subscribe((event: any) => {
            const currentTab = this.tabs.find(tab => {
                return tab.route.includes(event.url);
            });
           // this.currentPath = currentTab.title === 'Device' ? true : false;
            if (currentTab !== undefined) {
                this.currentHelpDoc = currentTab.helpDocument;
              //  console.log('helpdoc:', this.currentHelpDoc);
            }
        });
        this.activeLink = '#' + this.route.url;
    }

    getAllData(team) {
        this.sub2 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
        
                this.dataService.getDeviceInventoryData().next(data);
            }
        });
        this.dataService
      .getAllProfiles().subscribe(dt => {
        if (dt) {
            this.allProfiles = dt;
        }
      });
        this.dataService.getAllDevices().subscribe(data => {
        if (data){
            this.deviceCsv = data;
            console.log('device', this.deviceCsv);
            this.allProfiles.map(profile => {
                const devices = _.filter(this.deviceCsv, device => {
                  return profile._id === device.profileId;
                });
                profile.deviceNames = [];
                devices.forEach(dev => {
                    profile.deviceNames.push(dev.deviceName);
                });
            });
        }
       });

    }
    onSave(){
        if (this.activeLink === '#/pages/device-inventory/device') {
        console.log('inside save');
        let columns =[];
        let fileName = 'Device List.csv';
        let columnNames = ["Device Names","MAC","IP",'Firmware','Profile Name','Model Name',"Vendor",'Shared Device',"TestBed Name" ];
        let header = columnNames.join(',');
        let csv = header;
        csv += '\r\n';
        this.deviceCsv.map(c => {
            
            columns =[]
            c.target.map(d=>{
                console.log("d",d.testBedName);
                columns.push(d.testBedName);
            })
            if (columns.length === 0) {
                columns.push("No Testbeds Available"); 
            }
            if(c['CM Firmware Version'] ==undefined ){
                csv += [c["deviceName"],c['deviceMac'],c['deviceIp'],"NA",c['profileName'],c['model'],c['vendor'],c['shareDevice'] ==true?"Yes":"No", columns].join(',');
                csv += '\r\n';
            }else{
                csv += [c["deviceName"],c['deviceMac'],c['deviceIp'],c['CM Firmware Version'],c['profileName'],c['model'],c['vendor'],c['shareDevice']==true?"Yes":"No", columns].join(',');
                csv += '\r\n';
            }
      
             })
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    } else if (this.activeLink === '#/pages/device-inventory/device-profile') {
            const fileName = 'DeviceProfile.csv';
            const columnNames = ['Profile Name', 'Device Count', 'Devices'];
            const header = columnNames.join(',');
            let csv = header;
            csv += '\r\n';
            this.allProfiles.map(profile => {
                const Devices = profile.deviceNames ? profile.deviceNames.join('; \r\n') : 'Not Mapped';
                csv += [profile.profileName, profile.deviceCount, '\"' + Devices + '\"'].join(',');
                csv += '\r\n';
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
    } else if (this.activeLink === '#/pages/device-inventory/vendor-model') {
        const fileName = 'VendorModel.csv';
        const columnNames = ['Model Name', 'Profile Name', 'Vendor', 'Device Count', 'Devices'];
        const header = columnNames.join(',');
        let csv = header;
        csv += '\r\n';
        this.dataService.getvendorModelDetails().subscribe(data => {
            data.forEach(model => {
                const deviceNames = [];
                model.target.forEach(tgt => {
                    deviceNames.push(tgt.deviceName);
                });
                const Devices = deviceNames ? deviceNames.join('; \r\n') : 'Not Mapped';
                csv += [model.modelName, model.profileName, model.deviceVendor, model.count, '\"' + Devices + '\"'].join(',');
                csv += '\r\n';
            });
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
} else if (this.activeLink === '#/pages/device-inventory/device-variables') {
    const fileName = 'DeviceVariables.csv';
    const columnNames = ['Variable Groups', 'Count', 'Variables'];
    const header = columnNames.join(',');
    let csv = header;
    csv += '\r\n';
    this.dataService.getModelVariables().subscribe(data => {
        data.forEach(variableGrps => {
            const VarNames = [];
            variableGrps.variables.forEach(variable => {
                VarNames.push(variable.variableName);
            });
            const variables = VarNames ? VarNames.join('; \r\n') : 'Not Mapped';
            csv += [variableGrps.groupName,
                variableGrps.variables.length, '\"' + variables + '\"'].join(',');
            csv += '\r\n';
        });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
    }
    ngOnInit() { }

    onTabClick(tabRoute): void{
        this.activeLink = tabRoute;
        this.sideBarService.onTabChange('Device Inventory', tabRoute.slice(1));
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.routerSub) {
            this.routerSub.unsubscribe();
        }
    }
}
