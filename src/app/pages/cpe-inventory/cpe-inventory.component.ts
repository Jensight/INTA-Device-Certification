import { DataService } from './../../@core/services/data.service';
import { DeviceInventoryService } from './../../@core/services/device-inventory.service';
import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SideBarService } from '../../@core/services/sideBar.service';
@Component({
    selector: 'app-cpe-inventory',
    template: `
        <div class="row">
            <nav class="col-md-5 px-0" aria-label="breadcrumb">
                <ol class="breadcrumb" style="background-color:#fafafa; padding-top:0px;">
                    <li class="breadcrumb-item"><a href="#/pages/dashboard" style="color:red;text-decoration: none;font-size: medium;">Dashboard</a></li>
                    <li class="breadcrumb-item active" style="color:rgba(0, 0, 0, 0.87);text-decoration: none;font-size: medium;">Reserve Devices</li>
                </ol>
            </nav>
            <div class="col-md-6">
                <div class="d-flex">
                    <app-title-display titleName="Reserve Devices"></app-title-display>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="row">
                <div class="col-md-12">
                <nav mat-tab-nav-bar>
                <a mat-tab-link style="min-width: 140px; flex-grow: 0;" *ngFor="let tab of tabs;"
                     [href]="tab.route"
                    (click)="onTabClick(tab.route)"
                    [active]="activeLink == tab.route"> {{tab.title}} </a>
                    <span class="row col-md-6" style="justify-content: flex-end; padding-right: 0px">
                    <span class="col-md-7"></span>
                    <span class="col-md-1" style="padding-top: 12px;">
                    <app-help-display [docName]="currentHelpDoc" matTooltip="Get Help !!" style="padding-left:200px"></app-help-display>
                </span>
                </span>
           </nav>
           <mat-tab-nav-panel #tabPanel><div>
           <router-outlet></router-outlet>
         </div></mat-tab-nav-panel>
                </div>
            </div>
        </div>
    `
})
export class CPEInventoryComponent implements OnDestroy {
    sub1;
    sub2;
    routerSub;
    activeLink;
    currentHelpDoc ='device-reservation';
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/reserve/device',
            label: 'Reserve Devices'
        }
    ];
    tabs = [
        {
            title: 'Devices',
            route: '#/pages/reserve/device',
            helpDocument: 'reserve-device'
        },
        {
            title: 'Testbed',
            route: '#/pages/reserve/testbed',
            helpDocument: 'reserve-testbed'
        }
    ];

    constructor(private dInventoryService: DeviceInventoryService, private dataService: DataService, private route: Router,
                private sideBarService: SideBarService) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.getAllData();
            }
        });
        this.routerSub = this.route.events.pipe(filter(url => url instanceof NavigationEnd)).subscribe((event: any) => {
            const currentTab = this.tabs.find(tab => {
                return tab.route.includes(event.url);
            });
            if(currentTab !== undefined){
                this.currentHelpDoc = currentTab.helpDocument;
            }
        });
        this.activeLink = '#' + this.route.url;
    }

    onTabClick(tabRoute): void{
        this.activeLink = tabRoute;
        this.sideBarService.onTabChange('Manual Reservation', tabRoute.slice(1));
    }
    getAllData() {
        this.sub2 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getDeviceInventoryData().next(data);
            }
        });
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
