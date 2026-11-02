import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegressionResultAnalysisComponent } from './regression-result-analysis.component';

describe('RegressionResultAnalysisComponent', () => {
  let component: RegressionResultAnalysisComponent;
  let fixture: ComponentFixture<RegressionResultAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegressionResultAnalysisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegressionResultAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
