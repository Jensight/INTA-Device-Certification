import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../../../@core/services/data.service';
import { UserService } from '../../../../../@core/services/user.service';
import * as _ from 'lodash';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { LocalDataSource } from 'angular2-smart-table';
import { switchMap, map, mergeMap } from 'rxjs/operators';
import { NameFromIdPipe } from '../../../../../@shared/pipes/name-from-id.pipe';
import { TestbedConfigureCheckPipe } from '../../../../../@shared/pipes/testbed-configure-check.pipe';
@Component({
  selector: 'app-testbed-tab',
  templateUrl: './testbed-tab.component.html',
  styleUrls: ['./testbed-tab.component.scss']
})
export class TestbedTabComponent implements OnInit {

  displayedColumns: string[] = ['select','nodeName','profileName','count'];
  dataSource: MatTableDataSource<any[]>;
  selection = new SelectionModel<any[]>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  tab='Network Element'
  update=true
  iconActive=false
  nodes=[]
  testbedProfile=[]
  testbed=[]
  devProfile=[]
  filterSelectObj: { name: string; columnProp: string; }[];
  selectedTab: string;

  constructor(
    private dataService: DataService, 
    private userService: UserService,
    private testbedConfig: TestbedConfigureCheckPipe,
    private nameFromId: NameFromIdPipe,
    ) { }

  ngOnInit(): void {
    this.getData()
    this.dataSource.paginator = this.paginator;
  }

  getData() {

    this.dataService.getAllProfiles().subscribe(profile=>{
        this.devProfile=profile
    })

    this.dataService
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
      let nodes=[]
        if (
            data &&
            data['tb'] !== null &&
            data['node'] !== null &&
            data['apiData'] !== null
        ) {
            const filterRemoveNode = data['node'].slice().filter(item=> (item.nodeName!=='ReturnValX' && item.nodeName!=='Text Value'));
            nodes = filterRemoveNode;
            this.nodes=nodes
            this.testbed = data['tb'];
                    this.nodes.forEach(value => {
                        value['count'] = 0;
                        this.devProfile.forEach((prof)=>{
                          if(prof._id==value.profileId){
                            value.profileName=prof.profileName
                          }
                        })
                    });
                    this.countNode();
        }
        this.dataSource = new MatTableDataSource(nodes);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Network Element',
            columnProp: 'nodeName',
          }, 
          {
            name: 'Profile',
            columnProp: 'profileName',
          }, 
        ]
    });

      this.dataService
      .getTestbedProfile()
      .subscribe((testbedProfile) => {
        if (testbedProfile) {
          this.testbedProfile = testbedProfile;
        }
      });
    this.testbedProfile.forEach((tbProfiles) => {
      tbProfiles['count'] = this.getCountofProfile(tbProfiles['_id']);
    });

    this.dataService.getTestBed().subscribe((testbedData) => {
      if (testbedData) {
        this.testbed = testbedData.filter(function(item){
          return !item.testBedName.toLowerCase().includes('_reused');
        })
        this.extractTestbedData();
      }
    })

    console.log(this.testbed,"testbed")
  }

  extractTestbedData() {
    this.testbed.forEach((testbed) => {

      testbed['isConfigured'] = this.testbedConfig.transform(testbed)
        ? 'Yes'
        : 'No';
      const allNodes = [];
      testbed['nodes'].forEach((element) => {
        allNodes.push(
          this.nameFromId.transform(
            element['nodeId'],
            this.nodes,
            '_id',
            'nodeName'
          )
        );
      });
      // console.log(allNodes);
      testbed['profileName'] = this.nameFromId.transform(
        testbed['testBedProfileId'],
        this.testbedProfile,
        '_id',
        'testBedProfileName'
      );

      testbed['networkElements'] = allNodes.toString();
    });
  }

  getCountofProfile(idd) {
    let countVal = 0;

    const arrayTb = this.testbed.filter((pro) => {
      return pro.testBedProfileId === idd;
    });
    countVal = arrayTb.length;
    return countVal;
  }

  countNode() {
    this.testbed.forEach(tbData => {
        tbData['nodes'].forEach(element => {
            const selectedNode = _.findIndex(this.nodes, {
                _id: element['nodeId']
            });
            if (selectedNode > -1) {
                this.nodes[selectedNode]['nodeCount']++;
            }
        });
    });
}

  setupFilter(column: string) {
    console.log(column)
    this.dataSource.filterPredicate = (d:any[], filter: string) => {
      const textToSearch = d[column] && d[column].toLowerCase() || '';
      return textToSearch.indexOf(filter) !== -1;
    };
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  
  
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.selection.selected.length >=1?this.dataService.copyCollectionButton.next(true) :this.dataService.copyCollectionButton.next(false)
      return;
    }
    this.selection.select(...this.dataSource.data);
    this.selection.selected.length >=1?this.dataService.copyCollectionButton.next(true) :this.dataService.copyCollectionButton.next(false)
    this.logSelection()
  }
  
  checkboxLabel(row?:any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.progress + 1
    }`;
  
  }
  
  logSelection() {
    
  this.selection.selected.length >=1?this.dataService.copyCollectionButton.next(true) :this.dataService.copyCollectionButton.next(false)
    console.log(this.selection.selected)
    this.dataService.getSelectedData().next(this.selection.selected)
    // this.selection.selected.forEach((s) => console.log(s));
  }
  
  tableOption(event:any){
    console.log(event.tab.textLabel)
    this.tab=event.tab.textLabel
    this.update=true
    // this.dataService.loading.next(true)
    this.selection.clear();
  
    if(event.tab.textLabel ==="Network Element"){
      this.displayedColumns=['select','nodeName','profileName','count'];
      this.dataSource = new MatTableDataSource(this.nodes);
      this.dataSource.paginator = this.paginator;
      this.filterSelectObj = [
        {
          name: 'Network Element',
          columnProp: 'nodeName',
        }, 
        {
          name: 'Profile',
          columnProp: 'profileName',
        }, 
      ]
    }
    else if(event.tab.textLabel ==="Testbed Profile"){
      this.displayedColumns=['select','testBedProfileName','count'];
      this.dataSource = new MatTableDataSource(this.testbedProfile);
      this.dataSource.paginator = this.paginator;
      this.filterSelectObj = [
        {
          name: 'Profile',
          columnProp: 'profileName',
        }, 
      ]
    }
   
    else{
      this.displayedColumns=['select','testBedName', 'profileName', 'networkElements'];
      this.dataSource = new MatTableDataSource(this.testbed);
      this.dataSource.paginator = this.paginator;
      this.filterSelectObj = [
        {
          name: 'Testbed',
          columnProp: 'testBedName',
        }, 
        {
          name: 'Testbed Profile',
          columnProp: 'testBedProfileName',
        }, {
          name: 'Network Elements',
          columnProp: 'networkElements',
        },
      ]
    }
  setTimeout(()=>{
    if(this.iconActive==true){
      this.update=false
    }
    else{
    this.update=true
    }
    this.dataSource.sort = this.sort;
    // this.dataService.loading.next(false)
  },0)
  }
}
