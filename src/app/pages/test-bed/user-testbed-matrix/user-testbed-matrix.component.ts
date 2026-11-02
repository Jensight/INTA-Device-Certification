import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * User - TestBed Access Matrix
 * -----------------------------
 * Layout mirrors the Model - TC Matrix screen (dynamic scheduler):
 *   - Rows          : usernames (like TC ID / TC Name rows).
 *   - Columns       : one selectable column per testbed (like models).
 *   - Cells         : checkbox — is this user allowed to access that testbed.
 * Persistence: sysConfiguration/updateUserTestbedAccessMatrix
 *   Shape: { [username]: { username: string, testbedIds: string[] } }
 */
@Component({
  selector: 'app-user-testbed-matrix',
  templateUrl: './user-testbed-matrix.component.html',
  styleUrls: ['./user-testbed-matrix.component.scss']
})
export class UserTestbedMatrixComponent implements OnInit, OnDestroy {
  allUsers: any[] = [];
  allTestbeds: any[] = [];

  /** All testbed names available for row selection (already filtered by active/inactive toggle). */
  availableTestbeds: string[] = [];
  selectedTestbeds: string[] = [];
  filteredAvailableTestbeds: string[] = [];
  testbedSearch: string = '';

  /** All usernames available for column selection. */
  availableUsers: string[] = [];
  selectedUsers: string[] = [];
  filteredAvailableUsers: string[] = [];
  userSearch: string = '';

  /** Active-Testbeds toggle: true => show active testbeds only, false => show inactive only. */
  toggleFlag: boolean = true;

  /**
   * Per-cell checkbox state:
   *   cellState[username][testBedName] = boolean
   */
  cellState: { [username: string]: { [tb: string]: boolean } } = {};

  /** Cached user-column header state (select-all testbeds for a user). */
  userColAllChecked: { [username: string]: boolean } = {};
  userColIndeterminate: { [username: string]: boolean } = {};

  /** Cached testbed-row header state (select-all users for a testbed). */
  tbRowAllChecked: { [tb: string]: boolean } = {};
  tbRowIndeterminate: { [tb: string]: boolean } = {};

  isSaving = false;

  /** True only when the logged-in user is 'sysadmin'. Non-sysadmin users get read-only access. */
  isSysAdmin = false;

  /**
   * True when "Restrict Test Bed to User" is enabled for the selected team.
   * When enabled, testbed columns with no persisted mapping default to CHECKED
   * for every displayed user (except Guest), so the admin starts with full
   * access mapped and can then uncheck as needed before saving.
   */
  restrictTestbedToUser = false;

  /** regressionConfig[0].teams from settings — used to read the restrict flag per team. */
  private regressionTeams: any[] = [];

  /** Currently-selected team (matrix rows are scoped per team). */
  selectedTeam: string = '';

  /**
   * Persisted matrix loaded from settings; merged on save.
   * Shape:
   *   { [username]: { username, teams: Array<{ teamName, testbedIds: string[] }> } }
   */
  private existingMatrix: {
    [username: string]: {
      username: string;
      teams: Array<{ teamName: string; testbedIds: string[] }>;
    };
  } = {};

  private subs: any[] = [];

  constructor(
    private dataService: DataService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    // Read-only for non-sysadmin users; sysadmin has full edit access.
    const currentUser: any = this.dataService.getCurrentUser();
    this.isSysAdmin = !!(currentUser && currentUser.username === 'sysadmin');

    this.subs.push(
      this.dataService.selectedTeam.subscribe((team: any) => {
        const newTeam = team ? String(team) : '';
        if (newTeam && newTeam !== this.selectedTeam) {
          this.selectedTeam = newTeam;
          this.cellState = {};
          this.selectedTestbeds = [];
          this.selectedUsers = [];
          this.updateRestrictFlag();
          this.rebuildAvailableUsers();
          this.applyStatusFilter();
        }
      })
    );

    this.subs.push(
      this.dataService.getTestBed().subscribe((tb: any[]) => {
        this.allTestbeds = tb || [];
        this.applyStatusFilter();
      })
    );

    this.loadUsersAndMatrix();
  }

