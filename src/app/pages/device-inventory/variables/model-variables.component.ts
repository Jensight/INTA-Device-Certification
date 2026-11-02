import { DeviceInventoryService } from './../../../@core/services/device-inventory.service';
import { APIInventoryDeleteComponent } from './../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ApiService } from './../../../@core/services/api.service';
import { EditVariableComponent } from './edit-variable/edit-variable.component';
import { OnDestroy } from '@angular/core';
import { EditVariableGroupComponent } from './edit-variable-group/edit-variable-group.component';
import { AddVariableComponent } from './add-variable/add-variable.component';
import { DataService } from './../../../@core/services/data.service';
import { AddVariableGroupComponent } from './add-variable-group/add-variable-group.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
@Component({
    selector: 'app-model-variables',
    templateUrl: './model-variables.component.html',
    styleUrls: ['./model-variables.component.scss']
})
export class ModelVariableComponent implements OnInit, OnDestroy {
    selectedTeam;
    searchTerm: any;
    duplicateGroup: any;
    searchTermVariable: any;
    duplicateVariable: any;
    allVariableGroup = [];
    duplicateVariableGroup = [];
    selectedGroup;
    selectedIndex;
    allVariableGroupDuplicate;
    allAPI = [];

    sub;
    sub1;
    sub2;
    sub3;
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    classNameDuplicate = ['red-color', 'orange-color', 'pink-color', 'green-color'];
    role: String;
    constructor(
        private dInventoryService: DeviceInventoryService,
        private modal: MatDialog,
        private dataService: DataService,
        private apiService: ApiService,
        private snackBar: MatSnackBar
    ) {
        this.role = this.dataService.getCurrentUser()['role'];
        
        this.sub = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.loadAPIData();
            }
        });

        this.sub1 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
                this.duplicateVariableGroup = data;
                this.setSelectedGroup();
            }
        });

        this.sub2 = this.dataService.getAllAPI().subscribe(data => {
            if (data) {
                this.allAPI = data;
                this.loadVarsData();
            }
        });
    }

    /**
     * Called to get all available device data from the backend.
     */

    loadAPIData() {
        this.sub3 = this.apiService.getAllData().subscribe(api => {
            if (api) {
                this.dataService.getAPIData().next(api);
            }
        });
    }

    ngOnInit(): void {
        this.allVariableGroup = this.allVariableGroup.sort(function (a, b) {
            let dateA: any = new Date(a.createdAt).getTime(), dateB: any = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }

    /**
     * Called to open the add variable group form
     */

    addNewGroup() {
        this.modal.open(AddVariableGroupComponent, {
            width: '400px',
            height: '240px',
            data: {
                selectedTeam: this.selectedTeam,
                allVariableGroup: this.allVariableGroup
            }
        });
     this.groupFilter();
     
    }
    groupFilter(){
    this.searchTerm='';
        if(this.searchTerm === ''){
            this.allVariableGroup=this.duplicateVariableGroup;
        }
    }
    /**
     * Called to open the variable group edit form
     * @param group .
     */

    editVariableGroup(group) {
        this.modal.open(EditVariableGroupComponent, {
            width: '400px',
            height: '240px',
            data: {
                selectedTeam: this.selectedTeam,
                allVariableGroup: this.allVariableGroup,
                selectedGroup: group
            }
        });
      this.groupFilter();
      this.searchTermVariable='';
    }

    onSelect(group, index) {
        this.searchTermVariable='';
        this.selectedGroup = group;
        this.duplicateGroup = group;
        this.duplicateVariable = JSON.parse(JSON.stringify(this.selectedGroup));
        this.selectedIndex = index;
    }

    /**
     * Called to open the variable edit form
     * @param variable .
     */

    editVariable(variable) {
        this.variableFilter();
        this.modal.open(EditVariableComponent, {
            width: '400px',
            height: '240px',
            data: {
                selectedTeam: this.selectedTeam,
                selectedGroup: this.duplicateGroup,
                selectedVariable: variable
            }
        });
    }

    /**
     * Called to load all available model variable data from API call
     */

    loadVarsData() {
        if (!this.allVariableGroupDuplicate) {
            this.dataService.getModelVariables().next(this.allVariableGroup);
            this.allVariableGroupDuplicate = _.cloneDeep(this.allVariableGroup);
            for (let index = 0; index < this.allVariableGroupDuplicate.length; index++) {
                const element = this.allVariableGroupDuplicate[index].variables;
                for (let j = 0; j < element.length; j++) {
                    const vars = element[j];
                    for (let k = 0; k < this.allAPI.length; k++) {
                        const api = this.allAPI[k].arguments;
                        for (let l = 0; l < api.length; l++) {
                            let count = 0;
                            const values = api[l].argumentValue;
                            for (let m = 0; m < values.length; m++) {
                                const args = values[m];
                                if (args.includes(vars._id)) {
                                    count++;
                                    vars.count = vars.count ? vars.count + 1 : 1;
                                    // tslint:disable-next-line: no-unused-expression
                                    vars.api;
                                    if (!vars.apis) {
                                        vars.apis = [];
                                    }
                                    vars.apis.push(this.allAPI[k]);
                                    if (!this.allVariableGroupDuplicate[index].apis) {
                                        this.allVariableGroupDuplicate[index].apis = [];
                                    }
                                    this.allVariableGroupDuplicate[index].apis.push(this.allAPI[k]);
                                    this.allVariableGroupDuplicate[index].apis = _.uniq(
                                        this.allVariableGroupDuplicate[index].apis
                                    );
                                    break;
                                }
                            }
                            if (count > 0) {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Delete Variable function used to delete a variable
     * @param variable .
     * @param i .
     */

    deleteVariable(variable, i) {
        if (!this.allVariableGroupDuplicate) {
            this.loadVarsData();
        }
        const vars = this.allVariableGroupDuplicate[this.selectedIndex].variables[i];
        let count = 0;
        if (vars && vars.count) {
            count = vars.count || 0;
        }
        let apis = [];
        if (vars && vars.apis) {
            apis = vars.apis || [];
        }


        const dialogRef = this.modal.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'Variable',
                successText: `Deleting will remove the Variable  and this action can't be reversed.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot Delete Variable as ${count} API(s) using this Variable. Edit/Remove those API(s) to proceed. `,
                data: { count, target: apis },
                targetName: 'API',
                targetFields: ['apiId', 'apiName']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.variableFilter();
        this.sub1 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.confirmDeleteVariable(variable);
            }
        });
    }

    /**
     * Confirm the dialog before deleting the variable
     * @param variable .
     */

    confirmDeleteVariable(variable) {
        this.dInventoryService.deleteVariable(variable).subscribe(allData => {
            this.dataService.loading.next(false);
            if (allData) {
                this.dataService.getDeviceInventoryData().next(allData);
                this.allVariableGroupDuplicate = null;
                this.loadVarsData();
                this.snackBar.open('Variable  Deleted Succesfully.', 'Ok', {
                    duration: 5000
                });
            } else {
                this.snackBar.open('Error Deleting Variable .', 'Try Again', {
                    duration: 5000
                });
            }
        }, error => {
            this.snackBar.open('Error Deleting Variable .', 'Try Again', {
                duration: 5000
            });
        });
    }

    /**
     * Called to delete a variable group
     * @param index .
     */

    deleteVariableGroup(index) {
        if (!this.allVariableGroupDuplicate) {
            this.loadVarsData();
        }
        const vars = this.allVariableGroupDuplicate[index];
        const count = vars.apis ? vars.apis.length : 0;
        const apis = vars.apis ? vars.apis : [];
        const dialogRef = this.modal.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'Variable Group',
                successText: `Deleting will remove the Variable Group and associated variables  and this action can't be reversed.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot Delete Variable Group as ${count} API(s) using this Variable. Edit/Remove those API(s) to proceed. `,
                data: { count, target: apis },
                targetName: 'API',
                targetFields: ['apiId', 'apiName']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.groupFilter();
        this.sub1 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.confirmDeleteVariableGroup(vars);
            }
        });
    }

    /**
     * Confirm the dialog before deleting the variable group
     * @param variable .
     */

    confirmDeleteVariableGroup(variable) {
        this.dInventoryService.deleteVariableGroup(variable).subscribe(allData => {
            this.dataService.loading.next(false);
            if (allData) {
                this.dataService.getDeviceInventoryData().next(allData);
                this.allVariableGroupDuplicate = null;
                this.loadVarsData();
                this.snackBar.open('Variable Group  Deleted Succesfully.', 'Ok', {
                    duration: 5000
                });
            } else {
                this.snackBar.open('Error Deleting Variable Group .', 'Try Again', {
                    duration: 5000
                });
            }
        }, error => {
            this.snackBar.open('Error Deleting Variable Group .', 'Try Again', {
                duration: 5000
            });
        });
    }
    variableFilter(){
        this.duplicateVariable = _.find(this.allVariableGroup, { _id: this.selectedGroup._id });
        let data=[...this.selectedGroup.variables,...this.duplicateVariable.variables];
        let resArr = [];
            data.filter(function(item){
            let i = resArr.findIndex(x => (x._id == item._id && x.variableName == item.variableName));
                 if(i <= -1){
                     resArr.push(item);
                 }
                 return null;
                });
        this.duplicateGroup.variables = resArr;
        this.searchTermVariable='';
        if(this.searchTermVariable === ''){
            this.selectedGroup.variables=this.duplicateGroup.variables;
        }

    }
    /**
     * Called to open Add variable form
     */

    addNewVariables() {
        this.variableFilter();
        this.modal.open(AddVariableComponent, {
            width: '470px',
            minHeight: '210px',
            maxHeight: '400px',
            data: {
                selectedTeam: this.selectedTeam,
                selectedGroup:this.duplicateGroup
            }
        });
       }

    /**
     * Stores the selected group
     */

    setSelectedGroup() {
        if (this.selectedGroup) {
            this.selectedGroup = _.find(this.allVariableGroup, { _id: this.selectedGroup._id });
        }
    }

    ascending() {
        this.allVariableGroup.sort((a, b) => {
            let a1 = a.groupName.toLowerCase();
            let a2 = b.groupName.toLowerCase();
            if (a1 < a2) {
                return -1;
            }
            if (a1 > a2) {
                return 1;
            }
            return 0;
        });
        //
    }
    // Descending
    descending() {
        this.allVariableGroup.sort((a, b) => {
            let a1 = a.groupName.toLowerCase();
            let a2 = b.groupName.toLowerCase();
            if (a1 > a2) {
                return -1;
            }
            if (a1 < a2) {
                return 1;
            }
            return 0;
        });
    }
    // date sorting
    date() {
        this.allVariableGroup.sort(function (a, b) {
            let dateA: any = new Date(a.createdAt).getTime(), dateB: any = new Date(b.createdAt).getTime();

            return dateA - dateB;
        });
    }
    applyFilter() {
        this.sub1 = this.dataService.getDeviceVariableGroup().subscribe(data => {
            if (data) {
                this.allVariableGroup = data;
                this.setSelectedGroup();
            }
        });
        let term = this.searchTerm;
        let data: any = [];
        if (term === '') {
            return this.allVariableGroup;
        }
        else {
            term = term.toLowerCase();
            data = this.allVariableGroup.filter(function (el: any) {
                return el.groupName.toLowerCase().includes(term);
            });
            this.allVariableGroup = data;
        }
    }

    applyFilterVariable() {
        this.duplicateVariable = _.find(this.allVariableGroup, { _id: this.selectedGroup._id });
        this.selectedGroup = JSON.parse(JSON.stringify(this.duplicateVariable));
        if(this.searchTermVariable === ''){
            return this.selectedGroup.variables; 
        }else{
        let data:any = this.selectedGroup.variables.filter((el) => {
            return el.variableName.toLowerCase().includes(this.searchTermVariable);
        });
        this.selectedGroup.variables=data;
    }
    }
    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
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
    }
}
