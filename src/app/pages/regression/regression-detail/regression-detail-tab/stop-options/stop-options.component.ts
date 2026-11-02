import { Component, Inject, OnInit, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-stop-options',
  templateUrl: './stop-options.component.html',
  styleUrls: ['./stop-options.component.scss']
})
export class StopOptionsComponent implements OnInit {
  data = {
    name: 'stopGracefully'
  };
  constructor(

    public dialogRef: MatDialogRef<StopOptionsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dataFromParent: any

  ) {}

  ngOnInit(): void {
    this.data.name = 'stopGracefully';
  }
  stop(){
    this.dialogRef.close({ event: 'submit', data: this.data.name });
  }
  close(){
    this.dialogRef.close();
  }

 
  ngOnDestroy() {
   
  }

}
