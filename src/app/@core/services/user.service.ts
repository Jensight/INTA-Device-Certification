import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { SERVER } from './../../models/config';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class UserService {
    constructor(
        private httpClient: HttpClient,
        private dataService: DataService
    ) { }

    getStats() {
        return this.httpClient.get(SERVER + 'user/stats');
    }

    getHelp() {
        return this.httpClient.get(SERVER + 'help-ip');
    }

    addUser(user) {
        return this.httpClient.post(SERVER + 'user/add', user);
    }

    updateUser(user) {
        return this.httpClient.put(SERVER + 'user/update', user);
    }

    deleteUser(user) {
        return this.httpClient.post(SERVER + 'user/delete', user);
    }

    getAllusers() {
        return this.httpClient.get(SERVER + 'user/settings');
    }

    updateUsers(allUsers) {
        this.dataService.setUsers(allUsers);
        return this.httpClient.put(
            SERVER + 'user/settings',
            this.dataService.getSettingsData()
        );
    }

    deleteUsers(allUsers) {
        this.dataService.setUsers(allUsers);
        return this.httpClient.put(
            SERVER + 'user/settings',
            this.dataService.getSettingsData()
        );
    }

    addSystemConf(conf) {
        return this.httpClient.post(SERVER + 'sysConfiguration/add', conf);
    }

    updateSystemConf(conf) {
        return this.httpClient.put(SERVER + 'sysConfiguration/update', conf);
    }

    copyCollection(req) {
        return this.httpClient.post(SERVER + 'sysConfiguration/copyColletion', req);
    }

    addExtraSystemConf(conf) {
        return this.httpClient.post(SERVER + 'sysConfiguration/exconfigadd', conf);
    }

    updateExtraSystemConf(conf) {
        return this.httpClient.put(SERVER + 'sysConfiguration/exconfigupdate', conf);
    }

    addLabSetConf(data) {
        return this.httpClient.post(SERVER + 'sysConfiguration/addlabsetupcon', data);
    }

    updateLabSetConf(data) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updatelabsetup', data);
    }

    addLabSetUpConfig(data) {
        return this.httpClient.post(SERVER + 'sysConfiguration/addLabSetUpConfig', data);
    }

    updateLabSetUpConfig(data) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateLabSetUpConfig', data);
    }

    getLabSetDetails() {
        return this.httpClient.get(SERVER + 'sysConfiguration/getlabsetupdetails');
    }

    deleteLabSetup(data) {
        return this.httpClient.post(SERVER + 'sysConfiguration/deletelabsetupcon', data);
    }

    addErrorCodes(data) {
        return this.httpClient.post(SERVER + 'sysConfiguration/addErrorCodescon', data);
    }

    updateErrorCodes(data) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateErrorCodes', data);
    }

    deleteErrorCodes(data) {
        return this.httpClient.post(SERVER + 'sysConfiguration/deleteErrorCodescon', data);
    }
    addDashboardConf(conf) {
        return this.httpClient.post(SERVER + 'sysConfiguration/dashboardConfigAdd', conf);
    }

    updateDashboardConf(conf) {
        return this.httpClient.put(SERVER + 'sysConfiguration/dashboardConfigUpdate', conf);
    }
   
    addJiraConfig(conf) {
        return this.httpClient.post(SERVER + 'sysConfiguration/addJiraConfig', conf);
    }

    updateJiraConfig(conf) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateJiraConfig', conf);
    }
    addMultiDeleteRegressions(conf) {
        return this.httpClient.post(SERVER + 'sysConfiguration/multideleteRegAdd', conf);
    }
    updateMultiDeleteRegressions(conf) {
        return this.httpClient.put(SERVER + 'sysConfiguration/multideleteRegUpdate', conf);
    }

    addDashboardRules(config) {
        return this.httpClient.post(SERVER + 'sysConfiguration/addDashboardRules', config);
    }

    updateDashboardRules(config) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateDashboardRules', config);
    }

    updateModelTCMatrix(data) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateModelTCMatrix', data);
    }

    updateUserTestbedAccessMatrix(data) {
        return this.httpClient.put(SERVER + 'sysConfiguration/updateUserTestbedAccessMatrix', data);
    }

    seedUserTestbedAccessMatrix(teamName) {
        return this.httpClient.put(SERVER + 'sysConfiguration/seedUserTestbedAccessMatrix', { teamName });
    }
}
