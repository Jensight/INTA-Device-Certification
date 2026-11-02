import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailSummaryComponent } from './detail-summary.component';

describe('DetailSummaryComponent', () => {
  let component: DetailSummaryComponent;
  let fixture: ComponentFixture<DetailSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
