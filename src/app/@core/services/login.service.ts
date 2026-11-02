import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER } from './../../models/config';
import { ENABLE_SSO } from './../../models/config';
import { DecryptPassword } from '../../@shared/pipes/decrypt-password.pipe';
import { DashboardService } from './dashboard.service';

@Injectable()
export class LoginService {
    userLogged = false;
    users: any;
    userDetails: any;
    constructor(
        private dataService: DataService,
        private httpService: HttpClient,
        private decryptPassword: DecryptPassword,
        private dashboardService: DashboardService
    ) { }


    validateUserUsingUname(oUser) {
        this.userLogged = false;
        return this.httpService.post(SERVER + 'user/loginUser', oUser);

    }

    login() {
        this.userLogged = true;
        var tempSessionStorage = {_id:this.dataService.getCurrentUser()._id , name:this.dataService.getCurrentUser().name, username: this.dataService.getCurrentUser().username , teams:  this.dataService.getCurrentUser().teams }
        sessionStorage.setItem('xarc_user_logged', JSON.stringify(tempSessionStorage));
    }

    logLogin() {
        return this.httpService.post(SERVER + 'user/login', { username: this.dataService.getCurrentUser().username });
    }

    ssoLogin(postData) {
        return this.httpService.post(SERVER + 'user/ssoLogin', postData);
    }

    isLoggedIn() {
        if (
            sessionStorage.getItem('xarc_user_logged') !== undefined &&
            sessionStorage.getItem('xarc_user_logged') !== null
        ) {
            if (this.userLogged) {
                return true;
            } else {
                
                this.dashboardService.getUsers().subscribe(
                    (response: any) => {
                        this.users = response[0].users;
                        for (let index = 0; index < this.users.length; index++) {
                            var temp: any = sessionStorage.getItem('xarc_user_logged')
                            if (JSON.parse(temp)._id === this.users[index]._id) {
                                this.userDetails = this.users[index];
                            }
                        }
                    }
                );
                    //console.log(" this.userDetails>>>>>>", this.userDetails);
                this.dataService.setCurrentUser(this.userDetails);
                return true;
            }
        } else {
            return false;
        }
    }

    logout() {
        this.userLogged = false;
        sessionStorage.removeItem('xarc_user_logged');
        sessionStorage.removeItem('loginlogout');
        sessionStorage.removeItem('token');
        window.location.reload();
    }

    logoutOnLoad() {
        if(sessionStorage.loginlogout){
            this.addlogouttime();
            setTimeout(() => {
                this.userLogged = false;
                sessionStorage.removeItem('xarc_user_logged');
                sessionStorage.removeItem('loginlogout');
                sessionStorage.removeItem('token');
            }, 1);
        } else {
            this.userLogged = false;
            sessionStorage.removeItem('xarc_user_logged');
            sessionStorage.removeItem('loginlogout');
            sessionStorage.removeItem('token');
        }
        
    }

    addlogintime(postData){
        return this.httpService.post(SERVER + 'user/addlogintime', postData);
    }

    addlogouttime(){
        let current = new Date();
        return this.httpService.post(SERVER + 'user/logouttime', {logouttime:current.toISOString(), _id:JSON.parse(sessionStorage.loginlogout)._id, logintime:JSON.parse(sessionStorage.loginlogout).logintime});
    }

    getAuthToken(data: any) {
        return this.httpService.post(SERVER + 'INTA/auth/generateJwtToken', data)
    }
    
    updateteaminloginlogout(team){
        return this.httpService.post(SERVER + 'user/updateteaminloginlogout', team);
    }

    getloginloutdata(teamName){
        return this.httpService.post(SERVER + 'user/getloginloutdata', {'teamName':teamName})
    }

    getDataByDateRange(data){
        return this.httpService.post(SERVER + 'user/getDataByDateRange', data);
    }

    userloginlast(data){
        return this.httpService.post(SERVER + 'user/userloginlast', data);
    }

    getalluserslastlogin(){
        return this.httpService.post(SERVER+ 'user/alluserslastlogin', {})
    }
}
