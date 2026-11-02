import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { Validators, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

@Component({
    selector: 'app-edit-vendor',
    templateUrl: './edit-vendor.component.html',
    styleUrls: ['./edit-vendor.component.scss']
})
export class EditVendorComponent implements OnInit, OnDestroy {
    public editVendorForm: UntypedFormGroup;
    public allVendors;
    sub1;
    sub2;
    sub3;
    constructor(
        public dialogRef: MatDialogRef<EditVendorComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit() {
        this.editVendorForm = new UntypedFormGroup({
            name: new UntypedFormControl(this.data.data.name, Validators.required)
        });

        this.sub1 = this.dataService.getAllVendors().subscribe(vendors => {
            if (vendors) {
                this.allVendors = vendors;
            }
        });

        this.sub2 = this.editVendorForm.get('name').valueChanges.subscribe(value => {
            if (
                this.allVendors.indexOf(value) !== -1 &&
                this.data.data.name !== this.editVendorForm.get('name').value
            ) {
                this.editVendorForm.get('name').setErrors({ duplicate: true });
            } else if (this.editVendorForm.get('name').hasError('required')) {
                this.editVendorForm.get('name').setErrors(null);
                this.editVendorForm.get('name').setErrors({ required: true });
            } else {
                this.editVendorForm.get('name').setErrors(null);
            }
        });
    }

    /**
     * Change the supplier after getting all the values ??from the form to the backend
     */

    updateVendor() {
        this.dataService.loading.next(true);
        this.editVendorForm.setErrors({ submitted: true });
        const data = {};
        data['oldName'] = this.data.data.name;
        data['newName'] = this.editVendorForm.get('name').value;
        this.sub3 = this.dInventoryService.editVendor(data).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getDeviceInventoryData().next(result);
                    this.snackBar.open('Vendor Edited Succesfully', 'OK', { duration: 5000 });
                    this.dialogRef.close();
                } else {
                    this.snackBar.open('Error in Editing Vendor', 'Try Again', { duration: 5000 });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error in Editing Vendor', 'Try Again', { duration: 5000 });
                this.dialogRef.close();
            }
        );
    }

    /**
     * Close the dialog.
     */

    cancelEdit() {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
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
