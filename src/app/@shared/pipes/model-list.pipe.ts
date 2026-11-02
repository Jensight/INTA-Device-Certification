import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
@Pipe({ name: 'modelList' })
export class ModelListPipe implements PipeTransform {
    transform(models: any[], selectedVendor: string): any {
        const modelList = _.filter(models, model => {
            return model.deviceVendor === selectedVendor;
        });
        return modelList;
    }
}
