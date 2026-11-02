import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { DataService } from '../../../../@core/services/data.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray } from '@angular/forms';
import { ApiService } from '../../../../@core/services/api.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '../../../../../../node_modules/@angular/router';
@Component({
    selector: 'app-add-api-group',
    templateUrl: './add-api-group.component.html',
    styleUrls: ['./add-api-group.component.scss']
})
export class AddAPIGroupComponent implements OnInit, OnDestroy {
    public apiGroupForm: UntypedFormGroup;
    public duplicateName;
    private allAPIGroup = [];
    private allAPIGroupName = [];
   allAPIGroupNames = [];
    private selectedTeam;
    sub;
    sub1;
    public data;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '/#/pages/api-inventory/',
            label: 'API Inventory'
        },
        {
            link: '#/pages/api-inventory/group/add',
            label: 'Add APIGroup'
        },
      
        
       
    ];
    constructor(
        private dataService: DataService,
        private apiService: ApiService,
        // private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router:Router ,
        private r: ActivatedRoute,
        
        // public dialogRef: MatDialogRef<AddAPIGroupComponent>,
        // @Inject(MAT_DIALOG_DATA) private data
    ) {}

    ngOnInit() {
        // this.allAPIGroup = this.data['allAPIGroup'];
        // this.selectedTeam = this.data['selectedTeam'];
        // this.allAPIGroupName = this.data['allAPIGroupName'];
        // this.apiService.configureAPI.subscribe(tb => {
        //     if (tb) {
        //         console.log(this.data)
        //          this.data=_.cloneDeep(tb);
        //         this.allAPIGroup =this.data['allAPIGroup'];
        //         this.allAPIGroupName=this.data['allAPIGroupName'];
        //         this.selectedTeam=this.data['selectedTeam'];
               
                
        //     } 
        //     else {
        //         this.router.navigate(['../'], { relativeTo: this.r });
        //     }
        // });
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        this.dataService.getAllAPIGroup().subscribe(group => {
            if (group) {
                group.forEach(apiGroup => {
                    this.allAPIGroupNames.push(apiGroup.name);
                  });
            }
        });
        this.apiGroupForm = new UntypedFormGroup({
            name: new UntypedFormControl(null, Validators.required),
            primaryURL: new UntypedFormControl(null, Validators.required),
            secondaryURL: new UntypedFormControl(null, Validators.required),
            preExecution: new UntypedFormArray([]),
            postExecution: new UntypedFormArray([]),
            counter: new UntypedFormControl(0)
        });
    }
    /**
     * Add API group using API call
     */
    addAPIGroup() {
        this.dataService.loading.next(true)
        this.sub = this.apiService.addAPIGroup(this.apiGroupForm.value).subscribe(
            data => {
                this.dataService.loading.next(false)
                if (data) {
                    this.dataService.getAPIData().next(data);
                    this.snackBar.open('API Group Added Succesfully.', 'Ok', {
                        duration: 5000
                    });
                    this.router.navigateByUrl('/pages/api-inventory/group');
                } else {
                    this.snackBar.open('Error Adding API Group.', 'Try Again', {
                        duration: 5000
                    });
                }
               
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Adding API Group.', 'Try Again', {
                    duration: 5000
                });
               
            }
        );
    }

    /**
     * API group name validation
     */

    apiGroupNameValidate(): void {
        if (this.allAPIGroupNames.indexOf(this.apiGroupForm.get('name').value) !== -1) {
            this.apiGroupForm.get('name').setErrors({ duplicateName: true });
        } else {
            if (this.apiGroupForm.get('name').hasError('required')) {
                this.apiGroupForm.get('name').setErrors({ required: true });
            } else {
                this.apiGroupForm.get('name').setErrors(null);
            }
        }
    }

    

    ngOnDestroy(): void {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        if(this.sub1){
            this.sub1.unsubscribe();
        }
    }
}
