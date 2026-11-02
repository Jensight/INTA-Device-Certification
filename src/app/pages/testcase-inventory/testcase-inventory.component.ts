import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../@core/services/data.service';
import { TestCaseInventoryService } from '../../@core/services/testcase-inventory.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SideBarService } from '../../@core/services/sideBar.service';

@Component({
    selector: 'app-testcase-inventory',
    template: `
        <div class="row">
            <nav class="col-md-5 px-0" aria-label="breadcrumb">
                <ol class="breadcrumb" style="background-color:#fafafa; padding-top:0px;">
                    <li class="breadcrumb-item"><a href="#/pages/dashboard" style="color:red;text-decoration: none;font-size: medium;">Dashboard</a></li>
                    <li class="breadcrumb-item active" style="color:rgba(0, 0, 0, 0.87);text-decoration: none;font-size: medium;">TestCase Inventory</li>
                </ol>
            </nav>
            <div class="col-md-6">
                <div class="d-flex">
                    <app-title-display titleName="TestCase Inventory"></app-title-display>
                    <div style="padding-left: 25px; margin-top: -3px; ">
                        <span>
                            <i class="fa fa-question-circle-o" matTooltip="User can execute the regression only after configuring the Test Case Inventory. Each Test cases can be configured using set of APIs and it belongs to the particular Test suite and test groups." 
                            style="font-size: 17px; color:#8e97a0; margin-left:-6px; "></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="card"
            ><div class="row">
                <div class="col-md-12">
                    <div>
                    <nav mat-tab-nav-bar>
                    <a mat-tab-link style="min-width:140px; flex-grow: 0;" *ngFor="let tab of tabs;"
                         [href]="tab.route"
                        (click)="onTabClick(tab.route)"
                        [active]="activeLink == tab.route"> {{tab.title}} </a>
                        <span class="row col-md-4" style="justify-content: flex-end; padding-right: 0px">
                        <span class="col-md-7"></span>
                        <span class="col-md-1" style="padding-top: 12px;">
                        <app-help-display matTooltip="Download the Testbed inventory report" [docName]="currentHelpDoc"></app-help-display>
                    </span>
                    </span>
               </nav>
               <mat-tab-nav-panel #tabPanel><div>
               <router-outlet></router-outlet>
             </div></mat-tab-nav-panel>
             </div>
                </div></div
        ></div>
    `
})
export class TestCaseInventoryComponent implements OnInit, OnDestroy {
    public selectedTeam;
    currentHelpDoc = 'testset';
    routerSub;
    sub1;
    sub2;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/tc-inventory/test-set',
            label: 'TestCase Inventory'
        }
    ];
    tabs = [
        {
            title: 'Test Set',
            route: '#/pages/testcase-inventory/test-set',
            helpDocument: 'testset'
        },
        {
            title: 'Test Suite',
            route: '#/pages/testcase-inventory/testsuite',
            helpDocument: 'testsuite'
        },
        {
            title: 'Test Group',
            route: '#/pages/testcase-inventory/testgroup',
            helpDocument: 'testgroup'
        },
        {
            title: 'Testcase',
            route: '#/pages/testcase-inventory/testcase',
            helpDocument: 'testcase'
        },
        {
            title: 'Download CSV',
            route: '#/pages/testcase-inventory/download',
            helpDocument: 'testcase'
        }
       
    ];
    activeLink;
    constructor(private dataService: DataService, private tcInventoryService: TestCaseInventoryService, private route: Router,
                private sideBarService: SideBarService) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.getAllData();
            }
        });
        this.routerSub = this.route.events.pipe(filter(url => url instanceof NavigationEnd)).subscribe((event: any) => {
            const currentTab = this.tabs.find(tab => {
                return tab.route.includes(event.url);
            });
            if (currentTab !== undefined) {
                this.currentHelpDoc = currentTab.helpDocument;
            }
        });
        this.activeLink = '#' + this.route.url;
    }

    getAllData() {
        this.dataService.getTcInventoryData().subscribe(data => {
            if (!data) {
                this.sub2 = this.tcInventoryService.getAllData().subscribe(allData => {
                    if (allData) {
                        this.dataService.getTcInventoryData().next(allData);
                    }
                });
            }
        });           
    }

    ngOnInit() { }

    onTabClick(tabRoute): void{
        this.activeLink = tabRoute;
        this.sideBarService.onTabChange('TestCase Detail', tabRoute.slice(1));
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
