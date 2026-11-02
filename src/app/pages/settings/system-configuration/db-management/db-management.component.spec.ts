import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbManagementComponent } from './db-management.component';

describe('DbManagementComponent', () => {
  let component: DbManagementComponent;
  let fixture: ComponentFixture<DbManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DbManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DbManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
