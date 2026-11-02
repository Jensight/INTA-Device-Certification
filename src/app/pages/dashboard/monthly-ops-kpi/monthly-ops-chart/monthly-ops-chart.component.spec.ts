import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyOpsChartComponent } from './monthly-ops-chart.component';

describe('MonthlyOpsChartComponent', () => {
  let component: MonthlyOpsChartComponent;
  let fixture: ComponentFixture<MonthlyOpsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyOpsChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyOpsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
