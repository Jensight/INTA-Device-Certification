import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildTypeAnalysisComponent } from './build-type-analysis.component';

describe('BuildTypeAnalysisComponent', () => {
  let component: BuildTypeAnalysisComponent;
  let fixture: ComponentFixture<BuildTypeAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildTypeAnalysisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildTypeAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
