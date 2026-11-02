import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestbedlistPopupComponent } from './testbedlist-popup.component';

describe('TestbedlistPopupComponent', () => {
  let component: TestbedlistPopupComponent;
  let fixture: ComponentFixture<TestbedlistPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestbedlistPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestbedlistPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
