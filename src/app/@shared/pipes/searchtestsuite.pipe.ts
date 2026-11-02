import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchtestsuite'
})
export class SearchtestsuitePipe implements PipeTransform {

  
  transform(value: any, args: any): any {
    if(!args)return value;
    //if(args)return value;
    args = args.toLowerCase();
    var sortedArray: any[] = value.sort((n1,n2) => {
      if (n1.testSuiteName > n2.testSuiteName) {
          return 1;
      }
  
      if (n1.testSuiteName < n2.testSuiteName) {
          return -1;
      }
  
      return 0;
    });
    return sortedArray.filter(function(item){
      return item.testSuiteName.toLowerCase().includes(args);
    })

    
  }

}