  /**
   * Rebuild `availableTestbeds` from `allTestbeds` filtered by the Active-Testbeds toggle.
   * Mirrors the Testbed view: toggleFlag=true keeps everything NOT marked inactive.
   * Also prunes any currently-selected testbeds that are no longer visible.
   */
  private applyStatusFilter() {
    const filtered = (this.allTestbeds || []).filter((t: any) => {
      const isInactive = t && t.status && t.status === 'inactive';
      return this.toggleFlag ? !isInactive : isInactive;
    });
    this.availableTestbeds = filtered
      .map((t: any) => t && t.testBedName)
      .filter((n: string) => !!n);
    this.filteredAvailableTestbeds = this.availableTestbeds
      .filter(n => !this.testbedSearch || n.toLowerCase().includes(this.testbedSearch));
    const stillAvailable = new Set(this.availableTestbeds);
    this.selectedTestbeds = this.selectedTestbeds.filter(n => stillAvailable.has(n));
    this.rebuildCellState();
  }

  toggleActiveTestbeds() {
    // Flipping the Active-Testbeds toggle resets both dropdowns: the testbed
    // list changes (active <-> inactive) so selections are pruned, and we also
    // clear Select Users so the matrix starts fresh until the admin re-picks.
    this.selectedUsers = [];
    this.applyStatusFilter();
  }

  /** Read `restrict_testbed_to_user` for the selected team from cached regression config. */
  private updateRestrictFlag() {
    const teamCfg = (this.regressionTeams || []).find((t: any) => t && t.name === this.selectedTeam);
    this.restrictTestbedToUser = !!(teamCfg && teamCfg.restrict_testbed_to_user);
  }

  ngOnDestroy() {
    this.subs.forEach(s => s && s.unsubscribe && s.unsubscribe());
  }

  private loadUsersAndMatrix() {
    this.userService.getAllusers().subscribe(
      (data: any) => {
        const settings = Array.isArray(data) ? data[0] : data;
        const rawUsers = (settings && Array.isArray(settings.users)) ? settings.users : [];
        // Only active users are eligible rows in the matrix — mirrors the
        // "Active Users" view in User Management (status !== 'in-active').
        this.allUsers = rawUsers.filter((u: any) => u && u.status !== 'in-active');
        this.rebuildAvailableUsers();

        const raw = (settings && settings.userTestbedAccessMatrix) ? settings.userTestbedAccessMatrix : {};
        // Cache regression team configs so we can read the restrict flag per team.
        this.regressionTeams = (settings && Array.isArray(settings.regressionConfig)
          && settings.regressionConfig[0] && Array.isArray(settings.regressionConfig[0].teams))
          ? settings.regressionConfig[0].teams
          : [];
        this.updateRestrictFlag();
        const normalised: any = {};
        Object.keys(raw || {}).forEach((username) => {
          const entry = raw[username];
          if (!entry || typeof entry !== 'object') return;
          // Back-compat: older flat shape had { username, testbedIds[] } with no teams.
          // Migrate that into a teams array bucketed under the current team (best-effort).
          if (Array.isArray(entry.testbedIds) && !entry.teams) {
            const teamsArr: Array<{ teamName: string; testbedIds: string[] }> = [];
            if (this.selectedTeam) {
              teamsArr.push({ teamName: this.selectedTeam, testbedIds: entry.testbedIds });
            }
            normalised[username] = { username: entry.username || username, teams: teamsArr };
            return;
          }
          // Normalise teams into an array regardless of whether the persisted shape
          // is the new array-of-objects or the legacy map keyed by teamName.
          const teamsArr: Array<{ teamName: string; testbedIds: string[] }> = [];
          if (Array.isArray(entry.teams)) {
            entry.teams.forEach((teamEntry: any) => {
              if (!teamEntry || typeof teamEntry !== 'object' || !teamEntry.teamName) return;
              teamsArr.push({
                teamName: teamEntry.teamName,
                testbedIds: Array.isArray(teamEntry.testbedIds) ? teamEntry.testbedIds : []
              });
            });
          } else if (entry.teams && typeof entry.teams === 'object') {
            Object.keys(entry.teams).forEach((teamName) => {
              const teamEntry = entry.teams[teamName];
              if (!teamEntry || typeof teamEntry !== 'object') return;
              teamsArr.push({
                teamName: teamEntry.teamName || teamName,
                testbedIds: Array.isArray(teamEntry.testbedIds) ? teamEntry.testbedIds : []
              });
            });
          }
          normalised[username] = { username: entry.username || username, teams: teamsArr };
        });
        this.existingMatrix = normalised;
        this.rebuildCellState();
      },
      () => {
        this.allUsers = [];
        this.existingMatrix = {};
      }
    );
  }

