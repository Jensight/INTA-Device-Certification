import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({ name: 'deviceSearchPipe', pure:false })
export class DeviceSearchPipe implements PipeTransform {
    transform(value: any[], vendor: string[], model: string[], searchString: string, availability: boolean): any {
        let finalList = value;
        if (vendor.length > 0) {
            finalList = _.filter(finalList, device => {
                return vendor.indexOf(device.vendor) > -1;
            });
        }
        if (model.length > 0) {
            finalList = _.filter(finalList, device => {
                return model.indexOf(device.model) > -1;
            });
        }

        if (availability){
            finalList = _.filter(finalList , {available:true});
        }

        if(searchString !== ''){
            finalList = finalList.filter((data)=> {
                return Object.values(data).filter((val:any) => {
                    return String(val).toLowerCase().includes(searchString.toLowerCase())
                }).length > 0;
            });
        }
     return finalList;
    }
}
