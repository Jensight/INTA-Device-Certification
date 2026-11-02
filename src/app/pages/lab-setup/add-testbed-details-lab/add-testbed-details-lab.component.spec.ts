import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTestbedDetailsLabComponent } from './add-testbed-details-lab.component';

describe('AddTestbedDetailsLabComponent', () => {
  let component: AddTestbedDetailsLabComponent;
  let fixture: ComponentFixture<AddTestbedDetailsLabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTestbedDetailsLabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTestbedDetailsLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
