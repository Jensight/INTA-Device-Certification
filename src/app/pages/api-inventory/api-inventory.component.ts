import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../@core/services/api.service';
import { DataService } from '../../@core/services/data.service';
import { ActivatedRoute, ActivatedRouteSnapshot, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NameFromIdPipe } from '../../@shared/pipes/name-from-id.pipe';
import { SideBarService } from '../../@core/services/sideBar.service';
@Component({
    selector: 'app-name',
    providers: [NameFromIdPipe],
    template: `
        <div class="row">
            <nav class="col-md-5 px-0" aria-label="breadcrumb">
                <ol class="breadcrumb" style="background-color:#fafafa; padding-top:0px;">
                <li class="breadcrumb-item"><a href="#/pages/dashboard" style="color:red;text-decoration: none;font-size: medium;">Dashboard</a></li>
                <li class="breadcrumb-item active" style="color:rgba(0, 0, 0, 0.87);text-decoration: none;font-size: medium;">API Inventory</li>
                </ol>
            </nav>
            <div class="col-md-6">
                <div class="d-flex">
                    <app-title-display titleName="API Inventory"></app-title-display>
                    <div style="padding-left: 25px; margin-top: -3px;">
                        <span>
                            <i class="fa fa-question-circle-o" matTooltip="For creating a test cases, user need to create a set of APIs with API group. That can be added using API Inventory." 
                            style="font-size: 17px; color:#8e97a0; margin-left:-6px; "></i>
                        </span>
                    </div>
                </div>
            </div>    
        </div>
        <div class="card">
            <div class="row">
                <div class="col-md-12">
                    <nav mat-tab-nav-bar>
                    <a mat-tab-link  style="min-width:110px; flex-grow: 0;" *ngFor="let tab of tabs;"
                         [href]="tab.route"
                        (click)="onTabClick(tab.route)"
                        [active]="activeLink == tab.route"> {{tab.title}} </a>
                        <span class="row col-md-8" style="justify-content: flex-end; padding-right: 0px">
                        <span class="col-md-9"></span>
                        <span class="col-md-1" style="padding-top: 15px;padding-right: 4%;">
                                   <span
                            (click)="onSave()" title="Download CSV Report For API">
                            <i class="fa fa-download fa-lg" aria-hidden="true" style="color: #da291c;
                            background-color: white; border: none;"></i>
                        </span></span>
                        <span class="col-md-1" style="padding-top: 12px; padding-left: 40px;">
                            <app-help-display matTooltip="Download the API inventory report"
                            [docName]="currentHelpDoc"></app-help-display>
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
export class APIInventoryComponent implements OnInit, OnDestroy {
    currentHelpDoc = 'API-Group';
    routerSub;
    tabs = [
        {
            title: 'API Group',
            route: '#/pages/api-inventory/group',
            helpDocument: 'API-Group'
        },
        {
            title: 'API',
            route: '#/pages/api-inventory/api',
            helpDocument: 'API'
        }
    ];
    activeLink;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/api-inventory/group',
            label: 'API Inventory'
        }
    ];
    sub1;
    sub2;
    apiCsvData;
    apiGroup;
    currentPath=false
    constructor(private apiService: ApiService, private dataService: DataService, private route: Router,
                private nameFromId: NameFromIdPipe, private sideBarService: SideBarService) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.getAllData();
            }
        });

        this.routerSub = this.route.events.pipe(filter(url => url instanceof NavigationEnd)).subscribe((event: any) => {
            const currentTab = this.tabs.find(tab => {
                return tab.route.includes(event.url);
            });
            this.currentPath = currentTab.title =="API"?false:false;
            if (currentTab !== undefined) {
                this.currentHelpDoc = currentTab.helpDocument;
            }
        });
        this.activeLink = '#' + this.route.url;
    }

    getAllData() {
        this.sub2 = this.apiService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getAPIData().next(data);
            }
        });
        this.dataService.getAllAPI().subscribe(data => {
            if (data){
                this.apiCsvData =  data;
            }
        });
        this.dataService.getAllAPIGroup().subscribe(data => {
            this.apiGroup = data;
        });
        setTimeout(() => {
        if (this.apiCsvData) {
            this.apiCsvData.forEach( api => {
        this.apiGroup.forEach(apiGrp => {
            apiGrp.APIList = apiGrp.APIList ? apiGrp.APIList : [];
            if (apiGrp._id === api.apiGroupId){
                apiGrp.APIList.push(api.apiName);
            }
            });
            });
        }
    }, 100);

    }

    tabChanged(event) {
    }

    ngOnInit() { }

    onTabClick(tabRoute): void{
        this.activeLink = tabRoute;
        this.sideBarService.onTabChange('API Inventory', tabRoute.slice(1));
    }

    onSave(){
        if (this.activeLink === '#/pages/api-inventory/api'){
            let agrument = [];
            const fileName = 'API List.csv';
            const columnNames = ['Api Names', 'Api Group', 'Argument Value'];
            const header = columnNames.join(',');
            let csv = header;
            csv += '\r\n';
            this.apiCsvData.map(c => {
                agrument = [];
                c.arguments.map(d => {
                    agrument.push(d.argumentName);
                });
                c.name = this.nameFromId.transform(c.apiGroupId, this.apiGroup, '_id', 'name');
                csv += [c['apiName'], c['name'], agrument].join(',');
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
    } else if (this.activeLink === '#/pages/api-inventory/group') {
        const fileName = 'APIGroup.csv';
        const columnNames = ['API Group', 'Primary URL', 'Secondary URL', 'API Count'];
        const header = columnNames.join(',');
        let csv = header;
        csv += '\r\n';
        console.log('API Grp', this.apiGroup);
        this.apiGroup.map(apiGrp => {
            const apiList = apiGrp.APIList ? apiGrp.APIList.join('; \r\n') : 'Not Mapped';
            csv += [apiGrp.name, '\"' + apiGrp.primaryURL + '\"', '\"' + apiGrp.secondaryURL + '\"', apiGrp.counter,
                   '\"' + apiList + '\"'].join(',');
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

    }
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
