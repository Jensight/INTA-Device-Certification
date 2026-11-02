import { OnDestroy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from 'src/app/@core/services/data.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToolTipDisplayComponent } from 'src/app/@shared/components/tooltip-component/tooltip.component';
import * as _ from 'lodash';
import { FeedbackService } from 'src/app/@core/services/feedback.service';
import { CloseScrollStrategy } from '@angular/cdk/overlay';
import { InformationDiaogComponent } from 'src/app/@shared/components/information-dialog/information-dialog.component';
import * as fileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { FeedbackExcelService } from '../feedback-excel.service';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Component({
    selector: 'app-feedback',
    templateUrl: './feedback.component.html',
    styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {

    public settingsData;
    private dataServiceSubscription;
    public allFeedback;
    deleteFeedbackValue: boolean = false;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/feedback/view',
            label: 'View Feedback'
        }
    ];
    public settings = {
        attr: {
            class: 'text-center custom-smart-table'
        },
        noDataMessage: 'No Feedback Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete: this.deleteFeedbackValue,
            position: 'right',
            // width: '300px'
        },
        edit: {
            editButtonContent: '<i class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i class="fa fa-trash-o"></i>',
            confirmDelete: true
        },
        columns: {
            pageName: {
                title: 'Feedback Pages',
                type: 'custom',
                width: '225px',
                class: 'text-left',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 150);
                  }
            },
            priority: {
                title: 'Feedback Priority',
                type: 'custom',
                width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 50);
                  }
            },
            feedbackDescription: {
                title: 'Feedback Description',
                type: 'custom',
                width: '275px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 50);
                  }
            },
            userCreated: {
                title: 'Created user',
                type: 'custom',
                width: '175px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 50);
                  }
            },
            status: {
                title: 'Status',
                type: 'string',
                width: '150px',
                valuePrepareFunction: data => {
                    if (data !== '') {
                        return data;
                    } else {
                        return 'NA';
                    }
                },
                filterFunction(cell?: any, search?: string): boolean {
                    const value = cell === 'A' ? 'activated' : 'deactivated';
                    if (value.toLowerCase().includes(search.toLowerCase())) {
                        return true;
                    } else {
                        return false;
                    }
                },
                class: 'text-center'
            }
        }

    };

    source: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    userData;
    batchArray = [];
    constructor(
        private snackBar: MatSnackBar,
        private dataService: DataService,
        public dialog: MatDialog,
        private router: Router,
        private feedbackService: FeedbackService,
        private excel:FeedbackExcelService
    ) {
        this.deleteFeedbackValue = this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteFeedbackValue;
        this.settings = Object.assign({}, this.settings);
    }

    ngOnInit() {
        const userDetails = this.dataService.getCurrentUser();
        this.userData = userDetails;
        this.sub5 = this.dataService.getUsers()
        console.log(this.sub5, "sub5 data")
        this.sub1 = this.dataService.getAllFeedback().subscribe(data => {
            if (data) {
                //  console.log(data,"data")
                data.forEach(res => {
                    this.sub5.forEach(res1 => {
                        if (res.createdBy == res1._id) {
                            if (res1.name?.length > 1) {
                                res.userCreated = res1.name
                            } else {
                                res.userCreated = res1.username
                            }

                        }
                    })
                });
                // if (userDetails.role !== 'admin') {
                //     const tcModule = _.filter(data, function (feedback) {
                //         return feedback.createdBy === userDetails._id;
                //     });
                //     const feedbackData = _.filter(data, function (feedback) {
                //         if (feedback.userList && feedback.userList.length > 0) {
                //             // tslint:disable-next-line: prefer-for-of
                //             for (let index = 0; index < feedback.userList.length; index++) {
                //                 if (feedback.userList[index].username === userDetails.username) {
                //                     return feedback;
                //                 }
                //             }
                //         }
                //     });
                //     const feedbackList = feedbackData.concat(tcModule);
                //     this.allFeedback = feedbackList.reverse();
                // } else {
                //     this.allFeedback = data.reverse();
                // }
                this.allFeedback = data.reverse();
                this.source.load(this.allFeedback);
            }
        });

        // Badge Count Remove
        if (userDetails.role !== 'admin') {

            this.batchArray = _.filter(this.allFeedback, function (feedback) {
                if (feedback.userList && feedback.userList.length > 0) {
                    // tslint:disable-next-line: prefer-for-of
                    for (let index = 0; index < feedback.userList.length; index++) {
                        if (feedback.userList[index].username === userDetails.username && feedback.userList[index].read === 0) {
                            return feedback;
                        }
                    }
                }
            });
        }
        // tslint:disable-next-line: prefer-for-of
        for (let indexInitial = 0; indexInitial < this.batchArray.length; indexInitial++) {
            // tslint:disable-next-line: prefer-for-of
            for (let index = 0; index < this.batchArray[indexInitial].userList.length; index++) {
                const temp = this.batchArray[indexInitial].userList[index];
                // tslint:disable-next-line: max-line-length
                if (this.batchArray[indexInitial].userList[index].username === userDetails.username && this.batchArray[indexInitial].userList[index].read === 0) {
                    temp.read = 1;
                }
            }
            this.feedbackService.updateFeedback(this.batchArray[indexInitial]).subscribe();
        }

        this.dataService.setBatchValue(0);
    }

    /**
     * Delete Confirmation function
     * After confirmation deleteTeam function will be invoked
     * @param deleteEvent .
     */

    deleteFeedbackConfirmation(deleteEvent) {

        if (this.userData.role !== 'admin') {
            this.dialog.open(InformationDiaogComponent, {
                data: {
                    title: 'Permission Denied!',
                    body:
                        'You do not have permission to delete this feedback!. Please convey via Comments.'
                },
                panelClass: 'app-full-bleed-dialog',
                width: '400px'
            });
            return;
        }



        const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
            width: '500px',
            data: {
                name: 'Feedback',
                text:
                    'Deleting will remove Feedback.' +
                    'This action can\'t be reversed. Are you sure to continue?',
                action: 'Delete'
            },
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub2 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.dataService.loading.next(true);
                this.deleteFeedback(deleteEvent);
            }
        });
    }

    /**
     * Delete feedback function to remove data from backend
     * @param event .
     */

    deleteFeedback(event) {
        this.sub3 = this.feedbackService.deleteFeedback(event.data).subscribe(
            result => {
                this.dataService.loading.next(false);
                if (result) {
                    console.log(JSON.stringify(result));
                    this.dataService.getAllFeedback().next(result);
                    this.snackBar.open('Feedback Deleted Successfully', 'OK', {
                        duration: 4000
                    });
                }
            },
            error => {
                this.snackBar.open('Some Error Occurred', 'Try Again', {
                    duration: 4000
                });
            }
        );
    }

    /**
     * Update Team function to open update form
     * @param updateEvent .
     */

    editFeedback(updateEvent) {
        this.feedbackService.selectedFeedback = _.cloneDeep(updateEvent.data);
        if (this.userData.role === 'admin') {
            this.router.navigateByUrl('/pages/settings/feedback/edit');
        } else {
            this.router.navigateByUrl('/pages/userSetting/feedback/edit');
        }

    }

    ngOnDestroy() {
        if (this.dataServiceSubscription) {
            this.dataServiceSubscription.unsubscribe();
        }
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
    }

    saveFeedbackToExcel() {
        // let feedbackExcelData = [];
        // this.allFeedback.forEach((d: any) => {
        //     let e = {
        //         'Feedback Pages': d["pageName"],
        //         'Feedback Priority': d["priority"],
        //         'Feedback Description': d["feedbackDescription"],
        //         'Created user': d["userCreated"],
        //         'Status': d["status"]
        //     }
        //     feedbackExcelData.push(e);
        // }); 
        // const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(feedbackExcelData);
        // const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
        // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        // this.saveAsExcelFile(excelBuffer, 'Feedback List')
        let header=["Feedback Pages",'Feedback Priority','Feedback Description','Created user','Status']
        this.excel.exportAsExcelFile("All Users Feedback","",header,this.allFeedback,[],"All Feedbacks","Feedbacks","")
    }

    // private saveAsExcelFile(buffer: any, fileName: string): void {
    //     const data: Blob = new Blob([buffer], {
    //         type: EXCEL_TYPE
    //     });
    //     fileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    // }

}
