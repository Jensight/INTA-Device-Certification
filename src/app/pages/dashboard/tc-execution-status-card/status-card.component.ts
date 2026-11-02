import { InformationDiaogComponent } from './../../../@shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { DataService } from 'src/app/@core/services/data.service';
@Component({
    selector: 'app-tc-execution-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class TcExecutionStatusCardComponent implements OnInit, OnDestroy, OnChanges {
    @ViewChild('productCard', { static: true })
    card: ElementRef;
    @ViewChild('carousel', { static: true })
    carousel: ElementRef;
    number = 0;
    failNumber = 0;
    noRunNumber = 0;
    reversal = false;
    timeDifference;
    timeout;
    lastYear;
    @Input() data;
    isEnableLatestInfo: boolean;
    constructor(private router: Router, private dialog: MatDialog, private dataService: DataService) { }

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
            this.failNumber = data.data.currentValue.failTC;
            this.noRunNumber = data.data.currentValue.norunTC;
            this.number = data.data.currentValue.passTC;
            this.lastYear = new Date(data.data.currentValue.startTime).getFullYear();
            const timeDiff = (new Date().valueOf() - new Date(data.data.currentValue.startTime).valueOf()) / 36e5;
            if (timeDiff <= 1 && timeDiff > 0) {
                this.timeDifference = `${Math.round(timeDiff * 60)} ${Math.round(timeDiff * 60) === 1 ? 'Minute' : 'Minutes'
                    } ago.`;
            } else if (timeDiff <= 24) {
                this.timeDifference = `${Math.round(timeDiff)} ${Math.round(timeDiff) === 1 ? 'Hour' : 'Hours'} ago.`;
            } else if (timeDiff <= 24 * 7) {
                this.timeDifference = `${Math.round(timeDiff / 24)} ${Math.round(timeDiff / 24) === 1 ? 'Day' : 'Days'
                    } ago.`;
            } else {
                this.timeDifference = `${Math.round(timeDiff / (24 * 7))} ${Math.round(timeDiff / (24 * 7)) === 1 ? 'Week' : 'Weeks'
                    } ago.`;
            }

        }
    }
    ngOnDestroy() {
    }

    redirect() {
        if (!this.lastYear) {
            this.dialog.open(InformationDiaogComponent, {
                data: {
                    title: 'No Regressions !',
                    body:
                        'No data available to generate reports. ' +
                        'Please run regressions and try generating reports.'
                },
                panelClass: 'app-full-bleed-dialog',
                width: '600px'
            });
        } else {
            // this.router.navigate(['/pages/dashboard/tc-execution-analysis/monthly', this.lastYear])
            this.router.navigate(['/pages/dashboard/tc-execution-analysis']);
        }

    }
}
