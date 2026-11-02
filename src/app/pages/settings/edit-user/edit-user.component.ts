import { LoginService } from './../../../@core/services/login.service';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../@core/services/data.service';
import { UserService } from '../../../@core/services/user.service';
import { DecryptPassword } from '../../../@shared/pipes/decrypt-password.pipe';
import { GeneratePassword } from '../../../@shared/pipes/generate-password.pipe';
import { EncryptPassword } from '../../../@shared/pipes/encrypt-password.pipe';

@Component({
    selector: 'app-edit-user',
    templateUrl: './edit-user.component.html',
    styleUrls: ['./edit-user.component.scss'],
    providers: [
        DecryptPassword,
        GeneratePassword,
        EncryptPassword
    ]
})
export class EditUserComponent implements OnInit, OnDestroy {
    public editUserForm: UntypedFormGroup;
    public selectedUser;
    public allTeams;
    decryptedPassword;
    public userTeams = [];
    public allUsers = this.dataService.getUsers();
    public allUserNames = [];
    public selectedUserName;
    public userStatus;
    sub1;
    constructor(
        public dialogRef: MatDialogRef<EditUserComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private userService: UserService,
        private snackBar: MatSnackBar,
        private loginService: LoginService,
        private decryptPassword: DecryptPassword,
        private encryptPassword: EncryptPassword,
        private generatePassword: GeneratePassword,
    ) {
        this.selectedUser = data;
        this.allTeams = this.dataService.getTeams();
        this.decryptedPassword = this.decryptPassword.transform(this.selectedUser.password);
    }

    ngOnInit() {
        this.editUserForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedUser._id),
            name: new UntypedFormControl(this.selectedUser.name, Validators.required),
            username: new UntypedFormControl(this.selectedUser.username, Validators.required),
            email: new UntypedFormControl(this.selectedUser.email, Validators.email),
            role: new UntypedFormControl(this.selectedUser.role),
            teams: new UntypedFormControl(this.selectedUser.teams.slice()),
            password: new UntypedFormControl({ value: this.decryptedPassword, disabled: true }),
            status:new UntypedFormControl(this.selectedUser.status, Validators.required)
        });
        this.selectedUserName = this.selectedUser.username;
        this.userTeams = this.editUserForm.get('teams').value;
        this.getAllUsersNames();
        this.userStatus = this.editUserForm.get('status').value;
    }

    /**
     * Edit User Team function
     * @param event .
     * @param teamName .
     */

    editUserTeam(event, teamName) {
        if (event.checked && teamName) {
            this.userTeams.push(teamName);
        } else {
            if (this.userTeams.indexOf(teamName) !== -1) {
                this.userTeams.splice(this.userTeams.indexOf(teamName), 1);
            }
        }
    }

    /**
     * Get All User Names
     */

    getAllUsersNames() {
        this.allUserNames = [];
        this.allUsers.forEach(element => {
            this.allUserNames.push(element.username.toLowerCase());
        });
    }

    /**
     * Validation for User name
     */

    validateUsername() {
        if (
            this.allUserNames.indexOf(this.editUserForm.get('username').value.toLowerCase()) !== -1 &&
            this.selectedUserName.toLowerCase() !== this.editUserForm.get('username').value.toLowerCase()
        ) {
            this.editUserForm.get('username').setErrors({ unique: true });
        } else {
            if (this.editUserForm.get('username').hasError('required')) {
                this.editUserForm.get('username').setErrors({ required: true });
            } else {
                this.editUserForm.get('username').setErrors(null);
            }
        }
    }

    // Change Password

    changePassword() {
        this.decryptedPassword = this.generatePassword.transform();
        this.editUserForm.get('password').setValue(this.decryptedPassword);
    }

    /**
     * Update User function to modify user data to the backend
     */

    updateUser() {
        const encryptPassword = this.encryptPassword.transform(this.decryptedPassword);
        this.editUserForm.value.password = encryptPassword;
        this.sub1 = this.userService.updateUser(this.editUserForm.value).subscribe(
            result => {
                if (result) {
                    if(this.editUserForm.get('_id').value === this.dataService.getCurrentUser()._id){
                        this.snackBar.open('User Edited Successfully,Login To Continue', 'OK', {
                            duration: 4000
                        });
                        setTimeout(()=> {
                            this.loginService.logout();
                        },2000)
                        this.dataService.saveSettingData(result[0]);
                        this.dataService.setSettingsData(result[0]);
                    } else {
                        this.dataService.getSettingsData().next(result[0]);
                        this.snackBar.open('User Edited Successfully', 'OK', {
                            duration: 4000
                        });
                        this.dialogRef.close();
                    }
                }
            },
            error => {
                this.snackBar.open('Some Error Occurred', 'Try Again', {
                    duration: 4000
                });
                this.dialogRef.close();
            }
        );
    }

    /**
     * Cancel Edit
     */

    cancelEdit() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
    }
}
