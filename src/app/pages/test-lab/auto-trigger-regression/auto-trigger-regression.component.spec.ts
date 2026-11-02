import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoTriggerRegressionComponent } from './auto-trigger-regression.component';

describe('AutoTriggerRegressionComponent', () => {
  let component: AutoTriggerRegressionComponent;
  let fixture: ComponentFixture<AutoTriggerRegressionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoTriggerRegressionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoTriggerRegressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
