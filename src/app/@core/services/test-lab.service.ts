import { DataService } from './data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SERVER } from './../../models/config';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as fileSaver from 'file-saver';
import { DomSanitizer } from '@angular/platform-browser';
import * as blobUtil from 'blob-util';
@Injectable()
export class TestLabService {
    constructor(private http: HttpClient, private snackBar: MatSnackBar, private dataService: DataService, private sanitizer: DomSanitizer) { }

    saveRegressionData(data) {
        return this.http.post(SERVER + 'regression/start/' , data);
    }

    saveDynamicSchedule(data) {
        return this.http.post(SERVER + 'dynamicScheduler/schedule/', data);
    }

    getAllDynamicSchedules() {
        return this.http.get(SERVER + 'dynamicScheduler/all/');
    }

    addDutsToDynamicSchedule(id: string, payload: any) {
        return this.http.post(SERVER + 'dynamicScheduler/add-duts/' + id, payload);
    }

    cancelDynamicSchedule(id: string, deviceId?: string) {
        let url = SERVER + 'dynamicScheduler/cancel/' + id;
        if (deviceId) {
            url += '?deviceId=' + deviceId;
        }
        return this.http.delete(url);
    }

    stopAllDynamicSchedule(duts: any[], dynamicRegressionTagName: string, stopOption?: string) {
        return this.http.post(SERVER + 'dynamicScheduler/stop-all/', { duts, dynamicRegressionTagName, stopOption });
    }

    getRegressionData(startDate, endDate, isReviewed) {
        return this.http.post(SERVER + 'regression/' + 'getallRegData', {startDate, endDate, isReviewed});
    }
    // get regression for first 100 data
    getRegressionInitialData() {
        return this.http.post(SERVER + 'regression/getFirst100/' , "");
    }
    createJiraTestcase(jiraData) {
        return this.http.post(SERVER + 'outsideService/createTestCase', jiraData);
    }
    validateExecutionId(executionId: string){
        return this.http.get(SERVER + 'outsideService/validate/'+executionId);
    }
    validateJiraUser(emailId){
        return this.http.post(SERVER + 'outsideService/validateEmailId/', emailId);
    }
    downloadLogsForWholeRegression(regressionId) {
        this.dataService.loading.next(true);
        this.http.post(SERVER + `regression/download`, { regressionId }, { responseType: 'blob' }).subscribe(
            d => {
                if (d) {
                    fileSaver.saveAs(d, `${regressionId}.zip`);
                } else {
                    this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                }
                this.dataService.loading.next(false);
            },
            err => {
                this.dataService.loading.next(false);
                this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
            }
        );
    }

    // downloadLogsForJobs(jobId) {
    //     this.dataService.loading.next(true);
    //      this.http.post(SERVER + `regression/download/job`, { jobId }, { responseType: 'blob' }).subscribe(
    //         d => {
    //             if (d) {
    //                 fileSaver.saveAs(d, `${jobId}.zip`);
    //             } else {
    //                 this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
    //             }
    //             this.dataService.loading.next(false);
    //         },
    //         err => {
    //             this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
    //             this.dataService.loading.next(false);
    //         }
    //     );
    //     }
    

    downloadExcelLogsForJobs(jobId, isexcel, runId?) {
        // To Do
        this.dataService.loading.next(true);
        let path = isexcel ? `regression/download/job/excel/` : `regression/download/job`;
        this.http.post(SERVER + path , { jobId, runId }, { responseType: 'blob' }).subscribe(
            d => {
                if (d) {
                    fileSaver.saveAs(d, isexcel ? `${jobId}.xlsx` : `${jobId}.zip` );
                } else {
                    this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                }
                this.dataService.loading.next(false);
            },
            err => {
                this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                this.dataService.loading.next(false);
            }
        );
    }

