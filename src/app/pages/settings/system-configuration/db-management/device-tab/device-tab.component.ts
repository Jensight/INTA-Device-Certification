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
  selector: 'app-device-tab',
  templateUrl: './device-tab.component.html',
  styleUrls: ['./device-tab.component.scss']
})
export class DeviceTabComponent implements OnInit {
  displayedColumns: string[] = ['select','vendorName', 'count'];
  dataSource: MatTableDataSource<any[]>;
  selection = new SelectionModel<any[]>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  tab='Vendor'
  devData =[];
  allDevice:any=[]
  dInventorySubscription: any;
  update=true
  singleSelected=[]
  iconActive=false
  vendor=[]
  variableData=[]
  devProfile=[]
  devModel=[]
  selectedTeam: any;
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
  getData() {

   this.dataService.getAllDevices().subscribe((data)=>{
    this.devData=data
   })

   this.dataService.getAllModels().subscribe(model => {
        if (model) {
          this.devModel = model
        }
      });

      this.dataService.getDeviceVariableGroup().subscribe(data => {
        if (data) {
          let variables=_.cloneDeep(data)
          variables.forEach(element => {
            let varName=[]
            element.variables.forEach(element1 => {
              varName.push(element1.variableName)
            });
            element.varName=varName.toString()
          });
          this.variableData=variables
          console.log(this.variableData,"123")
        }
    })

    this.dataService.getAllProfiles().subscribe(profile=>{
      if(profile){
        profile.forEach(profile => {
          const deviceCount = _.filter(this.devData, function (o) {
            if (o.profileName === profile.profileName) {
              return o;
            }
          }).length;
          profile['deviceCount'] = deviceCount;
        });
        this.devProfile=profile
      }
      console.log(this.devProfile)
    })
    
    this.dataService.getAllModels().subscribe(models => {
      if (models) {
        models.forEach(model => {
          const modelDevices = _.filter(this.devData, function (device) {
            if (device.model === model.modelName) {
              return device;
            }
          });
          model['count'] = modelDevices.length;
        });
        this.devModel=models
      }
      console.log(this.devModel)
    });

this.dataService.getAllVendors().subscribe(vendors => {
     if (vendors) {
       const duplicateVendors = _.cloneDeep(vendors);
       duplicateVendors.forEach(ven => {
         const tempVendor = {};
         tempVendor['vendorName'] = ven;
         const modelsOfVendor = _.filter(
           this.devModel,
           function (model) {
             if (model.deviceVendor === ven) {
               return model;
             }
           }
         );
         tempVendor['noModel'] = modelsOfVendor.length;
         tempVendor['count'] = modelsOfVendor.length;
         tempVendor['target'] = modelsOfVendor;
         this.vendor.push(tempVendor);
       });
       this.dataSource = new MatTableDataSource(this.vendor);
       this.dataSource.paginator = this.paginator;
     }
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
  let name=[]
  console.log(this.selection.selected)

  this.selection.selected.length >=1?this.dataService.copyCollectionButton.next(true) :this.dataService.copyCollectionButton.next(false)
  if(this.tab=="Vendor"){
    name=[]
    this.selection.selected.forEach((sel)=>{
      name.push(sel['vendorName'])
    })
    let data=this.dataService.getVendorId()
    data['values']=name
    console.log(data,"asdsad")
    this.dataService.getSelectedData().next([data])
  }
  else if(this.tab=="Device Profile"){
    name=[]
    this.selection.selected.forEach((sel)=>{
      name.push(sel['_id'])
    })
    let data=this.dataService.getDeviceProfId()
    data['values']=name
    this.dataService.getSelectedData().next([data])
  }
  else{
    this.dataService.getSelectedData().next(this.selection.selected)
  }
  
  // this.selection.selected.forEach((s) => console.log(s));
}

// clearArray(){
//   this.singleSelected=[]
//   if(this.iconActive==true){

//   }

tableOption(event:any){
  console.log(event.tab.textLabel);
  this.tab=event.tab.textLabel;
  this.update=true
  // this.dataService.loading.next(true)
  this.selection.clear();

  if(event.tab.textLabel ==="Vendor"){
    console.log("vendor",this.vendor)
   this.displayedColumns=['select','vendorName', 'count'];
    this.dataSource = new MatTableDataSource(this.vendor);
    this.dataSource.paginator = this.paginator;
  }
  else if(event.tab.textLabel ==="Device Variables"){
    console.log("variables",this.variableData)
    this.displayedColumns=['select','groupName','varName'];
    this.dataSource = new MatTableDataSource(this.variableData);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'Variable Group',
        columnProp: 'groupName',
      },
      {
        name:'Variables',
        columnProp:"varName"
      }
    ]
  }
  else if(event.tab.textLabel ==="Device Profile"){
    console.log("profile",this.devProfile)
    this.displayedColumns=['select','profileName','deviceCount'];
    this.dataSource = new MatTableDataSource(this.devProfile);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'Device Profile',
        columnProp: 'profileName',
      },
    ]
  }
  else if(event.tab.textLabel ==="Device Model"){
console.log("Model",this.devModel)
this.displayedColumns=['select','modelName', 'profileName','deviceVendor','count'];
    this.dataSource = new MatTableDataSource(this.devModel);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'Model',
        columnProp: 'modelName',
      }, {
        name: 'Profile',
        columnProp: 'profileName',
      }, {
        name: 'Vendor',
        columnProp: 'deviceVendor',
      }, 
    ]
  }
  else{
    this.displayedColumns=['select','deviceName', 'profileName', 'model', 'vendor'];
    this.dataSource = new MatTableDataSource(this.devData);
    this.dataSource.paginator = this.paginator;
    this.filterSelectObj = [
      {
        name: 'Device',
        columnProp: 'deviceName',
      }, {
        name: 'Profile',
        columnProp: 'profileName',
      }, {
        name: 'Model',
        columnProp: 'model',
      }, {
        name: 'Vendor',
        columnProp: 'vendor',
      }
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
