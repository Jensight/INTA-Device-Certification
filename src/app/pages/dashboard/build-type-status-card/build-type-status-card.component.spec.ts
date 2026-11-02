import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildTypeStatusCardComponent } from './build-type-status-card.component';

describe('BuildTypeStatusCardComponent', () => {
  let component: BuildTypeStatusCardComponent;
  let fixture: ComponentFixture<BuildTypeStatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildTypeStatusCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildTypeStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
