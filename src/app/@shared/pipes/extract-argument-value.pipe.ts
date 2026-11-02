import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'extractArgumentValue' })
export class ExtarctAPIArgumentValuePipe implements PipeTransform {
    transform(value: string, allNodes: any[], allVariables: any[]): any {
        const splittedValue = value.split(':');
        if (splittedValue[0] === 'GLOBAL') {
            const variable = _.find(allVariables, { _id: splittedValue[1] });
            // return variable && variable['variableName'] ? splittedValue[0] + ':' + variable['variableName'] : value;
            return variable && variable['variableName'] ? variable['variableName'] : value;
        }else if (splittedValue[0] === 'ELEMENT') {
            const node = _.find(allNodes, { _id: splittedValue[1] });
            return node && node['nodeName'] ? node['nodeName'] : value;
        } else {
            const node = _.find(allNodes, { _id: splittedValue[0] });
            return node && node['nodeName'] ? node['nodeName'] + ':' + splittedValue[1] : value;
        }
    }
}
