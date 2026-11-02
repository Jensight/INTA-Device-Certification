import { SERVER } from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CommonService {
    constructor(private httpClient: HttpClient) {}
    getVersion(): any{
        return this.httpClient.get(SERVER + 'about/getVersion');
    }
    getAboutContent(): any{
        return this.httpClient.get(SERVER + 'about/getAboutContent');
    }
}
