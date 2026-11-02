import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { catchError, tap, timeout, map } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { DataService } from './data.service';
import { ServerStatusService } from './serverStatus.service';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
    isTokenExpired = false;
    isSessionExpired = false;
    serverDownAlertShown = false; 
        constructor(
        public snackBar: MatSnackBar,
        private router: Router,
        private loginService: LoginService,
        private dataService: DataService,
        private serverStatus: ServerStatusService 
    ) { }

    public intercept(req: HttpRequest<any>, next: HttpHandler) {
        let params = new HttpParams({});
        let headers = new HttpHeaders({});
        this.dataService.isSessionExpired.subscribe(sess => {
            this.isSessionExpired = sess;
        });
        if (sessionStorage.getItem('xarc_user_logged')) {
            const userData = JSON.parse(sessionStorage.getItem('xarc_user_logged'));
            const token = sessionStorage.getItem('token');
            // if (userData['username']) {
            //     params = new HttpParams({}).append('username', userData.username);
            // }
            if(userData['username'] && token) {
                headers = headers.set('token', token);
            }
        }
        return next.handle(req.clone({ headers: headers, params: params })).pipe(
            timeout(100000),
            map(res => {
                if (res instanceof HttpResponse) {
                    this.isTokenExpired = false;
                }
                return res;
             }),
            catchError(e => {
                if ((e.status === 0 || e.status === undefined) && e instanceof HttpErrorResponse) {
                    this.serverStatus.serverDown$.next(true); 
                    return throwError(e);
                }
                if (e.status ==  '401' && !this.isTokenExpired && !this.isSessionExpired) {
                    this.isTokenExpired = true;
                     
                     this.loginService.addlogouttime().subscribe((data: any) => {
                        sessionStorage.removeItem('loginlogout');
                     sessionStorage.removeItem('token');
                     this.router.navigate(['/login']);
                     
                       
                    }, err => {
                        sessionStorage.removeItem('loginlogout');
                     sessionStorage.removeItem('token');
                     this.router.navigate(['/login']);
                     
                    });
                   
                    alert('Token has been expired, Please logout and login again.');

                }else {
                    return throwError(e);
                }
                
            })
        );
    }
}

export const TimeoutInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: TimeoutInterceptor,
    multi: true
};
