import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HygieneChartComponent } from './hygiene-chart.component';

describe('HygieneChartComponent', () => {
  let component: HygieneChartComponent;
  let fixture: ComponentFixture<HygieneChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HygieneChartComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HygieneChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
