import { Pipe, PipeTransform } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Pipe({
    name: 'encryptPassword'
    // pure: false
})
export class EncryptPassword implements PipeTransform {
    password = '';
    passwordLength = 8;
    includeLetters = true;
    includeNumbers = true;
    includeSymbols = true;

    transform(value): any {
        const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

        return CryptoJS.AES.encrypt(value, secretKey.trim()).toString();
    }
}
