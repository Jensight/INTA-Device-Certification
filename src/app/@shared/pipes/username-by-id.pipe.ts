import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'usernameById'
})
export class UsernameByIdPipe implements PipeTransform {

  transform(idValue: string, userArray: any): string {
    let returnValue = '';
    userArray.forEach(element => {
      const sdsd = element._id;
      if (sdsd === idValue) {
        returnValue = element.username;
        return;
      }
    });
    return returnValue;
  }

}
