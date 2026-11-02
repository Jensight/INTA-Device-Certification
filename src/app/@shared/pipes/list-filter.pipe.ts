import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'filter'})
export class ListfilterPipe implements PipeTransform {
    transform(value: any[], searchString:string): any {
        if (searchString === '') {
            return value;
        } else {
            const filterList:any = [];
            value.forEach((data:string) => {
                if(data.toLowerCase().includes(searchString.toLowerCase())){
                    filterList.push(data);
                }
            });
            return filterList;
        }
    }
}
