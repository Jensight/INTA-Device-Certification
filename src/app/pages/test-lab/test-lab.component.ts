import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../@core/services/data.service';
import { TestCaseInventoryService } from '../../@core/services/testcase-inventory.service';
import { DeviceInventoryService } from '../../@core/services/device-inventory.service';
import { TestBedService } from '../../@core/services/test-bed.service';
import { ApiService } from '../../@core/services/api.service';

@Component({
    selector: 'app-name',
    template: `
    <div class="row">
    <nav  class="col-sm-12" aria-label="breadcrumb">
      <ol class="breadcrumb" style="background-color:#fafafa; padding-left: 0px; padding-top:0px; margin-bottom: 0px;">
        <li class="breadcrumb-item"><a href="#/pages/dashboard" style="color:red;text-decoration: none;font-size: medium;">Dashboard</a></li>
        <li class="breadcrumb-item active" style="text-decoration: none;font-size: medium;color:rgba(0, 0, 0, 0.87)">Test Scheduler</li>
      </ol>
    </nav>

    </div>
    <router-outlet></router-outlet>`
})
export class TestLabComponent implements OnInit, OnDestroy {
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '/pages/test-scheduler/configure',
            label: 'Test Scheduler'
        },
        {
            link: '/pages/test-scheduler/quickScheduler',
            label: 'Quick Scheduler'
        },
        {
            link: '/pages/test-scheduler/telemetry',
            label: 'Telemetry Scheduler'
        },
        {
            link: '/pages/test-scheduler/autoRegression',
            label: 'Auto Regression'
        }
    ];
    selectedTeam;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    constructor(
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private deviceInventoryService: DeviceInventoryService,
        private testbedService: TestBedService,
        private apiService: ApiService
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.loadData();
            }
        });
    }

    ngOnInit() { }

    loadData() {
        this.sub2 = this.testbedService.getTestBed().subscribe(tbData => {
            if (tbData) {
                this.dataService.getTestBedData().next(tbData);
            }
        });

        this.sub3 = this.deviceInventoryService.getAllData().subscribe(deviceData => {
            if (deviceData) {
                this.dataService.getDeviceInventoryData().next(deviceData);
            }
        });

        this.sub4 = this.tcInventoryService.getAllData().subscribe(tcData => {
            if (tcData) {
                this.dataService.getTcInventoryData().next(tcData);
            }
        });

        this.sub5 = this.apiService.getAllData().subscribe(apiData => {
            if (apiData) {
                this.dataService.getAPIData().next(apiData);
            }
        });
    }

    ngOnDestroy() {
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
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
    }
}
