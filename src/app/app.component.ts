import { LoginService } from './@core/services/login.service';
import { DataService } from './@core/services/data.service';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SERVER } from 'src/app/models/config';
import { ServerStatusService } from './@core/services/serverStatus.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
   serverDown = false;
   title = 'vAuto';
  loading: any = false;
  subscription;
  constructor(
      private dataService: DataService,
      private loginService: LoginService,
      private serverStatus: ServerStatusService
  ) {}
  ngOnInit(): void {
    this.serverStatus.serverDown$.subscribe(val => this.serverDown = val);
    this.subscription = this.dataService.loading.subscribe(load => {
        this.loading = load;
    });
    this.loginService.isLoggedIn();
  }
  ngOnDestroy(): void {
      if (this.subscription) {
          this.subscription.unsubscribe();
      }
      if (sessionStorage.xarc_user_logged){
          this.loginService.addlogouttime();
      }
  }

  @HostListener('window:beforeunload', ['$event'])
  async beforeUnloadHandler(): Promise<void> {
    console.log('sessionStorage.loginlogout', sessionStorage.loginlogout);
    if (sessionStorage.xarc_user_logged) {
      const id = JSON.parse(sessionStorage.loginlogout)._id;
      await navigator.sendBeacon(SERVER + 'user/logouttimeById/' + id);
    }
  }
}
