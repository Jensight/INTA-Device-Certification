import { NameFromIdPipe } from './../../../../@shared/pipes/name-from-id.pipe';
import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'app-view-testbed-details',
    templateUrl: './view-testbed-details.component.html',
    styleUrls: ['./view-testbed-details.component.scss'],
    providers : [NameFromIdPipe]
})
export class ViewTestbedDetailsComponent implements OnInit, OnChanges {
    @Input() testbedData;
    @Input() allDevices;
    @Input() allNodes;
    @Input() allVariables;
    testbedDataKeys = [];
    finalObj = {}
    deviceDetailObj ={}
    deviceNames = [];
    constructor(private nameFromId: NameFromIdPipe) { }

    ngOnInit(): void { }

    ngOnChanges(changes:SimpleChanges){
        const finalObject = {}
        this.deviceDetailObj ={}
        this.deviceNames = [];
        if(changes.testbedData && changes.testbedData.currentValue && this.allDevices.length >= 0 && this.allNodes.length >=0){
            const testbed = changes.testbedData.currentValue;
            finalObject['Device Count'] = testbed.nodes.length || 0;
            finalObject['Variable Count'] = testbed.variables.length||0;

            testbed.nodes.forEach(element => {
                let nodeName = this.nameFromId.transform(element.nodeId,this.allNodes,'_id', 'nodeName');
                let deviceName = this.nameFromId.transform(element.deviceId,this.allDevices,'_id', 'deviceName')
                this.deviceNames.push(deviceName);
                this.deviceDetailObj[deviceName] = _.find(this.allDevices,{_id: element.deviceId});
                finalObject[nodeName] = deviceName;
            });

            testbed.variables.forEach(variable => {
                let variableName = this.nameFromId.transform(variable.variableId,this.allVariables,'_id', 'variableName');
                finalObject[variableName] = variable.variableValue
            });
            this.finalObj = finalObject
            this.testbedDataKeys = Object.keys(finalObject);
        }
    }
}
