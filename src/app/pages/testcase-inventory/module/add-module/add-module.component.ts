import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';


@Component({
    selector: 'app-add-module',
    templateUrl: './add-module.component.html',
    styleUrls: ['./add-module.component.scss']
})
export class AddModuleComponent implements OnInit, OnDestroy {
    public moduleForm: UntypedFormGroup;
    public allModuleNames = [];
    sub1;
    sub2;
    sub3;
    constructor(
        public dialogRef: MatDialogRef<AddModuleComponent>,
        @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.sub1 = this.dataService.getTCModules().subscribe(modules => {
            if (modules) {
                this.allModuleNames = [];
                modules.forEach(element => {
                    this.allModuleNames.push(element['moduleName']);
                });
            }
        });
    }

    ngOnInit() {
        this.moduleForm = new UntypedFormGroup({
            moduleName: new UntypedFormControl(null, Validators.required)
        });
        this.sub2 = this.moduleForm.get('moduleName').valueChanges.subscribe(value => {
            if (this.allModuleNames.indexOf(value) !== -1) {
                this.moduleForm.get('moduleName').setErrors({ duplicate: true });
            } else {
                const allErrors = this.moduleForm.get('moduleName').errors || null;
                if (allErrors) {
                    delete allErrors['duplicate'];
                }
                this.moduleForm.get('moduleName').setErrors(allErrors);
            }
            if (value.includes(' ')) {
                this.moduleForm.get('moduleName').setErrors({ spaceAvailable: true });
            } else {
                const allErrors = this.moduleForm.get('moduleName').errors || null;
                if (allErrors) {
                    delete allErrors['spaceAvailable'];
                }
                this.moduleForm.get('moduleName').setErrors(allErrors);
            }
        });
    }

    /**
     * Add Module function to save module data to the backend using api call
     */

    addModule() {
        this.dataService.loading.next(true);
        this.moduleForm.setErrors({ formSubmited: true });
        this.sub3 = this.tcInventoryService.add( this.moduleForm.value).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testset Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Testset', 'Try Again', {
                    duration: 5000
                });
                this.dialogRef.close();
            }
        );
    }

    cancel() {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
    }
}
