import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRulesComponent } from './dashboard-rules.component';

describe('DashboardRulesComponent', () => {
  let component: DashboardRulesComponent;
  let fixture: ComponentFixture<DashboardRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardRulesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
