import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'timeDifference'})
export class TimeDifferencePipe implements PipeTransform {
    transform(time): any {
        const  d = Math.floor(time/86400),
        h = ('0'+Math.floor(time/3600) % 24).slice(-2),
        m = ('0'+Math.floor(time/60)%60).slice(-2),
        s = ('0' + time % 60).slice(-2);
        const data = (d > 0 ? d + 'd ' : '') + (Number(h) > 0 ? h + 'h ' : '') + (Number(m) > 0 ? m + 'm ' : '')+ (Number(s) > 0 ? s + 's ' : '');
        console.log("data>>>>", data, time);
        console.log("d>>>>", d, ">>>>h>>>", h, ">>>>m>>>",m, ">>>>s>>>", s);
        if(!data){
            return time + 's'
        }
        return data;
    }
}
