import { MatSnackBar } from '@angular/material/snack-bar';
import { Router} from '@angular/router';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from '../services/login.service';

@Injectable()
export class AuthGuard  {
    constructor(private router: Router, private loginService: LoginService, private snackBar: MatSnackBar) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        if (this.loginService.isLoggedIn()) {
            return true;
        } else {
            this.router.navigateByUrl('/login');
            this.snackBar.open('Please Login to Continue', 'ok', {
                duration: 5000
            });
            return false;
        }
    }
}
