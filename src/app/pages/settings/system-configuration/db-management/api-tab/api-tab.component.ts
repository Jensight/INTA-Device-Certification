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

@Component({
  selector: 'app-api-tab',
  templateUrl: './api-tab.component.html',
  styleUrls: ['./api-tab.component.scss'],
 // encapsulation: ViewEncapsulation.None
})
export class ApiTabComponent implements OnInit {

  displayedColumns: string[] = ['select','vendorName', 'count'];
  dataSource: MatTableDataSource<any[]>;
  selection = new SelectionModel<any[]>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  tab='API Group'
  update=true
  iconActive=false
  apiGrp=[]
  api=[]
  filterSelectObj: { name: string; columnProp: string; }[];
  selectedTab: string;

  constructor(
    private dataService: DataService, 
    private userService: UserService,
    ) { }

  ngOnInit(): void {

    this.getData()
    this.dataSource.paginator = this.paginator;
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getargumentName(arg) {
    let arr=[]
    arg.forEach((item)=>{
      arr.push( `${item.argumentName}`)
    })
      return arr.toString()
    }

APIprofileidtoname(id:any, targetArray:any, field:any, target:any) {
  const temp = {};
  temp[field] = id;
  const data = _.find(targetArray, temp);
  return data && data[target] !== undefined ? data[target] : id;
}
  getData() {

    this.dataService.getAllAPI().subscribe(apiData => {
      if (apiData) {
          this.api = apiData;
      }
  });

    this.dataService.getAllAPIGroup().subscribe(group => {
      if (group) {          
          this.apiGrp=group
          this.displayedColumns=['select','name','primaryURL','secondaryURL','counter'];
          this.dataSource = new MatTableDataSource(group);
          this.dataSource.paginator = this.paginator;
          this.filterSelectObj = [
            {
              name: 'API Group',
              columnProp: 'name',
            }, 
          ]
      }
  });
  this.api.forEach((api)=>{
    api.grpName=this.APIprofileidtoname(api.apiGroupId,this.apiGrp,'_id','name')
    api.varName=this.getargumentName(api.arguments)
  })
  console.log(this.api)
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
  let name=[]
  if(this.tab=="API Group"){
    name=[]
    this.selection.selected.forEach((sel)=>{
      name.push(sel['_id'])
    })
    let data=this.dataService.getApiGrpId()
    data['values']=name
    console.log(data,"asdsad")
    this.dataService.getSelectedData().next([data])
  }
  else{
    this.dataService.getSelectedData().next(this.selection.selected)
  }
  // this.selection.selected.forEach((s) => console.log(s));
}

tableOption(event:any){
  console.log(event.tab.textLabel);
  this.tab=event.tab.textLabel;
  this.update=true
  // this.dataService.loading.next(true)
  this.selection.clear();

  if(event.tab.textLabel === "API Group"){
    this.displayedColumns=['select','name','primaryURL','secondaryURL','counter'];
    this.dataSource = new MatTableDataSource(this.apiGrp);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'API Group',
        columnProp: 'name',
      }, 
    ]
  }
 
  else{
    this.displayedColumns=['select','apiName', 'grpName', 'varName'];
    this.dataSource = new MatTableDataSource(this.api);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'API',
        columnProp: 'apiName',
      }, 
      {
        name: 'API Group',
        columnProp: 'grpName',
      }, {
        name: 'Arguments',
        columnProp: 'varName',
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
