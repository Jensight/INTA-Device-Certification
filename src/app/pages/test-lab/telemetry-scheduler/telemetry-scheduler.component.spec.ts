import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelemetrySchedulerComponent } from './telemetry-scheduler.component';

describe('TelemetrySchedulerComponent', () => {
  let component: TelemetrySchedulerComponent;
  let fixture: ComponentFixture<TelemetrySchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TelemetrySchedulerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TelemetrySchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
