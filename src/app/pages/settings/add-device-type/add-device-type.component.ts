import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/@core/services/data.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-add-device-type',
  templateUrl: './add-device-type.component.html',
  styleUrls: ['./add-device-type.component.scss']
})
export class AddDeviceTypeComponent implements OnInit {
  allVendors: any;
  buttonTitle = 'Add';
  showErrorMessage: boolean = false;
  deviceDetailsForm: UntypedFormGroup;
  myForm: UntypedFormGroup;
  fb: UntypedFormGroup;
  editRecordData = null;
  existingDeviceTypes: any[] = [];
  existingVendors: any;
  constructor(private dataService: DataService, public dialogRef: MatDialogRef<AddDeviceTypeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.dataService.getAllVendors().subscribe(vendor => {
      if (vendor) {
        this.allVendors = vendor;
      }
    });
    this.existingDeviceTypes = this.data ? this.data.existingDeviceTypes ? this.data.existingDeviceTypes : [] : [];
    this.editRecordData = this.data ? this.data.recordData ? this.data.recordData : null : null;
    this.buttonTitle = this.editRecordData ? 'Update' : 'Add';
  }

  ngOnInit(): void {
    // this.dataService.loading.next(true); 
    // this.editRecordData ? this.editRecordData.vendorArray :
    // console.log("edit record data", th)
    this.myForm = new UntypedFormGroup({
      DeviceType: new UntypedFormControl(this.editRecordData ? this.editRecordData.DeviceType : null, Validators.required),
      Status: new UntypedFormControl(this.editRecordData ? this.editRecordData.Status : 'active', Validators.required),
      vendorArray: new UntypedFormArray([], Validators.required),
      ModelType : new UntypedFormControl(this.editRecordData ? this.editRecordData.ModelType : 'ALL', Validators.required),
      ONTModelPosition : new UntypedFormControl(this.editRecordData ? this.editRecordData.ONTModelPosition ? 
         this.editRecordData.ONTModelPosition : 'noONT' : 'noONT', Validators.required)
    });
    console.log('ngOnInit', this.myForm.value);
    if (this.editRecordData) {
      const temp = this.myForm.get('vendorArray') as UntypedFormArray;
      const vendorArray = this.myForm.get('vendorArray') as UntypedFormArray;
      this.editRecordData.vendorArray.forEach(ele => {
        const tempFormGroup: UntypedFormGroup = new UntypedFormGroup({
          Vendor: new UntypedFormControl(ele.Vendor, Validators.required),
          DUT: new UntypedFormControl(ele.DUT, Validators.required),
          TFW: new UntypedFormControl(ele.TFW, Validators.required)
        });
        temp.push(tempFormGroup);
      });

    } else {
      this.getNewLabel();

    }
    this.myForm.get('DeviceType').valueChanges.subscribe(value => {
      if (this.existingDeviceTypes.indexOf(value) !== -1) {
        this.myForm.get('DeviceType').setErrors({ duplicate: true });
      } else {
        this.myForm.get('DeviceType').setErrors(null);
      }
    });
    this.myForm.get('vendorArray').valueChanges.subscribe(value => {
      const vendorArray = this.myForm.get('vendorArray') as UntypedFormArray;
      const vendors = vendorArray.controls.map((control) => (control as UntypedFormGroup).get('Vendor')?.value);
      let duplicateVendor = null;
      vendors.forEach((VendorValue, index) => {
        if (VendorValue && vendors.indexOf(VendorValue) !== index && duplicateVendor === null) {
          duplicateVendor = VendorValue;
        }
      });
      if (duplicateVendor) {
        vendorArray.setErrors({ duplicate: true, duplicateValue: duplicateVendor });
      } else {
        vendorArray.setErrors(null);
      }
    });


  }
  getNewLabel() {
    const temp = this.myForm.get('vendorArray') as UntypedFormArray;
    temp.push(
      new UntypedFormGroup({
        Vendor: new UntypedFormControl(null, Validators.required),
        DUT: new UntypedFormControl(false, Validators.required),
        TFW: new UntypedFormControl(false, Validators.required)
      })
    );
    // this.dataService.loading.next(false);


  }
  deleteVendor(index: number): void {
    const vendorArray = this.myForm.get('vendorArray') as UntypedFormArray;
    if (vendorArray.length === 1) {
      this.showErrorMessage = true;
      return;
    }
    this.showErrorMessage = false;
    vendorArray.removeAt(index);
  }
  get vendorArrayLength(): number {
    return (this.myForm.get('vendorArray') as UntypedFormArray).length;
  }

  onSubmit() {
    this.dialogRef.close({ event: this.buttonTitle === 'Update' ? 'update' : 'create', data: this.myForm.value });
  }

}
