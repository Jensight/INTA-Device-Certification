import { Component, OnInit, Inject, Output, ViewChild } from '@angular/core';
import { DataService } from '../../../../../@core/services/data.service';
import { FormGroup, FormControl, Validators } from '../../../../../../../node_modules/@angular/forms';
import { DashboardService } from '../../../../../@core/services/dashboard.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeviceInventoryService } from '../../../../../@core/services/device-inventory.service';
import * as _ from 'lodash';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {trigger, state, style, animate, transition, query, group } from '@angular/animations';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
    selector: 'app-select-regression',
    templateUrl: './select-regression.component.html',
    styleUrls: ['./select-regression.component.scss'],
    animations: [
        trigger('fade', [ 
          transition('void => *', [
            style({ opacity: 0 ,transform: 'translateX(-250px)'}), 
            animate(500, style({opacity: 1,transform: 'translateX(0)'}))
          ]) 
        ])
      ]
})
export class SelectRegressionComponent implements OnInit {
    displayedColumns = ['selected', 'runId','filter'];
    dataSource: MatTableDataSource<any[]>;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    date = new Date();
    usersList;
    regressionForm: FormGroup;
    deviceSubscription
    formSubmitted = false;
    showRegList = false;
    chosenRegName: string=''
    regressionFullData ;
    regressionNameList ;
    selectedReg=""
    resultalldata;
    resultObj;
    noData= false;
    sub1;
    sub2;
    allModels = [];
    environment_type:any = [];
    enable_environment_type_selection: boolean = false;
    selectedTeam:any;
    env_type:any='';
    range = new FormGroup({
        start: new FormControl(null,Validators.required),
        end: new FormControl(null,Validators.required),
      });
    Dup: boolean=false;
    constructor(private dataService: DataService,
        private dInventoryService: DeviceInventoryService,
        private dashboardService: DashboardService,
     private userService: UserService,
        public dialogRef: MatDialogRef<SelectRegressionComponent>,
        
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.environment_type.push('All Environment')
                this.selectedTeam = team;
                var confd = this.dataService.getTeamDashBoardConfig(team);
                if(confd.enable_environment_type_selection && confd.enable_environment_type_selection == true){
                    this.enable_environment_type_selection = true;
                    this.environment_type.push(...confd.environment_value_array);
                }
            }
        })
            this.regressionForm = new FormGroup({
                fromDate: new FormControl('', Validators.required),
                toDate: new FormControl('', Validators.required),
                model: new FormControl('', Validators.required),
            	environment: new FormControl('All Environment', Validators.required)           
            });
            this.selectedReg=data.filter?.regName
        this.regressionForm.get('fromDate').setValue(data.filter?.fromDate)
        let toDate=new Date(data.filter?.toDate)
        toDate.setDate(toDate.getDate()-1)
       
        this.regressionForm.get('toDate').setValue(toDate)
        this.regressionForm.get('model').setValue(data.filter?.model)
        this.usersList = this.dataService.getUsers();
        this.dataSource = new MatTableDataSource([]);

    }

    ngOnInit(): void {
        this.getAllData()
        this.dataSource.paginator = this.paginator;
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    
      applyFilter(filterValue: string) {
        console.log(filterValue,"wqew")
        this.dataSource.filter = filterValue.trim().toLowerCase();
      
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      }
      
    getAllData() {
        this.sub2 = this.dInventoryService.getAllData().subscribe(data => {
            if (data) {
                // console.log(data)
                this.dataService.getDeviceInventoryData().next(data);
                this.getAllDevices()
            }
        });
    }
/* fetches all the regression details  */
    fetchRegressions() {
        this.formSubmitted = true;
        if (this.regressionForm.valid) {
            this.dataService.loading.next(true)
          
            const regName = this.data.regName;
           if (new Date(this.regressionForm.value['toDate']).toString === new Date(this.regressionForm.value['fromDate']).toString) {
                const d = new Date(this.regressionForm.value['toDate']);
                d.setTime(d.getTime() + 86400000);
                this.regressionForm.value['toDate'] = d;
            }
            this.sub1=this.dashboardService.getRegressionByDate(this.regressionForm.value).subscribe((res) => {
                res['regName'] = regName;
                this.regressionFullData = res;
                this.regressionNameList = res['regressionNames'];
                console.log(this.regressionNameList,res,"213")
                let source = [];
                let source1 = [];
                this.regressionNameList.forEach((el) => {
                    let data = res['allData'].find(e => e.jobName == el);
                    if(data) {
                        source1.push({'runId':el, "tagName": (data.tagName && data.tagName != 'NA')? data.tagName: el, "environment_type": data.environment_type});
                    }
                });
                if(this.regressionForm.value.environment == 'All Environment'){
                    source = source1;
                } else {
                    this.env_type = this.regressionForm.value.environment;
                    source1.forEach((ele:any)=>{
                        if(ele.environment_type == this.regressionForm.value.environment){
                            source.push(ele);
                        }
                    })
                    //source = source1.find(e=> e.environment_type == ) 
                }
                this.dataSource = new MatTableDataSource(source);
                setTimeout(()=>{
                    this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;
                this.dataService.loading.next(false)
                },0)
                this.showRegList = true;
                if(this.regressionNameList.length <= 0){
                    this.noData = true;
                }else {
                    this.noData = false;
                }
        });
        }
    }

    // SelectedReg(event:Event){
    //     console.log(event)
    //     if(this.selectedReg=="reg1"){
    //         this.selectedReg1=event.target['value']
    //     }
    //     else{
    //         this.selectedReg2=event.target['value']
    //     }
    // }

    close() {
        this.dialogRef.close();
    }

    back() {
        this.showRegList = false;
    }
    sendDataToParent(name) {
       
        this.Dup=false
        if(this.selectedReg && name.value.runId==this.selectedReg){
            this.Dup=true
            console.log("adasdsad")
        }
        const resultalldata = this.regressionFullData['allData'].filter(element => {
           return element['jobName'] === name.value.runId;
        });
        const resulttcdata  = [];
        this.regressionFullData['tcData'].filter(element => {
            if (element[name.value.runId] && (element[name.value.runId] !== 'Not Executed') ) {
                resulttcdata.push(_.pick(element, ['tcName', '_id', name.value.runId, 'tcId']));
            }
        });
        const resultregressionNames = this.regressionFullData['regressionNames'].filter(element => {
            return element === name.value.runId;
         });
         let formValue=_.cloneDeep(this.regressionForm.value)
         formValue.regName=resultregressionNames[0]
          this.resultObj = {
             allData: resultalldata,
             regressionNames: resultregressionNames,
             tcData: resulttcdata,
             regName: this.regressionFullData['regName'],
             filter:formValue
         };
    }
    getAllDevices(){
        
        this.deviceSubscription = this.dataService
            .getAllModels()
            .subscribe(models => {
                const filteredmodel = _.filter(models, obj => {
                    return (
                       obj['dut'] == true
                         
                    );
                });
                this.allModels=_.sortBy(filteredmodel, 'modelName');
                console.log(models)
            });
    }
    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.deviceSubscription) {
            this.deviceSubscription.unsubscribe();
        }
    }

}
