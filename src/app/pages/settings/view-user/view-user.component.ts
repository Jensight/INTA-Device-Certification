import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from '../../../@core/services/data.service';
import { MatDialog } from '@angular/material/dialog';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { UserService } from '../../../@core/services/user.service';
import { ConfirmationDiaogComponent } from '../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import * as _ from 'lodash';
@Component({
    selector: 'app-view-user',
    templateUrl: './view-user.component.html',
    styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent implements OnInit, OnDestroy {
    private data;
    // deleteUserValue:boolean=false;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/settings/user/view',
            label: 'View User'
        }
    ]
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Users Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            delete:false,
            position: 'right'
            
        },
        edit: {
            editButtonContent: '<i class="fa fa-pencil"></i>'
        },
        delete: {
            deleteButtonContent: '<i class="fa fa-trash-o"></i>',
            confirmDelete: true
        },
        columns: {
            name:{
                title: 'Name',
                type: 'custom',
                // width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 60);
                  },
                  valuePrepareFunction: data => {
                    return data;
                },
            },
            username: {
                title: 'User Name',
                type: 'custom',
                // width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 60);
                  },
                valuePrepareFunction: data => {
                    return data;
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    if (a.toLowerCase().localeCompare(b.toLowerCase()) < 0) {
                        return -1 * direction;
                    }
                    if (a.toLowerCase().localeCompare(b.toLowerCase()) > 0) {

                        return direction;
                    }
                    return 0;
                }
            },
            email: {
                title: 'E-mail',
                type: 'custom',
                // width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 100);
                  }
            },
            role: {
                title: 'Role',
                type: 'custom',
                class: 'text-center',
                // width: '250px',
                 renderComponent: ToolTipDisplayComponent,
                 componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 50);
                  },
                valuePrepareFunction: data => {
                    return data.charAt(0).toUpperCase() + data.slice(1);
                }
            },
            teams: {
                title: 'Team',
                type: 'custom',
                // width: '250px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 50);
                  }
            }
        }
    };

    source: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    sub3;
    sub4;
    toggleFlag: boolean =true;
    constructor(private dataService: DataService, public dialog: MatDialog, private userService: UserService) {
        
        // this.deleteUserValue=this.dataService.deleteActions();
        // this.settings.actions.delete = this.deleteUserValue;
        this.settings = Object.assign({}, this.settings);
    }

    ngOnInit() {
        this.sub1 = this.userService.getAllusers().subscribe(
            
            settings => {
                if (settings) {
                    this.dataService.getSettingsData().next(settings[0]);
                    this.data = this.dataService.getUsers()
                    var userList = [];
                    if(this.toggleFlag == true){
                        userList = _.filter(this.data, function(user){
                            return user['status'] !== 'in-active';
                        } );

                    }
                    else{
                        userList = _.filter(this.data, function(user){
                            return user['status'] == 'in-active';
                        } );
                    }
                  
                       
                  
                    this.source.load(userList);
                }
            },
            error => {
                // console.log(error);
            }
        );

        //Sort Data
        const sortData = this.dataService.getUserSort();
        if(sortData){
            this.source.setSort(sortData);
            }
            }

    /**
     * Set Sort Data
     */

    setSortData() {
        this.dataService.storeUserSort(this.source.getSort());
    }

    /**
     * Edit User function to open edit user form
     * @param editEvent .
     */

    editUser(editEvent): void {
        // console.log(editEvent);
        const dialogRef = this.dialog.open(EditUserComponent, {
            width: '400px',
            data: editEvent.data
        });
        this.sub2 = dialogRef.afterClosed().subscribe(result => {
            this.data = this.dataService.getUsers();
            // this.toggleFlag =  true;
            console.log("toggle flag=>", this.toggleFlag);
            var userList = [];
                    if(this.toggleFlag == true){
                        userList = _.filter(this.data, function(user){
                            return user['status'] !== 'in-active';
                        } );
                        console.log("toggle flag true=>",this.toggleFlag, userList.length);
                    }
                    else{
                        userList = _.filter(this.data, function(user){
                            return user['status'] == 'in-active';
                        } );
                    }
                    console.log("user list=>",this.toggleFlag, userList.length);
            this.source.load(userList);
        });
    }

    /**
     * Delete User confirmation function
     * @param deleteEvent .
     */

   /* Removed the deleteButton in action column*/

    // deleteUserConfirmation(deleteEvent) {
    //     const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
    //         width: '400px',
    //         data: {
    //             name: 'User',
    //             text: "Deleting will remove the user and all his details. This action can't be reversed",
    //             action: 'Delete'
    //         },
    //         panelClass: 'app-full-bleed-dialog'
    //     });
    //     this.sub3 = dialogRef.afterClosed().subscribe(result => {
    //         if (result === true) {
    //             this.deleteUser(deleteEvent);
    //         }
    //     });
    // }

    /**
     * Delete User function to remove user from backend
     * @param deleteEvent .
     */

    // deleteUser(deleteEvent) {
    //      console.log(deleteEvent.data);
    //     this.sub4 = this.userService.deleteUser(deleteEvent.data).subscribe(data => {
    //         if (data) {
    //             this.dataService.getSettingsData().next(data[0]);
    //             this.data = this.dataService.getUsers();
    //             this.source.load(this.data);
    //         }
    //     });
    // } 
    toggleButtonChange(){
        console.log("togglebutton", this.toggleFlag);
        this.sub1 = this.userService.getAllusers().subscribe(
            
            settings => {
                if (settings) {
                    this.dataService.getSettingsData().next(settings[0]);
                    this.data = this.dataService.getUsers()
                    var userList = [];
                    if(this.toggleFlag == true){
                        userList = _.filter(this.data, function(user){
                            return user['status'] !== 'in-active';
                        } );

                    }
                    else{
                        userList = _.filter(this.data, function(user){
                            return user['status'] == 'in-active';
                        } );
                       
                    }
                  
                       
                  
                    this.source.load(userList);
                }
            },
            error => {
                // console.log(error);
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
    }
}
