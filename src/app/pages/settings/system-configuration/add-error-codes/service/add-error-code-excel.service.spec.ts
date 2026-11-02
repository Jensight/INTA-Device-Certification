import { TestBed } from '@angular/core/testing';

import { AddErrorCodeExcelService } from './add-error-code-excel.service';

describe('AddErrorCodeExcelService', () => {
  let service: AddErrorCodeExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddErrorCodeExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
