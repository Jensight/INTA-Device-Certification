import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  public serverDown$ = new BehaviorSubject<boolean>(false);
}