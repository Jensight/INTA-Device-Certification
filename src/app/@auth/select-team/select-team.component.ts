import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataService } from '../../@core/services/data.service';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/@core/services/login.service';
import { DashboardService } from 'src/app/@core/services/dashboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';


@Component({
    selector: 'app-select-team',
    templateUrl: './select-team.component.html',
    styleUrls: ['./select-team.component.scss']
})
export class SelectTeamComponent implements OnInit {
    public username;
    public teamCount;
    public userTeams;
    public className = 'col-md-';
    users;
    yearWiseData;
    allTestGroups = new Map();
    allJobs = [];
    allTestCases: any;
    constructor(private dataService: DataService, private router: Router,
                private loginService: LoginService, private dashboardService: DashboardService, public tcService: TestCaseInventoryService,
                public snackBar: MatSnackBar) { }

    ngOnInit(): void {
        this.username = this.dataService.getCurrentUser()?.username;
        if (this.username === undefined){
             this.dashboardService.getUsers().subscribe(

            (response: any) => {

                this.users = response[0].users;
                this.users.forEach(user => {
                    if (JSON.parse(sessionStorage.getItem('xarc_user_logged'))._id === user._id) {
                        this.dataService.setCurrentUser(user);
                        this.username = user.username;
                        this.teamCount = user.teams.length;
                        this.userTeams = user.teams;
                    }
                });

            }

        );
        }else{
            const data = this.dataService.getCurrentUser();
            if (data.name){
            this.username = data.name;
            }
            this.teamCount = this.dataService.getCurrentUser().teams.length;
            this.userTeams = this.dataService.getCurrentUser().teams;
        }
    }

    selectingTeam(teamName) {
        let userData = this.dataService.getCurrentUser();
        let data = {
            username: userData.username,
            role: userData.role,
            domain: teamName,
        };
        this.loginService.getAuthToken(data).subscribe((res: any) => {
            sessionStorage.setItem('token', res.token);
            
            if(sessionStorage.loginlogout){
                var temp:any = JSON.parse(sessionStorage.loginlogout);
                if(temp.team){
                    if(temp.team != teamName){
                        this.loginService.addlogouttime().subscribe((data:any)=>{
                            let current = new Date();
                            this.loginService.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString(), team: teamName})
                              .subscribe((data:any)=>{
                                var temp = data[0];
                                sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                            })
                          })
                    } else {
                        //console.log('inside same team name')
                    }
                } else {
                    this.loginService.updateteaminloginlogout({ team:teamName, _id:temp._id}).subscribe((data:any)=>{
                        temp.team = teamName;
                        sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                    }, err=>{
                        //console.log(err);
                    })
                }
            } else {
                //console.log('inside ELSE session not pressiont');
            }
            this.getAllRegressions(teamName);
            this.getTestCaseDetails(teamName);
             this.getRegressionYears(teamName);
            // this.getCPERegressionAnalysisData();
            this.dataService.selectedTeam.next(teamName);
            this.router.navigate(['/pages']);

        }, (err: any) => {
            this.snackBar.open('Authenication failed, Provide token', 'Ok', {
                duration: 5000
            });
        });
        
    }

    getAllRegressions(team: any): void {
        if (team) {
            this.dashboardService.getFormattedData().subscribe(data => {
            if (data) {
                console.log('data in dashboard comp :', data);
                this.dataService.allRegressionDetails.next(data);
                this.dataService.noRegressionDetails.next(false);
            } else {
                this.dataService.noRegressionDetails.next(true);
               // this.dataService.loading.next(false);
            }
        });
    }
}

/* Fetching TC All data to set test groups for failure by category chart */
    getTestCaseDetails(team: any): void {
        this.tcService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getTcInventoryData().next(data);
                this.dataService.getTestGroup().subscribe(testGroups => {
                    if (testGroups) {
                        testGroups.forEach( tg => {
                            this.allTestGroups.set(tg._id, tg.testGroupName);
                        });
                    }
                });
                this.dataService.getTcInventoryData().subscribe (dt => {
                    if (dt){
                        this.allTestCases = dt;
                    }
                });
            }
        });
    }
      getRegressionYears(team: any): void {
        this.dashboardService.getAllRegressionYears().subscribe(data => {
            if (data) {
                let tempArr = [];
                data['years'].forEach(dt => {
                    tempArr.push(dt.toString());
                });
                tempArr = tempArr.reverse();
                this.dataService.getAllYears().next(tempArr);
                // tempArr.forEach(year => {
                //     this.getAllRegressionData(team, year);
                //     });
            }
        });
    }
   
    getCPERegressionAnalysisData(): void{
     this.dataService.selectedTeam.pipe(
        mergeMap(team => {
            if (team) {
                return this.dashboardService.getDetailedCPERegressionAnalysis();
            } else {
                return Observable.create(null);
            }
        })
    ).subscribe(data => {
        if (data['yearlyData'] && (data['monthlyData']['model'] || data['monthlyData']['vendor'] ) ) {
            this.dataService.CPERegressionAnalysisData.next(data);
            this.dataService.CPERegressionNoData.next(false);
        }else {
            this.dataService.CPERegressionNoData.next(true);
        }
    });
    }

}
