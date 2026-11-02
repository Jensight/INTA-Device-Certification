import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { FeedbackService } from 'src/app/@core/services/feedback.service';
import { AddCommentComponent } from './add-comment/add-comment.component';

@Component({
  selector: 'app-edit-feedback',
  templateUrl: './edit-feedback.component.html',
  styleUrls: ['./edit-feedback.component.scss']
})
export class EditFeedbackComponent implements OnInit {
  public feedbackForm: UntypedFormGroup;
  submitted = false;
  totalCount = 0;
  sub2;
  sub1;
  selectedFeedback;
  feedbackComments;
  userData;
  allUsers;
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard'
    },
    {
      link: '#/pages/settings/feedback/view',
      label: 'View Feedback'
    }
  ];
  constructor(private formBuilder: UntypedFormBuilder,
              private router: Router,
              public dataService: DataService,
              private snackBar: MatSnackBar,
              private feedbackService: FeedbackService,
              private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.allUsers = this.dataService.getUsers();
    const userDetails = this.dataService.getCurrentUser();
    this.userData = userDetails;
    this.feedbackForm = this.formBuilder.group({
      pageName: ['', Validators.required],
      priority: ['', Validators.required],
      feedbackDescription: ['', Validators.required],
      status: ['', Validators.required]
    });
    if (this.feedbackService.selectedFeedback) {
      this.selectedFeedback = this.feedbackService.selectedFeedback;
      if (this.selectedFeedback.comments === undefined) {
        this.selectedFeedback.comments = [];
      }
      this.feedbackComments = this.selectedFeedback.comments;
      this.feedbackComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.feedbackForm.patchValue({
        pageName: this.selectedFeedback.pageName,
        feedbackDescription: this.selectedFeedback.feedbackDescription,
        priority: this.selectedFeedback.priority,
        status: this.selectedFeedback.status
      });
    }
  }

  get registerFormControl(): any {
    return this.feedbackForm.controls;
  }
  onBack(): any {
    if (this.userData.role === 'admin') {
      this.router.navigateByUrl('/pages/settings/feedback/view');
    } else {
      this.router.navigateByUrl('/pages/userSetting/feedback/view');
    }
  }

  onComment(): any {
    this.dialog.open(AddCommentComponent, {
      data: this.selectedFeedback,
      width: '500px'
    });

  }

  onSubmit(): any {
    this.submitted = true;
    // stop here if form is invalid
    if (this.feedbackForm.invalid) {
      return;
    }
    this.dataService.loading.next(true);
    const temp = this.selectedFeedback;
    temp.priority = this.feedbackForm.value.priority;
    temp.status = this.feedbackForm.value.status;
    temp.updatedBy = this.userData._id;
    this.sub2 = this.feedbackService.updateFeedback(temp).subscribe(
      result => {
        this.dataService.loading.next(false);
        if (result) {

          this.dataService.getAllFeedback().next(result);
          this.snackBar.open('Feedback Updated Successfully', 'OK', {
            duration: 5000
          });

        }
      },
      error => {
        this.dataService.loading.next(false);
        this.snackBar.open('Error Adding Feedback', 'Try Again', {
          duration: 5000
        });

      }
    );
  }
  ngOnDestroy(): any {
  }

}
