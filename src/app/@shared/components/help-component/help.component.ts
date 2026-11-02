import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../../@core/services/user.service';

@Component({
    selector: 'app-help-display',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpDisplayComponent implements OnInit {
    @Input() docName;
    constructor(private userService: UserService) {}

    ngOnInit(): void {}

    openHelpDoc() {
        this.userService.getHelp().subscribe(
            (d: any) => {
                var w = window.open('about:blank');
                w.document.open();
                w.document
                    .write(`<iframe src="http://${d.ipAddress}:${d.port}/help/${this.docName}"
            style="width: 100%; height:100%"></iframe>`);
                w.document.close();
            },
            e => console.log(e)
        );
    }
}
