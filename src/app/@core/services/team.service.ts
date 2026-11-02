import { DataService } from './data.service';
import { SERVER } from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TeamService {
    private allTeams;
    public selectedTeam;
    constructor(private http: HttpClient) {}

    getAllTeams() {
        return this.http.get(SERVER + 'user/settings');
    }

    deleteTeam(settingsObject) {
        return this.http.post(SERVER + 'team/delete' , settingsObject);
    }

    updateTeam(settingsObject) {
        return this.http.put(SERVER + 'team/update' , settingsObject);
    }

    addTeam(settingsObject) {
        return this.http.post(SERVER + 'team/add' , settingsObject);
    }
}
