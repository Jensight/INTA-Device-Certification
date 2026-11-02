import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTestbedDetailsComponent } from './view-testbed-details.component';

describe('ViewTestbedDetailsComponent', () => {
  let component: ViewTestbedDetailsComponent;
  let fixture: ComponentFixture<ViewTestbedDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTestbedDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTestbedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
