import { DataService } from './../../@core/services/data.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from 'src/app/@core/services/common.service';
import { DashboardService } from '../../@core/services/dashboard.service';
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { UserService } from './../../@core/services/user.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';

declare var $;
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
    selectedTeam;
    sub1;
    sub2;
    sub4;
    sub3;
    sub5;
    sub6;
    sub7;
    sub8;
    sub9;
    regData = {};
    cpeData = {};
    executionData = {};
    tcData = {};
    compareData = {}
    loading = false;
    roiData = {};
    sidebar = [];
    jobCount = [];
    modelFWCount = {};
    currentUser;
    users;
    userDetails;
    settingsData;
    public editUserForm: UntypedFormGroup;
    dashboard_extra_config: any;
    enable_environment_type_selection: boolean = false;
    yearWiseData;
    constructor(private dashboardService: DashboardService, private dataService: DataService,
        private userService: UserService, private commonService: CommonService) { }

        ngOnInit() {
            this.currentUser = this.dataService.getCurrentUser();
            this.sub1 = this.dataService.selectedTeam.subscribe(team => {
                if (team) {
                    this.selectedTeam = team;
                }
            });
            this.dashboardService.getFormattedData().subscribe(data => {
            if (data) {
                this.dataService.allRegressionDetails.next(data);
                this.dataService.noRegressionDetails.next(false);
            } else {
                this.dataService.noRegressionDetails.next(true);
               // this.dataService.loading.next(false);
            }
            });
            this.userService.getAllusers().subscribe((data: any) => {
                if (data && data[0]) {
                    this.dataService.getSettingsData().subscribe((settingsdata: any) => {
                        if (!settingsdata) {
                            this.dataService.saveSettingData(data[0]);
                        }
                    });
                    if (data[0].dashboardConfig) {
                        this.dashboard_extra_config = data[0].dashboardConfig;
                        this.loadRegressionDetails(this.selectedTeam);
                        if (data[0].dashboardConfig[0] && data[0].dashboardConfig[0].teams){
                            data[0].dashboardConfig[0].teams.forEach(el => {
                                if (el.name == this.selectedTeam){
                                    if (el.enable_environment_type_selection){
                                        if (el.enable_environment_type_selection == true){
                                            this.enable_environment_type_selection = true;
                                        }
                                    }
                                }
                            });
                        }
                    }
                    this.users = data[0].users;
                    const userdt = this.users.filter(element => {
                        return element._id === this.currentUser._id;
                    });
                    this.dataService.loading.next(false);
                }
             
            

                $('.carousel').carousel({
                    interval: false,
                });
                this.editUserForm = new UntypedFormGroup({
                    _id: new UntypedFormControl(this.currentUser._id),
                    username: new UntypedFormControl(this.currentUser.username, Validators.required),
                    email: new UntypedFormControl(this.currentUser.email, Validators.email),
                    role: new UntypedFormControl(this.currentUser.role),
                    teams: new UntypedFormControl(this.currentUser.teams.slice()),
                    password: new UntypedFormControl(this.currentUser.password),
                });
                if (this.userDetails && this.userDetails.preference && this.userDetails.preference.length > 0) {
                    this.sidebar = this.userDetails.preference;

                } else {
                    this.sidebar = [0, 1, 2, 3, 4, 5];
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
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
        if (this.sub9) {
            this.sub9.unsubscribe();
        }
    }
    /* loads all the regression details based on team selection */
    loadRegressionDetails(team) {
        let enableTeamCount = false;
        var config = this.dataService.getTeamDashBoardConfig(team);
        if (config && config.config && typeof config.config.enable_team_count !== 'undefined') {
            enableTeamCount = config.config.enable_team_count;
        } else {
            enableTeamCount = false;
        }
        // enableTeamCount = config?.config.enable_team_count ? config.enable_team_count : false;
        this.sub2 = this.dashboardService.getRegressionStatusCard(enableTeamCount)
        .subscribe((data: any) => {
            if (data && data.length > 0) {
                this.regData = data[0]['regData'][0];
                this.compareData = { ...data[0]['compareRegCount'][0], ...data[0]['duration'][0] }
            }
        });
        this.sub3 = this.dashboardService.getReservationStatusCard().subscribe(data => {
            if (data) {
                this.cpeData = data;
            }
        });

        this.sub4 = this.dashboardService.getTestcaseAnalysis().subscribe(data => {
            this.tcData = data;
        });

        this.sub5 = this.dashboardService.getROICardData().subscribe((data: any) => {
            if (data.success) {
                this.roiData = data.data || {};
            }
        })

        this.sub9 = this.dashboardService.getModelFWVersionCount().subscribe(data => {
            this.modelFWCount = data;
        });
    }


drop(event: CdkDragDrop<any>) {
        this.sidebar[event.previousContainer.data.index] = event.container.data.item
        this.sidebar[event.container.data.index] = event.previousContainer.data.item
        event.currentIndex = 0;
        const temp = this.editUserForm.value;
        temp.preference = this.sidebar;
        this.userService.updateUser(this.editUserForm.value).subscribe(
            result => {
                if (result) {
                    if (this.editUserForm.get('_id').value === this.dataService.getCurrentUser()._id) {
                        this.dataService.setUsers(result[0].users);
                    }
                }
            });
    }
}