    downloadLogsForTestcase(jobId, tcGroupId, tcId, runId?) {
        this.dataService.loading.next(true);
        this.http.post(SERVER + `regression/download/job`, { jobId, tcGroupId, tcId, runId }, { responseType: 'blob' })
         .subscribe(d => {
                    if (d) {
                        fileSaver.saveAs(d, `${tcId}.zip`);
                    } else {
                        this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                    }
                    this.dataService.loading.next(false);
        }, err => {
                    this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                    this.dataService.loading.next(false);
        });
    }

    /*viewWitbeLogsForTestcase(logUrl) {
        console.log(logUrl);
        this.dataService.loading.next(true);

        this.http
            .post(SERVER + `execution/witbeLogs`, { logUrl })
            .subscribe(
                data => {
                    if (data) {
                        const urlOpen = (data["RESULT"]);
                        window.open(urlOpen, '_blank');
                    } else {
                        this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    }
                    this.dataService.loading.next(false);
                },
                err => {
                    this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    this.dataService.loading.next(false);
                }
            );
    }*/
    viewWitbeLogsForTestcase(witbeUrl) {
        if (!witbeUrl) {
            this.snackBar.open('Failed to open URL', 'Try Again', { duration: 5000 });
            return;
        }
        const fileName = witbeUrl.trim().split('/').pop();
        const lower = fileName.toLowerCase();
        // Backend streams these types as raw bytes; the rest come as { base64String, docType }
        const isStreamed = lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.webm');
        this.dataService.loading.next(true);
        if (isStreamed) {
            this.http.post(SERVER + `regression/getFilesInHtmlLogs`, { imageUrl: witbeUrl }, { responseType: 'blob' }).subscribe(
                (blob: Blob) => {
                    this.dataService.loading.next(false);
                    if (!blob || blob.size === 0) {
                        this.snackBar.open('Failed to open file', 'Try Again', { duration: 5000 });
                        return;
                    }
                    const fileUrl = URL.createObjectURL(blob);
                    window.open(fileUrl, '_blank');
                    setTimeout(() => URL.revokeObjectURL(fileUrl), 30000);
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Failed to open file', 'Try Again', { duration: 5000 });
                });
        } else {
            this.http.post(SERVER + `regression/getFilesInHtmlLogs`, { imageUrl: witbeUrl }).subscribe(
                (data: any) => {
                    this.dataService.loading.next(false);
                    if (data && data['base64String']) {
                        this.openBase64File(data['base64String'], data['docType'], fileName);
                    } else {
                        this.snackBar.open('Failed to open file', 'Try Again', { duration: 5000 });
                    }
                },
                err => {
                    this.dataService.loading.next(false);
                    this.snackBar.open('Failed to open file', 'Try Again', { duration: 5000 });
                });
        }
    }

