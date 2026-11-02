import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { LocalDataSource } from 'angular2-smart-table';
import { Router, ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { ToolTipDisplayComponent } from '../../../../@shared/components/tooltip-component/tooltip.component';
import * as _ from 'lodash';
import { APINameDisplayComponent } from '../../../../@shared/components/api-name-display/api-name-display.component';
import { NodeNameDisplayComponent } from '../../../test-bed/test-bed-view/node-name-display/node-name-display.component';
import { ApiService } from 'src/app/@core/services/api.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { TestbedConfigureCheckPipe } from 'src/app/@shared/pipes/testbed-configure-check.pipe';
import { NameFromIdPipe } from '../../../../@shared/pipes/name-from-id.pipe';
import { LimitToPipe } from '../../../../@shared/pipes/limit-to.pipe';
import { TestbedNamePipe } from '../../../../@shared/pipes/testbed-name.pipe';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { min } from 'rxjs/operators';

@Component({
  selector: 'app-db-management',
  templateUrl: './db-management.component.html',
  styleUrls: ['./db-management.component.scss'],
  providers: [NameFromIdPipe,LimitToPipe,TestbedNamePipe, TestbedConfigureCheckPipe],
})

export class DbManagementComponent implements OnInit {

  dataSource: MatTableDataSource<any[]>;
  selection = new SelectionModel<any[]>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  selectedCollections: any=null;
  collectionsList: any[] = ['Devices', 'APIBank', 'TestCase', 'TestBed'];
  collectionsSet = new Map();
  disableButton:boolean = false;
  public db_management: UntypedFormGroup;
  teamList: any = [];
  sub1;
  selectedTeam: String;
  dInventorySubscription: any;
  selectedInventory = 'Inventory';
  primaryURL = null;
  secondaryURL = null;
  option:any=""
  update=true
  singleSelected=[]
  iconActive=false
  source: LocalDataSource = new LocalDataSource();
  apii: any;
  testcasee: any;
  tesbedd: any;
  loadTestbed: any;
  allNodes: any;
  selected: any;

  constructor(public dataService: DataService, private userService: UserService, private apiService: ApiService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dInventoryService:DeviceInventoryService,
    private apidata:ApiService,
    private r: ActivatedRoute,
    private tBed:TestBedService,
    private Tcase:TestCaseInventoryService,
    private nameFromId: NameFromIdPipe,
    private dialog: MatDialog,

    ) {}

  ngOnInit(): void {
    const user = this.dataService.getCurrentUser();
    if (user.teams.length > 1) {
      this.teamList = user.teams;
    };

    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
      }
    });

this.getData(this.selectedTeam)
this.getApiData(this.selectedTeam)
this.getTestBed(this.selectedTeam) 
this.getTestCaseData(this.selectedTeam)   

    this.db_management = new UntypedFormGroup({
      sourceTeam : new UntypedFormControl( this.selectedTeam,Validators.required),
      targetTeam: new UntypedFormControl(null,Validators.required),
      collectionsToCopy: new UntypedFormControl(null,Validators.required)
    });
  }


  getData(selectedteam) {
this.dInventorySubscription=this.dInventoryService.getAllData().subscribe(allData => {

        if (allData) {   
          this.dataService.getDeviceInventoryData().next(allData)
    }
    })
}
   
  getApiData(selectedTeam){
this.apii = this.apidata.getAllData().subscribe(alldata=>{
  this.dataService.getAPIData().next(alldata);

})
  }
  getTestCaseData(selected){
    
    this.testcasee = this.Tcase.getAllData().subscribe(alldata=>{
      this.dataService.getTcInventoryData().next(alldata);
    })

  }
  getTestBed(select){
    this.tesbedd = this.tBed.getTestBed().subscribe(alldata=>{
      this.dataService.getTestBedData().next(alldata);
    })

  }

  clearArray(){
    this.singleSelected = []
    this.dataService.getSelectedData().next(null)
  }
