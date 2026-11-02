import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/@core/services/data.service';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { ToolTipDisplayComponent } from '../../../../@shared/components/tooltip-component/tooltip.component';
import { ConfirmationDiaogComponent } from '../../../../@shared/components/confirmation-dialog/confirmation-dialog.component';
import { EditErrorCodeComponent } from './edit-error-code/edit-error-code.component';
import { UserService } from 'src/app/@core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddErrorCodeExcelService } from './service/add-error-code-excel.service';

@Component({
  selector: 'app-add-error-codes',
  templateUrl: './add-error-codes.component.html',
  styleUrls: ['./add-error-codes.component.scss']
})
export class AddErrorCodesComponent implements OnInit {
  existsCheckData
  private data: any;
  public errorCodes: FormGroup;
  deleteErrorValue: boolean = true;
  source: LocalDataSource = new LocalDataSource();
  existsCheck =[];
  constructor(private dataServices: DataService,
    private userService: UserService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar, private errorCodeExcelService: AddErrorCodeExcelService) {
      this.existsCheck =[]
      this.existsCheckData = this.dataServices.getErrorCodes();  
      this.existsCheckData.forEach((res) => {
        this.existsCheck.push(res.errorCode);
      });
  }

  public settings = {
    attr: {
      // defaultStyle: false,
      class: 'text-center table table-bordered'
    },
    noDataMessage: 'No Data Found',
    pager: {
      perPage: 10
    },
    mode: 'external',
    actions: {
      add: false,
      delete: this.deleteErrorValue,
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
      errorCode: {
        title: 'Error Code',
        type: 'custom',
        width: '300px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 60);
        },
        valuePrepareFunction: data => {
         return data;
          },

      },
      errorDesc: {
        title: 'Error Details',
        type: 'custom',
        width: '300px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 60);
        },
        valuePrepareFunction: data => {
          return data;
        },
      },
    }
  };

  ngOnInit(): void {
    // Form field created
    // this.errorCodes = new FormGroup({
    //   errorCode: new FormControl(null, Validators.required),
    //   errorDesc: new FormControl(null, Validators.required)
    // });
    // console.log(this.errorCodes,"error code")
    // this.errorCodes.get('errorDesc').valueChanges.subscribe(value=>{
    //   this.errorCodes.get('errorDesc').setErrors(null);
    // })
    // this.errorCodes.get('errorCode').valueChanges.subscribe(value =>{
    //   if(this.existsCheck.indexOf(value) !== -1){
    //     this.errorCodes.get('errorCode').setErrors({ duplicate: true });
    //   }
    // })
    
    this.getErrorData();
  }
  ngOnDestroy(): void{
   // this.errorCodes.reset()
  }

  getErrorData() {
    console.log(this.data,"data113") 
   this.data = this.dataServices.getErrorCodes();   
  if (Array.isArray(this.data)) {
      this.data.sort((a, b) => a.errorCode.localeCompare(b.errorCode));
    }
    this.source.load(this.data);

  }

  addErrorCodes() {
    // let data: any = {
    //   errorCode: this.errorCodes.value.errorCode,
    //   errorDesc: this.errorCodes.value.errorDesc
    // };
    const dialogRef = this.dialog.open(EditErrorCodeComponent, {
      width: '400px',
      data: "Add"
    });
    dialogRef.afterClosed().subscribe(result => {
      // if(result == true) {
        this.getErrorData();
      // }
  });
  //   this.userService.addErrorCodes(data).subscribe((res: any) => {
  //     this.dataServices.allErrorCodes = res[0].errorCodes;
  //     this.getErrorData();
  //     this.snackBar.open('Data Added Successfully', 'OK', {
  //       duration: 4000
  //     });
  //     // this.errorCodes.reset();
  //   }, (err: any) => {
  //     this.snackBar.open('Something went wrong ! Data not added', 'OK', {
  //       duration: 4000
  //     });
  //   });
  
  //  this.errorCodes.reset()
   //this.errorCodes.setErrors(null);
  }

  editErrorCode(ev: any) {
    // console.log(ev,"eve")
    const dialogRef = this.dialog.open(EditErrorCodeComponent, {
      width: '400px',
      data: ev.data
    });

    dialogRef.afterClosed().subscribe(result => {
        // if(result == true) {
          this.getErrorData();
        // }
    });
  }

  deleteErrorCode(ev: any) {
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: 'Error Codes',
          text: "Deleting will remove the " + ev.data.errorCode  + ".",
          action: 'Delete'
      },
      panelClass: 'app-full-bleed-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result == true) {
        this.userService.deleteErrorCodes(ev.data).subscribe((res: any) => {
          this.dataServices.allErrorCodes = res[0].errorCodes;
          this.getErrorData();
          this.snackBar.open('Data Deleted Successfully', 'OK', {
            duration: 4000
          });
        }, (err: any) => {
          this.snackBar.open('Something went wrong ! Data not deleted', 'OK', {
            duration: 4000
          });
        });
      }
    });
  }

  saveErrorCodeToExcel() {
    let header=["Error Code", "Error Details"]
    this.errorCodeExcelService.exportAsExcelFile("All Error Codes", "" , header , this.data , [] , "All Error Codes", "Error Codes" , "")
  }
  
}
