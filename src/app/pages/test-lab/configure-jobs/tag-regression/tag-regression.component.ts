
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  Component,
  OnInit,
  Inject,
  Optional
} from "@angular/core";

@Component({
  selector: "app-tag-regression",
  templateUrl: "./tag-regression.component.html",
  styleUrls: ["./tag-regression.component.scss"]
})
export class TagRegressionComponent implements OnInit {

  originalTagName: string = '';

   constructor(

    public dialogRef: MatDialogRef<TagRegressionComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,

  ) {}

  ngOnInit(): void {
    console.log("data>>>>>>>>>>>", this.data);
    // Store the original generated tag name for comparison
    this.originalTagName = this.data.name || '';
  }
  reserveTag(){
    // Compare if tag name was edited by user
    const isTagEdited = this.data.name !== this.originalTagName;
    this.dialogRef.close({ event: 'submit', data: this.data.name, isTagEdited: isTagEdited });
  }

  close(){
    this.dialogRef.close({ event: 'close', data: "" });
  }
  ngOnDestroy() {
   
  }
}
