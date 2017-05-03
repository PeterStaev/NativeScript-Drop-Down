/*! *****************************************************************************
Copyright (c) 2017 Tangra Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
***************************************************************************** */
import { Color } from "color";
import { Label } from "ui/label";
import { ItemsSource } from "ui/list-picker";
import { Font } from "ui/styling/font";
import {
    TextAlignment,
    TextDecoration,
    TextTransform,
    letterSpacingProperty,
    textAlignmentProperty,
    textDecorationProperty,
    textTransformProperty
} from "ui/text-base";
import * as types from "utils/types";
import * as utils from "utils/utils";
import { SelectedIndexChangedEventData } from ".";
import {
    DropDownBase,
    Length,
    backgroundColorProperty,
    colorProperty,
    fontInternalProperty,
    hintProperty,
    itemsProperty,
    layout,
    paddingBottomProperty,
    paddingLeftProperty,
    paddingRightProperty,
    paddingTopProperty,
    selectedIndexProperty
} from "./drop-down-common";

export * from "./drop-down-common";

const TOOLBAR_HEIGHT = 44;
const HINT_COLOR = new Color("#3904041E");

export class DropDown extends DropDownBase {
    public _listPicker: UIPickerView;
    public nativeView: TNSDropDownLabel;
    
    private _dropDownDelegate: DropDownListPickerDelegateImpl;
    private _dropDownDataSource: DropDownListDataSource;

    private _toolbar: UIToolbar;
    private _flexToolbarSpace: UIBarButtonItem;
    private _doneButton: UIBarButtonItem;
    private _doneTapDelegate: TapHandler;
    private _accessoryViewVisible: boolean;

