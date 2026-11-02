import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyDetailedAnalysisComponent } from './monthly-detailed-analysis.component';

describe('MonthlyDetailedAnalysisComponent', () => {
  let component: MonthlyDetailedAnalysisComponent;
  let fixture: ComponentFixture<MonthlyDetailedAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyDetailedAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyDetailedAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
