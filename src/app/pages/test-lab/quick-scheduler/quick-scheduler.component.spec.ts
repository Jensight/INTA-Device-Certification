import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickSchedulerComponent } from './quick-scheduler.component';

describe('QuickSchedulerComponent', () => {
  let component: QuickSchedulerComponent;
  let fixture: ComponentFixture<QuickSchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickSchedulerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
