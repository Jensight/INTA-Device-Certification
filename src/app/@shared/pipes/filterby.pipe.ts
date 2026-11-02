import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
    name: 'filterBy'
})
export class FilterByPipe implements PipeTransform {
    transform(value: [any], filterId: any, filterField: any, returnAll: boolean = false): any {
       
        if (returnAll || filterId === '') {
            const filteredList = _.filter(value, (obj) => {

                return obj[filterField]

            })

            for (let index = 0; index < filteredList.length; index++) {              

                filteredList[index].index = index;

            }

           
          
            return filteredList;
        } else {
            const tempObject = {};
            tempObject[filterField] = filterId;
            const filteredList = _.filter(value, (obj) => {
                if(typeof obj[filterField] == 'string') {
                    return obj[filterField].toLowerCase().includes(filterId.toLowerCase());
                } else {
                    var count = 0;
                    var flag = false;
                    _.filter(obj[filterField], (obj1) =>{
                        if(obj1.toLowerCase().includes(filterId.toLowerCase()) == true){
                            flag = true;
                        }
                        count ++;
                        if(obj[filterField].length == count){
                            return flag;
                        }
                    })
                    return flag;   
                }
            });
            for (let index = 0; index < filteredList.length; index++) {               
                filteredList[index].index = index;
            }           
            return filteredList;
        }
    }
}
