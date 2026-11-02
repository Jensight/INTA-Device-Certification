import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoRegressionResultComponent } from './auto-regression-result.component';

describe('AutoRegressionResultComponent', () => {
  let component: AutoRegressionResultComponent;
  let fixture: ComponentFixture<AutoRegressionResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoRegressionResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoRegressionResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