  // ------------- Testbed column selector -------------
  filterTestbeds(term: string) {
    this.testbedSearch = (term || '').toLowerCase();
    this.filteredAvailableTestbeds = this.availableTestbeds
      .filter(n => n.toLowerCase().includes(this.testbedSearch));
  }

  get isAllTestbedsSelected(): boolean {
    return this.availableTestbeds.length > 0
      && this.selectedTestbeds.length === this.availableTestbeds.length;
  }

  get isSomeTestbedsSelected(): boolean {
    return this.selectedTestbeds.length > 0
      && this.selectedTestbeds.length < this.availableTestbeds.length;
  }

  toggleSelectAllTestbeds() {
    this.selectedTestbeds = this.isAllTestbedsSelected ? [] : [...this.availableTestbeds];
    // Programmatic changes to selectedTestbeds do NOT fire mat-select's
    // (selectionChange), so we must rebuild cell state ourselves; otherwise
    // previously-saved checkbox states won't render for the newly-visible columns.
    this.rebuildCellState();
  }

  onTestbedsSelectionChange() {
    this.rebuildCellState();
  }

  // ------------- User column selector -------------
  /** Rebuild `availableUsers` from `allUsers`; start with NO users selected. */
  private rebuildAvailableUsers() {
    this.availableUsers = (this.allUsers || [])
      .map((u: any) => this.getUserName(u))
      .filter((n: string) => !!n);
    this.filteredAvailableUsers = this.availableUsers
      .filter(n => !this.userSearch || n.toLowerCase().includes(this.userSearch));
    const stillAvailable = new Set(this.availableUsers);
    // Start empty: the "Select Users" dropdown shows nothing until the user
    // explicitly picks entries. Only prune selections that are no longer available.
    this.selectedUsers = this.selectedUsers.filter(n => stillAvailable.has(n));
  }

  filterUsers(term: string) {
    this.userSearch = (term || '').toLowerCase();
    this.filteredAvailableUsers = this.availableUsers
      .filter(n => n.toLowerCase().includes(this.userSearch));
  }

  get isAllUsersSelected(): boolean {
    return this.availableUsers.length > 0
      && this.selectedUsers.length === this.availableUsers.length;
  }

  get isSomeUsersSelected(): boolean {
    return this.selectedUsers.length > 0
      && this.selectedUsers.length < this.availableUsers.length;
  }

  toggleSelectAllUsers() {
    this.selectedUsers = this.isAllUsersSelected ? [] : [...this.availableUsers];
    this.recomputeHeaders();
  }

  onUsersSelectionChange() {
    this.recomputeHeaders();
  }

  // ------------- Matrix cell logic -------------

