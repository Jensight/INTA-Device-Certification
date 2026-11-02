import { SERVER, SERVER_HTTP} from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ApiService {
    public selectedAPI = new BehaviorSubject(null);
    public selectedTeam = new BehaviorSubject(null);
    public allAPIGroup = new BehaviorSubject(null);
    public allAPIGroupName = new BehaviorSubject(null);
    public selectedAPIGroup=new BehaviorSubject(null);
    public configureAPI = new BehaviorSubject(null);
    constructor(private http: HttpClient) {}
    ping(url){
        return this.http.post(SERVER_HTTP + 'api/ping-group' , {url}, {observe : 'response'});
    }

    getAPIGroup() {
        return this.http.get(SERVER + 'api/group/get/');
    }

    addAPIGroup( apiGroup) {
        return this.http.post(
            SERVER + 'api/group/add/', apiGroup );
    }

    addAPI(api) {
        return this.http.post(SERVER + 'api/add/' , api);
    }

    getAPI() {
        return this.http.get(SERVER + 'api/get/' );
    }

    editAPIGroup(apiGroup, oldGroup) {
        return this.http.put(SERVER + 'api/group/edit/',
         {
            new: apiGroup,
            old: oldGroup
        });
    }

    editAPI( api, tbVar) {
        return this.http.put(SERVER + 'api/edit/' , {
            api: api,
            tbVar: tbVar
        });
    }

    deleteAPI( api) {
        return this.http.post(SERVER + 'api/delete/' , api);
    }

    getTestBed() {
        return this.http.get(SERVER + 'testbed/get/');
    }

    getAPIofSelectedGroup( api) {
        return this.http.post(SERVER + 'api/fromgroup/', api);
    }

    getAllData() {
        return this.http.get(SERVER + 'api/alldata' );
    }

    deleteAPIGroup(apiGroup) {
        return this.http.post(
            SERVER + 'api/group/delete/' ,
            apiGroup
        );
    }
    getPrimaryAndSecondaryURLS(urls) {
        return this.http.post(SERVER + 'api/group/updateURL/', urls);
    }

}
