import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { SERVER } from './../../models/config';
@Injectable()
export class CPEInventoryService {
    constructor(private http: HttpClient, private data: DataService){
        
    }

    startCpeTelemetry( tele) {
        return this.http.post(SERVER + 'cpetelemetry/save/' , tele);
    }

    getPollingList() {
        return this.http.get(SERVER + 'cpetelemetry/getPollingList');
    }

    stopPolling(pl) {
        return this.http.post(SERVER + 'cpetelemetry/stopPolling', pl);
    }
}
