import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TooltipPosition } from '@angular/material/tooltip';
import { TestBedService } from '../../../@core/services/test-bed.service';
import * as _ from 'lodash';
import { ToastrService, ToastrConfig } from 'ngx-toastr';
import { ActivatedRoute, Router } from '../../../../../node_modules/@angular/router';
import { Location } from '@angular/common';
@Component({
    selector: 'app-test-bed-configure',
    templateUrl: './test-bed-configure.component.html',
    styleUrls: ['./test-bed-configure.component.scss']
})
export class TestBedConfigureComponent implements OnDestroy {
    @Output()
    testbed = new EventEmitter();
    public selectedTeam;
    public allDevice;
    allProfiles = [];
    searchTerm;
    public allDeviceUnused = [];
    public duplicateAllDevice = [];
    public selectedTestbed;
    public testBedName;
    public allTestbedEnvVariables = [];
    public allDeviceProfileValue = [];
    public validData = false;
    public validDataStatus;
    public editVariableForm: UntypedFormGroup;
    public allModels = [];
    public allVendors = [];
    public allDeviceUnusedDuplicate = [];
    public allDeviceDuplicate = [];
    public allVariables = [];
    public allVariableNames = [];
    allTestbedSelectedVariables = [];
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    classNameDuplicate = ['red-color', 'orange-color', 'pink-color', 'green-color'];
    // filter variables
    public allModelNames = [];
    public allVendorName = [];
    public displayModels = [];
    public displayVendors = [];
    public hideModels = [];
    public hideVendors = [];
    public firstTime = true;
    public vendorModelData = {};
    public dataChanged = new EventEmitter();
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
            link: '#/pages/test-bed/view',
            label: 'Test Bed'
        },
        {
            link: '#/pages/test-bed/view/configure',
            label: 'Configure Testbed'
        },

    ];
    position: TooltipPosition[] = ['after', 'before', 'above', 'below', 'left', 'right'];
    tbSubscription;
    flag = true;
    selectedDevices = [];
    // config: ToasterConfig = new ToastrConfig({
    //     positionClass: 'toast-bottom-right',
    //     timeout: 5000,
    //     newestOnTop: true,
    //     tapToDismiss: true,
    //     preventDuplicates: true,
    //     animation: 'flyRight',
    //     limit: 5
    // });
    constructor(
        private toasterService: ToastrService,
        private testbedService: TestBedService,
        private dataService: DataService,
        private bar: MatSnackBar,
        private r: ActivatedRoute,
        private router: Router,
        private location: Location
    ) {
        this.testbedService.configureTestbed.subscribe(tb => {
            if (tb) {
                this.selectedTestbed = _.cloneDeep(tb);
                this.testBedName = this.selectedTestbed.testBedName;
                this.loadData();
            } else {
                this.router.navigate(['../'], { relativeTo: this.r });
            }
        });
    }

    /**
     * Will load all required data from the data service
     */

    loadData() {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.getDeviceOfSelectedTeam();
            }
        });
        this.sub2 = this.dataService.getTestbedVariables().subscribe(variable => {
            if (variable) {
                this.allVariables = _.cloneDeep(variable);
                this.allVariableNames = [];
                this.allVariables.forEach(varName => {
                    if (varName.variableName !== 'Text Value' && varName.variableName !== 'ReturnValX') {
                        this.allVariableNames.push(varName._id);
                    }
                });
            }
        });
        this.sub3 = this.dataService.getAllProfiles().subscribe(profile => {
            if (profile) {
                this.allProfiles = _.cloneDeep(profile);
            }
        });
        this.editVariableForm = new UntypedFormGroup({});
        this.validateData();
        this.getAllModels();
        this.getVariablesofTestbed();
    }

    /**
     * Get devices of selected team
     */

    getDeviceOfSelectedTeam() {
        this.sub4 = this.dataService.getAllDevices().subscribe(device => {
            if (device) {
                this.allDevice = device.slice();
                this.getDevicesAndProfile();
                this.getModelandVendor();
            }
        });
    }

    /**
     * Get devices and profile details
     */

    getDevicesAndProfile() {
        const allNodes: any[] = this.selectedTestbed.nodes;
        const deviceUsed = [];
        allNodes.forEach(val => {
            this.allDeviceProfileValue.push(val);
        });
        allNodes.forEach(node => {
            if (node.deviceId) {
                deviceUsed.push({ deviceId: node.deviceId });
            }
        });
        this.allDeviceDuplicate = _.cloneDeep(this.allDevice);
        this.allDeviceDuplicate.forEach(device => {
            device.deviceId = device._id;
            delete device._id;
        });

        this.allDeviceUnused = _.differenceBy(this.allDeviceDuplicate, deviceUsed, 'deviceId');
        this.allDeviceUnusedDuplicate = this.allDeviceUnused.slice();
        this.getModelandVendor();
        this.duplicateAllDevice = this.allDeviceUnused;

    }

    /**
     * Add Device to the profile function
     * @param event .
     * @param index .
     */

    addDeviceToProfile(event, index) {
        this.toasterService.clear();
        const testBedProfileId = this.allDeviceProfileValue[index].profileId;
        const deviceProfileId = event.dragData.profileId;
        if (testBedProfileId === deviceProfileId) {
            if (this.allDeviceProfileValue[index].deviceId !== null) {
                const temp = _.find(this.allDeviceDuplicate, ['deviceId', this.allDeviceProfileValue[index].deviceId]);
                if (temp !== undefined) {
                    this.allDeviceUnused.push(temp);
                    // this.checkModel({ cheked: false }, temp.model);
                }
            }
            this.allDeviceUnused.splice(this.allDeviceUnused.indexOf(event.dragData), 1);

            this.allDeviceProfileValue[index].deviceId = event.dragData.deviceId;
        } else {
            // this.toasterService.pop('error', 'Invalid Device', 'Device and Device Profile not matched');
        }
        this.validateData();
        this.getModelandVendor();
    }

    // Drag and Drop Button

    selectAProfile(index) {
        this.toasterService.clear();
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.allDeviceProfileValue.length; i++) {
            const testBedProfileId = this.allDeviceProfileValue[i].profileId;
            if (index !== 0) {
                const deviceProfileId = _.find(this.allDeviceDuplicate, ['deviceId', index]).profileId;
                const selectedData = _.find(this.allDeviceDuplicate, ['deviceId', index]);
                if (testBedProfileId === deviceProfileId) {
                    if (this.allDeviceProfileValue[i].deviceId !== null) {
                        const temp = _.find(this.allDeviceDuplicate, ['deviceId', this.allDeviceProfileValue[i].deviceId]);
                        if (temp !== undefined) {
                            // this.allDeviceUnused.push(temp);
                            // this.checkModel({ cheked: false }, temp.model);
                        }
                    }
                    if (this.allDeviceProfileValue[i].deviceId === null) {
                        this.allDeviceUnused.splice(this.allDeviceUnused.indexOf(selectedData), 1);
                        this.allDeviceProfileValue[i].deviceId = selectedData.deviceId;
                        index = 0;
                    }
                }
            } else {
                // this.toasterService.pop('error', 'Invalid Device', 'Device and Device Profile not matched');
            }

        }
        this.validateData();
        this.getModelandVendor();

    }

    /**
     * removes selected device
     * @param index .
     */

    removeDevice(index) {
        this.toasterService.clear();
        if (index.dragData !== null) {
            const object = this.allDeviceProfileValue[index.dragData];
            const temp = _.find(this.allDeviceDuplicate, ['deviceId', object.deviceId]);
            if (temp !== undefined) {
                this.allDeviceUnused.push(temp);
                this.checkModel({ checked: true }, temp.model);
            }
            object.deviceId = null;
        }
        this.validateData();
        this.getModelandVendor();
    }

    removeAProfile(index) {
        this.toasterService.clear();
        if (index !== null) {
            const object = this.allDeviceProfileValue[index];
            const temp = _.find(this.allDeviceDuplicate, ['deviceId', object.deviceId]);
            if (temp !== undefined) {
                this.allDeviceUnused.push(temp);
                this.checkModel({ checked: true }, temp.model);
            }
            object.deviceId = null;
        }
        this.validateData();
        this.getModelandVendor();
    }

    /**
     * Validate the device data weather it is null or undefined
     */

    validateData() {
        for (let i = 0; i < this.allDeviceProfileValue.length; i++) {
            if (
                this.allDeviceProfileValue[i].deviceId !== null &&
                this.allDeviceProfileValue[i].deviceId !== undefined
            ) {
                this.validData = true;
                this.validDataStatus = { invalid: false, valid: true };
            } else {
                this.validData = false;
                this.validDataStatus = { invalid: true, valid: false };
                break;
            }
        }
    }

    /**
     * Edit Testbed function
     */

    editTestBed() {
        this.dataService.loading.next(true);
        this.selectedTestbed.variables = this.editVariableForm.get('variables').value;
        delete this.selectedTestbed.allNodes;


        this.sub5 = this.testbedService.updateTestbedSettings( this.selectedTestbed).subscribe(
            data => {
                this.dataService.loading.next(false);
                if (data) {
                    this.dataService.getTestBedData().next(data);
                    const barRef = this.bar.open('TestBed is Configured  Succesfully', 'OK', {
                        duration: 5000
                    });
                    this.goBack();

                }
            },
            error => {
                this.dataService.loading.next(false);
                const barRef = this.bar.open('Error Configuring Testbed', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    /**
     * Cancel configure device
     */
    goBack() {
        this.location.back();
    }

    /**
     * Gets variables of selected testbed
     */
    getVariablesofTestbed() {
        const availableVariables: any[] = this.selectedTestbed.variables;
        const temp = new UntypedFormArray([]);
        for (let i = 0; i < availableVariables.length; i++) {
            this.flag = false;
            const tempFormGroup: UntypedFormGroup = new UntypedFormGroup({
                variableId: new UntypedFormControl(availableVariables[i].variableId, Validators.required),
                variableValue: new UntypedFormControl(availableVariables[i].variableValue, Validators.required)
            });
            temp.push(tempFormGroup);
        }
        this.editVariableForm = new UntypedFormGroup({
            variables: temp
        });
        this.allTestbedSelectedVariables = this.getAllSelectedVariables();
        this.sub6 = this.editVariableForm.get('variables').valueChanges.subscribe(value => {
            this.allTestbedSelectedVariables = this.getAllSelectedVariables();
        });
    }

    /**
     * Add New Variable function
     */

    addNewVariable() {
        const formAry = this.editVariableForm.get('variables') as UntypedFormArray;
        formAry.push(
            new UntypedFormGroup({
                variableId: new UntypedFormControl(null, Validators.required),
                variableValue: new UntypedFormControl(null, Validators.required)
            })
        );
        this.flag = false;
    }

    /**
     * Delete function for delete selected variable
     * @param k .
     */

    deleteVariableValue(k) {
        const variableArray = this.editVariableForm.get('variables') as UntypedFormArray;
        variableArray.removeAt(k);
        if (variableArray.length === 0) {
            this.flag = true;
        }
    }

    /**
     * Vendor validation function
     * @param data .
     * @param vendor .
     */

    checkVendor(data, vendor) {
        if (data.checked) {
            this.displayVendors.push(vendor);
            this.hideVendors = _.difference(this.allVendorName, this.displayVendors);
            this.displayModels = _.union(this.displayModels, this.vendorModelData[vendor]);
            this.hideModels = _.difference(this.allModelNames, this.displayModels);
        } else {
            this.displayVendors.splice(this.displayVendors.indexOf(vendor), 1);
            this.displayModels = _.difference(this.displayModels, this.vendorModelData[vendor]);
            this.hideModels = _.difference(this.allModelNames, this.displayModels);
            this.hideVendors = _.difference(this.allVendorName, this.displayVendors);
        }
    }

    /**
     * Check Model Function
     * @param data .
     * @param model .
     */

    checkModel(data, model) {
        const vendor = _.find(this.allModels, function(o) {
            return o.modelName === model;
        }).deviceVendor;
        if (data.checked) {
            this.displayVendors.push(vendor);
            this.displayVendors = _.uniq(this.displayVendors);
            this.hideVendors = _.difference(this.allVendorName, this.displayVendors);

            this.displayModels.push(model);
            this.displayModels = _.uniq(this.displayModels);
            this.hideModels = _.difference(this.allModelNames, this.displayModels);
        } else {
            // removing from display model
            this.displayModels.splice(this.displayModels.indexOf(model), 1);

            // getting all vendor for model
            const modelsOfVendor: any[] = this.vendorModelData[vendor];
            let status = false;
            for (let i = 0; i < modelsOfVendor.length; i++) {
                if (this.displayModels.indexOf(modelsOfVendor[i]) !== -1) {
                    status = true;
                }
            }
            if (!status) {
                this.displayVendors.splice(this.displayVendors.indexOf(vendor), 1);
            }
            this.hideModels = _.difference(this.allModelNames, this.displayModels);
            this.hideVendors = _.difference(this.allVendorName, this.displayVendors);
        }
    }

    /**
     * Invoked to get model and vendor function
     */

    getModelandVendor() {
        this.vendorModelData = {};
        this.allVendorName = [];
        this.allModelNames = [];
        this.allDeviceUnused.forEach(device => {
            this.allVendorName.push(device.vendor);
            this.allModelNames.push(device.model);
            if (this.vendorModelData[device.vendor]) {
                this.vendorModelData[device.vendor].push(device.model);
            } else {
                this.vendorModelData[device.vendor] = [];
                this.vendorModelData[device.vendor].push(device.model);
            }
        });

        this.allVendorName = _.uniq(this.allVendorName);
        this.allModelNames = _.uniq(this.allModelNames);
        this.displayModels = _.differenceBy(this.allModelNames, this.hideModels);
        this.displayVendors = _.differenceBy(this.allVendorName, this.hideVendors);
        this.displayVendors.forEach(ven => {
            const allModels = this.vendorModelData[ven];
            let status = false;
            allModels.forEach(element => {
                if (this.displayModels.indexOf(element) !== -1) {
                    status = true;
                }
            });
            if (!status) {
                this.checkVendor({ checked: false }, ven);
            }
        });
    }

    getAllModels() {
        this.sub7 = this.dataService.getAllModels().subscribe(model => {
            if (model) {
                this.allModels = model;
            }
        });
    }

    getAllSelectedVariables() {
        const variableArray = [];
        const variableFormArray = this.editVariableForm.get('variables') as UntypedFormArray;
        variableFormArray.controls.forEach(ele => {
            variableArray.push(ele.get('variableId').value);
        });
        return variableArray;
    }
    cancel() {
        this.goBack();
    }
    applyDevice() {
        let term = this.searchTerm;
        const data: any = [];
        if (term === '') {
            this.allDeviceUnused = this.duplicateAllDevice;
        } else {
            term = term.toLowerCase();
            for (let i = 0; i < this.allDeviceUnused.length; i++) {
                if (this.allDeviceUnused[i].deviceName.toLowerCase().includes(term)) {
                    data.push(this.allDeviceUnused[i]);
                }
            }
            this.allDeviceUnused = data;
        }
        this.validateData();
        this.getModelandVendor();
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
        if (this.tbSubscription) {
            this.tbSubscription.unsubscribe();
        }
    }

}
