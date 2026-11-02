import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
    name: 'testCasePipeByGroup'
})
export class TestCasePipeByGroup implements PipeTransform {
    transform(value: [any], selectedGroupId: any): any {
        if ((selectedGroupId === '')) {
            return value;
        } else {

            const filteredTc = _.filter(value, { tcGroupId: selectedGroupId });
            return filteredTc;
        }
    }
}
