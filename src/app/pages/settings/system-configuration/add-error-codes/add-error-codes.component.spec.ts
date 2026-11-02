import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddErrorCodesComponent } from './add-error-codes.component';

describe('AddErrorCodesComponent', () => {
  let component: AddErrorCodesComponent;
  let fixture: ComponentFixture<AddErrorCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddErrorCodesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddErrorCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
