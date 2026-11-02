import { DataService } from './data.service';
import { SERVER } from '../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class FeedbackService {
    public selectedFeedback;
    constructor(private http: HttpClient) {}

    getAllFeedback() {
        return this.http.get(SERVER + 'feedback/allFeedback/');
    }

    deleteFeedback(settingsObject) {
        return this.http.post(SERVER + 'feedback/delete/', settingsObject);
    }

    updateFeedback(settingsObject) {
        return this.http.put(SERVER + 'feedback/edit/', settingsObject);
    }

    addFeedback(settingsObject) {
        return this.http.post(SERVER + 'feedback/add/', settingsObject);
    }
}
