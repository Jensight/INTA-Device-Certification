import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabRowViewComponent } from './lab-row-view.component';

describe('LabRowViewComponent', () => {
  let component: LabRowViewComponent;
  let fixture: ComponentFixture<LabRowViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LabRowViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabRowViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
