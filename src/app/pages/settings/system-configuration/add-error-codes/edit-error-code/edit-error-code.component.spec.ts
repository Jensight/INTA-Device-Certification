import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditErrorCodeComponent } from './edit-error-code.component';

describe('EditErrorCodeComponent', () => {
  let component: EditErrorCodeComponent;
  let fixture: ComponentFixture<EditErrorCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditErrorCodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditErrorCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
