import { Component, ElementRef, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import * as _ from 'lodash';
@Component({
  selector: 'app-build-type-status-card',
  templateUrl: './build-type-status-card.component.html',
  styleUrls: ['./build-type-status-card.component.scss']
})
export class BuildTypeStatusCardComponent implements OnInit {

    @ViewChild('productCard', { static: true })
    card: ElementRef;
    @ViewChild('carousel', { static: true }) carousel: ElementRef;
    @Input() data;

    totalTestcases = 0;
    testGroup = 0;
    testSuite = 0;
    module = 0;
    tcName = null
    carouselSlideWidth = 305;
    carouselWidth = 305 * 4;
    isAnimating = false;
    reversal = false;
    timeout;
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
            this.totalTestcases = data.data.currentValue.testcase;
            this.testGroup = data.data.currentValue.testGroup;
            this.testSuite = data.data.currentValue.testSuite;
            this.module = data.data.currentValue.module;
            this.tcName = data.data.currentValue.tcName;

        }
    }

}
