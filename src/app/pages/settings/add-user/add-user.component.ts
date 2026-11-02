import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { TeamService } from '../../../@core/services/team.service';
import { UserService } from '../../../@core/services/user.service';
import { DataService } from '../../../@core/services/data.service';
import { Router } from '@angular/router';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
// import { Response } from '@angular/http';
import { OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { GeneratePassword } from '../../../@shared/pipes/generate-password.pipe';
import { EncryptPassword } from '../../../@shared/pipes/encrypt-password.pipe';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.scss'],
    providers: [
        GeneratePassword,
        EncryptPassword
    ]
})
export class AddUserComponent implements OnInit, OnDestroy {
    public addUserForm: UntypedFormGroup;
    public teamListNames;
    private teamList;
    public userStatus;
    private allUsers;
    public duplicateCheck;
    private allUserNames = [];
    public userServiceSubscription;
    public dataServiceSubscription;
    public teamSelectedStatus;
    sub1;
    sub2;
    sub3;
    sub4;
    password;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/user/add',
            label: 'Add User'
        }
    ]
    @ViewChild('userName', { static: true })
    userName: ElementRef;
    constructor(
        private teamService: TeamService,
        private userService: UserService,
        private dataService: DataService,
        private router: Router,
        private snackBar: MatSnackBar,
        private generatePassword: GeneratePassword,
        private encryptPassword: EncryptPassword
    ) { }

    ngOnInit() {
        this.password = this.generatePassword.transform();

        this.addUserForm = new UntypedFormGroup({
            name: new UntypedFormControl(null, Validators.required),
            username: new UntypedFormControl(null, Validators.required),
            email: new UntypedFormControl(null, [Validators.email, Validators.required]),
            role: new UntypedFormControl(null, Validators.required),
            teams: new UntypedFormControl([]),
            password: new UntypedFormControl({ value: this.password, disabled: true }),
            status:new UntypedFormControl("active",Validators.required)
        });

        this.userServiceSubscription = this.userService.getAllusers().subscribe(response => {
            if (response) {
                this.dataService.getSettingsData().next(response[0]);
            }
        });

        this.dataServiceSubscription = this.dataService.getSettingsData().subscribe(data => {
            if (data) {
                this.allUsers = data.users;
                this.teamList = data.teams;
                this.getAllUsersNames();
                const temp = [];
                for (let i = 0; i < this.teamList.length; i++) {
                    temp.push({
                        name: this.teamList[i].name,
                        status: false
                    });
                }
                this.teamListNames = temp;
            }
        });
    }

    /**
     * Get All Available User Names
     */

    getAllUsersNames() {
        this.allUserNames = [];
        this.allUsers.forEach(element => {
            this.allUserNames.push(element.username.toLowerCase());
        });
    }

    /**
     * Validation for user names
     */

    validateUsername() {
        if (this.allUserNames.indexOf(this.addUserForm.get('username').value.toLowerCase()) !== -1) {
            this.addUserForm.get('username').setErrors({ unique: true });
        } else {
            if (this.addUserForm.get('username').hasError('required')) {
                this.addUserForm.get('username').setErrors({ required: true });
            } else {
                this.addUserForm.get('username').setErrors(null);
            }
        }
    }

    /**
     * Team Select function
     * @param item .
     * @param checked .
     */

    teamSelect(item, checked) {
        if (checked) {
            this.addUserForm.get('teams').value.push(item);
        } else {
            const index = this.addUserForm.get('teams').value.indexOf(item);
            if (index > -1) {
                this.addUserForm.get('teams').value.splice(index, 1);
            }
        }
    }

    /**
     * Validation for team weather selected or not
     */

    validateTeam() {
        const selectedTeam = this.addUserForm.get('teams').value;
        if (selectedTeam.length > 0) {
            this.teamSelectedStatus = true;
            return true;
        } else {
            this.teamSelectedStatus = false;
            return false;
        }
    }

    /**
     * Add User function to store user details
     */

    addUser() {
        if (this.validateTeam()) {
            console.log("this.formt", this.addUserForm.value)
            this.dataService.loading.next(true);
            let snackRef: MatSnackBarRef<any>;
            const encryptPassword = this.encryptPassword.transform(this.password);
            this.addUserForm.value.password = encryptPassword;
            this.sub1 = this.userService.addUser(this.addUserForm.value).subscribe(
                response => {
                    if (response) {
                        this.dataService.getSettingsData().next(response[0]);
                        snackRef = this.snackBar.open('User Added Successfully', 'View Users', {
                            duration: 5000
                        });
                        this.router.navigateByUrl('/pages/settings/user/view');
                        this.addUserForm.reset();
                        this.sub2 = snackRef.onAction().subscribe(data => {
                            this.router.navigateByUrl('/pages/settings/user/view');
                        });
                        this.dataService.saveSettingData(response[0]);
                        this.dataService.setSettingsData(response[0]);
                    } else {
                        snackRef = this.snackBar.open('User Registration Failed', 'Try Again', {
                            duration: 5000
                        });
                        this.sub3 = snackRef.onAction().subscribe(data => {
                            this.userName.nativeElement.focus();
                        });
                    }
                    this.dataService.loading.next(false);
                },
                err => {
                    this.dataService.loading.next(false);
                    snackRef = this.snackBar.open('User Registration Failed', 'Try Again', {
                        duration: 5000
                    });
                    this.sub4 = snackRef.onAction().subscribe(data => {
                        this.userName.nativeElement.focus();
                    });
                }
            );
        } else {
            this.snackBar.open('Please Select Atleast One Team', 'OK', {
                duration: 5000
            });
        }
    }

    ngOnDestroy() {
        if (this.dataServiceSubscription) {
            this.dataServiceSubscription.unsubscribe();
        }
        if (this.userServiceSubscription) {
            this.userServiceSubscription.unsubscribe();
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
