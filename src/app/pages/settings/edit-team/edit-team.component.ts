import { Router } from '@angular/router';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../@core/services/data.service';
import { TeamService } from '../../../@core/services/team.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, ValidatorFn, AbstractControl } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'app-edit-team',
    templateUrl: './edit-team.component.html',
    styleUrls: ['./edit-team.component.scss']
})
export class EditTeamComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public settingsData;
    public allTeams;
    public editTeamForm: UntypedFormGroup;
    public selectedTeamIndex;
    public oldName;
    public allTeamNames = [];
    sub1;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/user/edit',
            label: 'Edit User'
        }
    ];
    constructor(
        private dataService: DataService,
        private teamService: TeamService,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        this.dataService.getSettingsData().subscribe(data => {
            if (data) {
                this.settingsData = _.cloneDeep(data);
            }
        });
        if (this.teamService.selectedTeam) {
            this.selectedTeam = this.teamService.selectedTeam;
            this.oldName = this.selectedTeam.name;
            this.allTeams = this.dataService.getTeams().slice();
            this.allTeams.forEach(team => {
                this.allTeamNames.push(team.name);
            });
        } else {
            this.router.navigateByUrl('/pages/settings/team/view');
        }
    }

    ngOnInit() {
        this.selectedTeamIndex = _.findIndex(this.allTeams, { _id: this.selectedTeam['_id'] });
        this.editTeamForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedTeam._id),
            name: new UntypedFormControl(this.selectedTeam.name, Validators.compose([Validators.required, this.NoWhitespaceValidator()])),
            //status: new FormControl(this.selectedTeam.status, Validators.required),
            //leadMailIds: new FormArray([]),
        });
        // if (this.selectedTeam.leadMailIds.length === 0) {
        //     const ary = this.editTeamForm.get('leadMailIds') as FormArray;
        //     ary.push(new FormControl(null, Validators.email));
        // }
        // for (let index = 0; index < this.selectedTeam.leadMailIds.length; index++) {
        //     const element = this.selectedTeam.leadMailIds[index];
        //     const ary = this.editTeamForm.get('leadMailIds') as FormArray;
        //     ary.push(new FormControl(element, Validators.email));
        // }
    }

    /**
     * Validation function for team name
     */
     NoWhitespaceValidator(): ValidatorFn {
        return (control: AbstractControl): any => {
            window.setTimeout(() => {
                if (control.value && control.value !== '') {
                    const trimedvalue = control.value.replace(/\s/g, '');
                    control.setValue(trimedvalue);
                }
            }, 10);
        };
    }
    validateTeamName() {
        if (
            this.allTeamNames.indexOf(this.editTeamForm.get('name').value) !== -1 &&
            this.selectedTeam.name !== this.editTeamForm.get('name').value
        ) {
            this.editTeamForm.get('name').setErrors({ unique: true });
        } else {
            if (this.editTeamForm.get('name').hasError('required')) {
                this.editTeamForm.get('name').setErrors({ required: true });
            } else {
                this.editTeamForm.get('name').setErrors(null);
            }
        }
    }

    /**
     * Add a new lead email
     */

    addNewLeadMail() {
        const leads = this.editTeamForm.get('leadMailIds') as UntypedFormArray;
        leads.push(new UntypedFormControl(null, [Validators.email]));
    }

    /**
     * remove lead mail from form
     * @param i .
     */

    removeLeadMail(i) {
        const leads = this.editTeamForm.get('leadMailIds') as UntypedFormArray;
        leads.removeAt(i);
    }

    /**
     * Update function to modify team data to the backend.
     */
     
    updateTeam() {
        if (!_.isEqual(this.selectedTeam, this.editTeamForm.value)) {
            this.dataService.loading.next(true);
            const tempObject = _.cloneDeep(this.settingsData);
            console.log('this.settingsDataupdate', this.settingsData);
            console.log('tempObjectupdate', tempObject);
            const allUsers = this.dataService.getUsers().slice();
            allUsers.forEach(user => {
                user.teams.forEach(element => {
                    if (element === this.oldName) {
                        user.teams[user.teams.indexOf(element)] = this.editTeamForm.get('name').value;
                    }
                });
            });
            this.allTeams[this.selectedTeamIndex] = this.editTeamForm.value;
            tempObject.teams = this.allTeams;
            tempObject.users = allUsers;
            tempObject['oldName'] = this.oldName;
            tempObject['newName'] = this.editTeamForm.get('name').value;
            this.sub1 = this.teamService
                .updateTeam(tempObject)
                .subscribe(
                    settingsData => {
                        if (settingsData) {
                            this.dataService.getSettingsData().next(settingsData[0]);
                            this.snackBar.open('Team Edited Successfully', 'OK', {
                                duration: 4000
                            });
                            this.router.navigateByUrl('/pages/settings/team/view');
                        }
                        this.dataService.loading.next(false);
                    },
                    error => {
                        this.dataService.loading.next(false);
                        this.snackBar.open('Some Error Occurred', 'Try Again', {
                            duration: 4000
                        });
                        this.router.navigateByUrl('/pages/settings/team/view');
                    }
                );
        } else {
            this.snackBar.open('No Changes Found', 'OK', {
                duration: 4000
            });
        }
    }

    /**
     * Cancel the edit function
     */

    cancelEdit() {
        this.router.navigateByUrl('/pages/settings/team/view');
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
