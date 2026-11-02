import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { SERVER } from './../../models/config';
import { BehaviorSubject } from 'rxjs';
import * as fileSaver from 'file-saver';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class TestCaseInventoryService {
    public selectedTestcase = new BehaviorSubject(null);
    public selectedTeam = new BehaviorSubject(null);
    public configureTestsuite = new BehaviorSubject(null);
    public selectedTestGroup = new BehaviorSubject(null);
    constructor(
        private http: HttpClient,
        private dataService: DataService,
        private snackBar: MatSnackBar
    ) { }

    getAllData() {
        return this.http.get(SERVER + 'tc/alldata/' );
    }

    add( module) {
        return this.http.post(SERVER + 'tc/add/'  , module);
    }

    edit( module) {
        return this.http.put(SERVER + 'tc/edit/' , module);
    }

    delete( module) {
        return this.http.post(SERVER + 'tc/delete/' , module);
    }

    editTestCase(module) {
        return this.http.put(SERVER + 'tc/testcase/edit/' , module);
    }

    mapTestCases(testSuite) {
        return this.http.put(SERVER + 'tc/edit/' , testSuite);
    }

    deleteTestcase( module) {
        return this.http.post(SERVER + 'tc/testcase/delete/'  , module);
    }

    deleteTestGroup( module) {
        return this.http.post(SERVER + 'tc/testgroup/delete/' , module);
    }

    /**
     * Get Test Case Details
     */
    getTestCaseDetail(testCaseNumber): any {
        return this.http.get(SERVER + 'outsideService/getTestCaseDetail/' + testCaseNumber);
    }

    /**
     * Testcase Download Option
     * @param testcaseId Download Testcase
     */
    downloadLogsForTestcase( testcaseData): any {
        this.dataService.loading.next(true);
        this.http.post(SERVER + `tc/download/` , { testcaseData }, { responseType: 'blob' }).subscribe(
            d => {
                if (d) {
                    fileSaver.saveAs(d, `${testcaseData.tcName.replace(/:/g, '')}.json`);
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

    updateTCForJiraIssueID(tcArray){
        return this.http.post(SERVER + 'outsideService/updateMulTCForJiraIssueID', tcArray)
    }
    defaultVendor = ["All", "Ignite All", "Ignite-XGSPON", "Ignite-DOCSIS", "Legacy", "Interop iOS", "Interop Android", "Interop - All"];
    // modelArray = []
    QuarterObj = { 1: "Q1", 2: "Q1", 3: "Q1", 4: "Q2", 5: "Q2", 6: "Q2", 7: "Q3", 8: "Q3", 9: "Q3", 10: "Q4", 11: "Q4", 12: "Q4" }

}
