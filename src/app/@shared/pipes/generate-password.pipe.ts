import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'generatePassword'
    // pure: false
})
export class GeneratePassword implements PipeTransform {
    password = '';
    passwordLength = 8;
    includeLetters = true;
    includeNumbers = true;
    includeSymbols = true;

    transform(): any {
        const lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
        const upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_-';

        let availableCharacters = '';

        if (this.includeLetters) {
            availableCharacters += lowerCaseLetters;
            availableCharacters += upperCaseLetters;
        }

        if (this.includeNumbers) {
            availableCharacters += numbers;
        }

        if (this.includeSymbols) {
            availableCharacters += symbols;
        }

        availableCharacters.split('');
        const generatedPassword = [];

        for (let i = 0; i < this.passwordLength; i += 1) {
            const max = availableCharacters.length;
            const ran = Math.random();
            const idx = Math.floor(ran * (max + 1));

            generatedPassword.push(availableCharacters[idx]);

        }
        this.password = generatedPassword.join('');

        return this.password;
    }
}
