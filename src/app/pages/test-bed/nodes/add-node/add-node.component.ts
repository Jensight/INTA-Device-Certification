import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';
import * as _ from 'lodash';


@Component({
    selector: 'app-add-node',
    templateUrl: './add-node.component.html',
    styleUrls: ['./add-node.component.scss']
})
export class AddNodeComponent implements OnInit, OnDestroy {
    public nodeForm: UntypedFormGroup;
    public allProfiles;
    // subscriptions
    dInventoryServiceSubscription;
    dataSubscription;
    dataSubscription1;
    testbedSubscription;
    public allNodeNames = [];
    sub1;
    sub2;
    isProfileIdHidden;
    constructor(
        public dInventoryService: DeviceInventoryService,
        public dialogRef: MatDialogRef<AddNodeComponent>,
        @Inject(MAT_DIALOG_DATA) public selectedTeam: any,
        public dataService: DataService,
        public testBedService: TestBedService,
        private snackBar: MatSnackBar
    ) {
        this.dInventoryServiceSubscription = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getDeviceInventoryData().next(data);
            }
        });
        this.dataSubscription = this.dataService.getAllProfiles().subscribe(profiles => {
            if (profiles) {
                this.allProfiles = profiles;
            }
        });

        this.testbedSubscription = this.testBedService.getTestBed().subscribe(data => {
            if (data) {
                this.dataService.getTestBedData().next(data);
            }
        });

        this.dataSubscription1 = this.dataService.getNodes().subscribe(nodes => {
            if (nodes) {
                this.allNodeNames = [];
                nodes.forEach(element => {
                    if(element['nodeName']!=='ReturnValX' || element['nodeName']!=='Text Value' ){
                        this.allNodeNames.push(element['nodeName']);
                    }                    
                });
            }
        });
    }

    ngOnInit() {
        this.nodeForm = new UntypedFormGroup({
            nodeName: new UntypedFormControl(null, Validators.required),
            elementType : new UntypedFormControl(true),
            profileId: new UntypedFormControl(null, Validators.required)
        });
        this.sub1 = this.nodeForm.get('nodeName').valueChanges.subscribe(value => {
            if (this.allNodeNames.indexOf(value) !== -1) {
                this.nodeForm.get('nodeName').setErrors({ duplicate: true });
            } else if (this.nodeForm.get('nodeName').hasError('required')) {
                this.nodeForm.get('nodeName').setErrors(null);
                this.nodeForm.get('nodeName').setErrors({ required: true });
            } else {
                this.nodeForm.get('nodeName').setErrors(null);
            }
        });
    }

    showOptions(event): void {
        if(event.checked){
            this.isProfileIdHidden = false;
            this.nodeForm.get('profileId').setValidators([Validators.required]); 
            this.nodeForm.get('profileId').updateValueAndValidity();
        }else{
            this.isProfileIdHidden = true;
            this.nodeForm.get('profileId').setValidators([]);
            this.nodeForm.get('profileId').updateValueAndValidity();
        }
    }

    /**
     * Add Node Function will save data to database
     */

    addNode() {
        this.dataService.loading.next(true);

        this.sub2 = this.testBedService.addNode( this.nodeForm.value).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    this.dataService.getTestBedData().next(result);
                    this.snackBar.open('Network Element Added Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false);
                this.snackBar.open('Error Adding Network Element', 'Try Again', {
                    duration: 5000
                });
                this.dialogRef.close();
            }
        );
    }

    /**
     * Cancel Function will return to node list
     */
    cancel() {
        this.dialogRef.close();
    }
    ngOnDestroy() {
        if (this.dInventoryServiceSubscription) {
            this.dInventoryServiceSubscription.unsubscribe();
        }
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.dataSubscription1) {
            this.dataSubscription1.unsubscribe();
        }
        if (this.testbedSubscription) {
            this.testbedSubscription.unsubscribe();
        }
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }
}
