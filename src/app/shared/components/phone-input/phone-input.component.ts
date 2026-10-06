import { Component, Input, forwardRef, signal } from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator,
} from '@angular/forms';
import { PHONE_PREFIXES } from '../../../core/data/spain';

/**
 * Teléfono con selector de prefijo (+34 por defecto).
 * Valor del control: "+34 600123456" (mismo formato que normaliza el backend).
 * Valida: España → 9 dígitos que empiezan por 6, 7, 8 o 9; otros → 6-14 dígitos.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  template: `
    <div class="phone" [class.phone--invalid]="invalid">
      <select class="phone__prefix" (change)="onPrefix($any($event.target).value)"
              [disabled]="disabled()" aria-label="Prefijo telefónico">
        @for (p of prefixes; track p.code) {
          <option [value]="p.code" [selected]="p.code === prefix()">{{ p.label }}</option>
        }
      </select>
      <input class="phone__number" type="tel" inputmode="tel" autocomplete="tel-national"
             [id]="inputId" [value]="number()" [disabled]="disabled()"
             [attr.aria-invalid]="invalid" placeholder="600 000 000"
             (input)="onNumber($any($event.target).value)" (blur)="onTouched()">
    </div>
  `,
  styles: [`
    .phone { display: flex; gap: 0.5rem; }
    .phone__prefix { flex: 0 0 auto; width: auto !important; min-width: 6.5rem; }
    .phone__number { flex: 1 1 auto; min-width: 0; }
    .phone--invalid .phone__number, .phone--invalid .phone__prefix { border-color: #e74c3c !important; }
  `],
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  @Input() inputId = 'phone';
  /** Marca el campo en rojo (lo decide el formulario padre: touched + invalid). */
  @Input() invalid = false;

  readonly prefixes = PHONE_PREFIXES;
  readonly prefix = signal('+34');
  readonly number = signal('');
  readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const text = (value ?? '').trim();
    const match = text.match(/^(\+\d{1,3})\s+(.*)$/);
    if (match && this.prefixes.some(p => p.code === match[1])) {
      this.prefix.set(match[1]);
      this.number.set(match[2]);
    } else if (text.startsWith('+34')) {
      this.prefix.set('+34');
      this.number.set(text.slice(3).trim());
    } else {
      this.prefix.set('+34');
      this.number.set(text);
    }
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled.set(disabled); }

  onPrefix(code: string): void {
    this.prefix.set(code);
    this.emit();
  }

  onNumber(value: string): void {
    this.number.set(value);
    this.emit();
  }

  private emit(): void {
    const digits = this.number().replace(/\D/g, '');
    this.onChange(digits ? `${this.prefix()} ${digits}` : '');
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value = String(control.value ?? '').trim();
    if (!value) return null; // `required` lo gestiona el formulario
    const match = value.match(/^\+(\d{1,3})\s+(\d+)$/);
    if (!match) {
      // Valor antiguo sin prefijo (p. ej. "600123456"): se interpreta como +34
      return /^[6789]\d{8}$/.test(value.replace(/\D/g, '')) ? null : { phone: true };
    }
    const [, prefix, digits] = match;
    if (prefix === '34') return /^[6789]\d{8}$/.test(digits) ? null : { phone: true };
    return /^\d{6,14}$/.test(digits) ? null : { phone: true };
  }
}
