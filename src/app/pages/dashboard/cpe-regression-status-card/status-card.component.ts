import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { DataService } from 'src/app/@core/services/data.service';
@Component({
    selector: 'app-cpe-regression-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class CPERegressionStatusCardComponent implements OnInit, OnDestroy {
    @ViewChild('productCard', { static: true })
    card: ElementRef;
    @ViewChild('carousel', { static: true })
    carousel: ElementRef;
    @Input() data = {};
    carouselSlideWidth = 305;
    carouselWidth = 305 * 3;
    isAnimating = false;
    reversal = false;
    timeout;
    activeCount = 0;
    completedCount = 0;
    resDevicesCount = 0;
    vendorCount = 0;
    profileCount = 0;
    modelCount = 0;
    deviceCount = 0;
    lastDevice = null;
    isEnableLatestInfo: boolean;

    constructor(private dataService: DataService) { }

    ngOnInit(): void {
        this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                var config = this.dataService.getTeamDashBoardConfig(team);
                this.isEnableLatestInfo = (config && config.enable_latest_info) ? config.enable_latest_info : false;
            } else {
                this.isEnableLatestInfo = false;
            }
        });
    }

    ngOnDestroy() {
    }

    ngOnChanges(data: SimpleChanges) {
        if (!_.isEmpty(data.data.currentValue)) {
            this.activeCount = data.data.currentValue.activeCount;
            this.completedCount = data.data.currentValue.completedCount;
            this.resDevicesCount = data.data.currentValue.devicesCount;
            this.vendorCount = data.data.currentValue.vendorCount;
            this.profileCount = data.data.currentValue.profileCount;
            this.modelCount = data.data.currentValue.modelCount;
            this.deviceCount = data.data.currentValue.deviceCount;
            this.lastDevice = data.data.currentValue.lastDevice;
        }
    }
}
