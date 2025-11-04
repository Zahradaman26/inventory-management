import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
@Component({
    selector: 'app-wizard',
    standalone: true,
    imports: [BreadcrumbComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './wizard.component.html',
    styleUrl: './wizard.component.css'
})
export class WizardComponent {
    title = 'Wizard';
    constructor() { }


    // Handles the next button click
    onNextClick(event: Event) {
        const button = event.target as HTMLElement;
        const parentFieldset = button.closest('.wizard-fieldset') as HTMLElement;
        const formWizard = button.closest('.form-wizard') as HTMLElement;
        const currentActiveStep = formWizard.querySelector('.form-wizard-list .active') as HTMLElement;

        let nextWizardStep = true;

        parentFieldset.querySelectorAll<HTMLInputElement>('.wizard-required').forEach(input => {
            if (input.value.trim() === '') {
                (input.nextElementSibling as HTMLElement).style.display = 'block';
                nextWizardStep = false;
            } else {
                (input.nextElementSibling as HTMLElement).style.display = 'none';
            }
        });

        if (nextWizardStep) {
            parentFieldset.classList.remove('show');
            currentActiveStep.classList.remove('active');
            currentActiveStep.classList.add('activated');
            const nextFieldset = parentFieldset.nextElementSibling as HTMLElement;
            nextFieldset.classList.add('show');

            this.updateWizardSteps(formWizard);
        }
    }

    // Handles the previous button click
    onPreviousClick(event: Event) {
        const button = event.target as HTMLElement;
        const parentFieldset = button.closest('.wizard-fieldset') as HTMLElement;
        const formWizard = button.closest('.form-wizard') as HTMLElement;
        const currentActiveStep = formWizard.querySelector('.form-wizard-list .active') as HTMLElement;

        parentFieldset.classList.remove('show');
        const previousFieldset = parentFieldset.previousElementSibling as HTMLElement;
        previousFieldset.classList.add('show');

        currentActiveStep.classList.remove('active');
        const previousStep = currentActiveStep.previousElementSibling as HTMLElement;
        previousStep.classList.remove('activated');
        previousStep.classList.add('active');

        this.updateWizardSteps(formWizard);
    }

    // Handles the form submission validation
    onSubmitClick(event: Event) {
        const button = event.target as HTMLElement;
        const parentFieldset = button.closest('.wizard-fieldset') as HTMLElement;

        parentFieldset.querySelectorAll<HTMLInputElement>('.wizard-required').forEach(input => {
            if (input.value.trim() === '') {
                (input.nextElementSibling as HTMLElement).style.display = 'block';
            } else {
                (input.nextElementSibling as HTMLElement).style.display = 'none';
            }
        });
    }

    // Handles focus and blur input field validation
    onInputBlur(event: Event) {
        const input = event.target as HTMLInputElement;

        if (input.value.trim() === '') {
            input.parentElement?.classList.remove('focus-input');
            const errorElement = input.nextElementSibling as HTMLElement;
            if (errorElement) errorElement.style.display = 'block';
        } else {
            input.parentElement?.classList.add('focus-input');
            const errorElement = input.nextElementSibling as HTMLElement;
            if (errorElement) errorElement.style.display = 'none';
        }
    }

    onInputFocus(event: Event) {
        const input = event.target as HTMLInputElement;
        input.parentElement?.classList.add('focus-input');
    }

    // Updates the moving step indicator
    private updateWizardSteps(formWizard: HTMLElement) {
        formWizard.querySelectorAll('.wizard-fieldset').forEach(fieldset => {
            if (fieldset.classList.contains('show')) {
                const formAttr = fieldset.getAttribute('data-tab-content');
                formWizard.querySelectorAll('.form-wizard-list .form-wizard-step-item').forEach(stepItem => {
                    if (stepItem.getAttribute('data-attr') === formAttr) {
                        stepItem.classList.add('active');
                        const stepMove = formWizard.querySelector('.form-wizard-step-move') as HTMLElement;
                        const position = (stepItem as HTMLElement).offsetLeft;
                        const width = (stepItem as HTMLElement).offsetWidth;

                        stepMove.style.left = `${position}px`;
                        stepMove.style.width = `${width}px`;
                    } else {
                        stepItem.classList.remove('active');
                    }
                });
            }
        });
    }
}