    constructor() {
        super();
        
        const applicationFrame = utils.ios.getter(UIScreen, UIScreen.mainScreen).applicationFrame;

        this.nativeView = TNSDropDownLabel.initWithOwner(new WeakRef(this));
        this.nativeView.userInteractionEnabled = true;
        this._listPicker = UIPickerView.alloc().init();

        this._dropDownDelegate = DropDownListPickerDelegateImpl.initWithOwner(new WeakRef(this));
        this._dropDownDataSource = DropDownListDataSource.initWithOwner(new WeakRef(this));
        this._flexToolbarSpace = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.FlexibleSpace, null, null);
        this._doneTapDelegate = TapHandler.initWithOwner(new WeakRef(this));
        this._doneButton = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.Done, this._doneTapDelegate, "tap");

        this._accessoryViewVisible = true;
        this._toolbar = UIToolbar.alloc().initWithFrame(CGRectMake(0, 0, applicationFrame.size.width, TOOLBAR_HEIGHT));
        this._toolbar.autoresizingMask = UIViewAutoresizing.FlexibleWidth;

        const nsArray = NSMutableArray.alloc<UIBarButtonItem>().init();
        nsArray.addObject(this._flexToolbarSpace);
        nsArray.addObject(this._doneButton);
        this._toolbar.setItemsAnimated(nsArray, false);
    }
    
    get ios(): TNSDropDownLabel {
        return this.nativeView;
    }

    get accessoryViewVisible(): boolean {
        return this._accessoryViewVisible;
    }
    set accessoryViewVisible(value: boolean) {
        this._accessoryViewVisible = value;
        this._showHideAccessoryView();
    }

    public onLoaded() {
        super.onLoaded();

        this._listPicker.delegate = this._dropDownDelegate;
        this._listPicker.dataSource = this._dropDownDataSource;

        this.ios.inputView = this._listPicker;
        this._showHideAccessoryView();
    }

    public onUnloaded() {
        this.ios.inputView = null;
        this.ios.inputAccessoryView = null;

        this._listPicker.delegate = null;
        this._listPicker.dataSource = null;

        this._doneTapDelegate = null;
        this._dropDownDelegate = null;
        this._dropDownDataSource = null;

        super.onUnloaded();
    }

    public open() {
        this.ios.becomeFirstResponder();
    }

    public [selectedIndexProperty.getDefault](): number {
        return null;
    }
    public [selectedIndexProperty.setNative](value: number) {
        if (value >= 0) {
            this._listPicker.selectRowInComponentAnimated(value, 0, true);
        }

        this.ios.setText(this._getItemAsString(value));
    }

    public [itemsProperty.getDefault](): any[] {
        return null;
    }
    public [itemsProperty.setNative](value: any[] | ItemsSource) {
        this._listPicker.reloadAllComponents();

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }

    public [hintProperty.getDefault](): string {
        return "";
    }
    public [hintProperty.setNative](value: string) {
        this.ios.hint = value;
    }

    public [colorProperty.getDefault](): UIColor {
        return this.nativeView.color;
    }
    public [colorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;

        this.nativeView.color = color;
        this._listPicker.tintColor = color;
        this._listPicker.reloadAllComponents();
    }

    public [backgroundColorProperty.getDefault](): UIColor {
        return this.nativeView.backgroundColor;
    }
    public [backgroundColorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;

        this.nativeView.backgroundColor = color;
        this._listPicker.backgroundColor = color;
        this._listPicker.reloadAllComponents();
    }

    public [fontInternalProperty.getDefault](): UIFont {
        return this.nativeView.font;
    }
    public [fontInternalProperty.setNative](value: Font | UIFont) {
        const font = value instanceof Font ? value.getUIFont(this.nativeView.font) : value;
        this.nativeView.font = font;
    }

    public [textAlignmentProperty.setNative](value: TextAlignment) {
        switch (value) {
            case "left":
                this.nativeView.textAlignment = NSTextAlignment.Left;
                break;

            case "center":
                this.nativeView.textAlignment = NSTextAlignment.Center;
                break;

            case "right":
                this.nativeView.textAlignment = NSTextAlignment.Right;
                break;
        }
    }

    public [textDecorationProperty.setNative](value: TextDecoration) {
        this._setTextAttributes();
    }

    public [textTransformProperty.setNative](value: TextTransform) {
        this._setTextAttributes();
    }

    public [letterSpacingProperty.setNative](value: number) {
        this._setTextAttributes();
    }

    public [paddingTopProperty.setNative](value: Length) {
        this._setPadding({ top: layout.toDeviceIndependentPixels(this.effectivePaddingTop) });
    }

    public [paddingRightProperty.setNative](value: Length) {
        this._setPadding({ right: layout.toDeviceIndependentPixels(this.effectivePaddingRight) });
    }

    public [paddingBottomProperty.setNative](value: Length) {
        this._setPadding({ bottom: layout.toDeviceIndependentPixels(this.effectivePaddingBottom) });
    }

    public [paddingLeftProperty.setNative](value: Length) {
        this._setPadding({ left: layout.toDeviceIndependentPixels(this.effectivePaddingLeft) });
    }

    public _setTextAttributes() {
        const style = this.style;
        const attributes = new Map<string, any>();

        switch (style.textDecoration) {
            case "none":
                break;

            case "underline":
                attributes.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.StyleSingle);
                break;

            case "line-through":
                attributes.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.StyleSingle);
                break;
                
            case "underline line-through":
                attributes.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.StyleSingle);
                attributes.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.StyleSingle);
                break;
        }

        if (style.letterSpacing !== 0) {
            attributes.set(NSKernAttributeName, style.letterSpacing * this.nativeView.font.pointSize);
        }

        if (this.nativeView.textColor && attributes.size > 0) {
            attributes.set(NSForegroundColorAttributeName, this.nativeView.textColor);
        }

        const text: string = types.isNullOrUndefined(this.nativeView.text) ? "" : this.nativeView.text.toString();
        let sourceString: string;
        switch (style.textTransform) {
            case "uppercase":
                sourceString = NSString.stringWithString(text).uppercaseString;
                break;

            case "lowercase":
                sourceString = NSString.stringWithString(text).lowercaseString;
                break;

            case "capitalize":
                sourceString = NSString.stringWithString(text).capitalizedString;
                break;

            default:
                sourceString = text;
        }

        if (attributes.size > 0) {
            const result = NSMutableAttributedString.alloc().initWithString(sourceString);
            result.setAttributesRange(attributes as any, { location: 0, length: sourceString.length });
            this.nativeView.attributedText = result;
        }
        else {
            // Clear attributedText or text won't be affected.
            this.nativeView.attributedText = undefined;
            this.nativeView.text = sourceString;
        }
    }
    
    private _setPadding(newPadding: { top?: number, right?: number, bottom?: number, left?: number }) {
        const nativeView = this.nativeView;
        const padding = nativeView.padding;
        nativeView.padding = Object.assign(padding, newPadding);
    }

    private _showHideAccessoryView() {
        this.ios.inputAccessoryView = (this._accessoryViewVisible ? this._toolbar : null);
    }
}

class TapHandler extends NSObject {
    public static ObjCExposedMethods = {
        tap: { returns: interop.types.void, params: [] }
    };

    public static initWithOwner(owner: WeakRef<DropDown>) {
        const tapHandler = TapHandler.new() as TapHandler;
        tapHandler._owner = owner;

        return tapHandler;
    }

    private _owner: WeakRef<DropDown>;

    public tap() {
        this._owner.get().ios.resignFirstResponder();
    }
}

class DropDownListDataSource extends NSObject implements UIPickerViewDataSource {
    public static ObjCProtocols = [UIPickerViewDataSource];

