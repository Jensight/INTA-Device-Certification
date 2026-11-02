import { Component, OnInit, Inject,  ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
@Component({
  selector: 'app-test-suite-selection',
  templateUrl: './test-suite-selection.component.html',
  styleUrls: ['./test-suite-selection.component.scss']
})
export class TestSuiteSelectionComponent implements OnInit {
  selectedTestBed;
  testBedName: any;
  testBedsDetails: any;
  mappedTestSuites: any;
  allTestsuites: any;
  testSuites = [];
  selectedTestSuites: any;
  allDevices: any;
  dutName: any;
  fwCommunity: any;
  public regDetailsForm: UntypedFormGroup;
  existingRecords: any;
  testbedListCopy = [];
  testSuiteListCopy: any[];
  testSetFilter = false;
  editRecordData: any;
  buttonTitle = 'Create';
  selectedTestBedId: any;
  selectedTestSuiteId: any;
  selectedDUTId: any;
  @ViewChild('search') searchTextBox: ElementRef;

  selectFormControl = new UntypedFormControl(null, Validators.required);
  searchTextboxControl = new UntypedFormControl();
  selectedValues = [];
  filteredOptions: Observable<any[]>;
  showOnlyPairedTestbeds: boolean = false;
  constructor(public dialogRef: MatDialogRef<TestSuiteSelectionComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
      console.log('data', data);
      if (data){
        let filteredTestbeds = data.testBedDetails && data.testBedDetails.length > 0 ? data.testBedDetails.filter((testbed) => testbed.status !== 'inactive') : [];
        // Exclude dynamic-enabled testbeds (used only in Dynamic Scheduler)
        filteredTestbeds = filteredTestbeds.filter((testbed) => !testbed.dynamic);
        
        // Apply showOnlyPairedTestbeds filter if passed from parent
        this.showOnlyPairedTestbeds = data.showOnlyPairedTestbeds || false;
        if (this.showOnlyPairedTestbeds) {
          filteredTestbeds = filteredTestbeds.filter((testbed) => testbed.labIndex && testbed.labIndex !== '' && testbed.labIndex !== 'NA');
        }
        
        this.testBedsDetails = filteredTestbeds;
        this.testbedListCopy = this.testBedsDetails;
        this.allTestsuites = data.allTestsuites && data.allTestsuites.length > 0 ? data.allTestsuites : [];
        this.allDevices = data.allDevices && data.allDevices.length > 0 ? data.allDevices : [];
        this.existingRecords = data.existingRecords && data.existingRecords.length > 0 ? data.existingRecords : [];
        this.testSetFilter = data.testSetFilter;
        this.editRecordData = data.editRecordData ? data.editRecordData : null;
      }
  }

  ngOnInit(): void {
    this.regDetailsForm = new UntypedFormGroup({
      testBed: new UntypedFormControl(this.editRecordData ? this.editRecordData.TestBed : null, Validators.required),
      // testSuites: new UntypedFormControl(this.editRecordData ? this.editRecordData.TestSuites.split(',') : null, Validators.required),
      dutName: new UntypedFormControl(this.editRecordData ? this.editRecordData.DUTName : null, Validators.required),
      fwCommunity: new UntypedFormControl(this.editRecordData ? this.editRecordData.FW_Community : null, Validators.required),
    });
    if (this.editRecordData) {
      this.selectedTestBed = this.editRecordData.TestBed;
      const tbDetails = this.testBedsDetails.filter(tb => {
        return (tb.testBedName === this.selectedTestBed);
    });
      this.testBedName = tbDetails[0]?.testBedName;
      this.getTestSuites(tbDetails);
      this.selectedTestBedId = this.editRecordData.TestBedId || tbDetails[0]?._id;
      this.selectedDUTId = this.editRecordData.DUTId || tbDetails[0]?.dutId;
      console.log('this.edit record', this.editRecordData);
      const testSuitesList = this.editRecordData.TestSuites.split(', ');
      const tsList = [];
      tsList.push(this.editRecordData.TestSuites);
      this.selectedTestSuites = testSuitesList && testSuitesList.length > 0 ? testSuitesList : tsList;
      this.selectedValues = [...this.selectedTestSuites];
      this.selectFormControl.patchValue(this.selectedValues);
      
      this.selectedTestSuiteId = [];
      this.selectedValues.forEach(value => {
        const ts = this.testSuites.find(ts => ts.testSuiteName === value);
        if (ts) {
          this.selectedTestSuiteId.push(ts._id);
        }
      });
      
      this.dutName = this.editRecordData.DUTName;
      this.fwCommunity = this.editRecordData.FW_Community;
      this.buttonTitle = 'Update';

    }
    this.filteredOptions = this.searchTextboxControl.valueChanges
    .pipe(
      startWith<string>(''),
      map(name => this._filter(name))
    );
    // this.testSuites.va
  }

  onTestBedSelection(event): void {
    this.selectedTestBed = event.value;
    const existingRecord = this.existingRecords.filter(record => {
      return (record.TestBed === this.selectedTestBed);
    });
    if (existingRecord && existingRecord.length > 0) {
      this.regDetailsForm.get('testBed').setErrors({ duplicateName: true });
    } else {
      const tbDetails = this.testBedsDetails.filter(tb => {
        return (tb.testBedName === this.selectedTestBed);
      });
      const dut = this.allDevices.filter(device => {
        return (device._id === tbDetails[0].dutId);
      });
      this.selectedTestBedId = tbDetails[0]._id;
      this.selectedDUTId = dut && dut.length > 0 ? dut[0]._id : '';
      this.dutName = dut && dut.length > 0 ? dut[0].deviceName : '';
      this.fwCommunity = dut && dut.length > 0 ? dut[0]['Firmware Community'] && dut[0]['Firmware Community'] !== null
        ? dut[0]['Firmware Community'] : 'NA' : 'NA';
      this.testBedName = tbDetails[0].testBedName;
      this.getTestSuites(tbDetails);
    }
  }

  getTestSuites(tbDetails): void {
    if (this.testSetFilter) {
      if (tbDetails && tbDetails.length > 0) {
        const testBed = tbDetails[0];
        if (testBed.mappedTestSets) {
          testBed.mappedTestSets.forEach(mappedtestSetId => {
            const temp = this.allTestsuites.filter(testSuite => {
              return testSuite.moduleId.includes(mappedtestSetId);
            });
            this.testSuites = [...this.testSuites, ...temp];
            this.testSuites = [...new Set(this.testSuites)];
            this.testSuiteListCopy = this.testSuites;
          });
        } else {
          this.regDetailsForm.get('testBed').setErrors({ noMappedTestSuites: true });
        }
      }
    } else {
      this.testSuites = this.allTestsuites;
      this.testSuiteListCopy = this.allTestsuites;
    }
    // this.filteredOptions = of(this._filter(''));
    this.filteredOptions = this.searchTextboxControl.valueChanges
    .pipe(
      startWith<string>(''),
      map(name => this._filter(name))
    );
  }

  filterTestBedOption(event): void {
    const name = event.target.value.toLowerCase();
    if (name) {
      this.testbedListCopy = this.testBedsDetails.filter((el) => (el.testBedName.toLowerCase()).includes(name));
    } else {
      this.testbedListCopy = this.testBedsDetails;
    }
  }

  onCreate(): void{
    this.dialogRef.close({event: this.buttonTitle === 'Update' ? 'update' : 'create',  data: {TestBed : this.testBedName,
      TestSuites: this.selectedTestSuites.join(', '), DUTName: this.dutName, FW_Community: this.fwCommunity, TestBedId: this.selectedTestBedId,
      TestSuiteId: this.selectedTestSuiteId, DUTId: this.selectedDUTId
    }});
  }
  handleInput(event: KeyboardEvent): void{
    event.stopPropagation();
 }

   private _filter(name: string): any {
    const filterValue = name.toLowerCase();
    // Patch the form control with current selected values (maintains selection order)
    this.selectFormControl.patchValue(this.selectedValues);
    this.selectedTestSuites = this.selectedValues;
    const filteredList = this.testSuites.filter((el) => (el.testSuiteName.toLowerCase()).includes(filterValue));
    return filteredList;
  }

/**
 * Remove from selected values based on uncheck, add in selection order when checked
 */
  selectionChange(event): void {
    if (event.isUserInput) {
      if (event.source.selected === false) {
        // Remove from selected values when unchecked
        const index = this.selectedValues.indexOf(event.source.value);
        if (index > -1) {
          this.selectedValues.splice(index, 1);
        }
      } else {
        // Add to selected values in the order of selection when checked
        if (this.selectedValues.indexOf(event.source.value) === -1) {
          this.selectedValues.push(event.source.value);
        }
      }
    }
    
    // Update selectedTestSuiteId in the same order as selectedValues
    this.selectedTestSuiteId = [];
    this.selectedValues.forEach(value => {
      this.selectedTestSuiteId.push(this.testSuites.find(ts => ts.testSuiteName === value)?._id);
    });

    this.selectedTestSuites = this.selectedValues;
  }

  openedChange(e): void {
    // Set search textbox value as empty while opening selectbox
    this.searchTextboxControl.patchValue('');
    // Focus to search textbox while clicking on selectbox
    if (e === true) {
      this.searchTextBox.nativeElement.focus();
    }
  }

  /**
   * Clearing search textbox value
   */
  clearSearch(event): void {
    event.stopPropagation();
    this.searchTextboxControl.patchValue('');
  }

  /**
   * Set selected values to retain the state
   */
  setSelectedValues(): void {
    if (this.selectFormControl.value && this.selectFormControl.value.length > 0) {
      this.selectFormControl.value.forEach((e) => {
        if (this.selectedValues.indexOf(e) === -1) {
          this.selectedValues.push(e);
        }
      });
    }
  }
}
