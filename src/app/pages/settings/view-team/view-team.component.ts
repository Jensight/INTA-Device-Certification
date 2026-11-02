import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { TeamService } from '../../../@core/services/team.service';
import * as _ from 'lodash';
import { EditTeamComponent } from '../edit-team/edit-team.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';

@Component({
    selector: 'app-view-team',
    templateUrl: './view-team.component.html',
    styleUrls: ['./view-team.component.scss']
})
export class ViewTeamComponent implements OnInit, OnDestroy {
    public settingsData;
    private dataServiceSubscription;
    public allTeams = [];
    private data;
    deleteViewValue: boolean = false;
    isNotAdmin: boolean = false;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/team/view',
            label: 'View Team'
        }
    ]
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Teams Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete: this.deleteViewValue,
            position: 'right'
        },
        edit: {
            editButtonContent: '<i class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i class="fa fa-trash-o"></i>',
            confirmDelete: true
        },
        columns: {
            name: {
                title: 'Team Name',
                type: 'custom',
                width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 20);
                  }
            },
            // status: {
            //     title: 'Status',
            //     type: 'string',
            //     width: '250px',
            //     valuePrepareFunction: data => {
            //         if (data === 'A') {
            //             return 'Activated';
            //         } else {
            //             return 'Deactivated';
            //         }
            //     },
            //     filterFunction(cell?: any, search?: string): boolean {
            //         const value = cell === 'A' ? 'activated' : 'deactivated';
            //         if (value.toLowerCase().includes(search.toLowerCase())) {
            //             return true;
            //         } else {
            //             return false;
            //         }
            //     },
            //     class: 'text-center'
            // }
        }

    };

    source: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    sub3;
    sub4;
    constructor(
        private snackBar: MatSnackBar,
        private dataService: DataService,
        public dialog: MatDialog,
        private teamService: TeamService,
        private router: Router
    ) {
        if (this.dataService.getCurrentUser()['role'] !== 'admin') {
            this.isNotAdmin = true;
            this.deleteViewValue = false;
            this.settings.actions.delete = this.deleteViewValue;
        } else {
            this.deleteViewValue = this.dataService.deleteActions();
            this.settings.actions.delete = this.deleteViewValue;
        }
        this.settings = Object.assign({}, this.settings);
    }

    ngOnInit() {
        this.sub1 = this.dataService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getSettingsData().next(data[0]);
                this.allTeams = data[0].teams;
                this.source.load(this.allTeams);
            }
        });

        this.dataServiceSubscription = this.dataService.getSettingsData().subscribe(data => {
            if (data) {
                this.settingsData = data;
                this.allTeams = data.teams;
            }
        });

        //Sort Data
        const sortData = this.dataService.getTeamSort();
        if(sortData){
            this.source.setSort(sortData);
            }
            }

    /**
     * Set Sort Data
     */

    setSortData() {
        this.dataService.storeTeamSort(this.source.getSort());
    }

    /**
     * Delete Confirmation function
     * After confirmation deleteTeam function will be invoked
     * @param deleteEvent .
     */

    deleteTeamConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            data: {
                name: 'Team',
                text:
                    'Deleting will remove team and all team details including Test Cases, API etc.' +
                    "This action can't be reversed. Are you sure to continue?",
                action: 'Delete'
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub2 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteTeam(deleteEvent);
            }
        });
    }

    /**
     * Delete Team function to remove data from backend
     * @param event .
     */

    deleteTeam(event) {
        const temp = this.allTeams.slice();
        _.remove(temp, { _id: event.data._id });
        const tempObject = _.cloneDeep(this.settingsData);
        console.log("this.settingsData", this.settingsData);
        console.log("temp", temp);
        const users = tempObject.users;
        for (let i = users.length - 1; i >= 0; i--) {
            const userTeams: any[] = users[i].teams;
            const index = userTeams.indexOf(event.data.name);
            if (index !== -1) {
                userTeams.splice(index, 1);
            }
        }

        tempObject['teams'] = temp;
        tempObject['name'] = event.data.name;
        this.sub3 = this.teamService.deleteTeam(tempObject).subscribe(
            result => {
                if (result) {
                    this.dataService.getSettingsData().next(result[0]);
                    this.source.load(this.dataService.getTeams());
                    this.snackBar.open('Team Deleted Successfully', 'OK', {
                        duration: 4000
                    });
                }
                this.dataService.saveSettingData(result[0]);
                this.dataService.setSettingsData(result[0]);
            },
            error => {
                this.snackBar.open('Some Error Occurred', 'Try Again', {
                    duration: 4000
                });
            }
        );
    }

    /**
     * Update Team function to open update form
     * @param updateEvent .
     */

    updateTeam(updateEvent) {
        this.teamService.selectedTeam = _.cloneDeep(updateEvent.data);
        this.router.navigateByUrl('/pages/settings/team/edit');
    }

    ngOnDestroy() {
        if (this.dataServiceSubscription) {
            this.dataServiceSubscription.unsubscribe();
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
}
