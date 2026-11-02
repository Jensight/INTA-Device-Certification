import { Component, OnInit, OnDestroy } from '@angular/core';
import { AddVariablesComponent } from './add-variables/add-variables.component';
import { EditVariablesComponent } from './edit-varibales/edit-variables.component';
import * as _ from 'lodash';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../@core/services/data.service';
import { TestBedService } from '../../../@core/services/test-bed.service';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from '../../../@core/services/api.service';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';

@Component({
  selector: 'app-name',
  templateUrl: './variables.component.html',
  styleUrls: ['./variables.component.scss'],
})
export class VariablesComponent implements OnInit, OnDestroy {
  public selectedTeam;
  teamSubsciption;
  allVariables = [];
  testbedSubscription;
  dataSubscription;
  allTestBed = [];
  deleteVariablesValue: boolean = false;
  public settings = {
    attr: {
      class: 'text-center',
    },
    noDataMessage: 'No Variables Found',
    pager: {
      perPage: 10,
    },
    mode: 'external',
    actions: {
      add: false,
      delete: this.deleteVariablesValue,
      position: 'right',
    },
    edit: {
      editButtonContent: '<i class="fa fa-pencil"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-trash-o"></i>',
      confirmDelete: true,
    },
    columns: {
      variableName: {
        title: 'Variable Name',
        type: 'custom',
        width: '450px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 45);
        },
      },
      count: {
        title: 'Testbed Count',
        type: 'string',
        width: '200px',
        class: 'text-center',
        valuePrepareFunciton: (value) => {
          return 0;
        },
      },
    },
  };
  source: LocalDataSource = new LocalDataSource();
  allAPI = [];
  apiSubscription;
  sub1;
  sub2;
  constructor(
    private dInventoryService: DeviceInventoryService,
    private dialog: MatDialog,
    private dataService: DataService,
    private testBedService: TestBedService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.teamSubsciption = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.loadData();
        this.getAPIData();
      }
    });
    this.deleteVariablesValue = this.dataService.deleteActions();
    this.settings.actions.delete = this.deleteVariablesValue;
    this.settings = Object.assign({}, this.settings);
  }

  ngOnInit() {
    this.dataSubscription = this.dataService
      .getTestBed()
      .pipe(
        switchMap((data) => {
          return this.dataService.getTestbedVariables().pipe(
            map((data1) => {
              return { tb: data, tbVariables: data1 };
            })
          );
        }),
        switchMap((tbNodeData) => {
          return this.dataService.getAllAPI().pipe(
            map((apiData) => {
              return { ...tbNodeData, apiData };
            })
          );
        })
      )
      .subscribe((data) => {
        if (
          data &&
          data['tb'] !== null &&
          data['tbVariables'] !== null &&
          data['apiData'] !== null
        ) {
          this.allVariables = data['tbVariables'].slice();
          this.allAPI = data['apiData'];
          this.allTestBed = data['tb'];
          _.remove(this.allVariables, { variableName: 'Text Value' });
          _.remove(this.allVariables, { variableName: 'ReturnValX' });
          this.allVariables.forEach((value) => {
            value['count'] = 0;
          });
          this.countVariable();
          this.countNodeVariable();
          this.source.load(this.allVariables);
        }
      });

    //Sort Data
    const sortData = this.dataService.getVariableSort();
    if(sortData){
      this.source.setSort(sortData);
      }
      }

  /**
   * Set Sort Data
   */

  setSortData() {
    this.dataService.storeVariableSort(this.source.getSort());
  }

  loadData() {
    this.testbedSubscription = this.testBedService
      .getTestBed()
      .subscribe((data) => {
        if (data) {
          this.dataService.getTestBedData().next(data);
        }
      });
  }

  /**
   * Edit Variable function used to open edit variable form
   */

  editVariable(event) {
    this.dialog.open(EditVariablesComponent, {
      width: '400px',
      data: { selectedTeam: this.selectedTeam, data: _.cloneDeep(event.data) },
    });
  }

  /**
   * Add Variable function used to open add variable form
   */

  addVariable() {
    this.dialog.open(AddVariablesComponent, {
      width: '400px',
      data: this.selectedTeam,
    });
  }

  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    if (this.testbedSubscription) {
      this.testbedSubscription.unsubscribe();
    }

    if (this.teamSubsciption) {
      this.teamSubsciption.unsubscribe();
    }

    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    if (this.sub1) {
      this.sub1.unsubscribe();
    }

    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

  /**
   * Count variable function
   */

  countVariable() {
    this.allTestBed.forEach((tbData) => {
      tbData['variables'].forEach((element) => {
        const selectedNode = _.findIndex(this.allVariables, {
          _id: element['variableId'],
        });
        if (selectedNode > -1) {
          this.allVariables[selectedNode]['count']++;
        }
      });
    });
  }

  /**
   * Node Variable Count function
   */

  countNodeVariable() {
    this.allVariables.forEach((node, index) => {
      node.count = 0;
      node.target = [];

      for (const api of this.allAPI) {
        let nodeFound = false;
        for (const argument of api['arguments']) {
          for (const value of argument['argumentValue']) {
            if (value.match(new RegExp(`.*${node._id}.*`))) {
              node.count += 1;
              node.target.push(api);
              nodeFound = true;
              break;
            }
          }
          if (nodeFound) {
            break;
          }
        }
      }
    });
  }

  /**
   * API Data Function
   */

  getAPIData() {
    this.apiSubscription = this.apiService
      .getAllData()
      .subscribe((data) => {
        if (data) {
          this.dataService.getAPIData().next(data);
        }
      });
  }

  /**
   * Delete Node confirmation dialogue
   * @param deleteEvent .
   */

  deleteVariableConfirmation(deleteEvent) {
    const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
      width: '400px',
      data: {
        name: 'Variable',
        successText: `Deleting will remove the Variable  and this action can't be reversed.
                Are you want to Proceed?`,
        action: 'Delete',
        errorText: `Cannot Delete Varibale as ${deleteEvent.data.count} API(s) using this Variable. Edit/Remove those API(s) to proceed. `,
        data: deleteEvent.data,
        targetName: 'API',
        targetFields: ['apiId', 'apiName'],
      },
      minWidth: '700px',
      panelClass: 'app-full-bleed-dialog',
    });
    this.sub1 = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteNode(deleteEvent);
      }
    });
  }

  /**
   * Delete node function
   * @param node .
   */

  deleteNode(node) {
    this.dataService.loading.next(true);
    this.sub2 = this.testBedService
      .deleteNode( node.data)
      .subscribe(
        (result) => {
          this.dataService.loading.next(false);
          if (result) {
            this.dataService.getTestBedData().next(result);
            this.snackBar.open('Variable Deleted Successfully', 'OK', {
              duration: 5000,
            });
          }
        },
        (error) => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Deleting Variable', 'Try Again', {
            duration: 5000,
          });
        }
      );
  }
}
