import { Component, OnInit, ViewChild, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
@Component({
    selector: 'app-roi-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class ROIStatusCardComponent implements OnInit, OnChanges {
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
    lowImpact = 0;
    moderateImpact = 0;
    highImpact = 0;

    constructor() {}

    ngOnInit(): void {
        this.carousel.nativeElement.style.width = this.carouselWidth + 'px';
        this.timeout = setInterval(() => {
            this.animate();
        }, 3500);
    }

    addClass() {
        this.card.nativeElement.classList.add('animate');
    }

    removeClass() {
        this.card.nativeElement.classList.remove('animate');
    }
/* based on selected value performs animation */
    animate() {
        const currentLeft = Math.abs(parseInt(this.carousel.nativeElement.style.left) || 0);
        let newLeft = currentLeft;
        if (this.isAnimating === true) {
            return;
        } else if (newLeft === 0) {
            newLeft = newLeft + this.carouselSlideWidth;
            this.reversal = false;
        } else if (this.carouselWidth - this.carouselSlideWidth === newLeft || this.reversal) {
            newLeft = newLeft - this.carouselSlideWidth;
            this.reversal = true;
        } else {
            newLeft = currentLeft + this.carouselSlideWidth;
        }
        this.recursiveAnimation(newLeft);
    }

    recursiveAnimation(leftSize) {
        this.carousel.nativeElement.style.left = '-' + leftSize + 'px';
        this.carousel.nativeElement.style.transition = '300ms ease-out';
        this.isAnimating = true;
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);
    }
    ngOnDestroy() {
        clearInterval(this.timeout);
    }

    ngOnChanges(data: SimpleChanges) {
        if (!_.isEmpty(data.data.currentValue)) {
            this.lowImpact = data.data.currentValue.lowImpact;
            this.highImpact = data.data.currentValue.highImpact;
            this.moderateImpact = data.data.currentValue.moderateImpact;
        }
    }
}
