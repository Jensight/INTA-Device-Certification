import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';

@Component({
    selector: 'app-add-vendor',
    templateUrl: './add-vendor.component.html',
    styleUrls: ['./add-vendor.component.scss']
})
export class AddVendorComponent implements OnInit, OnDestroy {
    public addVendorForm: UntypedFormGroup;
    public allVendors;
    sub1;
    sub2;
    sub3;
    constructor(
        public dialogRef: MatDialogRef<AddVendorComponent>,
        @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        this.addVendorForm = new UntypedFormGroup({
            name: new UntypedFormControl(null, Validators.required)
        });
        this.sub1 = this.dataService.getAllVendors().subscribe(vendors => {
            if (vendors) {
                this.allVendors = vendors;
            }
        });

        this.sub2 = this.addVendorForm.get('name').valueChanges.subscribe(value => {
            if (this.allVendors.indexOf(value) !== -1) {
                this.addVendorForm.get('name').setErrors({ duplicate: true });
            } else if (this.addVendorForm.get('name').hasError('required')) {
                this.addVendorForm.get('name').setErrors(null);
                this.addVendorForm.get('name').setErrors({ required: true });
            } else {
                this.addVendorForm.get('name').setErrors(null);
            }
        });
    }

    /**
     * Called to add new supplier after clicking save button using API call to backend
     */

    addVendor() {
        this.dataService.loading.next(true);
        this.addVendorForm.setErrors({ formSubbited: true });
        this.sub3 = this.dInventoryService.addNewVendor(this.addVendorForm.value).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getDeviceInventoryData().next(result);
                    this.snackBar.open('Vendor Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Vendor', 'Try Again', {
                    duration: 5000
                });
                this.dialogRef.close();
            }
        );
    }

    /**
     * Used to close the dialog
     */

    cancelEdit() {
        this.dialogRef.close();
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
    }
}