    openBase64File(base64String: string, docType: string, fileName: string) {
        const mimeMap = {
            pdf: 'application/pdf',
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const mimeType = mimeMap[docType] || 'application/octet-stream';
        const byteChars = atob(base64String);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
        const fileUrl = URL.createObjectURL(blob);
        // Office documents cannot render in-browser, so trigger a download instead
        const isDownload = docType === 'xlsx' || docType === 'docx';
        if (isDownload) {
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            window.open(fileUrl, '_blank');
        }
        setTimeout(() => URL.revokeObjectURL(fileUrl), 30000);
    }
    
    openBase64InNewWindow(base64String: string, mimeType: string, windowTitle: string = 'New Window') {
        // Construct the data URI
        const dataUri = `data:${mimeType};base64,${base64String}`;

        // Open a new window
        const newWindow = window.open();

        if (newWindow) {
            // Write the content to the new window
            newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${windowTitle}</title>
      </head>
      <body>
        <iframe src="${dataUri}" width="100%" height="100%" frameborder="0"></iframe>
      </body>
      </html>
    `);
            newWindow.document.close(); // Close the document stream
        } else {
            console.error("Failed to open a new window. Pop-ups might be blocked.");
        }
    }
    viewHTMLLogsForTestcase(jobId, testsuite, testcase, runId) {
        this.dataService.loading.next(true);
        this.http
            .post(SERVER + `regression/download/tc/html`, { jobId, testsuite, testcase, runId }, { responseType: 'text' })
            .subscribe(
                data => {
                    if (data) {
                        const w = window.open('about:blank');
                        w.document.open();
                        w.document.write(data);
                        w.document.close();
                    } else {
                        this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    }
                    this.dataService.loading.next(false);
                },
                err => {
                    this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    this.dataService.loading.next(false);
                }
            );
    }

    getHTMLLogsUrlForJob(jobId, runId) {
        return this.http.post(SERVER + 'regression/copy/job/htmlpath', {jobId, runId}, {responseType: 'text'});
     }

    viewHTMLLogsForJob(jobId, runId) {
        this.dataService.loading.next(true);
        this.http
            .post(SERVER + `regression/download/job/html`, { jobId, runId }, { responseType: 'text' })
            .subscribe(
                data => {
                    if (data) {
                        const w = window.open('about:blank');
                        w.document.open();
                        w.document.write(data);
                        w.document.close();
                    } else {
                        this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    }
                    this.dataService.loading.next(false);
                },
                err => {
                    this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
                    this.dataService.loading.next(false);
                }
            );
    }

    deleteRegression(data) {
        return this.http.post(SERVER + 'regression/deleteregression' , data);
    }

    getRegression(id) {
        return this.http.get(SERVER + 'regression/' + id);
    }

    getFullRegression( id) {
        return this.http.get(SERVER + 'regression/' + id + '/full');
    }

    sendMailReport( data) {
        return this.http.post(SERVER + 'regression/'  + 'send-mail-report', data);
    }

    stopRegression(regressionId, stopOption, jobLength, job_id) {
        return this.http.delete(SERVER + 'execution/stop/' + regressionId+ '/' + stopOption+ '/' + jobLength+ '/'+job_id);
    }

    downloadImageForWholeRegression(imageUrl) {
        this.dataService.loading.next(true);
        this.http.post(SERVER + `regression/downloadimage`, { imageUrl }, { responseType: 'blob' }).subscribe(
            d => {
                var data = imageUrl.split('/');
                if (d) {
                    fileSaver.saveAs(d, `${data[data.length - 1].replace(".PNG","")}.png`);
                } else {
                    this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
                }
                this.dataService.loading.next(false);
            },
            err => {
                this.dataService.loading.next(false);
                this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
            }
        );
    }

    showimginlivelogs(imageUrl){
        //this.dataService.loading.next(true);
        return this.http.post(SERVER + `regression/downloadimage`, { imageUrl }, { responseType: 'blob' })//.subscribe(
        //     d => {
        //         console.log(d);
        //         var myUrl = blobUtil.createObjectURL(d);
        //         console.log('myUrl => ', myUrl)
        //         return myUrl
               
        //         //this.dataService.loading.next(false);
        //     },
        //     err => {
        //         //this.dataService.loading.next(false);
        //         return imageUrl;
        //         this.snackBar.open('Failed Downloading Regression', 'Try Again', { duration: 5000 });
        //     }
        // );
    }

    updateTCStatus(data){
        return this.http.post(SERVER + 'regression/updateTCStatus' , data)
    }

    saveAutoRegression(data) {
        return this.http.post(SERVER + 'regression/path/auto-regression-file', {data});
    }

    getAutoRegressionData() {
        return this.http.post(SERVER + 'regression/read/auto-regression-file', null);
    }

    getAutoRegressionDataFromDB() {
        return this.http.post(SERVER + 'regression/getAutoRegressionData', null);
    }

   getRegressionResultDATA(data: any) {
    return this.http.post(SERVER + 'regression/getRegressionResultData', data);
}

    deleteMutliRegression(data) {
        return this.http.post(SERVER + 'regression/deletemultiple/'  , data);
    }

    updateReviewDetails(data) {
        return this.http.post(SERVER + 'regression/updateReviewDetails'  , data);
    }

    getStuckedRegression() {
        return this.http.post(SERVER + 'regression/getallStuckedRegressions', null);
    }
}
