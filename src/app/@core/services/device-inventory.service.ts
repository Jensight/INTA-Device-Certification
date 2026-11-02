import { Injectable } from '@angular/core';
import { SERVER } from '../../models/config';
import { HttpClient } from '@angular/common/http';
import {  BehaviorSubject } from 'rxjs';

@Injectable()
export class DeviceInventoryService {
    constructor(private http: HttpClient) {}
    public selectedDevice = new BehaviorSubject(null);
    public selectedProfile = new BehaviorSubject(null);
    public selectedModel = new BehaviorSubject(null);
    // get all data from db
    getAllData(): any {
        return this.http.get(SERVER + 'device/alldata/');
    }

    addNewVendor( vendor): any {
        return this.http.post(SERVER + 'device/vendor/add/', vendor);
    }

    deleteVendor(vendor): any {
        return this.http.post(SERVER + 'device/vendor/delete/', vendor);
    }

    editVendor(updateEdit): any {
        return this.http.put(SERVER + 'device/vendor/edit/',updateEdit);
    }

    // Device Profile Add , Edit, delete

    addNewProfile(profile): any {
        return this.http.post(SERVER + 'device/profile/add/', profile);
    }

    editDeviceProfile(profileDetails): any {
        return this.http.put(SERVER + 'device/profile/edit/', profileDetails);
    }

    deleteProfile(profile): any {
        return this.http.post(SERVER + 'device/profile/delete/', profile);
    }

    // Model Add, Edit , Delete

    addNewModel(model): any {
        return this.http.post(SERVER + 'device/model/add/', model);
    }

    editModel( model): any {
        return this.http.put(SERVER + 'device/model/edit/', model);
    }

    deleteModel(model): any {
        return this.http.post(SERVER + 'device/model/delete/' , model);
    }

    // Add Devices
    addDevice(deviceDetails): any {
        return this.http.post(SERVER + 'device/add/', deviceDetails);
    }

    editDevice(deviceDetails): any {
        return this.http.put(SERVER + 'device/edit/', deviceDetails);
    }

    pairDevice(deviceDetails): any {
        return this.http.put(SERVER + 'device/paired/' , deviceDetails);
    }
    pairDeviceToTestbed(deviceDetails): any {
        return this.http.put(SERVER + 'device/paired/testbed' , deviceDetails);
    }

    deleteDevice(deviceId): any {
        return this.http.post(SERVER + 'device/delete/', deviceId);
    }

    editVariable(variable): any {
        return this.http.put(SERVER + 'device/change/variable/', variable);
    }

    deleteVariable(variable): any{
        return this.http.put(SERVER + 'device/delete/variable/', variable);
    }

    deleteVariableGroup(variable): any{
        return this.http.put(SERVER + 'device/delete/group/', variable);
    }

    checkDeviceStatus(deviceDetails){
        return this.http.post(SERVER + 'device/checkDeviceStatus/', deviceDetails);
    }

    rebootDevice(deviceDetails){
        return this.http.post(SERVER + 'device/rebootDevice/', deviceDetails);
    }

    updateDeviceLabSetup(deviceDetails){
        return this.http.post(SERVER + 'device/updateDeviceLabSetup/', deviceDetails);
    }
}
