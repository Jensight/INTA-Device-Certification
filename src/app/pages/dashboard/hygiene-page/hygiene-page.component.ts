import { Component, OnInit, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { OnDestroy } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-hygiene-page',
  templateUrl: './hygiene-page.component.html',
  styleUrls: ['./hygiene-page.component.scss']
})
export class HygienePageComponent implements OnInit {

  card: ElementRef;
  @ViewChild('carousel', { static: true })
  carousel: ElementRef;
  @Input() data = {};
  carouselSlideWidth = 305;
  carouselWidth = 305 * 3;
  isAnimating = false;
  reversal = false;
  timeout;
  lastDevice = null;

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
    
  }

}
