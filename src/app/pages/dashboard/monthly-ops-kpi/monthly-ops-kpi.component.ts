
import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';
@Component({
  selector: 'app-monthly-ops-kpi',
  templateUrl: './monthly-ops-kpi.component.html',
  styleUrls: ['./monthly-ops-kpi.component.scss']
})
export class MonthlyOpsKpiComponent implements OnInit {
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
  fwTestedCount= 0;

  constructor() { }

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
    console.log("data>>>>",data )
      this.fwTestedCount = data.data.currentValue.fwTestedCount || 0;
      this.modelCount = data.data.currentValue.modelCount || 0;
      
  }
}
}
