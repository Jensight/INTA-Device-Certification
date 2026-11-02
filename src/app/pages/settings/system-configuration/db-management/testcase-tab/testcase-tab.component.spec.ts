import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestcaseTabComponent } from './testcase-tab.component';

describe('TestcaseTabComponent', () => {
  let component: TestcaseTabComponent;
  let fixture: ComponentFixture<TestcaseTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestcaseTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestcaseTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
