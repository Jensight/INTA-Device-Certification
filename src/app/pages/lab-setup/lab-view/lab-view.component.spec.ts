import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabViewComponent } from './lab-view.component';

describe('LabViewComponent', () => {
  let component: LabViewComponent;
  let fixture: ComponentFixture<LabViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LabViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
