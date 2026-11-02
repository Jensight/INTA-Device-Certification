import { switchMap, map, mergeMap } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AddNodeComponent } from './add-node/add-node.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../../@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { TestBedService } from '../../../@core/services/test-bed.service';
import * as _ from 'lodash';
import { EditNodeComponent } from './edit-node/edit-node.component';
import { DisplayNameComponent } from '../../../@shared/components/display-name-component/display-name.component';
import { DeviceInventoryService } from '../../../@core/services/device-inventory.service';
import { ApiService } from '../../../@core/services/api.service';
import { APIInventoryDeleteComponent } from '../../../@shared/components/api-inventory-delete/api-inventory-delete.component';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { TestbedlistPopupComponent } from 'src/app/testbedlist-popup/testbedlist-popup.component';

@Component({
    selector: 'app-testbed-node',
    templateUrl: './nodes.component.html',
    styleUrls: ['./nodes.component.scss']
})
export class NodeComponent implements OnInit, OnDestroy {
    public selectedTeam;
    teamSubsciption;
    allNodes = [];
    public allProfiles = [];
    private allTestBed = [];
    allAPI = [];

    // Subscriptions
    dataSubscription;
    dataSubscription1;
    dataSubscription2;
    dInventorySubscription;
    testBedSubscription;
    apiSubscription;
    deleteNodeValue:boolean=false;
    public settings = {
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Nodes Found',
        pager: {
            perPage: 10
        },
        mode: 'external',
        actions: {
            add: false,
            edit: true,
            delete:this.deleteNodeValue,
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
            nodeName: {
                title: 'Network Element Name',
                type: 'custom',
                width: '350px',
                class: 'text-center',
                renderComponent: ToolTipDisplayComponent,
                componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
                    ToolTipDisplayComponent.componentInit(instance, cell, 65);
                  },
                valuePrepareFunction: data => {
                    return data;
                },
                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;
                    if (a.localeCompare(b) < 0) {
                        return -1 * direction;
                    }
                    if (a.localeCompare(b) > 0) {
                        return direction;
                    }
                    return 0;
                },

            },
            profileId: {
                title: 'Profile Name',
                type: 'custom',
                width: '300px',
                class: 'text-center',
                renderComponent: DisplayNameComponent,
                componentInitFunction: (instance: DisplayNameComponent, cell: Cell) => {
                    DisplayNameComponent.componentInit(instance, cell, this.allProfiles, 'profileId', 'profileName', 60);
                },
            
                valuePrepareFunction: data => {
                    return data;
                },

                compareFunction: (direction: any, temp1: any, temp2: any) => {
                    var a = temp1;
                    var b = temp2;

                    if (this.getProfileFromId(a).localeCompare(this.getProfileFromId(b)) < 0) {
                        return -1 * direction;
                    }
                    if (this.getProfileFromId(a).localeCompare(this.getProfileFromId(b)) > 0) {
                        return direction;
                    }
                    return 0;
                },
                filterFunction: (cell: any, search: string): boolean => {
                    let id = cell
                    console.log("cell", cell);
                    console.log("search", search);
                    var st = this.getProfileFromId(id)
                    console.log("st", st);
                    if (st.toLowerCase().includes(search.toLowerCase())) {

                        return true;
                    } else {
                        return false;
                    }
                },
            },
            nodeCount: {
                title: 'Testbed Count',
                type: 'custom',
                width: '150px',
                class: 'text-center',
                valuePrepareFunciton: value => {
                    return value;             
                },
                resetText: Number,
                renderComponent: TestbedlistPopupComponent,
                componentInitFunction: (instance: TestbedlistPopupComponent, cell: Cell) => {
                    TestbedlistPopupComponent.componentInit(instance, cell, 100, 'node');
                  },
            }
        }
    };
    source: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    permissionDenied: boolean = false;
    constructor(
        private dInventoryService: DeviceInventoryService,
        private dialog: MatDialog,
        private dataService: DataService,
        private testBedService: TestBedService,
        private apiService: ApiService,
        private snackBar: MatSnackBar
    ) { 
        this.deleteNodeValue=this.dataService.deleteActions();
        this.settings.actions.delete = this.deleteNodeValue;
        this.settings = Object.assign({}, this.settings);
        this.source = new LocalDataSource();
        this.loadDatas();
         if (this.dataService.getCurrentUser()['role'] === 'guest') {
            this.permissionDenied = true;
            this.settings.actions.edit = false;
            this.settings.actions.delete = false;
        }
    }

    ngOnInit() {
        this.teamSubsciption = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.getDeviceProfile();
                this.getAPIData();
            }
        });

        this.dataSubscription2 = this.dataService
            .getTestBed()
            .pipe(
                switchMap(data => {
                    return this.dataService.getNodes().pipe(
                        map(data1 => {
                            return { tb: data, node: data1 };
                        })
                    );
                }),
                switchMap(tbNodeData => {
                    return this.dataService.getAllAPI().pipe(
                        map(apiData => {
                            return { ...tbNodeData, apiData };
                        })
                    );
                })
            )
            .subscribe(data => {
                if (
                    data &&
                    data['tb'] !== null &&
                    data['node'] !== null &&
                    data['apiData'] !== null
                ) {
                    const filterRemoveNode = data['node'].slice().filter(item=> (item.nodeName!=='ReturnValX' && item.nodeName!=='Text Value'));
                    this.allNodes = filterRemoveNode;
                    this.allTestBed = data['tb'];
                    this.allAPI = data['apiData'];
                    this.allNodes.forEach(value => {
                        value['nodeCount'] = 0;
                    });
                 
                    this.countNode();
                    this.countNodeAPI();
                    this.dataService.getAllNodesDetails().next(this.allNodes);
                    this.getTestbedsName(this.allNodes);
                    //   this.source.load(this.allNodes);
                }
                
            });

        this.dataSubscription1 = this.dataService
            .getAllProfiles()
            .subscribe(profile => {
                if (profile) {
                    this.allProfiles = profile;
                }
            });

        //Sort Data
        const sortData = this.dataService.getNodeSort();  
        if(sortData){
        this.source.setSort(sortData);
        }
    }

    private async loadDatas() {
        const data = await this.dataService.getNodeSort();
        if(data){
        this.source.load(data);
      }
    }

    /**
     * Set Sort Data
     */

    setSortData() {
        this.dataService.storeNodeSort(this.source.getSort());
    }
 
    getTestbedsName(allNodesList) {

        allNodesList.forEach(node => {
            node.testBeds = node.testBeds ? node.testBeds : [];
            this.allTestBed.forEach(testbed => {
                const nd = _.find(testbed.nodes, { nodeId: node._id });
                if (nd) {
                    node.testBeds.push(testbed.testBedName);
                }
                node.testBeds = _.uniq(node.testBeds);
            });
        });
        allNodesList.forEach((value1) => {
            const nameVal = [];
            let i = 0;
            value1.testBeds.forEach((ttbd) => {

                nameVal.push({
                    No: i + 1,
                    'testBedName': ttbd,
                });
            });
            value1['testBedList'] = nameVal;

        });
        this.source.load(allNodesList);

    }
    /**
     * Get Profile Details from Id
     * @param id .
     */
    getProfileFromId(id) {
        // return _.filter(this.allProfiles, function (data) {
        //     return data['_id'] === id;
        // })[0]['profileName'];
        if(id){
            const dt =_.filter(this.allProfiles,(data) =>{
                return data['_id'] == id;
            
            });
            const profileName =dt[0]['profileName'];
            return profileName;

        }
        else{
            return 'NA';

        }
    }
   
    /**
     * Get Device Profile Function
     */
    getDeviceProfile() {
        this.dInventorySubscription = this.dInventoryService
            .getAllData()
            .subscribe(data => {
                if (data) {
                    this.dataService.getDeviceInventoryData().next(data);
                    this.loadData();
                }
            });
    }

    /**
     * Invoked to load Data from data services
     */

    loadData() {
        this.testBedSubscription = this.testBedService
            .getTestBed()
            .subscribe(data => {
                if (data) {
                    this.dataService.getTestBedData().next(data);
                }
            });
    }

    /**
     * Invoked to open edit node form
     * @param event .
     */

    editNode(event) {
        this.dialog.open(EditNodeComponent, {
            width: '400px',
            data: {
                selectedTeam: this.selectedTeam,
                data: _.cloneDeep(event.data)
            }
        });
    }

    /**
     * Invoked to open add node form
     */

    addNode() {
        this.dialog.open(AddNodeComponent, {
            width: '400px',
            data: this.selectedTeam,
            panelClass: 'dynamic-theme'
        });
    }

    ngOnDestroy() {
        if (this.dInventorySubscription) {
            this.dInventorySubscription.unsubscribe();
        }
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
        }
        if (this.dataSubscription1) {
            this.dataSubscription1.unsubscribe();
        }
        if (this.dataSubscription2) {
            this.dataSubscription2.unsubscribe();
        }
        if (this.testBedSubscription) {
            this.testBedSubscription.unsubscribe();
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
     * Node Count Function
     */

    countNode() {
        this.allTestBed.forEach(tbData => {

            tbData['nodes'].forEach(element => {
                const selectedNode = _.findIndex(this.allNodes, {
                    _id: element['nodeId']
                });
                if (selectedNode > -1) {
                    this.allNodes[selectedNode]['nodeCount']++;
                }
            });
        });
    }

    /**
     * Count API's available in the node
     */

    countNodeAPI() {
        this.allNodes.forEach((node, index) => {
            node.count = 0;
            node.target = [];
            //  node['testBedList'] = [];
            //  let profileId = node['profileId'];

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
                // if (nodeFound) {
                //     break;
                // }
            }
        //  console.log("node",node, node['profileId']);
        // node['testBedList'] = this.getNameofProfile(profileId);
        });
    }

    /**
     * Get API Data will get API Details
     */

    getAPIData() {
        this.apiSubscription = this.apiService
            .getAllData()
            .subscribe(data => {
                if (data) {
                    this.dataService.getAPIData().next(data);
                }
            });
    }

    /**
     * Node delete confirmation API
     * @param deleteEvent .
     */

    deleteNodeConfirmation(deleteEvent) {
        const dialogRef = this.dialog.open(APIInventoryDeleteComponent, {
            width: '400px',
            data: {
                name: 'Node',
                successText: `Deleting will remove the Network Element and this action can't be reversed.
                Are you want to Proceed?`,
                action: 'Delete',
                errorText: `Cannot Delete Network Element as ${deleteEvent.data.count
                    } API(s) using this Network Element. Edit/Remove those API(s) to proceed. `,
                data: deleteEvent.data,
                targetName: 'API',
                targetFields: ['apiId', 'apiName']
            },
            minWidth: '700px',
            panelClass: 'app-full-bleed-dialog'
        });
        this.sub1 = dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                this.deleteNode(deleteEvent);
            }
        });
    }

    /**
     * Delete Node Function
     */

    deleteNode(node) {
        this.dataService.loading.next(true)
        this.sub2 = this.testBedService
            .deleteNode( node.data)
            .subscribe(
                result => {
                    this.dataService.loading.next(false)
                    if (result) {
                        this.dataService.getTestBedData().next(result);
                        this.snackBar.open('Network Element Deleted Successfully', 'OK', {
                            duration: 5000
                        });
                    }
                },
                error => {
                    this.dataService.loading.next(false)
                    this.snackBar.open('Error Deleting Network Element', 'Try Again', {
                        duration: 5000
                    });
                }
            );
    }
}
