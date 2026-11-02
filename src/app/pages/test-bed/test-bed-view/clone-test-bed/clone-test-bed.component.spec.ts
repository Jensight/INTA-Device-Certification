import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloneTestBedComponent } from './clone-test-bed.component';

describe('CloneTestBedComponent', () => {
  let component: CloneTestBedComponent;
  let fixture: ComponentFixture<CloneTestBedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloneTestBedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloneTestBedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
