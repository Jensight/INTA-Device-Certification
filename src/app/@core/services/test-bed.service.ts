import { SERVER } from './../../models/config';
import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class TestBedService {
    constructor(private http: HttpClient) {}
    public selectedTeam = new BehaviorSubject(null);
    public selectedTestbed = new BehaviorSubject(null);
    public configureTestbed = new BehaviorSubject(null);

    addTestBed( testBed) {
        return this.http.post(SERVER + 'testbed/add/', testBed);
    }

    getTestBed() {
        return this.http.get(SERVER + 'testbed/get/' );
    }

    updateTestbedSettings( testbed) {
        return this.http.put(SERVER + 'testbed/update/', testbed);
    }

    deleteTestbed(testbedId) {
        return this.http.post(SERVER + 'testbed/delete/' , { _id: testbedId });
    }

    addNode(node) {
        return this.http.post(SERVER + 'testbed/node/add/' , node);
    }

    updateNode( node) {
        return this.http.put(SERVER + 'testbed/node/update/' , node);
    }

    deleteNode( node) {
        return this.http.post(SERVER + 'testbed/node/delete/', node);
    }

    addVaribale( variable) {
        return this.http.post(SERVER + 'testbed/variable/add/' , variable);
    }

    updateVariable( variable) {
        return this.http.put(SERVER + 'testbed/variable/update/' , variable);
    }

    deleteVarible(variable) {
        return this.http.post(SERVER + 'testbed/variable/delete/' , variable);
    }
    
    addProfile( profile) {
        return this.http.post(SERVER + 'testbed/profile/add/' , profile);
    }

    updateProfile(profile) {
        return this.http.put(SERVER + 'testbed/profile/update/' , profile);
    }

    deleteProfile(profile) {
        return this.http.post(SERVER + 'testbed/profile/delete/' , profile);
    }

    

    getAPIAllData() {
        return this.http.get(SERVER + 'api/alldata/' );
    }
}
