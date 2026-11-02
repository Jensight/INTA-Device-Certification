import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'namesFromIds' })
export class NamesFromIdsPipe implements PipeTransform {
    transform(fieldArray: any[], targetArray: any[], field: string, target: string, returnTarget: string): any {
        fieldArray.forEach(value => {
            const temp = {};
            temp[target] = value[field];
            const profile = _.find(targetArray, temp);
            value[returnTarget] = profile[returnTarget];
        });
        return fieldArray;
    }
}
