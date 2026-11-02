import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
@Component({
  selector: 'app-sys-config',
  templateUrl: './sys-config.component.html',
  styleUrls: ['./sys-config.component.scss'],
})
export class SysConfigComponent implements OnInit {

  public system_config: UntypedFormGroup;
  duplicateCheck:any ;
  flagUserCanUpdate:boolean = false;
  constructor(private userService: UserService, private snackBar: MatSnackBar, private dataServices: DataService) { }
  sys_con:any = {}
  teams:any = [];
  startDate: any = null;
  numbersList = [5,10,15,20,25,30];
  ngOnInit(): void {
    this.system_config = new UntypedFormGroup({
      XrayUrl: new UntypedFormControl(null),
      xrayPort: new UntypedFormControl(null),
      fromemailID: new UntypedFormControl(null, [Validators.email, Validators.required]),
      emailserverIP : new UntypedFormControl(null, Validators.required),
      emailserverPort: new UntypedFormControl(null, Validators.required),
      kibanaserverIP : new UntypedFormControl(null),
      kibanaserverPort: new UntypedFormControl(null),
      enable_30mins_session_logout: new UntypedFormControl(0,Validators.required),
      server_monitor_page_warning_value: new UntypedFormControl(90,Validators.required),
      language:new UntypedFormControl('English' , Validators.required),
    });
    this.startDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() );
    console.log('start date', this.startDate);
    // this.dataServices.getCurrentUser().subscribe((data:any)=>{
    // })
    this.flagUserCanUpdate = this.dataServices.deleteActions();

    this.userService.getAllusers().subscribe((data:any)=>{
      this.sys_con = data[0].systemConfig;
      var sys_conf = data[0].systemConfig;
      if(sys_conf &&  sys_conf.length > 0) {
        this.system_config.patchValue({
          XrayUrl:sys_conf[0].XrayUrl,
          xrayPort:sys_conf[0].xrayPort,
          fromemailID:sys_conf[0].fromemailID,
          emailserverIP:sys_conf[0].emailserverIP,
          emailserverPort:sys_conf[0].emailserverPort,
          kibanaserverIP:sys_conf[0].kibanaserverIP,
          kibanaserverPort:sys_conf[0].kibanaserverPort,
          enable_30mins_session_logout: sys_conf[0].enable_30mins_session_logout,
          server_monitor_page_warning_value: sys_conf[0].server_monitor_page_warning_value,
          language:sys_conf[0].language,
        })
      }
    })
  }

  setConfig() {
    if(!this.system_config.valid){   
      return
    } else {
      if(this.sys_con && this.sys_con.length > 0 && this.sys_con[0]._id){       
        this.updateConfig();
      } else {
        this.addConfig();
      }
    }
  }

  addConfig(){
    let snackRef: MatSnackBarRef<any>;
    var con = this.system_config.value;
    this.userService.addSystemConf(con).subscribe((data:any)=>{
      snackRef = this.snackBar.open('System Config Added Successfully', '', {
        duration: 5000
      });
    }, err =>{
      snackRef = this.snackBar.open('Something Want Wrong, unable to add', '', {
        duration: 5000
      });
    })
  }

  updateConfig() {
    let snackRef: MatSnackBarRef<any>;
    var con = this.system_config.value;
    con['_id'] = this.sys_con[0]._id;
    this.userService.updateSystemConf(con).subscribe((data:any)=>{
      snackRef = this.snackBar.open('System Config Updated Successfully', '', {
        duration: 5000
    });    
    this.dataServices.saveSettingData(data[0]);
    this.dataServices.setSettingsData(data[0]);
    }, err =>{
      snackRef = this.snackBar.open('Something Want Wrong, unable to update', '', {
        duration: 5000
      });
    })
  }

}
