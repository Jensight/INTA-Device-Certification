import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-edit-model',
    templateUrl: './edit-model.component.html',
    styleUrls: ['./edit-model.component.scss']
})
export class EditModelComponent implements OnInit, OnDestroy {
    public selectedTeam;
    public editModelForm: UntypedFormGroup;
    public selectedModel;
    public allProfileName: any[] = [];
    public filteredProfileName: any[] = [];
    public allProfiles = [];
    public allVendors;
    public allModel = [];
    selectedProfile;
    selectedProfiles = [];
    allVariableGroup = [];
    requiredFormGroup;
    requiredVariables;

    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    sub8;

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
            link: '#/pages/device-inventory/vendor-model/',
            label: 'Vendor Model'
        },
        {
            link: '#/pages/device-inventory/vendor-model/edit/',
            label: 'Edit Model'
        }
    ];

    constructor(
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });

        this.sub7 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
            }
        });

        this.sub2 = this.dataService.getAllProfiles().subscribe(profile => {
            if (profile) {
                this.allProfiles = profile;
                this.allProfileName = [];
                this.allProfiles.forEach(p => {
                    this.allProfileName.push(p.profileName);
                });
                this.filteredProfileName = [...this.allProfileName];
            }
        });

        this.sub3 = this.dInventoryService.selectedModel.subscribe(model => {
            if (model) {
                this.selectedModel = model;
                this.loadData();
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });
    }

    /**
     * Used to retrieve all inventory data
     */

    loadData() {
        // Build selected profiles from model's profileName (can be array or single string)
        const existingProfileNames = Array.isArray(this.selectedModel.profileName)
            ? this.selectedModel.profileName
            : (this.selectedModel.profileName ? [this.selectedModel.profileName] : []);
        this.selectedProfiles = this.allProfiles.filter(p => existingProfileNames.includes(p.profileName));
        this.selectedProfile = this.selectedProfiles.length > 0 ? this.selectedProfiles[this.selectedProfiles.length - 1] : null;
        if (this.selectedProfiles.length > 0) {
            this.loadVariablesForAllProfiles();
        }
        if(this.selectedModel.modelName && (!this.selectedModel.shareDevice || this.selectedModel.shareDevice == null)) {
            this.selectedModel.shareDevice = false;
        }
        if(this.selectedModel.modelName && (!this.selectedModel.dut || this.selectedModel.dut == null)) {
            this.selectedModel.dut = false;
            this.selectedModel.firmware_version_N_2 = '';
            this.selectedModel.firmware_version_N_1 = '';
            this.selectedModel.firmware_version_N = '';
            this.selectedModel.firmware_version_N_min_1 = '';
        }
        this.editModelForm = new UntypedFormGroup({
            modelName: new UntypedFormControl(this.selectedModel.modelName, Validators.required),
            dut:new UntypedFormControl(this.selectedModel.dut),
	    tfw:new UntypedFormControl(this.selectedModel.tfw),
            firmware_version_N_2:new UntypedFormControl(this.selectedModel.firmware_version_N_2),
            firmware_version_N_1:new UntypedFormControl(this.selectedModel.firmware_version_N_1),
            firmware_version_N:new UntypedFormControl(this.selectedModel.firmware_version_N),
            firmware_version_N_min_1: new UntypedFormControl(this.selectedModel.firmware_version_N_min_1),
            shareDevice: new UntypedFormControl(this.selectedModel.shareDevice),
            profileName: new UntypedFormControl(
                existingProfileNames,
                Validators.required
            ),
            deviceVendor: new UntypedFormControl(
                { value: this.selectedModel.deviceVendor, disabled: true },
                Validators.required
            )
        });

        this.sub4 = this.dataService.getAllModels().subscribe(models => {
            if (models) {
                models.forEach(element => {
                    this.allModel.push(element.modelName);
                });
            }
        });

        this.sub5 = this.editModelForm.get('modelName').valueChanges.subscribe(value => {
            if (
                this.allModel.indexOf(value) !== -1 &&
                this.editModelForm.get('modelName').value !== this.selectedModel.modelName
            ) {
                this.editModelForm.get('modelName').setErrors({ duplicate: true });
            } else if (this.editModelForm.get('modelName').hasError('required')) {
                this.editModelForm.get('modelName').setErrors(null);
                this.editModelForm.get('modelName').setErrors({ required: true });
            } else {
                this.editModelForm.get('modelName').setErrors(null);
            }
        });

        this.sub8 = this.editModelForm.get('profileName').valueChanges.subscribe((profileNames: string[]) => {
            const selected = profileNames ? profileNames.filter(p => p !== '__select_all__') : [];
            if (selected.length > 0) {
                this.selectedProfiles = this.allProfiles.filter(p => selected.includes(p.profileName));
                this.selectedProfile = this.selectedProfiles[this.selectedProfiles.length - 1];
                this.loadVariablesForAllProfiles();
            } else {
                this.selectedProfile = null;
                this.selectedProfiles = [];
                this.requiredFormGroup = null;
                this.requiredVariables = [];
            }
        });
    }

    ngOnInit() {}

    /**
     * called to return to the models list page.
     */

    cancel() {
        this.router.navigate(['../'], { relativeTo: this.r });
    }

    /**
     * Get all values ??from Edit form and submit to API For Modify Model
     */

    editModel() {
        const finalValue = this.editModelForm.getRawValue();
        delete finalValue['count'];
        delete finalValue['target'];
        const restJson = {};
        restJson['updatedModel'] = finalValue;
        restJson['updatedModel']['variableGroups'] = this.requiredFormGroup.value['variableGroups'] || [];
        restJson['updatedModel']['modelId'] = this.selectedModel._id;
        restJson['oldModel'] = this.selectedModel;
        this.dataService.loading.next(true);
        this.sub6 = this.dInventoryService.editModel(restJson).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getDeviceInventoryData().next(result);
                    this.snackBar.open('Model Edited Succesfully', 'OK', { duration: 5000 });
                    this.cancel();
                } else {
                    this.snackBar.open('Error in Editing Model', 'Try Again', { duration: 5000 });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error in Editing Model', 'Try Again', { duration: 5000 });
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
        if (this.sub8) {
            this.sub8.unsubscribe();
        }
    }

    loadVariablesForAllProfiles() {
        const variableValueArray = new UntypedFormArray([]);
        const valueObj = {};
        if (this.selectedModel['variableGroups'] && this.selectedModel['variableGroups'].length > 0) {
            for (let i = 0; i < this.selectedModel['variableGroups'].length; i++) {
                const element = this.selectedModel['variableGroups'][i]['variables'];
                for (let j = 0; j < element.length; j++) {
                    const vars = element[j];
                    valueObj[vars.variableId] = vars.variableValue;
                }
            }
        }
        let allVariables = [];
        for (const profile of this.selectedProfiles) {
            if (profile.variableGroups && profile.variableGroups.length > 0) {
                const profileVars = this.allVariableGroup.filter(a => {
                    return profile.variableGroups.indexOf(a._id) > -1;
                }).map(v => ({ ...v, profileId: profile._id, profileName: profile.profileName }));
                allVariables = allVariables.concat(profileVars);
            }
        }
        for (let index = 0; index < allVariables.length; index++) {
            const element = allVariables[index];
            const varFormArray = new UntypedFormArray([]);
            const varArray = element['variables'];
            for (let j = 0; j < varArray.length; j++) {
                const variable = varArray[j];
                const tempGrp = new UntypedFormGroup({
                    variableId: new UntypedFormControl(variable._id),
                    variableValue: new UntypedFormControl(valueObj[variable._id] || null)
                });
                varFormArray.push(tempGrp);
            }
            const vrGroup = new UntypedFormGroup({
                profileId: new UntypedFormControl(element['profileId']),
                groupId: new UntypedFormControl(element['_id']),
                variables: varFormArray
            });
            variableValueArray.push(vrGroup);
        }
        this.requiredFormGroup = new UntypedFormGroup({ variableGroups: variableValueArray });
        this.requiredVariables = allVariables.map(v => ({ ...v, collapsed: true }));
    }

    filterProfiles(searchText: string) {
        if (!searchText) {
            this.filteredProfileName = [...this.allProfileName];
        } else {
            const lower = searchText.toLowerCase();
            this.filteredProfileName = this.allProfileName.filter(p => p.toLowerCase().includes(lower));
        }
    }

    toggleSelectAll() {
        const current: string[] = this.editModelForm.get('profileName').value || [];
        const hasSelectAll = current.includes('__select_all__');
        if (hasSelectAll) {
            this.editModelForm.get('profileName').setValue(['__select_all__', ...this.allProfileName]);
        } else {
            this.editModelForm.get('profileName').setValue([]);
        }
    }

    /**
     * Called to get a variable group for the respective device profile.
     */

    loadVariables() {
        const variableValueArray = new UntypedFormArray([]);
        const valueObj = {};
        if (this.selectedModel['variableGroups'] && this.selectedModel['variableGroups'].length > 0) {
            for (let i = 0; i < this.selectedModel['variableGroups'].length; i++) {
                const element = this.selectedModel['variableGroups'][i]['variables'];
                for (let j = 0; j < element.length; j++) {
                    const vars = element[j];
                    valueObj[vars.variableId] = vars.variableValue;
                }
            }
        }

        if (!this.selectedProfile || !this.selectedProfile.variableGroups) {
            this.requiredFormGroup = new UntypedFormGroup({ variableGroups: variableValueArray });
            this.requiredVariables = [];
            return;
        }
        const allVariables = this.allVariableGroup.filter(a => {
            return this.selectedProfile['variableGroups'].indexOf(a._id) > -1;
        });
        for (let index = 0; index < allVariables.length; index++) {
            const element = allVariables[index];
            const varFormArray = new UntypedFormArray([]);
            const varArray = element['variables'];
            for (let j = 0; j < varArray.length; j++) {
                const variable = varArray[j];
                const tempGrp = new UntypedFormGroup({
                    variableId: new UntypedFormControl(variable._id),
                    variableValue: new UntypedFormControl(valueObj[variable._id] || null)
                });
                varFormArray.push(tempGrp);
            }
            const vrGroup = new UntypedFormGroup({
                groupId: new UntypedFormControl(element['_id']),
                variables: varFormArray
            });
            variableValueArray.push(vrGroup);
        }
        this.requiredFormGroup = new UntypedFormGroup({ variableGroups: variableValueArray });
        this.requiredVariables = allVariables;
    }

    goToCheckDut() {
        setTimeout(() => {
            if(this.editModelForm.value.dut == false){
                this.editModelForm.patchValue({
                    firmware_version_N_2:'',
                    firmware_version_N_1:'',
                    firmware_version_N:'',
                    firmware_version_N_min_1:''
                })
            }
        }, 1);
    }
}
