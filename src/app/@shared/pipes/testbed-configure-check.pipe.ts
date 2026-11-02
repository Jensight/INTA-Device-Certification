import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'testbedConfigureCheck'
    // pure: false
})
export class TestbedConfigureCheckPipe implements PipeTransform {
    transform(value: any): any {
        let status = true;
        const allNodes: any[] = value['nodes'];
        allNodes.forEach(node => {
            if (!node['deviceId']) {
                status = false;
                return false;
            }
        });
        return status;
    }
}