  /**
   * Rebuild cellState so each visible (user × selected testbed) cell has an
   * explicit boolean. Existing saved state wins; anything else defaults to false.
   * Only reads the currently selected team's slice under each user.
   */
  rebuildCellState() {
    const rebuilt: { [u: string]: { [tb: string]: boolean } } = {};
    const teamKey = this.selectedTeam;
    this.allUsers.forEach(u => {
      const uname = this.getUserName(u);
      if (!uname) return;
      rebuilt[uname] = rebuilt[uname] || {};
      const teamsArr = (this.existingMatrix[uname] && this.existingMatrix[uname].teams) || [];
      const teamEntry = teamKey ? teamsArr.find(t => t && t.teamName === teamKey) : null;
      const hasTeamSlice = !!teamEntry;
      const savedIds = new Set<string>((teamEntry && teamEntry.testbedIds) || []);
      // When the restrict toggle is ON and this user has no persisted mapping yet
      // for the selected team, default their columns to CHECKED (except Guest).
      const isGuest = uname.toLowerCase() === 'guest';
      const defaultChecked = this.restrictTestbedToUser && !hasTeamSlice && !isGuest;
      this.selectedTestbeds.forEach(tbName => {
        const tbDoc = this.allTestbeds.find(t => t && t.testBedName === tbName);
        const tbId = tbDoc && tbDoc._id ? tbDoc._id.toString() : tbName;
        const savedOrDefault = hasTeamSlice ? savedIds.has(tbId) : defaultChecked;
        // Prefer existing cellState (unsaved user edits), then saved/default data.
        const prior = this.cellState[uname] && (this.cellState[uname][tbName] !== undefined)
          ? this.cellState[uname][tbName]
          : savedOrDefault;
        rebuilt[uname][tbName] = !!prior;
      });
    });
    this.cellState = rebuilt;
    this.recomputeHeaders();
  }

  isCellChecked(user: any, tbName: string): boolean {
    const uname = this.getUserName(user);
    return !!(this.cellState[uname] && this.cellState[uname][tbName]);
  }

  /** Cell lookup used by the transposed view (testbed rows × user columns). */
  isCellCheckedByName(uname: string, tbName: string): boolean {
    return !!(this.cellState[uname] && this.cellState[uname][tbName]);
  }

  /** Toggle a single (user, testbed) cell in the transposed view. */
  toggleCellByName(uname: string, tbName: string, checked: boolean) {
    if (!this.isSysAdmin) return;
    if (!uname) return;
    if (!this.cellState[uname]) this.cellState[uname] = {};
    this.cellState[uname][tbName] = !!checked;
    this.recomputeUserColumn(uname);
    this.recomputeTestbedRow(tbName);
  }

  /** Column header: select / unselect every visible testbed for this user. */
  toggleUserColumn(uname: string, checked: boolean) {
    if (!this.isSysAdmin) return;
    if (!uname) return;
    if (!this.cellState[uname]) this.cellState[uname] = {};
    this.selectedTestbeds.forEach(tbName => {
      this.cellState[uname][tbName] = !!checked;
    });
    this.recomputeUserColumn(uname);
    this.selectedTestbeds.forEach(tbName => this.recomputeTestbedRow(tbName));
  }

  /** Row header: select / unselect every visible user for this testbed. */
  toggleTestbedRow(tbName: string, checked: boolean) {
    if (!this.isSysAdmin) return;
    this.selectedUsers.forEach(uname => {
      if (!uname) return;
      if (!this.cellState[uname]) this.cellState[uname] = {};
      this.cellState[uname][tbName] = !!checked;
    });
    this.recomputeTestbedRow(tbName);
    this.selectedUsers.forEach(uname => this.recomputeUserColumn(uname));
  }

  private recomputeHeaders() {
    this.selectedUsers.forEach(uname => this.recomputeUserColumn(uname));
    this.selectedTestbeds.forEach(tbName => this.recomputeTestbedRow(tbName));
  }

  private recomputeUserColumn(uname: string) {
    let total = 0;
    let checked = 0;
    this.selectedTestbeds.forEach(tbName => {
      total++;
      if (this.cellState[uname] && this.cellState[uname][tbName]) checked++;
    });
    this.userColAllChecked[uname] = total > 0 && checked === total;
    this.userColIndeterminate[uname] = checked > 0 && checked < total;
  }

