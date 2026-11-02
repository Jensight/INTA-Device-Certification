import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestSuiteSelectionComponent } from './test-suite-selection.component';

describe('TestSuiteSelectionComponent', () => {
  let component: TestSuiteSelectionComponent;
  let fixture: ComponentFixture<TestSuiteSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestSuiteSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestSuiteSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
