import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-edit-error-code',
  templateUrl: './edit-error-code.component.html',
  styleUrls: ['./edit-error-code.component.scss']
})
export class EditErrorCodeComponent implements OnInit {
  existsCheck =[];
  errorDescriptionDetails=[];
  formType;
  public errorCodes: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  public dialog: MatDialog,
  public dialogRef: MatDialogRef<EditErrorCodeComponent>,
  public userService: UserService,
  public dataService: DataService,
  public snackBar: MatSnackBar) { 
    //To store all Error code data 
   
     this.existsCheck=[]
     this.errorDescriptionDetails=[]
    let tempData= this.dataService.getErrorCodes(); 
   
      tempData.forEach((res)=>{
        console.log("res", res);
        this.existsCheck.push(res.errorCode)
        this.errorDescriptionDetails.push(res.errorDesc)
      })
      
  }

  ngOnInit(): void {
  
   if(this.data =="Add"){
    this.formType = "ADD"
     // Form field created
     this.errorCodes = new FormGroup({
      errorCode: new FormControl(null, Validators.required),
      errorDesc: new FormControl(null, Validators.required),
    });
    this.errorCodes.get('errorCode').valueChanges.subscribe(value =>{
      console.log("existcheck", this.existsCheck);
      if(this.existsCheck.indexOf(value) !==-1) {
        this.errorCodes.get('errorCode').setErrors({ duplicate: true });
        
      }
    })
    
    this.errorCodes.get('errorDesc').valueChanges.subscribe(value =>{
      console.log("check", this.errorDescriptionDetails);
      if(this.errorDescriptionDetails.indexOf(value) !==-1) {
        this.errorCodes.get('errorDesc').setErrors({ duplicate: true });
        
      }
    })
   
   }else{
     this.errorCodes = new FormGroup({
      errorCode: new FormControl(null, Validators.required),
      errorDesc: new FormControl(null, Validators.required),
      _id: new FormControl(null)
    });
    this.errorCodes.patchValue({
      errorCode : this.data.errorCode,
      errorDesc: this.data.errorDesc,
      _id: this.data._id
    });
    this.errorCodes.get('errorCode').valueChanges.subscribe(value =>{
      
      if(this.existsCheck.indexOf(value) !==-1 && this.errorCodes.get('errorCode').value !== this.data.errorCode) {
        this.errorCodes.get('errorCode').setErrors({ duplicate: true });
      }
    })
    this.errorCodes.get('errorDesc').valueChanges.subscribe(value =>{
      
      if(this.errorDescriptionDetails.indexOf(value) !==-1 && this.errorCodes.get('errorDesc').value !== this.data.errordesc) {
        this.errorCodes.get('errorDesc').setErrors({ duplicate: true });
      }
    })
   
   }

   }

  openConfirmationModal() {
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: ' Error Codes',
          text: "Edit will do the changes in " + this.errorCodes.get('errorCode').value ,
          action: 'Submit'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result == true){
        this.updateErrorCodes();
      }
      // else {
      //   this.dialogRef.close();
      // }
    });
  }

  updateErrorCodes() {
  if(this.formType =="ADD"){
    this.errorCodes.value.errorCode = this.errorCodes.value.errorCode.trim();
  this.userService.addErrorCodes(this.errorCodes.value).subscribe((res: any) => {
     this.dataService.allErrorCodes = res[0].errorCodes;
    this.snackBar.open('Error Code Added Successfully', 'OK', {
      duration: 4000
    });
    this.dialogRef.close();
  }, (err: any) => {
    this.snackBar.open('Something went wrong ! Data not updated', 'OK', {
      duration: 4000
    });
  });
  }else{
    this.errorCodes.value.errorCode = this.errorCodes.value.errorCode.trim();
    this.userService.updateErrorCodes(this.errorCodes.value).subscribe((res: any) => {
      this.dataService.allErrorCodes = res[0].errorCodes;
      this.snackBar.open('Error Code Edited Successfully', 'OK', {
        duration: 4000
      });
      this.dialogRef.close();
    }, (err: any) => {
      this.snackBar.open('Something went wrong ! Data not updated', 'OK', {
        duration: 4000
      });
    });
  }
  }
}
