import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../services/data.service';

@Injectable()
export class AdminGuard  {
    constructor(private router: Router, private dataService: DataService, private snackBar: MatSnackBar) {}
    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        if (this.dataService.getCurrentUser()['role'] === 'admin' || this.dataService.getCurrentUser()['role'] === 'lead') {
            return true;
        } else {
            this.router.navigateByUrl('/pages');
            // this.snackBar.open('Please Login to Continue', 'ok', {
            //     duration: 5000
            // });
            return false;
        }
    }
}