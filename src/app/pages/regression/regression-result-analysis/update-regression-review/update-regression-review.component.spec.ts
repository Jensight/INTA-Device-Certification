import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRegressionReviewComponent } from './update-regression-review.component';

describe('UpdateRegressionReviewComponent', () => {
  let component: UpdateRegressionReviewComponent;
  let fixture: ComponentFixture<UpdateRegressionReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateRegressionReviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRegressionReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
