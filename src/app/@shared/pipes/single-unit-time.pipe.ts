import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'singleUnitTime'})
export class SingleUnitTimePipe implements PipeTransform {
    transform(time): any {
        if(time < 60){
            return {value: time, unit:'Secs'}
        }else if ((time/60) < 60){
            return {value: time/60, unit:'Mins'}
        }else {
            return {value: time/(60*60), unit:'Hrs'}
        }
    }
}
