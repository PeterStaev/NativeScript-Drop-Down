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
import { Observable, PropertyChangeData } from "data/observable";
import { Label } from "ui/label";
import { ItemsSource, ListPicker } from "ui/list-picker";
import { Font } from "ui/styling/font";
import * as types from "utils/types";
import * as utils from "utils/utils";
import { SelectedIndexChangedEventData } from ".";
import {
    DropDownBase,
    hintProperty,
    itemsProperty,
    selectedIndexProperty
} from "./drop-down-common";

export * from "./drop-down-common";

const TOOLBAR_HEIGHT = 44;
const HINT_COLOR = new Color("#3904041E");

const mangleExclude = [
    "DropDownListPickerDelegateImpl",
    "TNSDropDownLabel",
    "TapHandler"
];

export class DropDown extends DropDownBase {
    public _listPicker: ListPicker;

    private _toolbar: UIToolbar;
    private _flexToolbarSpace: UIBarButtonItem;
    private _doneButton: UIBarButtonItem;
    private _doneTapDelegate: TapHandler;
    private _accessoryViewVisible: boolean;
    private _label: DropDownLabel;

    constructor() {
        super();

        this.style.on("backgroundColorChange", this._onBackgroundColorChange, this);
        this.style.on("colorChange", this._onColorChange, this);
        this.style.on("paddingTopChange", this._onStylePropertyForLabelChange, this);
        this.style.on("paddingRightChange", this._onStylePropertyForLabelChange, this);
        this.style.on("paddingBottomChange", this._onStylePropertyForLabelChange, this);
        this.style.on("paddingLeftChange", this._onStylePropertyForLabelChange, this);
        this.style.on("textDecorationChange", this._onStylePropertyForLabelChange, this);
        
        const applicationFrame = utils.ios.getter(UIScreen, UIScreen.mainScreen).applicationFrame;

        this._label = new DropDownLabel(new WeakRef(this));        
        this._listPicker = new ListPicker();

        (this._listPicker as any)._delegate = DropDownListPickerDelegateImpl.initWithOwner(new WeakRef(this));       
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

    get nativeView(): TNSDropDownLabel {
        return this.ios;
    }
    
    get ios(): TNSDropDownLabel {
        return this._label.ios;
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
        this.style.off("backgroundColorChange");
        this.style.off("colorChange");
        this.style.off("paddingTopChange");
        this.style.off("paddingRightChange");
        this.style.off("paddingBottomChange");
        this.style.off("paddingLeftChange");
        this.style.off("textDecorationChange");
        
        this._label.onUnloaded();
        this._listPicker.onUnloaded();

        super.onUnloaded();
    }

    public open() {
        this._label.ios.becomeFirstResponder();
    }

    public [selectedIndexProperty.getDefault](): number {
        return null;
    }
    public [selectedIndexProperty.setNative](value: number) {
        this._listPicker.selectedIndex = value;

        this._label.text = (this._listPicker as any)._getItemAsString(value);
    }

    public [itemsProperty.getDefault](): any[] {
        return null;
    }
    public [itemsProperty.setNative](value: any[] | ItemsSource) {
        this._listPicker.items = value;

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }

    public [hintProperty.getDefault](): string {
        return "";
    }
    public [hintProperty.setNative](value: string) {
        this._label.hint = value;
    }
    
    private _showHideAccessoryView() {
        this.ios.inputAccessoryView = (this._accessoryViewVisible ? this._toolbar : null);
    }

    private _onColorChange(data: PropertyChangeData) {
        const color = data.value;
        const pickerView: UIPickerView = this._listPicker.ios;

        this._label.color = color;
        this._listPicker.color = color;
        pickerView.reloadAllComponents();
    }

    private _onBackgroundColorChange(data: PropertyChangeData) {
        const color = data.value;
        const pickerView: UIPickerView = this._listPicker.ios;

        this._label.backgroundColor = color;
        this._listPicker.backgroundColor = color;
        pickerView.reloadAllComponents();
    }

    private _onStylePropertyForLabelChange(data: PropertyChangeData) {
        this._label[data.propertyName] = data.value;
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

        label.text = (owner._listPicker as any)._getItemAsString(row);

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

            owner._listPicker.selectedIndex = row;
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

class DropDownLabel extends Label {
    public nativeView: TNSDropDownLabel;

    private _hint: string = "";
    private _hasText: boolean = true;
    private _internalColor: Color;
    
    constructor(owner: WeakRef<DropDown>) {
        super();

        this.nativeView = TNSDropDownLabel.initWithOwner(owner);
        this.nativeView.userInteractionEnabled = true;
    }

    public onLoaded() {
        super.onLoaded();
        this.text = null;
    }

    get ios(): TNSDropDownLabel {
        return this.nativeView;
    }
    
    get text(): string {
        return this.nativeView.text;
    }
    set text(value: string) {
        const actualText = value || this._hint || "";

        this._hasText = !types.isNullOrUndefined(value);
        this.nativeView.text = (actualText === "" ? " " : actualText); // HACK: If empty use <space> so the label does not collapse
        
        this._refreshColor();
    }

    get hint(): string {
        return this._hint;
    }
    set hint(value: string) {
        this._hint = value;

        if (!this._hasText) {
            this.nativeView.text = value;
        }
    }

    get color(): Color {
        return this._internalColor;
    }
    set color(value: Color) {
        this._internalColor = value;
        this._refreshColor();
    }

    private _refreshColor() {
        this.ios.textColor = (this._hasText && this._internalColor ? this._internalColor : HINT_COLOR).ios;
    }
}

class TNSDropDownLabel extends TNSLabel {
    public static initWithOwner(owner: WeakRef<DropDown>): TNSDropDownLabel {
        const label = TNSDropDownLabel.new() as TNSDropDownLabel;

        label._owner = owner;
        label._isInputViewOpened = false;
        
        return label;
    }

    private _inputView: UIView;
    private _inputAccessoryView: UIView;
    private _isInputViewOpened: boolean;
    private _owner: WeakRef<DropDown>;
    
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
}