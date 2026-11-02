import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ShowPreviewComponent } from '../show-preview/show-preview.component';
import * as _ from 'lodash';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
@Component({
    selector: 'app-add-profile',
    templateUrl: './add-profile.component.html',
    styleUrls: ['./add-profile.component.scss'],
    providers: [{ provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'customClass' } }],
})
export class AddProfileComponent implements OnInit, OnDestroy {
    public openPanel = 0;
    public deviceProfileForm: UntypedFormGroup;
    public showPreview = false;
    public allProfileName = [];
    selectedTeam = null;
    allVariableGroup = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;

    // Custom validator to check for dots in label name
    noDotValidator(control: AbstractControl): ValidationErrors | null {
        if (control.value && control.value.includes('.')) {
            return { noDot: true };
        }
        return null;
    }

    duplicateLabelValidator = (control: AbstractControl): ValidationErrors | null => {
        if (!control.value || !this.deviceProfileForm) return null;
        const labelsArray = this.deviceProfileForm.get('labels') as UntypedFormArray;
        if (!labelsArray) return null;
        const currentValue = control.value.toLowerCase();
        const duplicateCount = labelsArray.controls.filter((g: UntypedFormGroup) => 
            g.get('name')?.value?.toLowerCase() === currentValue).length;
        return duplicateCount > 1 ? { duplicateName: true } : null;
    }

    constructor(
        private dialog: MatDialog,
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/device-inventory/',
            label: 'DeviceInventory'
        },
        {
            link: '#/pages/device-inventory/device-profile/',
            label: 'Device Profile'
        },
        {
            link: '#/pages/device-inventory/device-profile/add/',
            label: 'Add Profile'
        }
    ];

    ngOnInit() {
        this.deviceProfileForm = new UntypedFormGroup({
            profileName: new UntypedFormControl(null, Validators.required),
            variableGroups: new UntypedFormControl([]),
            labels: new UntypedFormArray([], Validators.required),
            connected_clients: new UntypedFormControl(false),
        });
        

        this.sub5 = this.dataService.selectedTeam.subscribe(team => {
            this.selectedTeam = team;
        });

        this.sub2 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                profiles.forEach(element => {
                    this.allProfileName.push(element.profileName);
                });
            } else {
                this.loadData();
            }
        });

        this.sub7 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
            }
        });
        this.getNewLabel();

        this.sub3 = this.deviceProfileForm.valueChanges.subscribe(value => {
            this.showPreview = false;
        });

        this.sub1 = this.deviceProfileForm.get('profileName').valueChanges.subscribe(value => {
            if (this.allProfileName.indexOf(value) !== -1) {
                this.deviceProfileForm.get('profileName').setErrors({ duplicate: true });
            } else if (this.deviceProfileForm.get('profileName').hasError('required')) {
                this.deviceProfileForm.get('profileName').setErrors(null);
                this.deviceProfileForm.get('profileName').setErrors({ required: true });
            } else {
                this.deviceProfileForm.get('profileName').setErrors(null);
            }
        });
    }

    /**
     * Used to remove a label from
     * @param i .
     */

    removeLabel(i) {
        const temp = this.deviceProfileForm.controls.labels as UntypedFormArray;
        temp.removeAt(i);
    }

    /**
     * Used to retrieve all inventory data
     */

    loadData() {
        this.sub6 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                // console.log(data)
                this.dataService.getDeviceInventoryData().next(data);
            }
        });
    }

    /**
     * Called to add a new label to Form
     */

    getNewLabel() {
        const temp = this.deviceProfileForm.get('labels') as UntypedFormArray;
        temp.push(
            new UntypedFormGroup({
                name: new UntypedFormControl(null, [Validators.required, this.noDotValidator, this.duplicateLabelValidator]),
                type: new UntypedFormControl(null, Validators.required),
                value: new UntypedFormControl(null)
            })
        );
    }

    /**
     * Called to add / remove Drop down in label.
     * @param item .
     */

    addRemoveDropdown(item: UntypedFormGroup) {
        if (item.get('type').value === 'text') {
            item.addControl('textType', new UntypedFormControl(null, Validators.required));
            item.removeControl('dropdownValue');
            item.removeControl('no');
         } else if (item.get('type').value === 'date') {
            item.addControl('textType', new UntypedFormControl('datetime', Validators.required));
            item.removeControl('dropdownValue');
            item.removeControl('no');
             //item.removeControl('textType');
         } 
        else if (item.get('type').value === 'dropdown') {
            item.addControl('no', new UntypedFormControl(null, Validators.required));
            item.addControl('dropdownValue', new UntypedFormArray([], Validators.required));
            item.removeControl('textType');
        } else {
            item.removeControl('textType');
            item.removeControl('dropdownValue');
            item.removeControl('no');
        }
    }

    /**
     * Add a drop-down list to the label when the drop-down list is selected
     * @param label .
     */

    addDropDown(label) {
        const controldata = [];
        const formData = [];
        if (label.controls.dropdownValue) {
            controldata.push(label.controls.dropdownValue.controls);
        }
        controldata.forEach(elem => {
            elem.forEach(element => {
                formData.push(element.value);
            });
        });
        label.removeControl('dropdownValue');
        const formAry = [];
        for (let i = 0; i < label.controls.no.value; i++) {
            formAry.push(new UntypedFormControl(formData[i] ? formData[i] : null, Validators.required));
        }
        label.addControl('dropdownValue', new UntypedFormArray(formAry));
    }

    /**
     * Get all values ??from the form and send to API for create a new profile
     */

    addDeviceProfile() {
        const temp = this.deviceProfileForm.controls.labels as UntypedFormArray;
        const temp2 = temp.controls as [UntypedFormGroup];
        temp2.forEach(elem => {
            elem.removeControl('no');
            this.showPreview = true;
        });
        this.dataService.loading.next(true);
        this.sub4 = this.dInventoryService.addNewProfile(this.deviceProfileForm.value).subscribe(
            data => {
                this.dataService.loading.next(false);
                if (data) {
                    this.dataService.getDeviceInventoryData().next(data);
                    this.snackBar.open('Profile Added Succesfully.', 'Ok', {
                        duration: 5000
                    });
                    this.router.navigate(['pages/device-inventory/device-profile']);
                } else {
                    this.snackBar.open('Error Adding Profile.', 'Try Again', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Profile.', 'Try Again', {
                    duration: 5000
                });
            }
        );
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
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
    }

    /**
     * Used to preview form data
     */

    showPreviewDialog() {
        this.dialog.open(ShowPreviewComponent, {
            data: this.deviceProfileForm,
            maxHeight: 500
        });
    }

    changeInputType(item:UntypedFormGroup, i){
        if(item.get('type').value === 'text') {
            if(item.get('textType').value == 'ip'){
                item.removeControl('value');
                item.addControl('value', new UntypedFormControl(null, Validators.pattern("^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")));
            } else if(item.get('textType').value == 'mac'){
                item.removeControl('value');
                item.addControl('value', new UntypedFormControl(null, Validators.pattern("^([0-9a-fA-F]{2}[:.-]?){5}[0-9a-fA-F]{2}$")));
            } else {
                item.removeControl('value');
                item.addControl('value', new UntypedFormControl(null));
            }
        }
    }
}
