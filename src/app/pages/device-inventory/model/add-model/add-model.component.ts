import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import * as _ from 'lodash';
@Component({
    selector: 'app-add-model',
    templateUrl: './add-model.component.html',
    styleUrls: ['./add-model.component.scss']
})
export class AddModelComponent implements OnInit, OnDestroy {
    public addModelForm: UntypedFormGroup;
    public allVendors = [];
    public allProfileName = [];
    public filteredProfileName = [];
    public selectedTeam;
    public allModel = [];
    allProfiles = [];
    allVariableGroup = [];
    requiredVariables = [];
    requiredFormGroup;
    dataLoaded = false;
    vendorSubscription;
    teamSubscription;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    selectedProfile = null;
    selectedProfiles = [];
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
            link: '#/pages/device-inventory/vendor-model/add/',
            label: 'Add Model'
        }
    ];

    constructor(
        private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute
    ) {
        this.teamSubscription = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.loadData();
            }
        });

        this.sub4 = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
                this.allProfileName = [];
                this.allProfiles.forEach(profile => {
                    this.allProfileName.push(profile.profileName);
                });
                this.filteredProfileName = [...this.allProfileName];
            }
        });

        this.sub6 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
            }
        });
    }

    /**
     * Used to retrieve all inventory data
     */

    loadData() {
        this.vendorSubscription = this.dataService.getAllVendors().subscribe(vendors => {
            if (vendors) {
                this.allVendors = vendors;
            } else if (!this.dataLoaded) {
                this.dataLoaded = true;
                this.sub5 = this.dInventoryService.getAllData().subscribe(data => {
                    if (data) {
                        this.dataService.getDeviceInventoryData().next(data);
                    }
                });
            }
        });
    }

    ngOnInit() {
        this.addModelForm = new UntypedFormGroup({
            modelName: new UntypedFormControl(null, Validators.required),
            profileName: new UntypedFormControl(null, Validators.required),
            deviceVendor: new UntypedFormControl(null, Validators.required),
            dut: new UntypedFormControl(false),
            firmware_version_N_2:new UntypedFormControl(null),
            firmware_version_N_1:new UntypedFormControl(null),
            firmware_version_N:new UntypedFormControl(null),
            firmware_version_N_min_1: new UntypedFormControl(null),
            shareDevice: new UntypedFormControl(false),
            tfw: new UntypedFormControl(false)

        });

        this.sub7 = this.addModelForm.get('profileName').valueChanges.subscribe((profileNames: string[]) => {
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

        this.sub1 = this.dataService.getAllModels().subscribe(models => {
            if (models) {
                models.forEach(element => {
                    this.allModel.push(element.modelName);
                });
            }
        });

        this.sub2 = this.addModelForm.get('modelName').valueChanges.subscribe(value => {
            if (this.allModel.indexOf(value) !== -1) {
                this.addModelForm.get('modelName').setErrors({ duplicate: true });
            } else if (this.addModelForm.get('modelName').hasError('required')) {
                this.addModelForm.get('modelName').setErrors(null);
                this.addModelForm.get('modelName').setErrors({ required: true });
            } else {
                this.addModelForm.get('modelName').setErrors(null);
            }
        });
    }

    /**
     * Get all the values ??from the form and submit it to API For Create a New Model
     */

    addModel() {
        if (this.addModelForm.get('deviceVendor').value == null) {
            //this.addModelForm.get('deviceVendor').setValue('vAUTO');
        }
        this.addModelForm.addControl('variableGroups', this.requiredFormGroup ? this.requiredFormGroup.get('variableGroups') : new UntypedFormArray([]));
        this.dataService.loading.next(true);
        this.sub3 = this.dInventoryService.addNewModel(this.addModelForm.value).subscribe(
            allData => {
                this.dataService.loading.next(false);
                if (allData) {
                    this.dataService.getDeviceInventoryData().next(allData);
                    this.snackBar.open('Model Added Succesfully.', 'Ok', {
                        duration: 5000
                    });
                    this.cancel();
                } else {
                    this.snackBar.open('Error Adding Model.', 'Try Again', {
                        duration: 5000
                    });
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Model.', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    /**
     * Called to get a variable group for the respective device profile.
     */

    loadVariablesForAllProfiles() {
        const variableValueArray = new UntypedFormArray([]);
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
                    variableValue: new UntypedFormControl(null)
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
        this.requiredVariables = allVariables.map(v => ({ ...v, collapsed: true }));
    }

    loadVariables() {
        const variableValueArray = new UntypedFormArray([]);
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
                    variableValue: new UntypedFormControl(null)
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
        if (this.vendorSubscription) {
            this.vendorSubscription.unsubscribe();
        }
        if (this.teamSubscription) {
            this.teamSubscription.unsubscribe();
        }
        
    }

    /**
     * called to return to the models list page.
     */

    cancel() {
        this.router.navigate(['../'], { relativeTo: this.r });
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
        const current: string[] = this.addModelForm.get('profileName').value || [];
        const hasSelectAll = current.includes('__select_all__');
        if (hasSelectAll) {
            // Was just checked - select all profiles
            this.addModelForm.get('profileName').setValue(['__select_all__', ...this.allProfileName]);
        } else {
            // Was just unchecked - deselect all
            this.addModelForm.get('profileName').setValue([]);
        }
    }

    goToCheckDut() {
        setTimeout(() => {
            if(this.addModelForm.value.dut == false){
                this.addModelForm.patchValue({
                    firmware_version_N_2:'',
                    firmware_version_N_1:'',
                    firmware_version_N:'',
                    firmware_version_N_min_1:''
                })
            }
        }, 1);
    }
}