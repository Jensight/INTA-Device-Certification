import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'variableDisable'
})
export class VariableDisable implements PipeTransform {
    transform(value: [any], allSelectedVariables: [any], index): any {
        const finalList = [];
        value.forEach(newVariable => {
            const temp = {};
            if (allSelectedVariables.indexOf(newVariable) === -1) {
                temp['value'] = newVariable;
                temp['invalid'] = false;
            } else if (index === allSelectedVariables.indexOf(newVariable)) {
                temp['value'] = newVariable;
                temp['invalid'] = false;
            } else {
                temp['value'] = newVariable;
                temp['invalid'] = true;
            }
            finalList.push(temp);
        });
        return finalList;
    }
}
