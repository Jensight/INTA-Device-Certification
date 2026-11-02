import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchtestbedpipe'
})
export class SearchtestbedpipePipe implements PipeTransform {

  
  transform(value: any, args: any): any {
    var val = [];
    value.filter(function(item){
      if(item.testBedName.toLowerCase().includes('_reused')){
        item['hide'] = true;
      } else {
        item['hide'] = false;
      }
    })
    //console.log(value);
    if(!args)return value;
    //if(args)return value;
    args = args.toLowerCase();
    var sortedArray: any[] = value.sort((n1,n2) => {
      if (n1.testBedName > n2.testBedName) {
          return 1;
      }
  
      if (n1.testBedName < n2.testBedName) {
          return -1;
      }
  
      return 0;
    });
    return sortedArray.filter(function(item){
      return item.testBedName.toLowerCase().includes(args);
    })
  }

}
