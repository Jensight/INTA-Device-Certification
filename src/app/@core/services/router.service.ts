import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {  filter } from 'rxjs/operators';

@Injectable()
export class RouterService {
    private lastRoutes = [];
    constructor(private router: Router) {
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((d: any) => {
            this.lastRoutes.unshift(d.url);
            this.lastRoutes.splice(5, 1);
        });
    }

    getRoute(historyNumber) {
        return this.lastRoutes[historyNumber];
    }
}
