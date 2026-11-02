import { Component, OnInit, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import * as _ from 'lodash';
import * as $ from 'jquery';
@Component({
    selector: 'app-tc-analysis-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class TcAnalysisStatusCardComponent implements OnInit, OnDestroy, OnChanges {
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
    constructor() { }

    ngOnInit(): void {
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