    public static initWithOwner(owner: WeakRef<DropDown>): DropDownListDataSource {
        const dataSource = DropDownListDataSource.new() as DropDownListDataSource;

        dataSource._owner = owner;

        return dataSource;
    }

    private _owner: WeakRef<DropDown>;

    public numberOfComponentsInPickerView(pickerView: UIPickerView) {
        return 1;
    }

    public pickerViewNumberOfRowsInComponent(pickerView: UIPickerView, component: number) {
        const owner = this._owner.get();
        return (owner && owner.items) ? owner.items.length : 0;
    }
}

class DropDownListPickerDelegateImpl extends NSObject implements UIPickerViewDelegate {
    public static ObjCProtocols = [UIPickerViewDelegate];
    
    public static initWithOwner(owner: WeakRef<DropDown>): DropDownListPickerDelegateImpl {
        const delegate = DropDownListPickerDelegateImpl.new() as DropDownListPickerDelegateImpl;
        
        delegate._owner = owner;
        
        return delegate;
    }

    private _owner: WeakRef<DropDown>;
    
    public pickerViewViewForRowForComponentReusingView(pickerView: UIPickerView, row: number, component: number, view: UIView): UIView {
        // NOTE: Currently iOS sends the reusedView always as null, so no reusing is possible
        const owner = this._owner.get();
        const style = owner.style;
        const label = new Label();
        const labelStyle = label.style;

        label.text = owner._getItemAsString(row);

        // Copy Styles        
        labelStyle.color = style.color;
        labelStyle.fontInternal = style.fontInternal;
        labelStyle.padding = style.padding;
        labelStyle.textAlignment = style.textAlignment;
        labelStyle.textDecoration = style.textDecoration;
        
        return label.ios;
    }

    public pickerViewDidSelectRowInComponent(pickerView: UIPickerView, row: number, component: number): void {
        const  owner = this._owner.get();
        if (owner) {
            const oldIndex = owner.selectedIndex;

            owner.selectedIndex = row;
            if (row !== oldIndex) {
                owner.notify({
                    eventName: DropDownBase.selectedIndexChangedEvent,
                    object: owner,
                    oldIndex,
                    newIndex: row
                } as SelectedIndexChangedEventData);
            }
        }
    }
}

class TNSDropDownLabel extends TNSLabel {
    public static initWithOwner(owner: WeakRef<DropDown>): TNSDropDownLabel {
        const label = TNSDropDownLabel.new() as TNSDropDownLabel;

        label._owner = owner;
        label._isInputViewOpened = false;
        label.color = utils.ios.getter(UIColor, UIColor.blackColor);

        return label;
    }

    private _inputView: UIView;
    private _inputAccessoryView: UIView;
    private _isInputViewOpened: boolean;
    private _owner: WeakRef<DropDown>;
    private _hint: string;
    private _hasText: boolean;
    private _internalColor: UIColor;
    
    get inputView(): UIView {
        return this._inputView;
    }
    set inputView(value: UIView) {
        this._inputView = value;
    }

    get inputAccessoryView(): UIView {
        return this._inputAccessoryView;
    }
    set inputAccessoryView(value: UIView) {
        this._inputAccessoryView = value;
    }

    get canBecomeFirstResponder(): boolean {
        return true;
    }

    get canResignFirstResponder(): boolean {
        return true;
    }

    get hint(): string {
        return this._hint;
    }
    set hint(value: string) {
        this._hint = value;

        if (!this._hasText) {
            this.text = value;
            this._owner.get()._setTextAttributes();
        }
    }

    get color(): UIColor {
        return this._internalColor;
    }
    set color(value: UIColor) {
        this._internalColor = value;
        this._refreshColor();
    }
    
    public setText(value: string) {
        const actualText = value || this._hint || "";

        this._hasText = !types.isNullOrUndefined(value) && value !== "";
        this.text = (actualText === "" ? " " : actualText); // HACK: If empty use <space> so the label does not collapse
        
        this._refreshColor();

        this._owner.get()._setTextAttributes();
    }

    public becomeFirstResponder(): boolean {
        const result = super.becomeFirstResponder();
        
        if (result) {
            if (!this._isInputViewOpened) {
                const owner = this._owner.get();

                owner.notify({
                    eventName: DropDownBase.openedEvent,
                    object: owner
                });
            }

            this._isInputViewOpened = true;
        }

        return result;
    }
    
    public resignFirstResponder(): boolean {
        const result = super.resignFirstResponder();

        if (result) {
            this._isInputViewOpened = false;
        }
        
        return result;
    }

    public touchesEndedWithEvent(touches: NSSet<UITouch>, event: _UIEvent) {
        this.becomeFirstResponder();
    }

    private _refreshColor() {
        this.textColor = (this._hasText && this._internalColor ? this._internalColor : HINT_COLOR.ios);
    }    
}