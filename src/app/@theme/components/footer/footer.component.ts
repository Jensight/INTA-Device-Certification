import { Component } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import {environment} from '../../../../environments/environment';
@Component({
    selector: 'app-footer',
    styleUrls: ['./footer.component.scss'],
    templateUrl: './footer.component.html',
})
export class FooterComponent {
    date = new Date();
    buildVersion ;
    constructor(private dataService: DataService){

    }
    ngOnInit() {
      this.buildVersion =  environment.appVersion;
    /*this.dataService.getBuildVersion().subscribe(version => {
      if (version) {
        this.buildVersion = version;
      }
    });*/
    }
}
