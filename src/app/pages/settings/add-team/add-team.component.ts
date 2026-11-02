import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, ValidatorFn, AbstractControl } from '@angular/forms';
import { TeamService } from '../../../@core/services/team.service';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
    selector: 'app-add-team',
    templateUrl: './add-team.component.html',
    styleUrls: ['./add-team.component.scss']
})
export class AddTeamComponent implements OnInit, OnDestroy {
    public settingsData;
    public allTeams = [];
    public allTeamNames = [];
    public addTeamForm: UntypedFormGroup;
    sub1;
    sub2;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/user/add',
            label: 'Add User'
        }
    ];
    constructor(
        private router: Router,
        private dataService: DataService,
        private teamService: TeamService,
        private snackBar: MatSnackBar
    ) {
        this.sub1 = this.dataService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getSettingsData().next(data[0]);
                this.settingsData = data[0];
                this.allTeams = data[0].teams;
                this.allTeams.forEach(team => {
                    this.allTeamNames.push(team.name);
                });
                // console.log(this.allTeamNames);
            }
        });
    }

    ngOnInit() {
        this.addTeamForm = new UntypedFormGroup({
            name: new UntypedFormControl(null, Validators.compose([Validators.required, this.NoWhitespaceValidator()])),
            //status: new FormControl(null, Validators.required),
            //leadMailIds: new FormArray([new FormControl(null, Validators.email)])
        });
    }

    /**
     * Add Team function to sends teams data to the backend
     */

    addTeam() {
        const team = this.addTeamForm.value;
        //team['leadMailIds'] = team['leadMailIds'].filter(a => a !== '' && a!==null);
        this.dataService.loading.next(true);
        // this.allTeams.push(this.addTeamForm.value);
        // const tempObject = _.cloneDeep(this.settingsData);
        // tempObject.teams = this.allTeams;
        // const allUsers = this.dataService.getUsers().slice();
        // tempObject.users = allUsers;
        this.sub2 = this.teamService.addTeam(this.addTeamForm.value).subscribe(
            settingsData => {
                if (settingsData) {
                    // this.dataService.getSettingsData().next(settingsData);
                    // To Update settings data, which will also reflect to dashboard
                    this.dataService.saveSettingData(settingsData[0]);
                    this.dataService.setSettingsData(settingsData[0]);
                    this.snackBar.open('Team Added Successfully', 'OK', {
                        duration: 4000
                    });
                    this.router.navigateByUrl('/pages/settings/team/view');
                    this.addTeamForm.reset();
                    
                }
                this.dataService.loading.next(false);
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Some Error Occurred', 'Try Again', {
                    duration: 4000
                });
            }
        );
    }

    /**
     * Add New Lead Mail
     */

    addNewLeadMail() {
        const leads = this.addTeamForm.get('leadMailIds') as UntypedFormArray;
        leads.push(new UntypedFormControl(null, [Validators.email]));
    }

    /**
     * Remove lead mail from form
     * @param i .
     */

    removeLeadMail(i) {
        const leads = this.addTeamForm.get('leadMailIds') as UntypedFormArray;
        leads.removeAt(i);
    }

    /**
     * Validation For team name
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
        if (this.allTeamNames.indexOf(this.addTeamForm.get('name').value) !== -1) {
            this.addTeamForm.get('name').setErrors({ unique: true });
        } else {
            if (this.addTeamForm.get('name').hasError('required')) {
                this.addTeamForm.get('name').setErrors({ required: true });
            } else {
                this.addTeamForm.get('name').setErrors(null);
            }
        }
    }
    ngOnDestroy(): void {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }
}
