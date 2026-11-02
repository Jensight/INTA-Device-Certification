import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../../../@core/services/data.service';
import { UserService } from '../../../../../@core/services/user.service';
import * as _ from 'lodash';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';


@Component({
  selector: 'app-testcase-tab',
  templateUrl: './testcase-tab.component.html',
  styleUrls: ['./testcase-tab.component.scss']
})
export class TestcaseTabComponent implements OnInit {
  displayedColumns: string[] = ['select','moduleName','count'];
  dataSource: MatTableDataSource<any[]>;
  selection = new SelectionModel<any[]>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  tab='Network Element'
  update=true
  iconActive=false
  testSet=[]
  testSuite=[]
  testGroup=[]
  testCase=[]
  filterSelectObj: { name: string; columnProp: string; }[];
  selectedTab: string;
  allAPI: any;

  constructor(
    private dataService: DataService, 
    private userService: UserService,
    ) { }

    ngOnInit(): void {
      this.getData();
      this.tab = 'Test Set';
      this.dataSource.paginator = this.paginator;
    }

    getData() {

      this.dataService.getTCModules().subscribe(modules => {
        if (modules) {
            this.testSet = modules;        
        }
    });
    this.dataService.getTestSuites().subscribe(ts => {
      if (ts) {
          this.testSuite = ts;
          this.loadModule();
          this.testSuite.forEach((tests)=>{
            tests.moduleName=this.getModuleNameFromId(tests.moduleId)
            tests.count=tests.testCases.length
          })
      }
  });
  this.dataService.getTestGroup().subscribe(allTestGroup => {
    if (allTestGroup) {
        this.testGroup = allTestGroup;
    }
});

this.dataService.getAllAPI().subscribe(apiData => {
  if (apiData) {
      this.allAPI = apiData;
  }
})

this.dataService.getTestCases().subscribe(tc => {
  if (tc) {
      this.testCase = tc
      this.loadAPIName();
      this.testCase.forEach((tc)=>{
        tc.testGroupName=this.getGroupFromId(tc.tcGroupId)
        tc.apiName=tc.apiName.toString()
      })
  }
});
this.testGroup.forEach(tg => {
  tg['count'] = _.filter(this.testCase, function (tc) {
      if (tc['tcGroupId'] === tg['_id']) {
          return tc;
      }
  }).length;
});
  console.log(this.testSet,"set")
  console.log(this.testSuite,"suite")
  console.log(this.testGroup,"grp")
  console.log(this.testCase,"case")
    }

    loadAPIName() {
      this.testCase.forEach(element => {
          const testCaseAPINames = [];
          for (let i = 0; i < element['testSteps'].length; i++) {
              // Skip comment steps - they don't have api_id
              if (element['testSteps'][i]['isComment'] === true) {
                  continue;
              }
              
              this.allAPI.forEach(apiAvailable => {
                  if (element['testSteps'][i]['api_id'] && element['testSteps'][i]['api_id'].includes(apiAvailable['_id'])) {
                      element['testSteps'][i].apiName = apiAvailable['apiName'];
                      testCaseAPINames.push(apiAvailable['apiName']);
                  }
              });
          }
          element.apiName = _.uniq(testCaseAPINames);
      });
  }

  getGroupFromId(id) {
    return _.filter(this.testGroup, function (data) {
        return data['_id'] === id;
    })[0]['testGroupName'];
}

    getModuleNameFromId(id) {
      if(typeof id == 'string') {
          return _.filter(this.testSet, function (data) {
              return data['_id'] === id;
          })[0]['moduleName'];
      } else {
          var temp = '';
          var count = 0;
          id.forEach(e => {
              _.filter(this.testSet, function(data){
                  if(data['_id'] == e) {
                      if((id.length-1) == count){
                          temp = temp + data['moduleName']
                          return temp;
                      } else {
                          temp = temp + data['moduleName'] + ', ';
                          count++;
                      }
                  }
                  
              })
          });
          return temp;
      }
      
  }

    loadModule() {
      this.testSet.forEach(module => {
          module['count'] = 0;
          this.testSuite.forEach(ele => {
              if(typeof ele['moduleId'] == 'string') {
                  if(ele['moduleId'] == module['_id']) {
                      if(module['count']) {
                          module['count'] ++;
                      } else {
                          module['count'] = 1;
                      }
                  } 
              } else {
                  ele['moduleId'].forEach(el => {
                      if(el == module['_id']) {
                          if(module['count']) {
                              module['count'] ++;
                          } else {
                              module['count'] = 1;
                          }
                      }
                  });
              }
          });

      });
      this.dataSource = new MatTableDataSource(this.testSet);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Test Set',
            columnProp: 'moduleName',
          }, 
        ]
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
      console.log(this.selection.selected)
      this.selection.selected.length >=1?this.dataService.copyCollectionButton.next(true) :this.dataService.copyCollectionButton.next(false)
      this.dataService.getSelectedData().next(this.selection.selected)
      // this.selection.selected.forEach((s) => console.log(s));
    }
    
    tableOption(event:any){
      console.log(event.tab.textLabel);
      this.tab = event.tab.textLabel;
      this.update = true;
      // this.dataService.loading.next(true)
      this.selection.clear();
    
      if(event.tab.textLabel === 'Test Set'){
        console.log(this.testSet)
        this.displayedColumns=['select','moduleName','count'];
        this.dataSource = new MatTableDataSource(this.testSet);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Test Set',
            columnProp: 'moduleName',
          }, 
        ]
      }
      else if(event.tab.textLabel === 'Test Suite'){
        this.displayedColumns=['select','testSuiteName','moduleName','count'];
        this.dataSource = new MatTableDataSource(this.testSuite);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Test Suite',
            columnProp: 'suiteName',
          }, 
          {
            name: 'Test Set',
            columnProp: 'moduleName',
          },
        ]
      }

      else if(event.tab.textLabel === 'Test Group'){
        this.displayedColumns=['select','testGroupName','count'];
        this.dataSource = new MatTableDataSource(this.testGroup);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Test Group',
            columnProp: 'testGroupName',
          }, 
        ]
      }
     
      else{
        this.displayedColumns=['select','tcName', 'testGroupName', 'apiName'];
        this.dataSource = new MatTableDataSource(this.testCase);
        this.dataSource.paginator = this.paginator;
        this.filterSelectObj = [
          {
            name: 'Testcase',
            columnProp: 'tcName',
          }, 
          {
            name: 'Test Group',
            columnProp: 'testGroupName',
          }, {
            name: 'API',
            columnProp: 'apiName',
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
