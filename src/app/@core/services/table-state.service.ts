import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TableStateService {
    private state: { [key: string]: { filterState: any[]; currentPage: number } } = {};

    /**
     * Save the state for a specific component.
     * @param key Unique key for the component (e.g., component name or route).
     * @param filters The filter state to save.
     * @param page The current page to save.
     */
    saveState(key: string, filters: any[], page: number): void {
        this.state[key] = { filterState: filters, currentPage: page };
        console.log(`Saved state for ${key}:`, this.state[key]);
    }

    /**
     * Retrieve the state for a specific component.
     * @param key Unique key for the component.
     * @returns The saved state or default values if no state is found.
     */
    getState(key: string): { filterState: any[]; currentPage: number } {
        console.log(`Retrieved state for ${key}:`, this.state[key]);
        return this.state[key] || { filterState: [], currentPage: 1 };
    }

    /**
     * Clear the state for a specific component.
     * @param key Unique key for the component.
     */
    clearState(key: string): void {
        console.log(`Clearing state for ${key}`);
        delete this.state[key];
    }



}