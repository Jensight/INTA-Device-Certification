import { Component, OnInit } from '@angular/core';
import { UserService } from '../../@core/services/user.service';
import { LocalDataSource } from 'angular2-smart-table';

@Component({
    selector: 'app-stats',
    templateUrl: './app-stats.component.html',
    styleUrls: ['./app-stats.component.scss']
})
export class AppStatsComponent implements OnInit {
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Devices Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            edit: false,
            delete: false,
            position: 'right'
        },
        columns: {
            _id: {
                title: 'Username',
                type: 'text',
                width: '220px',
                class: 'text-center'
            },
            noOfLogin: {
                title: 'No. of Logins',
                type: 'number',
                // width: '250px',
                class: 'text-center'
            },
            totalRequest: {
                title: 'Total Requests',
                type: 'number',
                // width: '250px',
                class: 'text-center'
            },
            duration: {
                title: 'Usage(Mins)',
                type: 'number',
                // width: '250px',
                class: 'text-center',
                valuePrepareFunction : (value) => {
                    return Math.round(value)
                }
            }
        }
    };
    source = new LocalDataSource();
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '/pages/stats',
            label: 'Stats'
        }
    ]
    constructor(private userService: UserService) {
        this.userService.getStats().subscribe((data: any) => {
            if (data) {
                this.source.load(data);
            }
        });
    }

    ngOnInit(): void {}
}
