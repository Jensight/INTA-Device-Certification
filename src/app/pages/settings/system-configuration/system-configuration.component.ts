import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
  selector: 'app-system-configuration',
  templateUrl: './system-configuration.component.html',
  styleUrls: ['./system-configuration.component.scss']
})
export class SystemConfigurationComponent implements OnInit {

  sys_con:any = {};
  isAddErrorCode: boolean = false;

  constructor(private userService: UserService,
    private snackBar: MatSnackBar, 
    private dataServices: DataService) { }
    
  ngOnInit(): void {
    this.getSettingsData();
  }

  getSettingsData() {    
    let data = this.dataServices.getSettingsData().value;
    if(data && data.extraSystemConfig && data.extraSystemConfig[0]){
      this.isAddErrorCode = data.extraSystemConfig[0].add_error_codes;
    }
    
  }
}
