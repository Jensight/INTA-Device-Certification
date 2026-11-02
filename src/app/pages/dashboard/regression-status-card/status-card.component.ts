import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { DataService } from 'src/app/@core/services/data.service';
@Component({
    selector: 'app-regression-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class RegressionStatusCardComponent implements OnInit, OnChanges {
    @ViewChild('productCard', { static: true })
    card: ElementRef;
    @Input() data;
    isEnableLatestInfo: boolean;
    regressionCount = 0;
    lastRegression = null;
    lastRegressionId = null;
    startTime;
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

    ngOnChanges(data: SimpleChanges) {
        if (!_.isEmpty(data.data.currentValue)) {
            this.regressionCount = data.data.currentValue.totalregressions;
            this.lastRegression = data.data.currentValue.regressionName;
            this.lastRegressionId = data.data.currentValue._id;
            this.startTime = new Date(data.data.currentValue.startTime);
        }
    }

}
