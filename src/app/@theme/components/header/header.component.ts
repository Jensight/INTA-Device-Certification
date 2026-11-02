import { DataService } from './../../../@core/services/data.service';
import { Subject, Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { FeedbackComponent } from './feedback/feedback.component';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { LoginService } from 'src/app/@core/services/login.service';
import { filter, map } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { DashboardService } from 'src/app/@core/services/dashboard.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from 'src/app/@core/services/user.service';


@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  public readonly materialTheme$: Observable<boolean>;
  userPictureOnly: boolean = false;
  user: any = { picture: '../../../../assets/images/user.png' }


 // currentTheme = 'material-light';

  userMenuOrg = [{ title: 'Log out'}] //, link: '../login'
  userMenu: any = [];
  transSub;
  selectedTeam;
  showDropDown = 0;
  teamList: any = [];
  allFeedbackCount: any;
  info:any = 'Welcome';
  sub2: any;
  settingsData: any;

  public constructor(
    private dataService: DataService,
    private translate: TranslateService,
    private tcInventoryService: TestCaseInventoryService,
    private dialog: MatDialog,
    private router: Router,
    private loginservice: LoginService,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    public snackBar: MatSnackBar,
    public userService: UserService
  ) {
  }

  ngOnInit() {
    // this.currentTheme = this.themeService.currentTheme;
    const user = this.dataService.getCurrentUser();
    if (user.teams.length > 0) {
      // this.userMenuOrg.unshift({
      //   title: 'Change Team',
      //   link: '../selectteam'
      // });
      this.showDropDown = 1;
      this.dataService.selectedTeam.subscribe(team => {
        if (team) {
          this.selectedTeam = team;
        }
      });
      this.teamList = user.teams;
    }
    if(user.name) {
      this.user = { name: user.name, picture: 'assets/images/user.png' };
    } else {
      this.user = { name: user.username, picture: 'assets/images/user.png' };
    }
    
    this.translation();

    // Notification Badge
    const userDetails = this.dataService.getCurrentUser();
    this.dataService.getAllFeedback().subscribe(data => {
      if (data) {
        if (userDetails.role !== 'admin') {
          const tcModule = _.filter(data, function (feedback) {
            return feedback.createdBy === userDetails._id;
          });

          const feedbackData = _.filter(data, function (feedback) {
            if (feedback.userList && feedback.userList.length > 0) {
              // tslint:disable-next-line: prefer-for-of
              for (let index = 0; index < feedback.userList.length; index++) {
                if (feedback.userList[index].username === userDetails.username && feedback.userList[index].read === 0) {
                  return feedback;
                }
              }
            }
          });
          this.dataService.setBatchValue(feedbackData.length);
          this.dataService.getBatchValue().subscribe(
            result => {
              this.allFeedbackCount = result;
            }
          );
        } else {
          // this.allFeedbackCount = data;
        }
      }
    });

    // this.menuService.onItemClick()
    //   .pipe(
    //     filter(({ tag }) => tag === 'my-context-menu'),
    //     map(({ item: { title } }) => title),)
    //   .subscribe(title => {
    //     if(title == 'Log Out' || title == 'Log out'){
    //       this.logout();
    //     }
    //   });
    
    this.loginservice.userloginlast({username: userDetails.username}).subscribe((data:any)=>{
      if(data.logintime){
        this.info = 'You are last login ' + new DatePipe("en-US").transform(new Date(data.logintime), ' MMMM d, y, hh:mm a') + ' in '+ data.team + ' team';
      }
    }, err=>{
      //console.log(err);
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // changeTheme(themeName: string) {
  //   this.themeService.changeTheme(themeName);
  // }

  changeTeam() {
    let userData = this.dataService.getCurrentUser();
    // let decryptPassword = this.decryptPassword.transform(userData.password);
    let data = {
      username: userData.username,
      // password: decryptPassword,
      role: userData.role,
      domain: this.selectedTeam,
    };
    this.loginservice.getAuthToken(data).subscribe((res: any) => {
      sessionStorage.setItem('token', res.token);
      
      var temp:any = JSON.parse(sessionStorage.loginlogout);
      if(temp.team) {
        if(temp.team != this.selectedTeam) {
          this.loginservice.addlogouttime().subscribe((data:any)=>{
            let current = new Date();
            this.loginservice.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString(), team: this.selectedTeam}).subscribe((data:any)=>{
              var temp = data[0];
              sessionStorage.setItem('loginlogout', JSON.stringify(temp));
            })
          });

          //fetch formatted data to display in Dashboard
          this.getAllRegressions(this.selectedTeam);
          this.dataService.getDeviceInventoryData().next(null);
          this.dataService.getTestBedData().next(null);
          this.dataService.getAPIData().next(null);
          this.dataService.getAllAPI().next(null);
          // To Update Testcase data
          this.sub2 = this.tcInventoryService.getAllData().subscribe(allData => {
            if (allData) {
              this.dataService.getTcInventoryData().next(allData);
            }
          });
        } else {
          //console.log('inside same team name')
        }
      } else {
        //console.log('inside else')
      }
      this.dataService.selectedTeam.next(this.selectedTeam);
      // Jira Config
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
      if (this.settingsData[0].jiraConfig && this.settingsData[0].jiraConfig[0]) {
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
           // const jiraWarningAfter = this.settingsData[0].jiraConfig[0].jiraWarningAfter ? this.settingsData[0].jiraConfig[0].jiraWarningAfter : 10;
           // const currentDate = new Date()
           // const temp = this.datepipe.transform(this.settingsData[0].jiraConfig[0].jiraTokenExpiry, 'yyyy-MM-dd');
           // const expiryDate =  new Date(temp);
            // this.diffInDays = Math.floor((Date.UTC(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()) - Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) ) /(1000 * 60 * 60 * 24));
           // console.log('currentDate, expiryDate, diff', currentDate, expiryDate, this.diffInDays);
           // this.showJiraTokenWarning = this.diffInDays < jiraWarningAfter ;
           // console.log('show jira token', this.showJiraTokenWarning);
        }
        });
      })
      this.router.navigateByUrl('/selectteam', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/pages']);
      });
    }, (err: any) => {
      this.snackBar.open('Authenication failed, Provide token', 'Ok', {
        duration: 5000
      });
    });
  }

  // toggleSidebar(): boolean {
  //   this.sidebarService.toggle(true, 'menu-sidebar');
  //   // this.layoutService.changeLayoutSize();

  //   return false;
  // }

  // navigateHome() {
  //   this.menuService.navigateHome();
  //   return false;
  // }

  addFeedback(): any {
    this.dialog.open(FeedbackComponent, {
      data: { team: 'NA' },
      width: '700px'
    });
  }


  translation() {
    const transObj = this.translate.instant('DASHBOARD');
    const menuDuplicate = [...this.userMenuOrg];
    for (let index = 0; index < menuDuplicate.length; index++) {
      const element = menuDuplicate[index]['title'];
      const transTitle = transObj[element.toUpperCase()];
      menuDuplicate[index]['title'] = transTitle ? transTitle : element;
    }
    this.userMenu = [...menuDuplicate];
    this.transSub = this.translate.onLangChange.subscribe(async (event: LangChangeEvent) => {
      const transObj1 = this.translate.instant('DASHBOARD');
      const menuDuplicate1 = [...this.userMenuOrg];
      for (let index = 0; index < menuDuplicate1.length; index++) {
        const element = menuDuplicate1[index]['title'];
        const transTitle = transObj1[element.toUpperCase()];
        menuDuplicate1[index]['title'] = transTitle ? transTitle : element;
      }
      this.userMenu = [...menuDuplicate1];
    });
  }

  logout(){
    this.loginservice.addlogouttime().subscribe((data:any) => {
      sessionStorage.removeItem('loginlogout');
      sessionStorage.removeItem('token');
      this.router.navigate(['/login'])
    }, (err) => {
      sessionStorage.removeItem('loginlogout');
      sessionStorage.removeItem('token');
      this.router.navigate(['/login'])
    });
  }
  
  getAllRegressions(team: any): void {
    if (team) {
        this.dashboardService.getFormattedData().subscribe(data => {
        if (data) {
         
            this.dataService.allRegressionDetails.next(data);
            this.dataService.noRegressionDetails.next(false);
        } else {
            this.dataService.noRegressionDetails.next(true);
          
        }
    });
}
}
}
