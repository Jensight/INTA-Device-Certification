import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
@Component({
    selector: 'app-cpe-status-card',
    templateUrl: './status-card.component.html',
    styleUrls: ['./status-card.component.scss']
})
export class CPEStatusCardComponent implements OnInit, OnDestroy {
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

    constructor() {}

    ngOnInit(): void {
       
    }

    addClass() {
        this.card.nativeElement.classList.add('animate');
    }

    removeClass() {
        this.card.nativeElement.classList.remove('animate');
    }

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
            this.activeCount = data.data.currentValue.activeCount || 0;
            this.completedCount = data.data.currentValue.completedCount || 0;
            this.resDevicesCount = data.data.currentValue.devicesCount || 0;
            this.vendorCount = data.data.currentValue.vendorCount || 0;
            this.profileCount = data.data.currentValue.profileCount || 0;
            this.modelCount = data.data.currentValue.modelCount || 0;
            this.deviceCount = data.data.currentValue.deviceCount || 0;
            this.lastDevice = data.data.currentValue.lastDevice || 0;
        }
    }
}
