import { SingleUnitTimePipe } from './../../../@shared/pipes/single-unit-time.pipe';
import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges, OnChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { DataService } from 'src/app/@core/services/data.service';
@Component({
    selector: 'app-compare-reg-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss'],
    providers: [SingleUnitTimePipe]
})
export class CompareRegStatusCardComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('productCard', { static: true })
    card: ElementRef;
    @ViewChild('carousel', { static: true })

    carousel: ElementRef;
    @Input() data;
    weeklyCount = 0;
    monthlyCount = 0;
    weeklyDuration = 0;
    monthlyDuration = 0;
    monthlyUnits = 'S';
    weeklyUnits = 'S';
    isEnableLatestInfo: boolean;

    constructor(private singleUnitTime: SingleUnitTimePipe, private dataService: DataService) { }

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
            this.monthlyCount = data.data.currentValue.monthCount;
            this.weeklyCount = data.data.currentValue.weekCount;
            const month = this.singleUnitTime.transform(data.data.currentValue.monthDuration);
            const week = this.singleUnitTime.transform(data.data.currentValue.weekDuration);
            this.monthlyDuration = month['value'];
            this.monthlyUnits = month['unit'];
            this.weeklyDuration = week['value'];
            this.weeklyUnits = week['unit'];
        }
    }
}
