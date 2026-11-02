import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizedCalenderHeaderComponent } from './customized-calender-header.component';

describe('CustomizedCalenderHeaderComponent', () => {
  let component: CustomizedCalenderHeaderComponent;
  let fixture: ComponentFixture<CustomizedCalenderHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomizedCalenderHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizedCalenderHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
