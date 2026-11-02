import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'extractArguments' })
export class ExtarctAPIArgumentPipe implements PipeTransform {
    transform(value: string, allAPI: any[], field: string): any {
        if (allAPI.length > 0) {
            const api = _.find(allAPI, { _id: value });
            const argumentValue = _.find(api.arguments, { argumentName: field });
            return argumentValue['argumentValue'];
        } else {
            return ['null:null'];
        }
    }
}
