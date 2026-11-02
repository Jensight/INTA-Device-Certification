import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import * as SUGAR from 'sugar';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
import { ShowPreviewComponent } from '../show-preview/show-preview.component';
@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit, OnDestroy {
    public allProfileName = [];
    public selectedTeam;
    public selectedProfile;
    public selectedProfileClone;
    public totalLables;
    public openPanel = 0;
    public deviceProfileForm: UntypedFormGroup;
    public showPreview = true;
    public allLabelNames = [];

    // For Deleting Fields
    public deleteCheckArray = [];
    public deletedField = {};

    // For Editing Fields
    public editObject = {};

    // new Fields
    public newFields;

    // Profile Name Change
    public profileNameObject = {};
    allVariableGroup = [];

    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
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
            link: '#/pages/device-inventory/device-profile',
            label: 'Device profile'
        },
        {
            link: '#/pages/device-inventory/device-profile/edit',
            label: 'Edit Profile'
        }
    ];

    /**
     * Custom validator to restrict dot (.) character in label names
     */
    noDotValidator(control: AbstractControl): ValidationErrors | null {
        if (control.value && control.value.includes('.')) {
            return { noDot: true };
        }
        return null;
    }

    /**
     * Custom validator to check for duplicate label names
     */
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
        private snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute
    ) {
        this.sub7 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.sub6 = this.dInventoryService.selectedProfile.subscribe(profile => {
            if (profile) {
                this.selectedProfile = profile;
                this.totalLables = this.selectedProfile.labels.length - 1;
                this.loadData();
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });

        this.sub5 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
            }
        });
    }
    ngOnInit() { }

    /**
     * Retrieves data for editing a profile and is displayed in Form
     */

    loadData() {
        this.deviceProfileForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedProfile['_id']),
            profileName: new UntypedFormControl(this.selectedProfile.profileName, Validators.required),
            variableGroups: new UntypedFormControl(this.selectedProfile.variableGroups || []),
            labels: new UntypedFormArray([], Validators.required),
            connected_clients: new UntypedFormControl(this.selectedProfile.connected_clients || false),
        });
        const temp = this.deviceProfileForm.get('labels') as UntypedFormArray;
        this.selectedProfile.labels.forEach(label => {
            this.allLabelNames.push(label.name);
            this.deleteCheckArray.push(false);
            const tempFormGroup: UntypedFormGroup = new UntypedFormGroup({
                name: new UntypedFormControl(label.name, [Validators.required, this.noDotValidator, this.duplicateLabelValidator]),
                type: new UntypedFormControl({ value: label.type, disabled: true }, Validators.required),
                value: new UntypedFormControl(label.value)
            });
            if (label.type === 'text') {
                tempFormGroup.addControl('textType', new UntypedFormControl(label.textType || 'text', Validators.required));
            } else if (label.type === 'dropdown') {
                tempFormGroup.addControl('dropdownValue', new UntypedFormArray([], Validators.required));
                tempFormGroup.addControl('no', new UntypedFormControl(label.dropdownValue.length));
                const tempFormArray = tempFormGroup.get('dropdownValue') as UntypedFormArray;
                label.dropdownValue.forEach(val => {
                    tempFormArray.push(new UntypedFormControl({ value: val, disabled: true }, Validators.required));
                });
            }

            temp.push(tempFormGroup);
        });
        this.sub1 = this.deviceProfileForm.valueChanges.subscribe(value => {
            this.showPreview = false;
        });

        // When any label name changes, re-validate all other label name controls
        // so stale duplicateName errors are cleared on siblings.
        const labelsArray = this.deviceProfileForm.get('labels') as UntypedFormArray;
        labelsArray.controls.forEach((labelGroup, idx) => {
            labelGroup.get('name').valueChanges.subscribe(() => {
                labelsArray.controls.forEach((sibling, sibIdx) => {
                    if (sibIdx !== idx) {
                        sibling.get('name').updateValueAndValidity({ emitEvent: false });
                    }
                });
            });
        });

        this.sub2 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                profiles.forEach(element => {
                    this.allProfileName.push(element.profileName);
                });
            }
        });

        this.sub3 = this.deviceProfileForm.get('profileName').valueChanges.subscribe(value => {
            if (
                this.allProfileName.indexOf(value) !== -1 &&
                this.deviceProfileForm.get('profileName').value !== this.selectedProfile.profileName
            ) {
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
     * Returns true when the form has no errors OTHER than duplicateName.
     * Allows saving profiles that contain pre-existing duplicate label names
     * while still blocking save on real validation errors.
     */
    isFormSavable(): boolean {
        if (this.deviceProfileForm.valid) return true;
        return this.hasOnlyDuplicateNameErrors(this.deviceProfileForm);
    }

    private hasOnlyDuplicateNameErrors(group: UntypedFormGroup | UntypedFormArray): boolean {
        for (const key of Object.keys((group as any).controls)) {
            const ctrl = (group as any).controls[key];
            if (ctrl.invalid) {
                const errors = ctrl.errors;
                if (errors && Object.keys(errors).some(e => e !== 'duplicateName')) {
                    return false;
                }
                if (ctrl.controls && !this.hasOnlyDuplicateNameErrors(ctrl)) {
                    return false;
                }
            }
        }
        return true;
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
        }  else if (item.get('type').value === 'date') {
            item.addControl('textType', new UntypedFormControl('datetime', Validators.required));
            item.removeControl('dropdownValue');
            item.removeControl('no');
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
     * Add a drop-down list to the label when the drop-down list is selected.
     * @param label .
     */

    addDropDown(label, index) {
        const totalDeletedCount = SUGAR.Array.count(this.deleteCheckArray, true);
        const deletedCount = SUGAR.Array.count(this.deleteCheckArray, true, index);
        if (totalDeletedCount + index < this.selectedProfile.labels.length) {
            let maxValue;
            if (label.controls.no.value > this.deviceProfileForm.getRawValue().labels[index].dropdownValue.length) {
                maxValue = label.controls.no.value;
            } else {
                maxValue = Math.max(
                    this.selectedProfile.labels[index + deletedCount].dropdownValue.length,
                    label.controls.no.value
                );
            }
          //  console.log("label.controls.no.value>>>>",label.controls.no.value);
           // const finalValue = Math.min(10, maxValue);
           const finalValue =  maxValue;
            const tempFormArray = this.deviceProfileForm.get('labels') as UntypedFormArray;
            const tempFormGroup = tempFormArray.at(index) as UntypedFormGroup;
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
            for (let i = 0; i < finalValue; i++) {
                if (i < this.selectedProfile.labels[deletedCount + index].dropdownValue.length) {
                    formAry.push(new UntypedFormControl({ value: formData[i], disabled: true }, Validators.required));
                } else {
                    formAry.push(new UntypedFormControl(formData[i] ? formData[i] : null, Validators.required));
                }
            }
            label.addControl('dropdownValue', new UntypedFormArray(formAry));
            tempFormGroup.get('no').setValue(finalValue);
        } else {
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
            const tempFormAry = this.deviceProfileForm.get('labels') as UntypedFormArray;
            const tempFormGrp = tempFormAry.at(index) as UntypedFormGroup;
           // console.log("tempFormGrp.get('no').value else,", tempFormGrp.get('no').value);
           // const count = Math.min(tempFormGrp.get('no').value, 10);
           const count = tempFormGrp.get('no').value;
            for (let i = 0; i < count; i++) {
                formAry.push(new UntypedFormControl(formData[i] ? formData[i] : null, Validators.required));
            }
            label.addControl('dropdownValue', new UntypedFormArray(formAry));
        }
    }

    /**
     * Used to remove a label from
     * @param i .
     */

    removeLabel(i) {
        if (i <= this.totalLables) {
            this.totalLables--;
            const duplicateArray = this.deleteCheckArray.slice();
            duplicateArray.splice(i + 1);
            const totalDeleteCount = SUGAR.Array.count(duplicateArray, true);
            this.deleteCheckArray[i + totalDeleteCount] = true;
        }
        const temp = this.deviceProfileForm.controls.labels as UntypedFormArray;
        temp.removeAt(i);
    }

    /**
     * Called after hitting update function to save all changed values ??for back end via API call
     */

    editDeviceProfile() {
        const deletedGroup = _.difference(
            this.selectedProfile.variableGroups,
            this.deviceProfileForm.get('variableGroups').value
        );
        const temp = this.deviceProfileForm.controls.labels as UntypedFormArray;
        const temp2 = temp.controls as [UntypedFormGroup];
        temp2.forEach(elem => {
            elem.removeControl('no');
            this.showPreview = true;
        });

        const editProfileValue = this.deviceProfileForm.getRawValue();

        // checking for deletion of field
        this.deletedField = {};
        for (let i = 0; i < this.deleteCheckArray.length; i++) {
            if (this.deleteCheckArray[i]) {
                this.deletedField[this.selectedProfile.labels[i].name] = '';
            }
        }

        // checking for rename of field
        const tempRenameObject = {};
        if (this.deleteCheckArray.indexOf(false) !== -1) {
            let deleteCount = 0;
            for (let i = 0; i < this.deleteCheckArray.length; i++) {
                if (this.deleteCheckArray[i]) {
                    deleteCount++;
                } else {
                    if (this.selectedProfile.labels[i].name !== editProfileValue.labels[i - deleteCount]?.name) {
                        tempRenameObject[this.selectedProfile.labels[i].name] =
                            editProfileValue.labels[i - deleteCount]?.name;
                    }
                }
            }
        }
        this.editObject = tempRenameObject;

        // Checking for New Fields
        const newFieldObject = {};
        const unDeleteCount = this.deleteCheckArray.length - SUGAR.Array.count(this.deleteCheckArray, true);
        this.newFields = editProfileValue.labels.slice(unDeleteCount);
        this.newFields.forEach(element => {
            newFieldObject[element.name] = null;
            if (element.value){
                newFieldObject[element.name] = element.value;
            }
        });

        // checking for change in profile Name
        if (editProfileValue.profileName !== this.selectedProfile.profileName) {
            this.profileNameObject['oldName'] = this.selectedProfile.profileName;
            this.profileNameObject['newName'] = editProfileValue.profileName;
        } else {
            this.profileNameObject = {};
        }

        // framingFinal Edit Object
        delete this.selectedProfile['deviceCount'];
        delete this.selectedProfile['target'];
        delete this.selectedProfile['count'];
        const profileEditObject = {};
        profileEditObject['renameObject'] = this.editObject;
        profileEditObject['profileNameObject'] = this.profileNameObject;
        profileEditObject['newFields'] = newFieldObject;
        profileEditObject['deleteObject'] = this.deletedField;
        profileEditObject['oldProfile'] = this.selectedProfile;
        profileEditObject['newProfile'] = editProfileValue;
        profileEditObject['toBeDeletedGroup'] = deletedGroup;
        // console.log(editProfileValue);
        this.dataService.loading.next(true);
        this.sub4 = this.dInventoryService.editDeviceProfile(profileEditObject).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getDeviceInventoryData().next(result);
                    this.snackBar.open('Profile Edited Succesfully.', 'Ok', {
                        duration: 5000
                    });
                    this.router.navigate(['pages/device-inventory/device-profile']);
                } else {
                    this.snackBar.open('Error Editing Profile.', 'Try Again', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Editing Profile.', 'Try Again', {
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
