import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HygienePageComponent } from './hygiene-page.component';

describe('HygienePageComponent', () => {
  let component: HygienePageComponent;
  let fixture: ComponentFixture<HygienePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HygienePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HygienePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
