import { Router, ActivatedRoute } from '@angular/router';
import { RouterService } from './../@core/services/router.service';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ADMIN_MENU_ITEMS, LEAD_MENU_ITEMS, USER_MENU_ITEMS } from './pages-menu';
import { DataService } from '../@core/services/data.service';
import { SideBarService } from '../@core/services/sideBar.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { UserService } from '../@core/services/user.service';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { Location } from '@angular/common';
import { BnNgIdleService } from 'bn-ng-idle';
import { LoginService } from '../@core/services/login.service';
import {  SESSION_30DAYS_LOGOUT} from 'src/app/models/config';
import { DashboardService } from 'src/app/@core/services/dashboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TestLabService } from '../@core/services/test-lab.service';

@Component({
    selector: 'ngx-pages',
    templateUrl: './pages.component.html',
    styleUrls: ['./pages.component.scss'],
    providers: [DatePipe]
})

export class PagesComponent implements OnInit, OnDestroy {
    private subscription;
    sub1;
    rawMenu = [...USER_MENU_ITEMS];
    menuList;
    isMenuOpened = true;
    transSub;
    telemetry_option_flag: boolean = false;
    // dashBoardConfig: any;
    systemsConfig: any;
    logoutTimeInSeconds: number = SESSION_30DAYS_LOGOUT;
    isSessionExpired = false;
    diskUtilizationValue = 0;
    diskUtilizationThresholdValue;
    settingsData: any;
    showDiskUtilizationWarning = false;
    showJiraTokenWarning = false;
    diffInDays = 0;
    jiraMessage: string;
    
    private timeInterval: number = 30 * 60 * 1000; // 30 minutes in milliseconds
    private alarmSubscription: Subscription | undefined;
    showStuckRegressionWarning: boolean;

