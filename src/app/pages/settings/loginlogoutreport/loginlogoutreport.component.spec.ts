import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginlogoutreportComponent } from './loginlogoutreport.component';

describe('LoginlogoutreportComponent', () => {
  let component: LoginlogoutreportComponent;
  let fixture: ComponentFixture<LoginlogoutreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginlogoutreportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginlogoutreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
