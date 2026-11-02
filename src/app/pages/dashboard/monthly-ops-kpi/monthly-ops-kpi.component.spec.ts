import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyOpsKpiComponent } from './monthly-ops-kpi.component';

describe('MonthlyOpsKpiComponent', () => {
  let component: MonthlyOpsKpiComponent;
  let fixture: ComponentFixture<MonthlyOpsKpiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyOpsKpiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyOpsKpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
