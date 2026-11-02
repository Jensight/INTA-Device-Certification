import { Component, OnInit, Input, OnDestroy, ViewChild, EventEmitter, ElementRef } from '@angular/core';
import * as socketIO from 'socket.io-client';
import { SERVER } from '../../../../../models/config';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import * as blobUtil from 'blob-util';
@Component({
    selector: 'app-live-logs',
    templateUrl: './live-logs.component.html'
})
export class LiveLogsComponent implements OnInit, OnDestroy {
    private socketIO;
    @Input()
    jobId;
    @ViewChild('scrollMe', { static: true })
    scrollMe: ElementRef;
    public liveLogs = [];
    public eventEmitter = new EventEmitter(true);
    sub8: any;
    constructor(private tlService: TestLabService, private route: ActivatedRoute, private testBedService: TestBedService,
        private dataService: DataService, private sanitizer: DomSanitizer) {
        this.socketIO = socketIO.connect(SERVER);
    }
    count:any = 0;
    jobData:any = {};
    selectedRegressionId:any;
    selectedTeam: any;
    ngOnInit(): void {
        this.route.params.subscribe(param => {
            this.selectedRegressionId = param['id'];
           
            // this.routeChange();
        });
        this.dataService.selectedTeam.subscribe((team) => {
            if (team) {
              this.selectedTeam = team;
            }
          });
        
        this.socketIO.on('connect', () => {
            this.socketIO.emit('subscribe', this.jobId +'_Live');
        });

        this.socketIO.on(this.jobId + '_Live', data => {
            console.log(JSON.stringify(data));
            let modifiedValue;
            if (data.includes('comment~')) {
                const commentParts = data.split('comment~');
                const datePrefix = commentParts[0].trim(); // Get the timestamp prefix
                if (commentParts.length > 1) {
                    const commentData = commentParts[1].trim();
                    modifiedValue = {
                        mode: 'comment',
                        datePrefix: datePrefix,
                        value: commentData
                    };
                }
            } else if (data.includes('highlight~')) {
                const highlightParts = data.split('highlight~');
                const datePrefix = highlightParts[0].trim(); // Get the timestamp prefix
                if (highlightParts.length > 1) {
                    const highlightData = highlightParts[1].trim();
                    const styleParts = highlightData.split('~');
                    let style = {};
                    if (styleParts.length > 1) {
                        const styleString = styleParts[0].substring(styleParts[0].indexOf('{') + 1, styleParts[0].indexOf('}'));
                        const styleItems = styleString.split(';');
                        styleItems.forEach(styleItem => {
                            const item = styleItem.split('-');
                            if (item.includes('bold')) {
                                style['font-weight'] = 'bold';
                            } else if (item.includes('italic')) {
                                style['font-style'] = 'italic';
                            } else if (item.includes('underline')) {
                                style['text-decoration'] = 'underline';
                            } else if (item.includes('color')) {
                                const colorIndex = item.indexOf('color');
                                if (colorIndex > -1 && item.length > colorIndex + 1) {
                                    style['color'] = item[colorIndex + 1];
                                }
                            } else if (item.includes('bgcolor')) {
                                const bgcolorIndex = item.indexOf('bgcolor');
                                if (bgcolorIndex > -1 && item.length > bgcolorIndex + 1) {
                                    style['background-color'] = item[bgcolorIndex + 1];
                                }
                            } else if (item.includes('fontsize')) {
                                const fontsizeIndex = item.indexOf('fontsize');
                                if (fontsizeIndex > -1 && item.length > fontsizeIndex + 1) {
                                    style['font-size'] = item[fontsizeIndex + 1];
                                }
                            }
                        });
                    }
                    const textValue = styleParts.length > 1 ? styleParts[1].trim() : highlightData;
                    modifiedValue = {
                        mode: 'highlight',
                        datePrefix: datePrefix,
                        value: textValue,
                        style: style
                    };
                }
            } else if (data.includes('~')) {
                const splittedValue = data.split('~');
                const lastValue = splittedValue[splittedValue.length - 1];
                console.log('lastValue => ', lastValue);
                const arr = splittedValue[0].split(':')
                //console.log('splittedValue[0] => ', splittedValue[0]);
                //console.log('splittedValue[1] => ', splittedValue[1].replace(" ", ""));
                //console.log('arr => ', arr[4])
                if (arr[4] === 'img') {
                    modifiedValue = {
                        mode: 'img',
                        value:splittedValue[1].replace(" ",""),
                        showvalue: this.downloadImgnpm(splittedValue[1].replace(" ",""), splittedValue[1].replace(" ","")) // await this.downloadImgnpm(splittedValue[1].replace(" ",""))  //this.sanitizer.bypassSecurityTrustUrl(splittedValue[1].replace(" ","")) //
                    };
                } else {
                    modifiedValue = {
                        mode: 'url',
                        value: lastValue
                    };
                }
            } else if(data.includes('https://')){
                
                let arryUrl = [];
                if(data !== null && typeof data === "string"){
                    arryUrl = data.split("https://");
                }
                
                if(arryUrl.length > 1) {
                    let allUrls = [];
                    let othertextBefore = (arryUrl[0] !== undefined && arryUrl[0].trim() !== '') ? arryUrl[0].trim() + " ['" : "['";
                    let othertextAfter = "";
                    
                    for(let urlIndex = 1; urlIndex < arryUrl.length; urlIndex++) {
                        var othertext1 = arryUrl[urlIndex];
                        var s = othertext1.trim().split(/(?<=^\S+)\s/);
                        var urlWithTrailing = 'https://' + s[0];
                        var trailingChars = urlWithTrailing.match(/['",\]\s]+$/g);
                        var url = urlWithTrailing.replace(/['",\]\s]+$/g, '');
                        console.log(url, "console URL " + urlIndex);
                        allUrls.push(url);
                        
                        if(urlIndex === arryUrl.length - 1) {
                            if(trailingChars) {
                                othertextAfter = "']";
                            } else {
                                othertextAfter = "']";
                            }
                            if(s[1] !== undefined && s[1].trim() !== '') {
                                othertextAfter += " " + s[1].trim();
                            }
                        }
                    }
                                        let urlString = allUrls.join(', ');
                    console.log("All URLs in single line:", urlString);
                    
                    modifiedValue = {
                        mode: 'url',
                        value: urlString,
                        othertxt: othertextBefore,
                        othertxt1: othertextAfter
                    };
                } else {
                    // Fallback to original logic if only one URL
                    const splittedValue = data.split('https://');
                    var s = splittedValue[1].trim().split(/(?<=^\S+)\s/);
                    modifiedValue = {
                        mode: 'url',
                        value: 'https://' + s[0].trim(),
                        othertxt: splittedValue[0] + ' ',
                        othertxt1: ' ' + (s[1] == undefined ? '':" " + s[1] + " ")
                    };
                }
            } else {
                modifiedValue = {
                    mode: 'log',
                    value: data
                };
            }
            var check = data.split(':')
            if(check.length > 1 && check.length >= 3){
                if(check[3] == " TC Result"){
                    this.count++
                    if(this.jobData) {
                        this.socketIO.on(this.selectedRegressionId, data => {
                            this.jobData = _.cloneDeep(_.find(data['job'], { job_id: this.jobId }));
                        })
                    }
                    if(this.jobData && this.jobData.onExecution && this.jobData.onExecution.length == this.count ){
                        var testbedDet = this.jobData.testbed.testBedName.split('_')
                        if(testbedDet[testbedDet.length -1] == 'reused') {
                            this.deleteTestbed(this.jobData.testbed)
                        }
                    }
                    
                }
            }
           // console.log("modifiedvalue", modifiedValue)
            this.liveLogs.push(modifiedValue);
            this.eventEmitter.emit();
            this.scrollMe.nativeElement.scrollTop = this.scrollMe.nativeElement.scrollHeight;

            
        });
    }

    selectingURL(urlVal): any {
        console.log('urlVal => ', urlVal);
        this.tlService.viewWitbeLogsForTestcase(urlVal);
    }
    ngOnDestroy(): any {
        this.socketIO.off('data');
        this.socketIO.disconnect();
    }

    deleteTestbed(deleteEvent) {
        console.log(deleteEvent);
        this.dataService.loading.next(true);
        this.testBedService.deleteTestbed(deleteEvent._id).subscribe(
            (result) => {
              this.dataService.loading.next(false);
              if (result) {
                this.dataService.getTestBedData().next(result);
                /*this.snackBar.open('Testbed Deleted Successfully', 'OK', {
                  duration: 5000,
                });*/
              }
        }, (error) => {
              this.dataService.loading.next(false);
              /*this.snackBar.open('Error Deleting Testbed', 'Try Again', {
                duration: 5000,
              });*/
        });
    }

    downloadImageForWholeRegression(imageUrl){
        //window.open(imageUrl);
        //console.log('inise downloadImg => ', imageUrl);
        console.log('img url in ui', imageUrl);
        this.tlService.downloadImageForWholeRegression(imageUrl);
    }

    downloadImgnpm(value, imageUrl){
        //console.log('inside downloadImgnpm =>  ', imageUrl)
        this.tlService.showimginlivelogs(imageUrl).subscribe((data:any)=>{
            //console.log(data)
            if(data){
                this.liveLogs.forEach((el,index) => {
                    //console.log(el);
                    if(el.value == value){
                        el['showvalue'] = blobUtil.createObjectURL(data);
                        (<HTMLImageElement>document.querySelector("#image" + index)).src= blobUtil.createObjectURL(data);
                        //document.createElement("#image" + index).src = blobUtil.createObjectURL(data);
                    }
                });
            }
        })
        
    }

    openInNextPage(img){
        //console.log('img => ', img);
        window.open(img);
    }
}
