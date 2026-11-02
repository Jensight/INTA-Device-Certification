import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'testbedSearch'
})
export class TestbedSearchPipe implements PipeTransform {
    transform(value: any[], search: string, isAvailable:boolean): any {
        var temp = value.filter(tb => {
            if(String(tb.testBedName).toLowerCase().includes(search.toLocaleLowerCase())){
                return true
            }
            // let flag = false;
        
            //     console.log("search>>>>>",search);
            //     console.log("isAvailable>>>>>",isAvailable);
            //  tb.nodes.forEach(element => {
            //     Object.values(element.device).forEach(val => {
            //         if(String(val).toLowerCase().includes(search.toLocaleLowerCase())){
            //             flag = true;
            //         }
            //     })
            // });
            //  tb.variables.forEach(element => {
            //     if(String(element.variableValue).toLowerCase().includes(search.toLocaleLowerCase())){
            //         flag = true;
            //     }
            //  })
            // return flag;
        });
        if(isAvailable){
           
           return  temp.filter(tb => {
            if(tb.available !== false){ return true;}
            });
        }
        return temp;

    }
}
