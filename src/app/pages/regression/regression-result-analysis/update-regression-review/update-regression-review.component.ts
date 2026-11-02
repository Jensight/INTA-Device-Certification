import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-update-regression-review',
  templateUrl: './update-regression-review.component.html',
  styleUrls: ['./update-regression-review.component.scss']
})
export class UpdateRegressionReviewComponent implements OnInit {

  user: any;
  regName: any;
  status: any;
  reviewer: any;
  reviewedOn: any;
  failureCategory: any;
  remarks: any;
  selectedFailureCat: any;
  failureCategoryList = [
    {title: 'Firmware Issues', value: 'Firmware Issues'},
    {title: 'Automation API Issues', value: 'Automation API Issues'},
    {title: 'Lab Setup Issues', value: 'Lab Setup Issues'},
    {title: 'Hardware Issues', value: 'Hardware Issues'},
    {title: 'WAN IP Change', value: 'WAN IP Change'},
    {title: 'CM CID Change', value: 'CM CID Change'},
    {title: 'Reviewed No Issues', value: 'Reviewed No Issues'},

  ];
  yes = false;
  no = false;
  filteredOptions: Observable<any[]>;
  public regDetailsForm: UntypedFormGroup;
  recordData: any;
  id: any;
  @ViewChild('search') searchTextBox: ElementRef;

  selectFormControl = new UntypedFormControl(null, Validators.required);
  searchTextboxControl = new UntypedFormControl();
  selectedValues = [];
  constructor(public dialogRef: MatDialogRef<UpdateRegressionReviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private tlService: TestLabService) {
      console.log('data', data);
      if (data){
        this.user = data.user;
        this.regName = data.regName;
        this.status = data.status;
        this.reviewer = data.reviewer;
        this.reviewedOn = data.reviewedOn;
        this.remarks = data.remarks;
        this.recordData = this.data;
        this.id = data.id;
        this.yes = data.isReviewed === 'Yes' ? true : false;
        this.no = data.isReviewed === 'No' ? true : false;
      }
     }

  ngOnInit(): void {
    this.regDetailsForm = new UntypedFormGroup({
      regName: new UntypedFormControl(this.regName ? this.regName : null, Validators.required),
      user: new UntypedFormControl(this.user ? this.user : null, Validators.required),
      status: new UntypedFormControl(this.status ? this.status : null, Validators.required),
      reviewer: new UntypedFormControl(this.reviewer ? this.reviewer : null, Validators.required),
      reviewedOn: new UntypedFormControl(this.reviewedOn ? this.reviewedOn : null, Validators.required),
      remarks: new UntypedFormControl(this.remarks ? this.remarks : null, Validators.required),
      reviewComplete: new UntypedFormControl(),
      reviewNotComplete:new UntypedFormControl(),
    });
    const failCatList = this.recordData.failureCategory ? this.recordData.failureCategory.split(', ') : [];
    // const fcList = [];
    // fcList.push(this.recordData.failureCategory);
    this.selectedFailureCat = failCatList ;
    this.selectedValues = this.selectedFailureCat;
    this.selectFormControl.patchValue(this.selectedFailureCat);
    this.filteredOptions = this.searchTextboxControl.valueChanges
    .pipe(
      startWith<string>(''),
      map(name => this._filter(name))
    );
  }

  onUpdate(): void {
    const data = {
      _id : this.id,
      isReviewed: this.yes ? 'Yes' : 'No',
      reviewdOn: new Date(),
      reviewedBy: this.reviewer,
      failureCategory: this.selectedFailureCat.join(', '),
      freeTextRemarks: this.remarks
    };
    console.log('data', data);
    this.tlService.updateReviewDetails(data).subscribe(res => {
      console.log('res', res);
      this.dialogRef.close({data: {success: res['success']}});
    });
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

  private _filter(name: string): any {
    const filterValue = name.toLowerCase();
    // Set selected values to retain the selected checkbox state
    this.setSelectedValues();
    this.selectFormControl.patchValue(this.selectedValues);
    this.selectedFailureCat = this.selectedValues;
    const filteredList = this.failureCategoryList.filter((el) => (el.title.toLowerCase()).includes(filterValue));
    return filteredList;
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
 * Remove from selected values based on uncheck
 */
  selectionChange(event): void {
    if (event.isUserInput && event.source.selected === false) {
      const index = this.selectedValues.indexOf(event.source.value);
      this.selectedValues.splice(index, 1);
    }
    this.selectedFailureCat = this.selectedValues;
  }

  check(input) {
    console.log('input', input);
  	if(input === 'yes'){
      this.no = false;
    } else {
      this.yes = false;
    }

  }
}
