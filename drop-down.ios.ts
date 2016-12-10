/*! *****************************************************************************
Copyright (c) 2015 Tangra Inc.

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

import { Label } from "ui/label";
import { ListPicker } from "ui/list-picker";
import * as dependencyObservable from "ui/core/dependency-observable";
import { Observable, PropertyChangeData } from "data/observable";
import * as common from "./drop-down-common";
import * as style from "ui/styling/style";
import * as utils from "utils/utils";
import { Font } from "ui/styling/font";
import { Span } from "text/span";
import { FormattedString } from "text/formatted-string";
import { Color } from "color";
import * as enums from "ui/enums";
import * as types from "utils/types";
import { SelectedIndexChangedEventData } from "nativescript-drop-down";

global.moduleMerge(common, exports);

const TOOLBAR_HEIGHT = 44;
const HINT_COLOR = new Color("#3904041E");

export class DropDown extends common.DropDown {
    private _toolbar: UIToolbar;
    private _flexToolbarSpace: UIBarButtonItem;
    private _doneButton: UIBarButtonItem;
    private _doneTapDelegate: TapHandler;
    private _accessoryViewVisible: boolean;

    public _label: DropDownLabelWrapper;
    public _listPicker: ListPicker;

    constructor() {
        super();

        let applicationFrame = utils.ios.getter(UIScreen, UIScreen.mainScreen).applicationFrame;

        this._label = new DropDownLabelWrapper(this);
        this._listPicker = new ListPicker();

        (this._listPicker as any)._delegate = DropDownListPickerDelegateImpl.initWithOwner(this);       
        this._flexToolbarSpace = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.FlexibleSpace, null, null);
        this._doneTapDelegate = TapHandler.initWithOwner(new WeakRef(this));
        this._doneButton = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.Done, this._doneTapDelegate, "tap");

        this._accessoryViewVisible = true;
        this._toolbar = UIToolbar.alloc().initWithFrame(CGRectMake(0, 0, applicationFrame.size.width, TOOLBAR_HEIGHT));
        this._toolbar.autoresizingMask = UIViewAutoresizing.FlexibleWidth;

        let nsArray = NSMutableArray.alloc<UIBarButtonItem>().init();
        nsArray.addObject(this._flexToolbarSpace);
        nsArray.addObject(this._doneButton);
        this._toolbar.setItemsAnimated(nsArray, false);
    }

    get ios(): UILabel {
        return this._label.ios;
    }

    get accessoryViewVisible(): boolean {
        return this._accessoryViewVisible;
    }
    set accessoryViewVisible(value: boolean) {
        this._accessoryViewVisible = value;
        this._showHideAccessoryView();
    }

    private _showHideAccessoryView() {
        this.ios.inputAccessoryView = (this._accessoryViewVisible ? this._toolbar : null);
    }

    public onLoaded() {
        super.onLoaded();

        this._label.onLoaded();
        this._listPicker.onLoaded();
        this._listPicker.on(Observable.propertyChangeEvent,
            (data: PropertyChangeData) => {
                if (data.propertyName === "selectedIndex") {
                    this.selectedIndex = data.value;
                }
            });
        this.ios.inputView = this._listPicker.ios;
        this._showHideAccessoryView();
        
    }

    public onUnloaded() {
        this.ios.inputView = null;
        this.ios.inputAccessoryView = null;

        this._listPicker.off(Observable.propertyChangeEvent);

        this._label.onUnloaded();
        this._listPicker.onUnloaded();

        super.onUnloaded();
    }

    public open() {
        this._label.ios.becomeFirstResponder();
    }

    public _onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        this._listPicker.items = data.newValue;
    }

    public _onHintPropertyChanged(data: dependencyObservable.PropertyChangeData) {
       this._label.hint = data.newValue;
    }

    public _onSelectedIndexPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        super._onSelectedIndexPropertyChanged(data);
        this._listPicker.selectedIndex = data.newValue;
        this._label.text = (this.items && this.items.getItem ? this.items.getItem(data.newValue) : this.items[data.newValue]);
    }
}

class TapHandler extends NSObject {
    public static ObjCExposedMethods = {
        "tap": { returns: interop.types.void, params: [] }
    };

    private _owner: WeakRef<DropDown>;

    public static initWithOwner(owner: WeakRef<DropDown>) {
        let tapHandler = <TapHandler>TapHandler.new();
        tapHandler._owner = owner;

        return tapHandler;
    }

    public tap() {
        this._owner.get().ios.resignFirstResponder();
    }
}

class DropDownListPickerDelegateImpl extends NSObject implements UIPickerViewDelegate {
    public static ObjCProtocols = [UIPickerViewDelegate];

    private _owner: WeakRef<DropDown>;
    
    public static initWithOwner(owner: DropDown): DropDownListPickerDelegateImpl {
        let delegate = <DropDownListPickerDelegateImpl>DropDownListPickerDelegateImpl.new();
        delegate._owner = new WeakRef(owner);
        return delegate;
    }

    public pickerViewAttributedTitleForRowForComponent(pickerView: UIPickerView, row: number, component: number): NSAttributedString {
        let owner = this._owner.get();
        let span = new Span();
        let formattedString = new FormattedString();
        formattedString.spans.push(span);

        if (owner) {
            span.text = (owner._listPicker as any)._getItemAsString(row);
            span.foregroundColor = owner.style.color;
            switch (owner.style.textDecoration) {
                case enums.TextDecoration.underline:
                    span.underline = 1;
                    break;

                case enums.TextDecoration.lineThrough:
                    span.strikethrough = 1;
                    break;
            }
        }

        return (formattedString as any)._formattedText;
    }

    public pickerViewDidSelectRowInComponent(pickerView: UIPickerView, row: number, component: number): void {
        let owner = this._owner.get();
        if (owner) {
            let oldIndex = owner.selectedIndex;

            owner._listPicker._onPropertyChangedFromNative(ListPicker.selectedIndexProperty, row);

            if (row !== oldIndex) {
                owner.notify(<SelectedIndexChangedEventData>{
                    eventName: common.DropDown.selectedIndexChangedEvent,
                    object: owner,
                    oldIndex: oldIndex,
                    newIndex: row
                });
            }
        }
    }
}

class DropDownLabelWrapper extends Label {
    private _ios: UILabel;
    private _hint: string = "";
    private _hasText: boolean = true;
    private _internalColor: Color;

    constructor(dropDown: DropDown) {
        super();

        this._ios = DropDownLabel.initWithOwner(dropDown);
        this._ios.userInteractionEnabled = true;
    }

    public onLoaded() {
        super.onLoaded();
        this.internalColor = this.color;
    }

    get text(): string {
        return this._ios.text;
    }
    set text(value: string) {
        let actualText = value || this._hint || "";

        this._hasText = !types.isNullOrUndefined(value);
        this._ios.text = (actualText === "" ? " " : actualText); // HACK: If empty use <space> so the label does not collapse
        
        this._refreshColor();
    }

    get hint(): string {
        return this._hint;
    }
    set hint(value: string) {
        this._hint = value;

        if (!this._hasText) {
            this._ios.text = value;
        }
    }

    get internalColor(): Color {
        return this._internalColor;
    }
    set internalColor(value: Color) {
        this._internalColor = value;
        this._refreshColor();
    }

    private _refreshColor() {
        this.color = (this._hasText ? this._internalColor : HINT_COLOR);
    }
}

class DropDownLabel extends TNSLabel {
    private _inputView: UIView;
    private _inputAccessoryView: UIView;
    private _isInputViewOpened: boolean;
    private _owner: WeakRef<DropDown>;
    
    public static initWithOwner(owner: DropDown): DropDownLabel {
        let label = <DropDownLabel>DropDownLabel.new();
        label._owner = new WeakRef(owner);
        label._isInputViewOpened = false;
        return label;
    }

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

    public becomeFirstResponder(): boolean {
        let result = super.becomeFirstResponder();
        
        if (result) {
            if (!this._isInputViewOpened) {
                let owner = this._owner.get();

                owner.notify({
                    eventName: common.DropDown.openedEvent,
                    object: owner
                });
            }

            this._isInputViewOpened = true;
        }

        return result;
    }
    
    public resignFirstResponder(): boolean {
        let result = super.resignFirstResponder();

        if (result) {
            this._isInputViewOpened = false;
        }
        
        return result;
    }

    public touchesEndedWithEvent(touches: NSSet<UITouch>, event: UIEvent) {
        this.becomeFirstResponder();
    }
}    

//#region Styling
export class DropDownStyler implements style.Styler {
    //#region Font
    private static setFontInternalProperty(dropDown: DropDown, newValue: any, nativeValue?: any) {
        let ios = dropDown.ios;
        ios.font = (<Font>newValue).getUIFont(nativeValue);
    }

    private static resetFontInternalProperty(dropDown: DropDown, nativeValue: any) {
        let ios = dropDown.ios;
        ios.font = nativeValue;
    }

    private static getNativeFontInternalValue(dropDown: DropDown): any {
        let ios = dropDown.ios;
        return ios.font;
    }
    //#endregion

    //#region Text Align
    private static setTextAlignmentProperty(dropDown: DropDown, newValue: any) {
        utils.ios.setTextAlignment(dropDown.ios, newValue);
    }

    private static resetTextAlignmentProperty(dropDown: DropDown, nativeValue: any) {
        let ios = dropDown.ios;
        ios.textAlignment = nativeValue;
    }

    private static getNativeTextAlignmentValue(dropDown: DropDown): any {
        let ios = dropDown.ios;
        return ios.textAlignment;
    }
    //#endregion

    //#region  Text Decoration 
    private static setTextDecorationProperty(dropDown: DropDown, newValue: any) {
        dropDown._label.style.textDecoration = newValue;
        (<any>dropDown._label.style)._updateTextDecoration();
    }

    private static resetTextDecorationProperty(dropDown: DropDown, nativeValue: any) {
        dropDown._label.style.textDecoration = enums.TextDecoration.none;
        dropDown._label.style._updateTextDecoration();
    }
    //#endregion

    //#region Color
    private static setColorProperty(dropDown: DropDown, newValue: any) {
        let dropDownLabel = dropDown._label,
            pickerView = <UIPickerView>dropDown._listPicker.ios;

        dropDownLabel.internalColor = utils.ios.getColor(newValue);
        pickerView.reloadAllComponents();
    }

    private static resetColorProperty(dropDown: DropDown, nativeValue: any) {
        let dropDownLabel = dropDown._label,
            pickerView = <UIPickerView>dropDown._listPicker.ios;

        dropDownLabel.internalColor = utils.ios.getColor(nativeValue);
        pickerView.reloadAllComponents();
    }

    private static getNativeColorValue(dropDown: DropDown): any {
        let dropDownLabel = dropDown._label;
        return dropDownLabel.internalColor ? dropDownLabel.internalColor.ios : dropDownLabel.ios.textColor;
    }
    //#endregion

    //#region Background Color
    private static setBackgroundColorProperty(dropDown: DropDown, newValue: any) {
        let ios = dropDown.ios;
        let pickerView = <UIPickerView>dropDown._listPicker.ios;
        
        ios.backgroundColor = newValue;
        pickerView.backgroundColor = newValue;
    }

    private static resetBackgroundColorProperty(dropDown: DropDown, nativeValue: any) {
        let ios = dropDown.ios;
        let pickerView = <UIPickerView>dropDown._listPicker.ios;

        ios.backgroundColor = nativeValue;
        pickerView.backgroundColor = nativeValue;
    }

    private static getNativeBackgroundColorValue(dropDown: DropDown): any {
        let ios = dropDown.ios;
        return ios.backgroundColor;
    }
    //#endregion

    //#region Padding     
    private static setPaddingProperty(dropDown: DropDown, newValue: UIEdgeInsets) {
        DropDownStyler.setPadding(dropDown, newValue);
    }

    private static resetPaddingProperty(dropDown: DropDown, nativeValue: UIEdgeInsets) {
        DropDownStyler.setPadding(dropDown, nativeValue);
    }

    private static getPaddingProperty(dropDown: DropDown): UIEdgeInsets {
        let styles = dropDown.style;
        if (styles) {
            return UIEdgeInsetsFromString(`{${styles.paddingTop},${styles.paddingLeft},${styles.paddingBottom},${styles.paddingRight}}`);
        }
        return UIEdgeInsetsZero;
    }  

    private static setPadding(dropDown: DropDown, newValue: UIEdgeInsets) {
        dropDown._label.style.paddingTop = newValue.top;
        dropDown._label.style.paddingRight = newValue.right;
        dropDown._label.style.paddingBottom = newValue.bottom;
        dropDown._label.style.paddingLeft = newValue.left;
    }
    //#endregion
  
    public static registerHandlers() {
        style.registerHandler(style.fontInternalProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setFontInternalProperty,
                DropDownStyler.resetFontInternalProperty,
                DropDownStyler.getNativeFontInternalValue
            ),
            "DropDown");
        
        style.registerHandler(style.textAlignmentProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setTextAlignmentProperty,
                DropDownStyler.resetTextAlignmentProperty,
                DropDownStyler.getNativeTextAlignmentValue
            ),
            "DropDown");
        
        style.registerHandler(style.textDecorationProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setTextDecorationProperty,
                DropDownStyler.resetTextDecorationProperty
            ),
            "DropDown");
        
        style.registerHandler(style.colorProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setColorProperty,
                DropDownStyler.resetColorProperty,
                DropDownStyler.getNativeColorValue
            ),
            "DropDown");
        
        style.registerHandler(style.backgroundColorProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setBackgroundColorProperty,
                DropDownStyler.resetBackgroundColorProperty,
                DropDownStyler.getNativeBackgroundColorValue
            ),
            "DropDown");
        style.registerHandler(style.nativePaddingsProperty,
            new style.StylePropertyChangedHandler(
                DropDownStyler.setPaddingProperty,
                DropDownStyler.resetPaddingProperty,
                DropDownStyler.getPaddingProperty
            ),
            "DropDown");
    }
}
DropDownStyler.registerHandlers();
//#endregion