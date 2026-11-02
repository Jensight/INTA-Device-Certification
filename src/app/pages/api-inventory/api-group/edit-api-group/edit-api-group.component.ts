import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { DataService } from '../../../../@core/services/data.service';
import { ApiService } from '../../../../@core/services/api.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { UntypedFormGroup, UntypedFormControl, Validators, FormArray } from '@angular/forms';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '../../../../../../node_modules/@angular/router';
@Component({
    selector: 'app-edit-api-group',
    templateUrl: './edit-api-group.component.html',
    styleUrls: ['./edit-api-group.component.scss']
})
export class EditAPIGroupComponent implements OnInit, OnDestroy {
    public apiGroupForm: UntypedFormGroup;
    private allAPIGroup = [];
    private allAPIGroupName = [];
    private selectedTeam;
    private selectedAPIGroup;
    selectedAPIGroupDuplicate;
    public allAPI = [];
    public APIofGroup = [];
    public data;
    sub1;
    sub2;
    sub;
    sub3;
    sub4;
    sub5;
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
            link: '#/pages/api-inventory/group/edit',
            label: 'Edit APIGroup'
        },
      
        
       
    ];
    constructor(
        private dataService: DataService,
        private apiService: ApiService,
        private router:Router ,
        private r: ActivatedRoute,
        private snackBar: MatSnackBar,
      
    ) {
        
        
        this.sub=this.apiService.selectedAPIGroup.subscribe(tb =>{
        
            this.data=_.cloneDeep(tb);
         
            this.selectedAPIGroup=this.data;
        
         this.selectedAPIGroupDuplicate = _.cloneDeep(this.data);
         this.selectedAPIGroupDuplicate['preExecution'] = _.map(this.selectedAPIGroup['preExecution'], 'apiId');
         this.selectedAPIGroupDuplicate['postExecution'] = _.map(this.selectedAPIGroup['postExecution'], 'apiId');
        
        }
       
        
        );
        this.sub1 = this.dataService.getAllAPI().subscribe(apiData => {
            if (apiData) {
                this.allAPI = apiData;
                const tempAPi = _.filter(this.allAPI, { apiGroupId: this.selectedAPIGroup['_id'] });
                this.APIofGroup = tempAPi ? tempAPi : [];
            }
        });
        this.sub3=this.apiService.allAPIGroup.subscribe(tb =>{
            this.data=_.cloneDeep(tb);
            this.allAPIGroup=this.data;
        });
        this.sub4=this.apiService.allAPIGroupName.subscribe(tb =>{
            this.data=_.cloneDeep(tb);
            this.allAPIGroupName=this.data;
        });
        this.sub5=this.dataService.selectedTeam.subscribe(tb =>{
            this.data=_.cloneDeep(tb);
            this.selectedTeam=this.data;
        });
        

        
        this.apiGroupForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.selectedAPIGroup['_id']),
            name: new UntypedFormControl(this.selectedAPIGroup['name'], Validators.required),
            primaryURL: new UntypedFormControl(this.selectedAPIGroup['primaryURL'], Validators.required),
            secondaryURL: new UntypedFormControl(this.selectedAPIGroup['secondaryURL'], Validators.required),
            preExecution: new UntypedFormControl(_.map(this.selectedAPIGroup['preExecution'], 'apiId')),
            postExecution: new UntypedFormControl(_.map(this.selectedAPIGroup['postExecution'], 'apiId')),
            counter: new UntypedFormControl(this.selectedAPIGroup['counter'])
        });
    }

    ngOnInit() {}
    /**
     * API group name validation
     */

    apiGroupNameValidate() {
        if (
            this.allAPIGroupName.indexOf(this.apiGroupForm.get('name').value) !== -1 &&
            this.apiGroupForm.get('name').value !== this.selectedAPIGroup['name']
        ) {
            this.apiGroupForm.get('name').setErrors({ duplicateName: true });
        } else {
            if (this.apiGroupForm.get('name').hasError('required')) {
                this.apiGroupForm.get('name').setErrors({ required: true });
            } else {
                this.apiGroupForm.get('name').setErrors(null);
            }
        }
    }

    /**
     * Edit API group function
     */

    editAPIGroup() {
        this.dataService.loading.next(true)
        this.sub2 = this.apiService
            .editAPIGroup( this.apiGroupForm.value, this.selectedAPIGroupDuplicate)
            .subscribe(
                data => {
                    this.dataService.loading.next(false)
                    if (data) {
                        this.dataService.getAPIData().next(data);
                        this.snackBar.open('API Group Updated Succesfully.', 'Ok', {
                            duration: 5000
                        });
                        this.router.navigateByUrl('/pages/api-inventory/group');
                    } else {
                        this.snackBar.open('Error Updating API Group.', 'Try Again', {
                            duration: 5000
                        });
                    }
                    
                },
                error => {
                    this.dataService.loading.next(false)
                    this.snackBar.open('Error Updating API Group.', 'Try Again', {
                        duration: 5000
                    });
                   
                }
            );
    }

    

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        if (this.sub) {
            this.sub.unsubscribe();
        }
       
    }
}
