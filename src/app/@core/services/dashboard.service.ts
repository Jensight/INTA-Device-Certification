import { SERVER } from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from './data.service';

@Injectable()
export class DashboardService {
    constructor(private http: HttpClient, private data: DataService) {}

    getRegressionStatusCard(enableTeamCount) {
        const currentUser = this.data.getCurrentUser();
        return this.http.post(SERVER + 'dashboard/reg-card-status/' + enableTeamCount, currentUser);
    }
    getLastFiveRegression(data) {
        const currentUser = this.data.getCurrentUser();
        return this.http.post(SERVER + 'dashboard/last-five/regression/', data);
    }
    getRegDataBasedOnModule(module, data) {
        const currentUser = this.data.getCurrentUser();
        return this.http.post(SERVER + 'dashboard/last-five/regression/' + module, data);
    }
    getRegressionByDate(formValue) {
        return this.http.post(SERVER + 'dashboard/getRegressionsByDate/', formValue);
    }

    getReservationStatusCard(){
        return this.http.get(SERVER + 'dashboard/cpe-card-status/');
    }

    getReservationAnalysisData(){
        return this.http.get(SERVER + 'dashboard/reservation-analysis/');
    }

    getExecutionAnalysisData(){
        return this.http.get(SERVER + 'dashboard/execution-analysis/');
    }

    getDetailedExecutionAnalysisData() {
        return this.http.get(SERVER + 'dashboard/detail-execution-analysis/');
    }

    getDetailedCPERegressionAnalysis(){
        return this.http.get(SERVER + 'dashboard/cpe-analysis/');
    }

    getDetailedTestcaseAnalysis(){
        return this.http.get(SERVER + 'dashboard/tc-analysis/');
    }

    getTestcaseAnalysis(){
        return this.http.get(SERVER + 'dashboard/tc-analysis-card/');
    }

    getROIAnalysisData() {
        return this.http.get(SERVER + 'dashboard/roi-analysis/');
    }

    getROICardData(){
        return this.http.get(SERVER + 'dashboard/roi-card-status/');
    }

    // Get Users

    getUsers() {

        return this.http.get(SERVER + 'user/settings');

    }

    getDetailedExecutionAnalysisUserModelData(user, model) {
        return this.http.get(SERVER + 'dashboard/detail-exeAnalysis-userModel/' + user+ '/' +model );
    }

    getJobCount() {
        const currentUser = this.data.getCurrentUser();
        return this.http.post(SERVER + 'dashboard/reg-card-statusWithJob/' , currentUser);
    }

    getModelFWVersionCount(){
        return this.http.get(SERVER + 'dashboard/monthlyOPSKPICount/');
    }

    getFormattedData(): any{
        return this.http.get(SERVER + 'dashboard/getFormattedJobData/' );
    }

    getEnvirmentAnalysisData(data){
        return this.http.post(SERVER + 'dashboard/getEnviormentDetails/regression/', data);
    }

    getHygieneData(date) {
        const currentTime =  date.toISOString();
        return this.http.post(SERVER + "dashboard/getServerHygieneData", { time: currentTime });
    }
    getHygieneDataLatest(){
        return this.http.get(SERVER + "dashboard/getLatestServerHygieneData", );
    
    }

    getInfoLogPath() {
        return this.http.get(SERVER + "dashboard/getInfoLogPath")
    }
    getInfoLogs(index){
        return this.http.post(SERVER + `dashboard/getInfoLogs`, {index}, { responseType: 'text' });
    }
    getErrorLogs(index){
        return this.http.post(SERVER + `dashboard/getErrorLogs`, {index}, { responseType: 'text' });
    }

    getAllRegressionData( year) {
        //console.log('team,', teamName);
        const selYear = Number(year);
        const req = {year: selYear};
        return this.http.post(SERVER + 'dashboard/all-regression-data/' , req);
    }

    getAllRegressionYears(): any {
        return this.http.get(SERVER + 'dashboard/all-regression-years/');
    }
    getAudiTrilData() : any {
        return this.http.get(SERVER + 'dashboard/getAudiTrailData');
    }
}
