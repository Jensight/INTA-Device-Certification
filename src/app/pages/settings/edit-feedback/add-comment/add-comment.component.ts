import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { FeedbackService } from 'src/app/@core/services/feedback.service';

@Component({
  selector: 'app-add-comment',
  templateUrl: './add-comment.component.html',
  styleUrls: ['./add-comment.component.scss']
})
export class AddCommentComponent implements OnInit {
  public commentForm: UntypedFormGroup;
  submitted = false;
  selectedFeedback;
  userData;
  sub2;
  constructor(private formBuilder: UntypedFormBuilder,
              public dialogRef: MatDialogRef<AddCommentComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public dataService: DataService,
              private snackBar: MatSnackBar,
              private feedbackService: FeedbackService
    ) { }

  ngOnInit(): void {
    this.selectedFeedback = this.data;
    const userDetails = this.dataService.getCurrentUser();
    this.userData = userDetails._id;
    this.commentForm = this.formBuilder.group({
      comment: ['', Validators.required]
  });

  }


  onSubmit(): any {

    this.submitted = true;

    // stop here if form is invalid
    if (this.commentForm.invalid) {
        return;
    }
    const commentValue = { createdby: this.userData, createdAt : new Date().toISOString(), 
      comment : this.commentForm.get('comment').value };

    const temp = this.selectedFeedback;
    if (!this.selectedFeedback.hasOwnProperty('comments')){
      temp.comments = [];
    }
    temp.comments.unshift(commentValue);
    this.dataService.loading.next(true);
    this.sub2 = this.feedbackService.updateFeedback(temp).subscribe(
      result => {
          this.dataService.loading.next(false);
          if (result) {
              this.dataService.getAllFeedback().next(result);
              this.snackBar.open('Comments Added Successfully', 'OK', {
                  duration: 5000
              });
              this.dialogRef.close();
          }
      },
      error => {
          this.dataService.loading.next(false);
          this.snackBar.open('Error Adding Comments', 'Try Again', {
              duration: 5000
          });
          this.dialogRef.close();
      }
  );
}

  get commentFormControl(): any {
    return this.commentForm.controls;
  }

}