updateConfig() {
    let snackRef: MatSnackBarRef<any>;
    const urls = {
      primaryUrl: this.primaryURL,
      secondaryUrl: this.secondaryURL
    }
    this.apiService.getPrimaryAndSecondaryURLS(urls).subscribe((data: any) => {
      // console.log('data @ 385 => ', data);
        snackRef = this.snackBar.open('PrimaryURL and SecondaryURL are updated Successfully', '', {
          duration: 5000
        });
      
    }, err => {
      snackRef = this.snackBar.open('Something Went Wrong, unable to update', '', {
        duration: 5000
      });
    })


  }
  copyCollection() {
    let selectedDBCollection = ""
    this.singleSelected = []
    let formval = this.db_management.value
    this.selected = this.dataService.getSelected().subscribe(data => {

      data?.forEach(element => {
        this.singleSelected.push(element._id)
        if (element.values != undefined) {
          formval.values = element.values
        }
      });
    })

    let obj = {}

    if (this.singleSelected.length != 0 && this.iconActive == true) {
      selectedDBCollection =this.selectedCollections;
      obj[this.selectedCollections] = this.singleSelected
      this.db_management.get('collectionsToCopy').setValue([obj]);
      formval.collectionsToCopy = [obj]
    }

    else {
      obj[this.selectedCollections] = "All"
      this.db_management.get('collectionsToCopy').setValue([obj])
      formval.collectionsToCopy = [obj]
    }
    console.log(formval)
    this.dataService.getSelectedData().next(null)
    this.sub1 = this.userService
      .copyCollection(formval)
      .subscribe(
        (data) => {
          if (data) {
            console.log("Data>>>", data);
            this.snackBar.open('Copied Succesfully.', 'Ok', {
              duration: 5000,
            });
            // this.db_management.reset();
          } else {
            console.log("172>>>", data);
            this.snackBar.open('Copying Collection Failed .', 'Try again', {
              duration: 5000,
            });

          }
        },
        (error) => {
          if (selectedDBCollection == "TestCase") {
            this.errorPopUpDailogTestcase(error);
          }
          if (selectedDBCollection == "APIBank") {
            this.errorPopUpDailogApi(error);
          }
           if (selectedDBCollection == "TestBed") {
            this.errorPopUpDailogNetworkelements(error);
          }


        }
       
      );
  // setTimeout(() => {
  //   this.iconActive=false
  //   this.update=true
  //   this.selectedCollections=null
  // }, 0);
 
 }
  
  errorPopUpDailogTestcase(error) {
    console.log("207Testcase>>>", error);
    if (error['error'].TestcaseAvailable) {
      const tcid = error['error'].TestcaseAvailable[0].tcId;
      const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
        width: '500px',
        data: {
          txt: `${error['error'].message}`,
          tcName: "TestcaseAvailable:",
          tcEror: `${tcid}`,
          name: " ",
          action: " ",
          hideButtons: true
        }

      });
      // console.log(`Testcase with id ${tcId} is already available in target team`);
    } else {
      const Api = error['error'].data.api.map(api => 
        `{ API_Id:${api.API_id} , 
           APi_Name:${api.API_Name} }`).join(' , ');
      const testgroup = error['error'].data.testgroup.join(' , ');
      const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
        width: '500px',
        data: {
          txtErrMsg:`${error['error'].errorDetail}`,
          textMess: 'Error while copying TestCase: ',
          api: Api ? 'API Required:' : '',
          apisErr: `${Api}`,
          testGroup: testgroup ? 'Test Group Required:' : '',
          testError: `${testgroup}`,
          name: " ",
          action: " ",
          hideButtons: true
        }

      });
    }
  }
  errorPopUpDailogApi(error) {

    console.log("224Api>>>", error);
    const apiGroup = error.error.data.api_group.join(' , ');
    const networkElement = error.error.data.network_element.join(' , ');
    // const errorDetail = error && error.error && error.error.errorDetail
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '500px',
      data: {
        textMsg:` ${error.error.errorDetail}`,
        text: 'Error while copying API:', 
        apigroup: apiGroup ? 'ApiGroup:' : '',
        apiError: `${apiGroup}`,
        networkEle: networkElement? 'Network Elements Required:' : '',
        networkEleError: `${networkElement}`,
        name: " ",
        action: " ",
        hideButtons: true
      }

    });

  }
  errorPopUpDailogNetworkelements(error) {
    const deviceProfiles = error.error.data.device_profile.join(' , ');
   const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '500px',
      data: {
        txtMsg:`${error.error.errorDetail}`,
        textMssg: 'Error while copying Network Elements:',
        deviceProp: deviceProfiles ? 'Device Profiles Required' : '' ,
        deviceErr: `${deviceProfiles} `,
        name: " ",
        action: " ",
        hideButtons: true
      }

    });

  }
  ngOnDestroy() {
    if (this.dInventorySubscription) {
      this.dInventorySubscription.unsubscribe();
    }
    if(this.apii){
      this.apii.unsubscribe();
    }
    if(this.selected){
      this.selected.unsubscribe();
    }

  }
}

