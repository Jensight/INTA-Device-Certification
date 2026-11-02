import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'limitTo' })
export class LimitToPipe implements PipeTransform {
    transform(value: string, args: string): any {
        if (value) {
            const limit = args ? parseInt(args, 10) : 10;
            const trail = '...';
            return value.length > limit ? value.substring(0, limit) + trail : value;
        } else {
            return value;
        }
    }
}
