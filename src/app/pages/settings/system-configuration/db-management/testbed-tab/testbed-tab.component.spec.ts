import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestbedTabComponent } from './testbed-tab.component';

describe('TestbedTabComponent', () => {
  let component: TestbedTabComponent;
  let fixture: ComponentFixture<TestbedTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestbedTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestbedTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
