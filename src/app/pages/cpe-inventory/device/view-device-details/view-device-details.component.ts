import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'app-view-device-details',
    templateUrl: './view-device-details.component.html',
    styleUrls: ['./view-device-details.component.scss']
})
export class ViewDeviceDetailsComponent implements OnInit, OnChanges {
    @Input() deviceData;
    deviceDataKeys = [];
    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes:SimpleChanges){
       if(changes['deviceData'] && changes['deviceData'].currentValue){
            this.deviceDataKeys = Object.keys(changes['deviceData'].currentValue);
            _.remove(this.deviceDataKeys, function(keyValue) {
                return _.indexOf(['_id', 'profileId', 'deviceName', 'createdAt', 'updatedAt', 'reservedBy','reservedTill','reservationType','reservedAt'], keyValue) !== -1;
            });
       }
    }
}
