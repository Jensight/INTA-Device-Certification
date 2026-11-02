import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'deviceFilter', pure: false })
export class DeviceFilterPipe implements PipeTransform {
    transform(allDevices: any[], vendors: any[], model: any[]): any {
        const temp = [];
        for (let i = 0; i < allDevices.length; i++) {
            const device = allDevices[i];
            if (vendors.indexOf(device.vendor) !== -1 && model.indexOf(device.model) !== -1) {
                temp.push(device);
            }
        }
        return temp;
    }
}
