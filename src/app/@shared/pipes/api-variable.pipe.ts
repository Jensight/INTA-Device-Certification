import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'variableValue'
    // pure: false
})
export class VariableValue implements PipeTransform {
    transform(value: any, formValue: any, allVaribaleArray, allVariableValue): any {
        if (formValue && allVariableValue && allVaribaleArray.length > 0) {
            return Object.keys(allVariableValue[allVaribaleArray.indexOf(formValue)]);
        } else {
            return [];
        }
    }
}
