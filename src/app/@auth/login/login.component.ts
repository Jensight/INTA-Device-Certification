import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LoginService } from '../../@core/services/login.service';
import { DataService } from '../../@core/services/data.service';
import { ENABLE_SSO } from './../../models/config';
import { DashboardService } from '../../@core/services/dashboard.service';
import jwt_decode from 'jwt-decode';
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    public loginForm: UntypedFormGroup;
    show = false;
    ENABLE_SSO = ENABLE_SSO;
    switch_login_methode: boolean = false;
    ENABLE_SSO_log:boolean = false;
    @ViewChild('loginButton', { static: true }) loginButton: ElementRef;
    public loginButtonName = 'Login';
    constructor(
        public snackBar: MatSnackBar,
        private router: Router,
        private loginService: LoginService,
        private dataService: DataService,
        private dashboardService: DashboardService,
        
    ) { }

    ngOnInit() {
        if (ENABLE_SSO === true) {
            this.ENABLE_SSO_log = true;
            this.loginForm = new UntypedFormGroup({
                XRAY_USERNAME: new UntypedFormControl(null, [Validators.email, Validators.required]),
                XRAY_PASSWORD: new UntypedFormControl(null, Validators.required)
            });
        } else {
            this.loginForm = new UntypedFormGroup({
                XRAY_USERNAME: new UntypedFormControl(null, Validators.required),
                XRAY_PASSWORD: new UntypedFormControl(null, Validators.required)
            });
        }
        this.loginService.logoutOnLoad();
    }

    login() {
        this.loginButtonName = 'Authentication..';
        this.loginButton.nativeElement.className = 'btn-pulse';
        this.dataService.loading.next(true);
        if (this.ENABLE_SSO_log === false) {
            this.loginService.validateUserUsingUname(this.loginForm.value).subscribe(
                (response: any) => {
                    if (response.error === 0) {
                        // To store token in session storage
                        sessionStorage.setItem('token', response.token);
                        //Decode method to decode jwt token
                        const decodedToken = jwt_decode(response.token);
                        response.userDetails.role = decodedToken['role'] ;
                        this.dataService.loading.next(false);
                        this.dataService.setCurrentUser(response.userDetails);
                        this.loginService.login();
                        if (this.loginService.isLoggedIn()) {
                            this.loginService.logLogin().subscribe(d => {
                                this.snackBar.dismiss();
                                if (this.dataService.getCurrentUser().teams.length > 1) {
                                    this.router.navigate(['/selectteam']);
                                    let current = new Date();
                                    this.loginService.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString()}).subscribe((data:any)=>{
                                        var temp = data[0];
                                        sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                                    })
                                } else {
                                    this.dataService.selectedTeam.next(this.dataService.getCurrentUser().teams[0]);
                                    this.getRegressionDetails();
                                    this.router.navigate(['/pages']);
                                    let current = new Date();
                                    this.loginService.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString(), team:this.dataService.getCurrentUser().teams[0]})
                                    .subscribe((data:any)=>{
                                        var temp = data[0];
                                        sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                                    })
                                }
                                this.snackBar.open('User Logged in Successfully', 'Ok', {
                                    duration: 5000
                                });
                            });
                        } else {
                            this.showError();
                        }
                    } else {
                        this.showError();
                    }
                },
                (error: any) => {
                    console.log("response>>>>", error.error);
                    if(error && error.error && error.error.reason && error.error.reason.includes("Authentication Failed")){
                        this.loginButtonName = 'Login';
                        this.dataService.loading.next(false);
                        this.loginForm.setValue({ XRAY_USERNAME: this.loginForm.get('XRAY_USERNAME').value, XRAY_PASSWORD: '' });
                        this.snackBar.open(error.error.reason, 'Try Again', {
                            duration: 5000
                        });
                        this.loginButton.nativeElement.className = 'btn';
                    } 
                    if (!error.error.success){
                        console.log('error ', error.error);
                        this.loginButtonName = 'Login';
                        this.dataService.loading.next(false);
                        // this.loginForm.setValue({ XRAY_USERNAME: this.loginForm.get('XRAY_USERNAME').value, XRAY_PASSWORD: '' });
                       if (error.error.reason === 'User is not Registered') {
                            this.snackBar.open('User is not Available!!!', 'Try Again', {
                            duration: 5000
                        });
                       } else if (error.error.reason === 'User is not Active'){ 
                             this.snackBar.open('User is not Active!!!', 'Try Again', {
                            duration: 5000
                        });
                       }else {
                        this.snackBar.open('Server is not Available!!!', 'Try Again', {
                            duration: 5000
                            
                        });
                        this.dataService.loading.next(false);
                       }
                      
                        this.loginButton.nativeElement.className = 'btn';



                    }
                }
            );
        } else {
            this.loginService.ssoLogin(this.loginForm.value).subscribe(
                (response: any) => {
                    this.dataService.loading.next(false);
                    if (response.error === 0) {
                        this.dataService.setCurrentUser(response.userDetails);
                        sessionStorage.setItem('token', response.token);
                        this.loginService.login();
                        if (this.loginService.isLoggedIn()) {
                            this.loginService.logLogin().subscribe(d => {
                                this.snackBar.dismiss();
                                if (this.dataService.getCurrentUser().teams.length > 1) {
                                    this.router.navigate(['/selectteam']);
                                    let current = new Date();
                                    this.loginService.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString()}).subscribe((data:any)=>{
                                        var temp = data[0];
                                        sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                                    });
                                } else {
                                    this.dataService.selectedTeam.next(this.dataService.getCurrentUser().teams[0]);
                                    let current = new Date();
                                    this.getRegressionDetails();
                                    this.loginService.addlogintime({username:this.dataService.getCurrentUser().username, logintime: current.toISOString(), team:this.dataService.getCurrentUser().teams[0]})
                                    .subscribe((data:any)=>{
                                        var temp = data[0];
                                        sessionStorage.setItem('loginlogout', JSON.stringify(temp));
                                    });
                                    this.router.navigate(['/pages']);
                                }
                                this.snackBar.open('User Logged in Successfully', 'Ok', {
                                    duration: 5000
                                });
                            });
                        } else {
                            this.showError();
                        }
                    } else {
                        if (response.errorMessage) {
                            this.loginForm.setValue({ XRAY_USERNAME: this.loginForm.get('XRAY_USERNAME').value, XRAY_PASSWORD: '' });
                            this.snackBar.open(response.errorMessage, 'Try Again', {
                                duration: 5000
                            });
                            this.loginButton.nativeElement.className = 'btn';
                        } else {
                            this.showError();
                        }
                    }
                },
                (error: any) => {
                    this.showError();
                }
            );
        }
    }

    private getRegressionDetails(): void {
        const team = this.dataService.getCurrentUser().teams[0];
        if (team) {
            this.dashboardService.getFormattedData().subscribe(data => {
                if (data) {
                    console.log('data in dashboard comp :', data);
                    this.dataService.allRegressionDetails.next(data);
                    this.dataService.noRegressionDetails.next(false);
                } else {
                    this.dataService.noRegressionDetails.next(true);
                    this.dataService.loading.next(false);
                }
            });
        }
    }

    showError() {
        this.loginButtonName = 'Login';
        this.dataService.loading.next(false);
        this.loginForm.setValue({ XRAY_USERNAME: this.loginForm.get('XRAY_USERNAME').value, XRAY_PASSWORD: '' });
        var temp = '';
        if (this.ENABLE_SSO === false) {
            temp = 'Invalid Username/Password';
        } else  if (this.ENABLE_SSO === true) {
            temp = 'Invalid Username/API Token';
        }
        this.snackBar.open(temp, 'Try Again', {
            duration: 5000
        });
        this.loginButton.nativeElement.className = 'btn';
    }

    getDecodedAccessToken(token: string): any {
        try {
          return jwt_decode(token);
        } catch(err) {
          return err;
        }
      }

      switchToDbLogin(){
        this.ENABLE_SSO_log = false;
        this.loginForm = new UntypedFormGroup({
            XRAY_USERNAME: new UntypedFormControl(null, Validators.required),
            XRAY_PASSWORD: new UntypedFormControl(null, Validators.required)
        });
    }

    switchToSSOLogin(){
        this.ENABLE_SSO_log = true;
        this.loginForm = new UntypedFormGroup({
            XRAY_USERNAME: new UntypedFormControl(null, [Validators.email, Validators.required]),
            XRAY_PASSWORD: new UntypedFormControl(null, Validators.required)
        });
    }
}
