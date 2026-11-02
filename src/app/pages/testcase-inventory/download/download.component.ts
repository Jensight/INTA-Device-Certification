import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit {
  testCaseData;
  allTestsuite;
  allTestgroup;
  allNodes;
  allVariableGroup = [];
  allVariables = [];
  allModules = [];
  variable;
  selectedTeam;
  fileTypes = ['TEST SET', 'TEST SUITE', 'TEST GROUP', 'TEST CASE'];
  constructor(private testBedService: TestBedService, private dataService: DataService,
    private tcInventoryService: TestCaseInventoryService, private dInventoryService: DeviceInventoryService) {
    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
        this.dataService.loading.next(true);
        this.getAllData();
      }
    });
  }

  ngOnInit(): void {
  }

  getAllData(): void {
    this.tcInventoryService.getAllData().subscribe(allData => {
      if (allData) {
        this.dataService.getTcInventoryData().next(allData);
      }
    });
    this.dataService.getDeviceInventoryData().subscribe(dt => {
      if (!dt) {
        this.dInventoryService.getAllData().subscribe((data: any) => {
          if (data && data.length > 0) {
            this.dataService.getDeviceInventoryData().next(data);
          }
        });
      }
    });
    this.dataService.getTestBedData().subscribe(dt => {
      if (!dt) {
        this.testBedService.getTestBed().subscribe(data => {
          if (data) {
            this.dataService.getTestBedData().next(data);
          }
        });
      }
    });
    this.dataService.getTestGroup().subscribe(tg => {
      if (tg) {
        this.allTestgroup = tg;
      }
    });
    this.dataService.getNodes().subscribe(node => {
      if (node) {
        this.allNodes = node;
      }
    });
    this.dataService.getTCModules().subscribe(module => {
      if (module) {
        this.allModules = module;
      }
    });
    this.dataService.getDeviceVariableGroup().subscribe(data => {
      if (data) {
        this.allVariableGroup = data;
        this.allVariableGroup.forEach(varGrp => {
          const element = varGrp.variables;
          this.allVariables = [...this.allVariables, ...element];
        });
      }
    });

    setTimeout(() => this.dataService.getTcInventoryData().subscribe(data => {
      if (data) {
        this.dataService.getTestSuites().subscribe(ts => {
          if (ts) {
            this.allTestsuite = ts;
          }
        });
        this.allModules.forEach(module => {
          module.testSuiteNamesList = [];
          this.allTestsuite.forEach(ts => {
            if (ts.moduleId.includes(module._id)) {
              module.testSuiteNamesList.push(ts.testSuiteName);
            }
          });

        });
        this.testCaseData = data;
        this.testCaseData.forEach(element => {
          const testCaseTestSuiteNames = [];
          this.allTestsuite.forEach(testSuite => {
            testSuite.testCaseNamesList = testSuite.testCaseNamesList ? testSuite.testCaseNamesList : [];
            if (testSuite.testCases.includes(element._id)) {
              testCaseTestSuiteNames.push(testSuite.testSuiteName);
              testSuite.testCaseNamesList.push(element.tcName);
            }
          });
          if (testCaseTestSuiteNames.length > 0) {
            element.testSuiteName = _.uniq(testCaseTestSuiteNames);
          }
          const testGroupName = _.filter(this.allTestgroup, dt => {
            return dt._id === element.tcGroupId;
          })[0]?.testGroupName;
          element.testGroup = testGroupName ? testGroupName : null;
          this.allTestgroup.forEach(tg => {
            tg.testCaseNamesList = tg.testCaseNamesList ? tg.testCaseNamesList : [];
            if (tg._id === element.tcGroupId) {
              tg.testCaseNamesList.push(element.tcName);
            }
          });
          element?.testSteps?.map(d => {
            if (d.isComment === true) { return; }
            d.doHttp?.postBody?.bodyParameter?.forEach(param => {
              const arry = param.argumentValue ? param.argumentValue.includes(':') ? param.argumentValue.split(':') : [] : [];
              if (arry.length > 0) {
                const id = arry[0] === 'ELEMENT' ? arry[1] : arry[0].includes('MODEL') ? arry[0].slice(6) : arry[0];
                const node = _.filter(this.allNodes, nd => {
                  return nd._id === id;
                })[0];
                if (arry[0].includes('MODEL')) {
                  this.variable = _.find(this.allVariables, { _id: arry[1] });
                }
                param.argumentValue = node ? (arry[0] === 'ELEMENT' ? node.nodeName : arry[0].includes('MODEL') ?
                  node.nodeName + ':' + this.variable.variableName : node.nodeName + ':' + arry[1])
                  : param.argumentValue;
              }
            });
          });
        });
        this.dataService.loading.next(false);
      }
    }), 100);
  }

  downloadCSV(type: any): void {
    if (type === 'TEST CASE') {
      const fileName = 'TestCase List.csv';
      const MAX_CELL_LENGTH = 32700;
      const columnNames = [
        'TestCase Id',
        'Jira Key',
        'TestCase Name',
        'Test Suite',
        'Test Group',
        'Priority',
        'Manual Exec Time',
        'Test Steps',
        'TestStep Description'
      ];
      let csv = columnNames.join(',') + '\r\n';

      const csvQuote = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return '"' + str.replace(/"/g, '""') + '"';
      };
      const splitByLength = (str: string, maxLen: number): string[] => {
        const result = [];
        for (let i = 0; i < str.length; i += maxLen) {
          result.push(str.slice(i, i + maxLen));
        }
        return result;
      };

      this.testCaseData.forEach(testCase => {
        if (testCase.tcId) {
          let testSteps = [];
          let testStepDescriptions = [];
          let pendingComments = [];
          let actualStepIndex = 0;
          (testCase?.testSteps || []).forEach((d) => {
            if (d.isComment === true) {
              pendingComments.push(d.commentText || d.description || '');
              return;
            }
            actualStepIndex++;
            const onPass = 'OnPass: ' + d.gotoOnPass;
            const onFail = 'OnFail: ' + d.gotoOnFail;
            let stepDetail = `Step-${actualStepIndex}: ${onPass}, ${onFail}, ${d.doHttp?.url?.split('/')?.slice(-1)}`;

            d.doHttp?.postBody?.bodyParameter?.forEach(param => {
              stepDetail += `, ${param.argumentName}: ${param.argumentValue}`;
            });
            if (pendingComments.length > 0) {
              const commentPrefix = pendingComments.map(c => `Comment: "${c}"`).join('; \r\n');
              stepDetail = commentPrefix + '; \r\n' + stepDetail;
              pendingComments = [];
            }
            testSteps.push(stepDetail);
            const action = d.description || 'Null';
            const dataVal = d.data || 'Null';
            const expectedRes = d.expectedResult || 'Null';
            let stepDesc = `Step-${actualStepIndex}: action: "${action}", data: "${dataVal}", expectedResult: "${expectedRes}"`;
            testStepDescriptions.push(stepDesc);
          });
          const testStepDescriptionsList = testStepDescriptions.join('; \r\n\n');
          const fullDescription = testSteps.join('; \r\n\n');
          let testSuiteNames = 'Not Mapped';
          if (Array.isArray(testCase.testSuiteName)) {
            testSuiteNames = testCase.testSuiteName.join('; \r\n');
          } else if (typeof testCase.testSuiteName === 'string') {
            testSuiteNames = testCase.testSuiteName;
          } else if (testCase.testSuiteName) {
            testSuiteNames = String(testCase.testSuiteName);
          }
          const jiraKey = testCase.jiraKey || 'NA';
          if (fullDescription.length <= MAX_CELL_LENGTH && testStepDescriptionsList.length <= MAX_CELL_LENGTH) {
            const row = [
              testCase.tcId,
              csvQuote(jiraKey),
              csvQuote(testCase.tcName),
              csvQuote(testSuiteNames),
              testCase.testGroup,
              testCase.tcPriority,
              testCase.manualExectime,
              csvQuote(fullDescription),
              csvQuote(testStepDescriptionsList)
            ];
            csv += row.join(',') + '\r\n';
          } else {
            const fullDescChunks = splitByLength(fullDescription, MAX_CELL_LENGTH);
            const stepDescChunks = splitByLength(testStepDescriptionsList, MAX_CELL_LENGTH);
            const maxChunks = Math.max(fullDescChunks.length, stepDescChunks.length);
            for (let i = 0; i < maxChunks; i++) {
              const fullDesc = fullDescChunks[i] !== undefined ? fullDescChunks[i] : '';
              const stepDesc = stepDescChunks[i] !== undefined ? stepDescChunks[i] : '';
              const row = [
                testCase.tcId,
                csvQuote(jiraKey),
                csvQuote(testCase.tcName),
                csvQuote(testSuiteNames),
                testCase.testGroup,
                testCase.tcPriority,
                testCase.manualExectime,
                csvQuote(fullDesc),
                csvQuote(stepDesc)
              ];
              csv += row.join(',') + '\r\n';
            }
          }
        }
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    // if (type === 'TEST CASE') {
    //   let testSteps = [];
    //   const fileName = 'TestCase List.csv';
    //   const columnNames = ['TestCase Id', 'Jira Key', 'TestCase Name', 'Test Suite', 'Test Group', 'Priority', 'Manual Exec Time', 'Test Steps', 'TestStep Description'];
    //   const header = columnNames.join(',');
    //   let csv = header;
    //   csv += '\r\n';
    //   this.testCaseData.map(testCase => {
    //     testSteps = [];
    //     let testStepdetails = null;
    //     let testStepDescription = null;
    //     let testStepDescriptions = [];
    //     testCase?.testSteps?.forEach((d, index) => {
    //       const onPass = 'OnPass' + ': ' + d.gotoOnPass.toString();
    //       const onFail = 'OnFail' + ': ' + d.gotoOnFail.toString();
    //       testStepdetails = 'Step-' + (index + 1) + ': ' + onPass + ', ' + onFail + ', ' + d.doHttp.url.split('/').slice(-1);
    //       d.doHttp.postBody.bodyParameter.forEach(param => {
    //         testStepdetails = testStepdetails + ', ' + param.argumentName + ': ' + param.argumentValue;
    //       });
    //       testSteps.push(testStepdetails);
    //       // console.log('test step details', d);
    //       testStepDescription = 'Step-' + (index + 1) + ':';
    //       const desc = d.description ? d.description : 'Null';
    //       testStepDescription = testStepDescription + ' ' + desc;
    //       testStepDescriptions.push(testStepDescription);
    //     });
    //     const testStepsList = testSteps.join('; \r\n\n');
    //     const testStepDescriptionsList = testStepDescriptions.join('; \r\n\n');
    //     console.log("testStepsList", testStepsList);
    //             console.log("testStepsListlength", testStepsList.length);
        
    //     if (testCase.tcId) {
    //       const jiraKey = testCase.jiraKey ? testCase.jiraKey : 'NA';
    //       const testSuiteNames = testCase.testSuiteName ? testCase.testSuiteName.join('; \r\n') : 'Not Mapped';
    //       csv += [testCase.tcId, '\"' + jiraKey + '\"', '\"' + testCase.tcName + '\"', '\"' + testSuiteNames + '\"', testCase.testGroup,
    //       testCase.tcPriority, testCase.manualExectime, '\"' + testStepsList + '\"', '\"' + testStepDescriptionsList + '\"'].join(',');
    //       csv += '\r\n';
    //     }

    //   });
    //   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    //   const link = document.createElement('a');
    //   if (link.download !== undefined) {
    //     const url = URL.createObjectURL(blob);
    //     link.setAttribute('href', url);
    //     link.setAttribute('download', fileName);
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //   }
    // } 

    else if (type === 'TEST GROUP') {
      const fileName = 'TestGroup.csv';
      const columnNames = ['TestGroup Name ', 'No of TestCases', 'Test Cases', '', '', ''];
      const header = columnNames.join(',');
      let csv = header;
      csv += '\r\n';
      this.allTestgroup.map(testGrp => {
        console.log('testGrp', testGrp);
        const testCaseNames = testGrp.testCaseNamesList ? testGrp.testCaseNamesList.join('; \r\n') : 'Not Mapped';
        const testCaseCount = testGrp.testCaseNamesList ? testGrp.testCaseNamesList.length : 0;
        let tcn1 = '';
        let tcn2 = '';
        let tcn3 = '';
        let tcn4 = '';
        if (testCaseNames.length > 32765) {
          console.log(' testCaseNames', testCaseNames);
          tcn1 = testCaseNames.slice(0, 32700);
          tcn2 = testCaseNames.slice(32700, testCaseNames.length);
          console.log('tcn1', tcn1);
          console.log('tcn2', tcn2);
          if (tcn2.length > 32765) {
            const temp = tcn2;
            tcn2 = temp.slice(0, 32700);
            tcn3 = temp.slice(32700, temp.length);
            console.log('tcn3', tcn3);
            if (tcn3.length > 32765) {
              const temp1 = tcn3;
              tcn3 = temp1.slice(0, 32700);
              tcn4 = temp1.slice(32700, temp.length);
            }
          }
        } else {
          tcn1 = testCaseNames;
        }
        csv += ['\"' + testGrp.testGroupName + '\"', '\"' + testCaseCount + '\"', '\"' + tcn1 + '\"',
        '\"' + tcn2 + '\"', '\"' + tcn3 + '\"', '\"' + tcn4 + '\"'].join(',');
        csv += '\r\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } else if (type === 'TEST SUITE') {
      const fileName = 'TestSuite.csv';
      const columnNames = ['Test Suite', 'Test Set', 'No of TestCases', 'TestCases'];
      const header = columnNames.join(',');
      let csv = header;
      csv += '\r\n';
      this.allTestsuite.map(testSuite => {
        const moduleName = [];
        console.log('testSuite', testSuite);
        if (typeof testSuite.moduleId == 'string') {
          const temp = _.filter(this.allModules, module => {
            return module._id === testSuite.moduleId;
          })[0]?.moduleName;
          moduleName.push(temp);
        } else {
          testSuite.moduleId?.forEach(ele => {
            const temp = _.filter(this.allModules, module => {
              return module._id === ele;
            })[0]?.moduleName;
            moduleName.push(temp);
          });
        }

        const testCasesNames = testSuite.testCaseNamesList ? testSuite.testCaseNamesList.join('; \r\n') : 'Not Mapped';
        let tcn1 = '';
        let tcn2 = '';
        let tcn3 = '';
        let tcn4 = '';
        if (testCasesNames.length > 32765) {
          console.log(' testCaseNames', testCasesNames);
          tcn1 = testCasesNames.slice(0, 32700);
          tcn2 = testCasesNames.slice(32700, testCasesNames.length);
          console.log('tcn1', tcn1);
          console.log('tcn2', tcn2);
          if (tcn2.length > 32765) {
            const temp = tcn2;
            tcn2 = temp.slice(0, 32700);
            tcn3 = temp.slice(32700, temp.length);
            console.log('tcn3', tcn3);
            if (tcn3.length > 32765) {
              const temp1 = tcn3;
              tcn3 = temp1.slice(0, 32700);
              tcn4 = temp1.slice(32700, temp.length);
            }
          }
        } else {
          tcn1 = testCasesNames;
        }
        const testCaseCount = testSuite.testCases?.length.toString();
        csv += ['\"' + testSuite.testSuiteName + '\"', '\"' + moduleName.join('; \r\n') + '\"', '\"' + testCaseCount + '\"',
        '\"' + tcn1 + '\"', '\"' + tcn2 + '\"', '\"' + tcn3 + '\"', '\"' + tcn4 + '\"'].join(',');
        csv += '\r\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } else if (type === 'TEST SET') {
      const fileName = 'TestSet.csv';
      const columnNames = ['Testset Name', 'TestSuite Count', 'TestSuites'];
      const header = columnNames.join(',');
      let csv = header;
      csv += '\r\n';
      this.allModules.map(module => {
        const count = module.testSuiteNamesList ? module.testSuiteNamesList.length : 0;
        const testsuiteNames = module.testSuiteNamesList ? module.testSuiteNamesList.join('; \r\n') : 'Not Mapped';
        csv += [module.moduleName, count, '\"' + testsuiteNames + '\"'].join(',');
        csv += '\r\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    }
  }

}
