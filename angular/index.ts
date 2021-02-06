import { AfterViewInit, Directive, ElementRef, HostListener, Inject, NgModule, forwardRef } from "@angular/core";
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { BaseValueAccessor, registerElement } from "@nativescript/angular";
import { View } from "@nativescript/core";
import { DropDown } from "nativescript-drop-down";

registerElement("DropDown", () => DropDown);

const SELECTED_INDEX_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectedIndexValueAccessor), multi: true
};

export type SelectableView = { selectedIndex: number } & View;

/**
 * The accessor for setting a selectedIndex and listening to changes that is used by the
 * {@link NgModel} directives.
 *
 *  ### Example
 *  ```
 *  <DropDown [(ngModel)]="model.test">
 *  ```
 */
@Directive({
  // tslint:disable-next-line:max-line-length directive-selector
  selector: "DropDown[ngModel], DropDown[formControl], DropDown[formControlName], dropDown[ngModel], dropDown[formControl], dropDown[formControlName], drop-down[ngModel], drop-down[formControl], drop-down[formControlName]",
  providers: [SELECTED_INDEX_VALUE_ACCESSOR]
})
export class SelectedIndexValueAccessor extends BaseValueAccessor<SelectableView> implements AfterViewInit { // tslint:disable-line:max-line-length directive-class-suffix

  private _normalizedValue: number;
  private viewInitialized: boolean;

  constructor(@Inject(ElementRef) elementRef: ElementRef) {
    super(elementRef.nativeElement);
  }

  @HostListener("selectedIndexChange", ["$event"])
  public selectedIndexChangeListener(event: any) {
    this.onChange(event.value);
  }

  // tslint:disable-next-line:no-empty
  public onTouched = () => { };

  public writeValue(value: any): void {
    if (value === undefined || value === null || value === "") {
      this._normalizedValue = null;
    }
    else {
      this._normalizedValue = value;
    }

    if (this.viewInitialized) {
      this.view.selectedIndex = this._normalizedValue;
    }
  }

  public ngAfterViewInit() {
    this.viewInitialized = true;
    this.view.selectedIndex = this._normalizedValue;
  }

  public registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}

@NgModule({
  declarations: [SelectedIndexValueAccessor],
  providers: [],
  imports: [
    ReactiveFormsModule
  ],
  exports: [
    SelectedIndexValueAccessor,
    ReactiveFormsModule
  ]
})
export class DropDownModule {
}
