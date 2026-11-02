import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'extractAPI' })
export class ExtarctAPIPipe implements PipeTransform {
    transform(value: any[], groupId: string): any {
        const temp = value.filter(api => {
            return api['apiGroupId'] === groupId;
        });
        return temp;
    }
}
