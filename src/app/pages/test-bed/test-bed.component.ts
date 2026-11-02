import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../@core/services/data.service';
import { TestBedService } from '../../@core/services/test-bed.service';
import { UserService } from '../../@core/services/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SideBarService } from '../../@core/services/sideBar.service';
import * as _ from 'lodash';
@Component({
    selector: 'app-test-bed',
    template: `
        <div class="row">
            <nav class="col-md-5 px-0" aria-label="breadcrumb">
                <ol class="breadcrumb" style="background-color:#fafafa; padding-top:0px;">
                    <li class="breadcrumb-item"><a href="#/pages/dashboard" style="color:red;text-decoration: none;font-size: medium;">Dashboard</a></li>
                    <li class="breadcrumb-item active" style="color:rgba(0, 0, 0, 0.87);text-decoration: none;font-size: medium;">Test Bed</li>
                </ol>
            </nav>
            <div class="col-md-6">
                <div class="d-flex">
                    <app-title-display titleName="Test Bed"></app-title-display>
                    <div style="padding-left: 25px; margin-top: -5px; ">
                        <span>
                            <i class="fa fa-question-circle-o" matTooltip="User can create a individual testbed on choosing Testbed menu, user will be able to see list of Testbed created by the user along with its node name and Config status after configuring the node and variable ." 
                            style="font-size: 17px; color:#8e97a0; margin-left: -6px; "></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="card"
            ><div class="row">
                <div class="col-md-12">
                <nav mat-tab-nav-bar>
                <ng-container *ngFor="let tab of tabs;">
                  <a mat-tab-link style="min-width:120px; flex-grow: 0;"
                       *ngIf="(!tab.sysadminOnly || isSysAdmin) && (!tab.requiresRestrictToUser || restrictTestbedToUser)"
                       [href]="tab.route"
                      (click)="onTabClick(tab.route)"
                      [active]="activeLink == tab.route"> {{tab.title}} </a>
                </ng-container>
                    <span class="row col-md-6" style="justify-content: flex-end; padding-right: 0px">
                    <span class="col-md-7"></span>
                    <span class="col-md-1" style="padding-top: 15px;padding-right: 4%;">
                    <span (click) ="onSave()" title="Download CSV Report For TestBed" >
                    <i class="fa fa-download fa-1x" aria-hidden="true" style="color: #da291c;
                    background-color: white; border: none; font-size: 1.3333333333em;"></i>
                    </span>
                    </span>
                    <span class="col-md-1" style="padding-top: 12px;">
                    <app-help-display matTooltip="Download the Testbed inventory report" [docName]="currentHelpDoc"></app-help-display>
                </span>
                </span>
           </nav>
           <mat-tab-nav-panel #tabPanel><div>
           <router-outlet></router-outlet>
         </div></mat-tab-nav-panel>
                </div></div
        ></div>
    `
})
export class TestBedComponent implements OnInit, OnDestroy {
    sub1;
    routerSub;
    currentHelpDoc = 'network-element';
    currentPath = true;
    public selectedTeam;
    testBedCsv;
    deviceCsv;
    activeLink;
    tbProfiles;
    allProfiles;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/test-bed/view',
            label: 'Test Bed'
        }
    ];
    tabs = [
        {
            title: 'Network Element',
            route: '#/pages/test-bed/network-element',
            helpDocument: 'network-element'
        },
        // {
        //     title: 'Testbed Variables',
        //     route: '/pages/test-bed/testbed-variables',
        //     helpDocument: 'variables'
        // },
        {
            title: 'Testbed Profile',
            route: '#/pages/test-bed/testbed-profile',
            helpDocument: 'profile'
        },
        {
            title: 'Testbed',
            route: '#/pages/test-bed/view',
            helpDocument: 'testbed'
        },
        {
            title: 'User - TestBed Access Matrix',
            route: '#/pages/test-bed/user-testbed-matrix',
            helpDocument: 'testbed',
            // Only visible when the team's "Restrict Test Bed to User" toggle is enabled.
            requiresRestrictToUser: true
        }
    ];
    isSysAdmin = false;
    // Controls visibility of the "User - TestBed Access Matrix" tab; driven by the
    // team-specific "Restrict Test Bed to User" regressionConfig toggle.
    restrictTestbedToUser = false;
    constructor(private dataService: DataService, private testbedService: TestBedService, private route: Router,
                private sideBarService: SideBarService, private userService: UserService) {
        const currentUser: any = this.dataService.getCurrentUser();
        this.isSysAdmin = !!(currentUser && (currentUser.username === 'sysadmin'));
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.updateAccessMatrixTabVisibility();
            }
        });
        this.routerSub = this.route.events.pipe(filter(url => url instanceof NavigationEnd)).subscribe((event: any) => {
            const currentTab = this.tabs.find(tab => {
                return tab.route.includes(event.url);
            });
            this.currentPath = currentTab.title === 'Testbed' ? true :false;
            if (currentTab !== undefined) {
                this.currentHelpDoc = currentTab.helpDocument;
            }
        });
        this.activeLink = '#' + this.route.url;
        this.dataService.getTestBed().subscribe(data => {
            if(data){
                this.testBedCsv = data;
            }
        }),
        this.dataService.getAllDevices().subscribe(data => {

            if (data){
                this.deviceCsv = data;
            }
           });
        this.dataService.getTestbedProfile().subscribe((testbedProfile) => {
             if (testbedProfile) {
               this.tbProfiles = testbedProfile;
             }
           });
        setTimeout(() => this.dataService.getAllNodesDetails().subscribe((nodes) => {
            nodes?.forEach(node => {
            node.testBeds = node.testBeds ? node.testBeds : [];
            this.testBedCsv.forEach(testbed => {
                const nd = _.find(testbed.nodes, { nodeId : node._id});
                if (nd){
                 node.testBeds.push(testbed.testBedName);
                }
                node.testBeds = _.uniq(node.testBeds);
            });
        });
        }), 100);
    }

    ngOnInit() { }

    /**
     * Show the "User - TestBed Access Matrix" tab only when the team's
     * "Restrict Test Bed to User" toggle (regressionConfig) is enabled.
     */
    private updateAccessMatrixTabVisibility(): void {
        if (!this.selectedTeam) { return; }
        this.userService.getAllusers().subscribe((data: any) => {
            const settings = data && data[0] ? data[0] : null;
            let restrict = false;
            if (settings && settings.regressionConfig && settings.regressionConfig[0]
                && settings.regressionConfig[0].teams) {
                const teamConfig = settings.regressionConfig[0].teams
                    .find((t: any) => t.name === this.selectedTeam);
                restrict = !!(teamConfig && teamConfig.restrict_testbed_to_user);
            }
            this.restrictTestbedToUser = restrict;
        });
    }

    onTabClick(tabRoute): void{
        this.activeLink = tabRoute;
        this.sideBarService.onTabChange('Test Bed', tabRoute.slice(1));
    }
    onSave(){
        if (this.activeLink === '#/pages/test-bed/view') {

            const fileName = 'Test Bed List.csv';
            const columnNames = ['TestBed Names', 'Profile Names', 'Dut Testbed ModelNames', 'Network Element Names'];
            const header = columnNames.join(',');
            let csv = header;
            // let devices=[]
            csv += '\r\n';
            console.log('tedtbed', this.testBedCsv);
            this.testBedCsv.map(c => {
                c.devices = [];

                c.nodes.map(device => {
                    if (device.profileId == null) {
                        c.devices.push(device.deviceId);
                    } else {
                        _.find(this.deviceCsv, (id) => {
                            if (device.deviceId === id._id) {
                                c.devices.push(id.deviceName);
                            }
                        });

                    }
                });
                csv += [c.testBedName, c.profileName, c.modelName, c.devices.join('; '), ].join(',');
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
        } else if (this.activeLink === '#/pages/test-bed/testbed-profile') {
            const fileName = 'Test Bed Profile.csv';
            const columnNames = ['Testbed Profile Name', 'Testbed Count', 'Testbeds'];
            const header = columnNames.join(',');
            let csv = header;
            csv += '\r\n';
            this.tbProfiles.forEach(tbProfile => {
                const testBedNames = [];
                tbProfile.target.forEach( ele => {
                    testBedNames.push(ele.testBedName);
                });
                const testBeds = testBedNames.length > 0 ? testBedNames.join('; \r\n') : 'Not Mapped';
                csv += [tbProfile.testBedProfileName, tbProfile.count, '\"' + testBeds + '\"'].join(',');
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
        } else if (this.activeLink === '#/pages/test-bed/network-element') {
            this.dataService.getAllProfiles().subscribe(profile => {
                if (profile) {
                   this.allProfiles = profile;
                }
            });
            const fileName = 'Network Element.csv';
            const columnNames = ['Networ Element', 'Testbed Profile', 'Testbed Count', 'Testbeds'];
            const header = columnNames.join(',');
            let csv = header;
            csv += '\r\n';
            this.dataService.getAllNodesDetails().subscribe((nodes) => {
                nodes.forEach(node => {
                const tbProfile = _.find(this.allProfiles, { _id: node.profileId });
                console.log('tbProfile ', tbProfile);
                const testBeds = node.testBeds.length > 0 ? node.testBeds.join('; \r\n') : 'Not Mapped';
                csv += [node.nodeName, tbProfile ? tbProfile.profileName : 'NA', node.nodeCount, '\"' + testBeds + '\"'].join(',');
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
    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.routerSub) {
            this.routerSub.unsubscribe();
        }
    }
}
