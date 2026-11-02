import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'nameFromId' })
export class NameFromIdPipe implements PipeTransform {
    transform(id: string, targetArray: any[], field: string, target: string): any {
        const temp = {};
        temp[field] = id;
        const data = _.find(targetArray, temp);
        return data && data[target] !== undefined ? data[target] : id;
    }
}