  private recomputeTestbedRow(tbName: string) {
    let total = 0;
    let checked = 0;
    this.selectedUsers.forEach(uname => {
      if (!uname) return;
      total++;
      if (this.cellState[uname] && this.cellState[uname][tbName]) checked++;
    });
    this.tbRowAllChecked[tbName] = total > 0 && checked === total;
    this.tbRowIndeterminate[tbName] = checked > 0 && checked < total;
  }

  // ------------- Save -------------
  saveMatrix() {
    // Guard: non-sysadmin users have read-only access.
    if (!this.isSysAdmin) {
      this.snackBar.open('Only sysadmin can update the User - TestBed Access Matrix.', 'OK', { duration: 3000 });
      return;
    }
    if (this.selectedTestbeds.length === 0) {
      this.snackBar.open('Please select at least one testbed.', 'OK', { duration: 3000 });
      return;
    }
    if (this.selectedUsers.length === 0) {
      this.snackBar.open('Please select at least one user.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.selectedTeam) {
      this.snackBar.open('No team selected. Please select a team first.', 'OK', { duration: 3000 });
      return;
    }

    const teamKey = this.selectedTeam;

    // Deep-clone existing saved data so we do not drop other teams' access lists
    // nor testbeds the user did not display.
    const matrixMap: {
      [u: string]: {
        username: string;
        teams: Array<{ teamName: string; testbedIds: string[] }>;
      };
    } = {};
    Object.keys(this.existingMatrix || {}).forEach(u => {
      const src = this.existingMatrix[u];
      const clonedTeams: Array<{ teamName: string; testbedIds: string[] }> = (src.teams || []).map(t => ({
        teamName: t.teamName,
        testbedIds: [...(t.testbedIds || [])]
      }));
      matrixMap[u] = { username: src.username || u, teams: clonedTeams };
    });

    // Overwrite ONLY the currently selected team's slice for the visible users,
    // and only for the currently visible testbed rows.
    this.selectedUsers.forEach(uname => {
      if (!uname) return;
      if (!matrixMap[uname]) matrixMap[uname] = { username: uname, teams: [] };
      let teamSlice = matrixMap[uname].teams.find(t => t && t.teamName === teamKey);
      if (!teamSlice) {
        teamSlice = { teamName: teamKey, testbedIds: [] };
        matrixMap[uname].teams.push(teamSlice);
      }

      this.selectedTestbeds.forEach(tbName => {
        const tbDoc = this.allTestbeds.find(t => t && t.testBedName === tbName);
        const tbId = tbDoc && tbDoc._id ? tbDoc._id.toString() : tbName;
        const checked = this.cellState[uname] && this.cellState[uname][tbName];
        // Remove any prior entry for this visible testbed then re-add if checked.
        teamSlice.testbedIds = teamSlice.testbedIds.filter(id => id !== tbId);
        if (checked) teamSlice.testbedIds.push(tbId);
      });
    });

    this.isSaving = true;
    this.userService.updateUserTestbedAccessMatrix(matrixMap).subscribe(
      () => {
        this.isSaving = false;
        this.existingMatrix = matrixMap;
        // Broadcast the update so any open scheduler screens re-apply their
        // testbed filters immediately (no page refresh required).
        this.dataService.notifyUserTestbedAccessMatrixChanged(matrixMap);
        this.snackBar.open('User - TestBed Access Matrix saved successfully.', 'OK', { duration: 3000 });
      },
      () => {
        this.isSaving = false;
        this.snackBar.open('Error saving User - TestBed Access Matrix.', 'Try Again', { duration: 3000 });
      }
    );
  }

  // ------------- Helpers -------------
  getUserName(user: any): string {
    if (!user) return '';
    return user.username || user.userName || user.name || '';
  }

  trackByUser = (_: number, u: any): string => this.getUserName(u) || String(_);
  trackByUserName = (_: number, u: string): string => u;
  trackByTestbed = (_: number, tb: string): string => tb;
}
