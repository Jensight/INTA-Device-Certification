import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { AddNodeComponent } from '../add-node/add-node.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../../@core/services/data.service';
import { TestBedService } from '../../../../@core/services/test-bed.service';

@Component({
    selector: 'app-edit-node',
    templateUrl: './edit-node.component.html',
    styleUrls: ['./edit-node.component.scss']
})
export class EditNodeComponent implements OnInit, OnDestroy {
    public nodeForm: UntypedFormGroup;
    public allProfiles;
    public allNodeNames = [];

    // subscriptions
    dInventoryServiceSubscription;
    dataSubscription;
    dataSubscription1;
    testbedSubscription;
    sub1;
    sub2;
    isProfileIdHidden;
    constructor(
        public dInventoryService: DeviceInventoryService,
        public dialogRef: MatDialogRef<AddNodeComponent>,
        @Inject(MAT_DIALOG_DATA) public nodeData: { selectedTeam: string; data: any },
        public dataService: DataService,
        public testBedService: TestBedService,
        private snackBar: MatSnackBar
    ) {
        this.dInventoryServiceSubscription = this.dInventoryService
            .getAllData()
            .subscribe(data => {
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
                    this.allNodeNames.push(element['nodeName']);
                });
            }
        });
    }

    ngOnInit() {
        this.isProfileIdHidden = true;
        if(this.nodeData['data']['elementType'] === false || this.nodeData['data']['elementType'] === null){
            this.isProfileIdHidden = false;
        }
 console.log(this.isProfileIdHidden);
 
        this.nodeForm = new UntypedFormGroup({
            _id: new UntypedFormControl(this.nodeData['data']['_id']),
            nodeName: new UntypedFormControl(this.nodeData['data']['nodeName'], Validators.required),
            elementType : new UntypedFormControl(this.isProfileIdHidden),
            profileId: new UntypedFormControl(
                { value: this.nodeData['data']['profileId'], disabled: true },
                Validators.required
            )
        });


        this.sub1 = this.nodeForm.get('nodeName').valueChanges.subscribe(value => {
            if (this.allNodeNames.indexOf(value) !== -1 && value !== this.nodeData.data['nodeName']) {
                this.nodeForm.get('nodeName').setErrors({ duplicate: true });
            } else if (this.nodeForm.get('nodeName').hasError('required')) {
                this.nodeForm.get('nodeName').setErrors(null);
                this.nodeForm.get('nodeName').setErrors({ required: true });
            } else {
                this.nodeForm.get('nodeName').setErrors(null);
            }
        });
    }

    /**
     * Edit Node Function will modify node data
     */

    editNode() {
        this.dataService.loading.next(true)
        this.sub2 = this.testBedService.updateNode( this.nodeForm.getRawValue()).subscribe(
            result => {
                this.dataService.loading.next(false)
                if (result) {
                    this.dataService.getTestBedData().next(result);
                    this.snackBar.open('Network Element Updated Successfully', 'OK', {
                        duration: 5000
                    });
                    this.dialogRef.close();
                }
            },
            error => {
                this.dataService.loading.next(false)
                this.snackBar.open('Error Updateing Network Element', 'Try Again', {
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
