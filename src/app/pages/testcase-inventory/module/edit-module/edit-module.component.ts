import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddModuleComponent } from '../add-module/add-module.component';
import { DataService } from '../../../../@core/services/data.service';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';


import {ErrorStateMatcher} from '@angular/material/core';

/** Error when invalid control is dirty, touched, or submitted. */

@Component({
    selector: 'app-edit-module',
    templateUrl: './edit-module.component.html',
    styleUrls: ['./edit-module.component.scss']
})
export class EditModuleComponent implements OnInit, OnDestroy {
    public moduleForm: UntypedFormGroup;
    public allModuleNames = [];
    public selectedTeam;
    public selectedModule;
    sub1;
    sub2;
    sub3;
    constructor(
        public dialogRef: MatDialogRef<AddModuleComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private dataService: DataService,
        private tcInventoryService: TestCaseInventoryService,
        private snackBar: MatSnackBar
    ) {
        this.selectedTeam = this.data['selectedTeam'];
        this.selectedModule = this.data['selectedModule'];
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
            _id: new UntypedFormControl(this.selectedModule['_id']),
            moduleName: new UntypedFormControl(this.selectedModule['moduleName'], Validators.required)
        });
        this.sub2 = this.moduleForm.get('moduleName').valueChanges.subscribe(value => {
            if (this.allModuleNames.indexOf(value) !== -1  && this.selectedModule['moduleName'] !== value) {
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
     * Edit Module Function used to modify module name
     */

    editModule() {
        this.dataService.loading.next(true)
        this.moduleForm.setErrors({ formSubbited: true });
        this.sub3 = this.tcInventoryService.edit( this.moduleForm.value).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testset Updated Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Updating Testset', 'Try Again', {
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
