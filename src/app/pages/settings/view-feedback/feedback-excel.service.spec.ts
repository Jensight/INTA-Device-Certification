import { TestBed } from '@angular/core/testing';

import { FeedbackExcelService } from './feedback-excel.service';

describe('FeedbackExcelService', () => {
  let service: FeedbackExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeedbackExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
