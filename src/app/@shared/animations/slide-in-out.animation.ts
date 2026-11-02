
import { trigger, animate, transition, style } from '@angular/animations';

export const slideInOutAnimation =
    // trigger name for attaching this animation to an element using the [@triggerName] syntax
    [
        trigger(
            'routeSlide', [

                transition('* => back', [
                    style({ transform: 'translateX(-100%)', opacity: 1 }),
                    animate('450ms', style({ transform: 'translateX(0%)', opacity: 1 }))
                ]),
                transition('* => next', [
                    style({ transform: 'translateX(100%)', opacity: 0 }),
                    animate('450ms', style({ transform: 'translateX(0%)', opacity: 1 }))
                ]),
                transition('next => middle', [
                    style({ opacity: 0 }),
                ]),
                transition('next => back', [
                    style({ opacity: 0 }),
                ])

            ]
        )
    ]
