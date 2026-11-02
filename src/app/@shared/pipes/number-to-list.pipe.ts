import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numberToList' })
export class NumberToListPipe implements PipeTransform {
    transform(value): any {
        const res = [];
        for (let i = 1; i < Number(value) + 1; i++) {
            res.push(i);
        }
        return res;
    }
}
