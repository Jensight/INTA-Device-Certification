import { Pipe, PipeTransform } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Pipe({
    name: 'decryptPassword'
    // pure: false
})
export class DecryptPassword implements PipeTransform {
    password = '';
    passwordLength = 8;
    includeLetters = true;
    includeNumbers = true;
    includeSymbols = true;

    transform(value): any {
        const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

        return CryptoJS.AES.decrypt(value, secretKey.trim()).toString(CryptoJS.enc.Utf8);
    }
}
