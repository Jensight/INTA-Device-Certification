import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDiaogComponent implements OnInit {
    actionName = 'Delete'
    showCloseButton: boolean = false;
    safeHtml: SafeHtml = '';

    // Paginated table support
    pageSize = 5;
    currentPage = 0;
    pagedRows: any[] = [];
    totalPages = 0;
    allFilteredRows: any[] = [];
    columnFilters: { [key: string]: string } = {};

    constructor(
        public dialogRef: MatDialogRef<ConfirmationDiaogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        console.log("ConfirmationDialogComponent initialized with data:", this.data);
        
        if (this.data && this.data.showCloseButton) {
            console.log("Setting showCloseButton to true");
            
            this.showCloseButton = true;
        }
        if (this.data && this.data.isHtml && this.data.text) {
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.data.text);
        }
        if (this.data && this.data.isPaginatedTable && this.data.tableRows) {
            this.allFilteredRows = [...this.data.tableRows];
            this.totalPages = Math.ceil(this.allFilteredRows.length / this.pageSize);
            this.updatePage();
        }
    }

    updatePage() {
        const start = this.currentPage * this.pageSize;
        this.pagedRows = this.allFilteredRows.slice(start, start + this.pageSize);
    }

    applyTableFilter(key: string, event: Event) {
        const val = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.columnFilters[key] = val;
        this.allFilteredRows = (this.data.tableRows || []).filter((row: any) => {
            return Object.keys(this.columnFilters).every(k => {
                if (!this.columnFilters[k]) return true;
                return (row[k] || '').toString().toLowerCase().includes(this.columnFilters[k]);
            });
        });
        this.currentPage = 0;
        this.totalPages = Math.ceil(this.allFilteredRows.length / this.pageSize);
        this.updatePage();
    }

    goToPage(page: number) {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
            this.updatePage();
        }
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    close() {
        this.dialogRef.close();
    }
}
