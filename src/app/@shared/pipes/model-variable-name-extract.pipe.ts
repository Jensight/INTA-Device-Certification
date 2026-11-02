import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'modelVariableExtract' })
export class ModelVariableNameExtractPipe implements PipeTransform {
    transform(id: string, allNodes: any[], allVaribles: any[]): any {
        const onlyIds = id.slice(6);
        const idList = onlyIds.split(':');
        const nodeId = idList[0];
        const variableId = idList[1];
        const node = _.find(allNodes, { _id: nodeId });
        const variable = _.find(allVaribles, { _id: variableId });
        return (node ? node['nodeName'] : nodeId) + ':' + (variable ? variable['variableName'] : variableId);
    }
}
