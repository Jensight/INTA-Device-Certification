import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'testbedName'
    // pure: false
})
export class TestbedNamePipe implements PipeTransform {
    transform(value: any): any {
        const keys = Object.keys(value);
        let testBedName = '';
        keys.forEach(element => {
            if (
                element !== '_id' &&
                element !== 'envVariables' &&
                element !== 'isConfigured' &&
                element !== 'name' &&
                element !== 'envVariables'
            ) {
                testBedName = element;
            }
        });
        return testBedName;
    }
}
