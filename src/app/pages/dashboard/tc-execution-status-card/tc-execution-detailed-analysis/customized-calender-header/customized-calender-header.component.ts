import { Component, OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  OnDestroy
} from '@angular/core';
import {MatCalendar} from '@angular/material/datepicker';
import {DateAdapter, MAT_DATE_FORMATS, MatDateFormats} from '@angular/material/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-customized-calender-header',
  templateUrl: './customized-calender-header.component.html',
  styleUrls: ['./customized-calender-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomizedCalenderHeaderComponent<D> implements OnInit, OnDestroy {

  private destroyed = new Subject<void>();

  constructor(
      private calendar: MatCalendar<D>, private dateAdapter: DateAdapter<D>,
      @Inject(MAT_DATE_FORMATS) private dateFormats: MatDateFormats, cdr: ChangeDetectorRef) {
    calendar.stateChanges
        .pipe(takeUntil(this.destroyed))
        .subscribe(() => cdr.markForCheck());
  }

  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  get periodLabel(): any {
    const label = this.dateAdapter
        .format(this.calendar.activeDate, this.dateFormats.display.monthYearLabel);
    const displayLabel = label.slice(-4);
    return displayLabel;
  }

  previousClicked(): void {
    this.calendar.activeDate =
        this.dateAdapter.addCalendarYears(this.calendar.activeDate, -1);
  }

  nextClicked(): void {
    this.calendar.activeDate =
        this.dateAdapter.addCalendarYears(this.calendar.activeDate, 1);
  }

}
