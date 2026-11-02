import { SERVER } from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { id } from '@swimlane/ngx-charts';

@Injectable()
export class ReservationService {
    constructor(private http: HttpClient) {}

    getTestbedStatus(id) {
        return this.http.get(SERVER + 'reservation/'+ 'check-testbed/' + id);
    }

    reserveDevices(reservationDetails){
        return this.http.post(SERVER + 'reservation/' +'devices', reservationDetails);
    }

    getAllReservations() {
        return this.http.get(SERVER + 'reservation/' + 'getallReservarions');
    }
    getScheduledRegressions() {
        return this.http.get(SERVER + 'reservation/' +  'scheduled-regressions');
    }

    getTestCasesOfReservation(reservationId) {
        return this.http.post(SERVER + 'reservation/' +  'getTestCasesOfReservation', { reservationId });
    }

    editReservationForm(data) {
        return this.http.post(SERVER + 'reservation/' +  'update',data);
    }

    cancelReservation( id) {
        return this.http.delete(SERVER + 'reservation/' + 'cancel/' + id);
    }


    cancelScheduledRegression( id) {
        return this.http.delete(SERVER + 'reservation/' + 'cancel/scheduled-regression/' + id);
    }


    reserveTestbed( data){
        return this.http.post(SERVER + 'reservation/'  + 'testbeds', data);
    }
    unlockTestbed( data){
         return this.http.post(SERVER + 'reservation/' +  'unlock', data);
    }
    getAllReservationName() {
        return this.http.get(SERVER + 'reservation/' + '/names');
    }

    checkTestbedAvailability(data){
        return this.http.post(SERVER + 'reservation/' +   'regression-check', data);
    }

    addScheduledReservation(data){
        return this.http.post(SERVER + 'reservation/' +  'schedule-regression', data);
    }

    updateScheduledReservation( data){
        return this.http.put(SERVER + 'reservation/' +  'schedule-regression', data);
    }

    releaseDevices(data){
        return this.http.post(SERVER + 'reservation/' +  'release-device',data);
    }
    removeUnlockDeviceFromReservation(reservationId, deviceId ){
        return this.http.put(SERVER + 'reservation/' +  'unlock/'+ reservationId, deviceId )
    }
    getActiveReservationsDetails(){
        return this.http.get(SERVER + 'reservation/' +  'getallActiveReservations');
    }
}