    constructor(
        private routerService: RouterService,
        public dataService: DataService,
        private router: Router,
        private translate: TranslateService,
        private userService: UserService,
        private sideBarService: SideBarService,
        private loginService: LoginService,
        private bnIdle: BnNgIdleService,
        private dashboardService: DashboardService,
       // private snackBar: MatSnackBa
        public snackBar: MatSnackBar,
        public cd: ChangeDetectorRef,
        public datepipe: DatePipe,
        private testLabService: TestLabService
    ) {
        // this.StartCheckingStuckRegs();
        this.menuChange();
        this.translation();
    }
    ngOnInit() {
       let date = new Date();
       this.dataService.isJiraEnabled.next(false);
        if (this.dataService.getCurrentUser()) {
            console.log('current user', this.dataService.getCurrentUser());
            this.testLabService.validateJiraUser({email: this.dataService.getCurrentUser()['email']}).subscribe((result:any) => {
                if(result && result?.validUser === true){
                    this.dataService.getCurrentUser()['validJiraUser'] = true;
                } 
                if(result && result?.jiraReachable === true){
                    this.dataService.getCurrentUser()['jiraReachable'] = true;
                }
                if(result && result?.validUser === false){
                    this.dataService.getCurrentUser()['validJiraUser'] = false;
                }
                if(result && result?.jiraReachable === false){
                    this.dataService.getCurrentUser()['jiraReachable'] = false;
                }
                if(result && result?.activeUser === true){
                    this.dataService.getCurrentUser()['activeJiraUser'] = true;
                }
                if(result && result?.activeUser === false){
                    this.dataService.getCurrentUser()['activeJiraUser'] = false;
                }
                console.log('current user', this.dataService.getCurrentUser());
            });
            this.subscription = this.dataService.selectedTeam.subscribe((team) => {
                if (this.dataService.getCurrentUser().role === 'admin') {
                    this.rawMenu = [...ADMIN_MENU_ITEMS];
                    this.menuChange();
                } else if (this.dataService.getCurrentUser().role === 'lead') {
                    this.rawMenu = [...LEAD_MENU_ITEMS];
                    this.menuChange();
                }
                if (!team && this.dataService.getCurrentUser().teams.length > 1) {
                    this.router.navigate(['/selectteam']);
                } else if (!team) {
                    this.dataService.selectedTeam.next(this.dataService.getCurrentUser().teams[0]);
                }
                
            });
        }
        this.sideBarService.removeActiveClassOnLoad();
        this.dataService.getSettingsData().subscribe((settingsdata: any) => {
            if (!settingsdata) {
                this.userService.getAllusers().subscribe((data: any) => {
                    this.dataService.saveSettingData(data[0]);
                    settingsdata = data;
                    this.settingsData = data;

                });
            } else {
                const temp = [];
                temp.push(settingsdata);
                this.settingsData = temp;

            }
            setTimeout(() => {
            if (this.settingsData && this.settingsData[0]) {
                console.log("settings data93", this.settingsData[0])
                if (this.settingsData[0].systemConfig &&
                    this.settingsData[0].systemConfig[0].server_monitor_page_warning_value) {
                    this.dashboardService.getHygieneDataLatest().subscribe((res: any) => {
                        this.diskUtilizationThresholdValue = parseInt(this.settingsData[0].systemConfig[0].server_monitor_page_warning_value);
                        console.log('disk utilization thresold value', this.diskUtilizationThresholdValue);
                       // let latestDate = new Date(Math.max(...res.hygieneData[0].hygiene_data.map((el: any) =>
                       //     new Date(el.time.replace(/\s/g, ''))))).toISOString();
                       // let latestChartData = res.hygieneData[0].hygiene_data.find((el: any) => el.time.replace(/\s/g, '') === latestDate);
                        this.diskUtilizationValue = parseInt(res[0].diskutilization.disk_percentage);
                        this.cd.detectChanges();
                        console.log("disk utilization value", this.diskUtilizationValue);
                        if (this.diskUtilizationThresholdValue < this.diskUtilizationValue) {
                            this.showDiskUtilizationWarning = true;
                            this.cd.detectChanges();
                        } else {
                           this.showDiskUtilizationWarning = false;
                            this.cd.detectChanges();
                        }
                    }, (err: any) => {
                        console.log(err);
                    });
                }
                // Jira Config
                if (this.settingsData[0].jiraConfig && this.settingsData[0].jiraConfig[0] ) {
                   // this.settingsData[0].jiraConfig[0].jiraIntegration
                   // && this.settingsData[0].jiraConfig[0].jiraTokenExpiry
                        if(this.settingsData[0].jiraConfig[0].teams){
                            this.dataService.selectedTeam.subscribe((team) => {
                                if (team) {
                                    const teamJiraDetails = this.settingsData[0].jiraConfig[0].teams.filter(ele => {
                                        return (ele.teamname === team);
                                      });
                                      console.log('team jira Deatils', teamJiraDetails);
                                      if(teamJiraDetails && teamJiraDetails.length > 0 && teamJiraDetails[0].jiraIntegration && teamJiraDetails[0].jira_project_id){
                                          this.dataService.isJiraEnabled.next(true);
                                      }
                                }
                              });
                           
                        }
                        const jiraWarningAfter = this.settingsData[0].jiraConfig[0].jiraWarningAfter ? this.settingsData[0].jiraConfig[0].jiraWarningAfter : 10;
                        const currentDate = new Date()
                        const temp = this.datepipe.transform(this.settingsData[0].jiraConfig[0].jiraTokenExpiry, 'yyyy-MM-dd');
                        const expiryDate =  new Date(temp);
                        this.diffInDays = Math.floor((Date.UTC(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()) - Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) ) /(1000 * 60 * 60 * 24));
                        console.log('currentDate, expiryDate, diff', currentDate, expiryDate, this.diffInDays);
                        this.showJiraTokenWarning = this.diffInDays < jiraWarningAfter;

                        if (this.showJiraTokenWarning) {
                          if (this.diffInDays < 0) {
                            this.jiraMessage = `JIRA Token is expired ${Math.abs(this.diffInDays)} ${
                              Math.abs(this.diffInDays) === 1 ? 'day' : 'days'
                            } ago`;
                          } else {
                            this.jiraMessage = 'Jira Token is expiring in ' + this.diffInDays + ' days';
                          }
                        }
                        console.log('show jira token', this.showJiraTokenWarning);
                    }
                this.systemsConfig = this.settingsData[0].systemConfig;
                this.loginService.isLoggedIn();
                if (this.systemsConfig && this.systemsConfig[0] && this.systemsConfig[0].enable_30mins_session_logout
                    && this.systemsConfig[0].enable_30mins_session_logout.trim() > 0) {
                    const logouttime = Number(this.systemsConfig[0].enable_30mins_session_logout);
                    const timeInSec = logouttime * 60;
                    this.bnIdle.startWatching(timeInSec).subscribe((idleTimeout: boolean) => {
                        const isSessionActive = (sessionStorage.getItem('xarc_user_logged')
                            || sessionStorage.getItem('loginlogout')) ? true : false;
                        this.dataService.isSessionExpired.subscribe(sess => {
                            this.isSessionExpired = sess;
                        });
                        if (isSessionActive && idleTimeout && !this.isSessionExpired) {
                            alert('You have been idle for ' + logouttime + ' mins. Session has been expired');
                            this.loginService.addlogouttime().subscribe((data: any) => {
                                sessionStorage.removeItem('loginlogout');
                                this.router.navigate(['/login']);
                            }, err => {
                                sessionStorage.removeItem('loginlogout');
                                this.router.navigate(['/login']);
                            });
                            this.dataService.isSessionExpired.next(true);
                        }
                    });
                }
                if (this.settingsData[0].extraSystemConfig && this.settingsData[0].extraSystemConfig[0]) {
                    if (this.settingsData[0].extraSystemConfig[0].cpe_telemetry == true) {
                        this.telemetry_option_flag = true;
                        if (this.telemetry_option_flag == true && this.rawMenu) {
                            this.rawMenu.forEach(el => {
                                if (el.title == 'Scheduler' || el.title == 'Test Scheduler') {
                                    // console.log(el);
                                    var flag = false;
                                    var count = 0;
                                    el['children'].forEach(pg => {

                                        if (pg.title == 'Telemetry') {
                                            flag = true;
                                        }
                                        count++;

                                        if (count == el['children'].length && flag == false) {
                                            el['children'].push(
                                                {
                                                    title: 'Telemetry',
                                                    link: '/pages/test-scheduler/telemetry',
                                                    icon: 'plus-circle-outline',
                                                    active: false,
                                                    hasTabs: false,
                                                    tabs: null
                                                }
                                            )
                                        }
                                    })
                                }
                            })
                        }
                    }
                }
                // Dynamic Scheduler visibility based on regressionConfig
                if (this.rawMenu) {
                    // Some flows push a partial document through this same
                    // BehaviorSubject (e.g. add/edit/pair device → PUT
                    // /sysConfiguration/updatelabsetup returns a LabSetup
                    // document, not the full settings). When that happens
                    // `regressionConfig` is undefined and the rebuild below
                    // would silently strip the Dynamic Scheduler menu entry
                    // until the next page refresh. Skip the rebuild for
                    // those non-settings emissions.
                    const hasRegressionConfig =
                        this.settingsData[0].regressionConfig
                        && this.settingsData[0].regressionConfig.length > 0
                        && this.settingsData[0].regressionConfig[0].teams;

                    if (hasRegressionConfig) {
                        let showDynamicScheduler = false;
                        const currentTeam = this.dataService.selectedTeam.getValue();
                        if (currentTeam) {
                            const teamConfig = this.settingsData[0].regressionConfig[0].teams.find(
                                (t: any) => t.name === currentTeam
                            );
                            showDynamicScheduler = teamConfig && teamConfig.show_dynamic_scheduler ? true : false;
                        }
                        this.rawMenu.forEach(el => {
                            if (el.title == 'Scheduler' || el.title == 'Test Scheduler') {
                                // Remove Dynamic Scheduler if it exists
                                el['children'] = el['children'].filter(
                                    (pg: any) => pg.title !== 'Dynamic Scheduler'
                                );
                                // Add it back only if enabled
                                if (showDynamicScheduler) {
                                    el['children'].push({
                                        title: 'Dynamic Scheduler',
                                        link: '/pages/test-scheduler/dynamicScheduler',
                                        icon: 'dynamic_feed',
                                    });
                                }
                            }
                        });
                        this.menuChange();
                    }
                }
            }
        }, 30);
        });
        this.dataService.hasStuckRegression.subscribe((hasStuckRegression) => {
            this.cd.detectChanges();
        });
    }

    ngOnDestroy() {
       // this.stopCheckingStuckRegs();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        if (this.sub1) {
            this.sub1.unsubscribe();
        }

        if (this.transSub) {
            this.transSub.unsubscribe();
        }
    }

    StartCheckingStuckRegs() {
    this.alarmSubscription = interval(this.timeInterval).subscribe(() => {
      this.testLabService.getStuckedRegression().subscribe((res: any) => {
        // if (res && res.data && res.data.length > 0) {
        //     this.showStuckRegressionWarning = true;
        // }
      });
    });
  }

    stopCheckingStuckRegs() {
        if (this.alarmSubscription) {
            this.alarmSubscription.unsubscribe();
        }
    }

    translation() {
        this.transSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
            this.menuChange();
        });
    }

    menuChange() {
        const transObj = this.translate.instant('DASHBOARD');
        const menuDuplicate = _.cloneDeep(this.rawMenu);
        const finalMenu: BehaviorSubject<any> = new BehaviorSubject([]);
        for (let index = 0; index < menuDuplicate.length; index++) {
            const element = menuDuplicate[index]['title'];
            const transTitle = transObj[element.toUpperCase()];
            menuDuplicate[index]['title'] = transTitle ? transTitle : element;
            if (menuDuplicate[index]['children'] && menuDuplicate[index]['children'].length > 0) {
                for (let j = 0; j < menuDuplicate[index]['children'].length; j++) {
                    const child = menuDuplicate[index]['children'][j]['title'];
                    const transTitle1 = transObj[child.toUpperCase()];
                    menuDuplicate[index]['children'][j]['title'] = transTitle1 ? transTitle1 : child;
                    const childObj = menuDuplicate[index]['children'][j]['children'];
                    if (childObj && childObj.length > 0) {
                        for (let k = 0; k < childObj.length; k++) {
                            const grandChild = childObj[k]['title'];
                            const transTitle2 = transObj[grandChild.toUpperCase()];
                            childObj[k]['title'] = transTitle2 ? transTitle2 : grandChild;
                        }
                    }
                }
            }
        }
        finalMenu.next(menuDuplicate);
        this.menuList = finalMenu.value;
        this.dataService.getMenuList().next(finalMenu.value);
    }

    clearSort() {
        this.dataService.clearSortData();
    }

    onMenuToggle(): void{
        this.isMenuOpened = !this.isMenuOpened;
    }
 
}
