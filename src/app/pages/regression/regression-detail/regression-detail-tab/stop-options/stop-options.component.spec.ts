import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StopOptionsComponent } from './stop-options.component';

describe('StopOptionsComponent', () => {
  let component: StopOptionsComponent;
  let fixture: ComponentFixture<StopOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StopOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
