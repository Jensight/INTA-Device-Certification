import { ReservationChartDisplayComponent } from './cpe-detailed-analysis/reservation-chart-display/reservation-chart.component';
import { ReservationStreakComponent } from './cpe-detailed-analysis/reservation-streak/reservation-streak.component';
import { ReservationChartComponent } from './cpe-detailed-analysis/reservation-trend/reservation-chart.component';
import { CPEDetailedAnalysisComponent } from './cpe-detailed-analysis/cpe-detailed-analysis.component';
import { CPEStatusCardComponent } from './status-card.component';


export const CPE_STATUS = [
    CPEStatusCardComponent,
    CPEDetailedAnalysisComponent,
    ReservationChartComponent,
    ReservationStreakComponent,
    ReservationChartDisplayComponent
]

export const CPE_ROUTES = {
    path: 'reservation-analysis',
    component: CPEDetailedAnalysisComponent
}
