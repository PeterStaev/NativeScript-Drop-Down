/*! *****************************************************************************
Copyright (c) 2018 Tangra Inc.

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
import { placeholderColorProperty } from "ui/editable-text-base/editable-text-base";
import { ItemsSource } from "ui/list-picker";
import { Font } from "ui/styling/font";
import { Style } from "ui/styling/style";
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
    itemsPaddingProperty,
    itemsProperty,
    itemsTextAlignmentProperty,
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
    
    public createNativeView() {
        const dropDown = TNSDropDownLabel.initWithOwner(new WeakRef(this));

        dropDown.userInteractionEnabled = true;

        return dropDown;
    }

    public initNativeView() {
        super.initNativeView();

        const nativeView: TNSDropDownLabel = this.nativeViewProtected;
        const applicationFrame = utils.ios.getter(UIScreen, UIScreen.mainScreen).applicationFrame;
        
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

        nativeView.inputView = this._listPicker;
        this._accessoryViewVisible = true;
        this._showHideAccessoryView();
    }

    public disposeNativeView() {
        this._doneTapDelegate = null;
        this._dropDownDelegate = null;
        this._dropDownDataSource = null;

        this.ios.inputView = null;
        this.ios.inputAccessoryView = null;

        this._listPicker = null;
        this._toolbar = null;
        this._doneButton = null;

        super.disposeNativeView();
    }

    get ios(): TNSDropDownLabel {
        return this.nativeViewProtected;
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
    }

    public onUnloaded() {
        this._listPicker.delegate = null;
        this._listPicker.dataSource = null;

        super.onUnloaded();
    }

    public open() {
        if (this.isEnabled) {
            this.ios.becomeFirstResponder();
        }
    }

    public close() {
        this.ios.resignFirstResponder();
    }

    public refresh() {
        if (!this._listPicker) {
            return;
        }
        
        this._listPicker.reloadAllComponents();

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }

    public [selectedIndexProperty.getDefault](): number {
        return null;
    }
    public [selectedIndexProperty.setNative](value: number) {
        if (value >= 0) {

            // HACK to fix #178
            setTimeout(() => {
                this._listPicker.selectRowInComponentAnimated(value, 0, true);
            }, 1);
        }

        this.ios.setText(this._getItemAsString(value));
    }

    public [itemsProperty.getDefault](): any[] {
        return null;
    }
    public [itemsProperty.setNative](value: any[] | ItemsSource) {
        this.refresh();
    }

    public [hintProperty.getDefault](): string {
        return "";
    }
    public [hintProperty.setNative](value: string) {
        this.ios.hint = value;
    }

    public [itemsTextAlignmentProperty.getDefault](): TextAlignment {
        return "initial";
    }
    public [itemsTextAlignmentProperty.setNative](value: TextAlignment) {
        this.itemsTextAlignment = value;
    }
    
    public [itemsPaddingProperty.getDefault](): string {
        return "";
    }
    public [itemsPaddingProperty.setNative](value: string) {
        this.itemsPadding = value;
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

    public [placeholderColorProperty.getDefault](): UIColor {
        return this.nativeView.placeholderColor;
    }
    public [placeholderColorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;

        this.nativeView.placeholderColor = color;
    }

    public [backgroundColorProperty.getDefault](): UIColor {
        return this.nativeView.backgroundColor;
    }
    public [backgroundColorProperty.setNative](value: Color | UIColor) {
        if (!value) {
            return;
        }

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
            case "initial":
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
        _setTextAttributes(this.nativeView, this.style);
    }

    public [textTransformProperty.setNative](value: TextTransform) {
        _setTextAttributes(this.nativeView, this.style);
    }

    public [letterSpacingProperty.setNative](value: number) {
        _setTextAttributes(this.nativeView, this.style);
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

    private _setPadding(newPadding: { top?: number, right?: number, bottom?: number, left?: number }) {
        const nativeView = this.nativeView;
        const padding = nativeView.padding;
        nativeView.padding = Object.assign(padding, newPadding);
    }

    private _showHideAccessoryView() {
        this.ios.inputAccessoryView = (this._accessoryViewVisible ? this._toolbar : null);
    }
}

@ObjCClass()
class TapHandler extends NSObject {
    public static initWithOwner(owner: WeakRef<DropDown>) {
        const tapHandler = TapHandler.new() as TapHandler;
        tapHandler._owner = owner;

        return tapHandler;
    }

    private _owner: WeakRef<DropDown>;

    @ObjCMethod()
    public tap() {
        this._owner.get().close();
    }
}

@ObjCClass(UIPickerViewDataSource)
class DropDownListDataSource extends NSObject implements UIPickerViewDataSource {
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

@ObjCClass(UIPickerViewDelegate)
class DropDownListPickerDelegateImpl extends NSObject implements UIPickerViewDelegate {
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
        const label = TNSLabel.alloc().init();

        label.text = owner._getItemAsString(row);

        // Copy Styles
        if (style.color) {
            label.textColor = style.color.ios;
        }
        
        let itemsPaddingTop = owner.effectivePaddingTop;
        let itemsPaddingRight = owner.effectivePaddingRight;
        let itemsPaddingBottom = owner.effectivePaddingBottom;
        let itemsPaddingLeft = owner.effectivePaddingLeft;
        if (owner.itemsPadding !== "") { 
            const itemsPadding = owner.itemsPadding.split(" ").map((s) => parseInt(s, 10));
            if (itemsPadding.length === 1) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[0];
                itemsPaddingBottom = itemsPadding[0];
                itemsPaddingLeft = itemsPadding[0];
            } else if (itemsPadding.length === 2) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[0];
                itemsPaddingLeft = itemsPadding[1];
            } else if (itemsPadding.length === 3) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[2];
                itemsPaddingLeft = itemsPadding[1];
            } else if (itemsPadding.length === 4) {
                itemsPaddingTop = itemsPadding[0];
                itemsPaddingRight = itemsPadding[1];
                itemsPaddingBottom = itemsPadding[2];
                itemsPaddingLeft = itemsPadding[3];
            }
        }

        label.padding = {
            top: utils.layout.toDeviceIndependentPixels(itemsPaddingTop),
            right: utils.layout.toDeviceIndependentPixels(itemsPaddingRight),
            bottom: utils.layout.toDeviceIndependentPixels(itemsPaddingBottom),
            left: utils.layout.toDeviceIndependentPixels(itemsPaddingLeft)
        };

        label.font = style.fontInternal.getUIFont(label.font);
        let itemsTextAlignment = owner.itemsTextAlignment;
        if (itemsTextAlignment === "initial") {
            itemsTextAlignment = style.textAlignment;
        }
        switch (itemsTextAlignment) {
            case "initial":
            case "left":
                label.textAlignment = NSTextAlignment.Left;
                break;
            case "center":
                label.textAlignment = NSTextAlignment.Center;
                break;
            case "right":
                label.textAlignment = NSTextAlignment.Right;
                break;
        }

        _setTextAttributes(label, style);

        return label;
    }

    public pickerViewDidSelectRowInComponent(pickerView: UIPickerView, row: number, component: number): void {
        const owner = this._owner.get();
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

@ObjCClass()
class TNSDropDownLabel extends TNSLabel {
    public static initWithOwner(owner: WeakRef<DropDown>): TNSDropDownLabel {
        const label = TNSDropDownLabel.new() as TNSDropDownLabel;

        label._owner = owner;
        label._isInputViewOpened = false;
        label.color = utils.ios.getter(UIColor, UIColor.blackColor);
        label.placeholderColor = HINT_COLOR.ios;
        label.text = " "; // HACK: Set the text to space so that it takes the necessary height if no hint/selected item

        label.addGestureRecognizer(UITapGestureRecognizer.alloc().initWithTargetAction(label, "tap"));

        return label;
    }

    private _inputView: UIView;
    private _inputAccessoryView: UIView;
    private _isInputViewOpened: boolean;
    private _owner: WeakRef<DropDown>;
    private _hint: string;
    private _hasText: boolean;
    private _internalColor: UIColor;
    private _internalPlaceholderColor: UIColor;

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
        const owner = this._owner.get();
        this._hint = value;

        if (!this._hasText) {
            this.text = value;
            _setTextAttributes(owner.nativeView, owner.style);
        }
    }

    get color(): UIColor {
        return this._internalColor;
    }
    set color(value: UIColor) {
        this._internalColor = value;
        this._refreshColor();
    }

    get placeholderColor(): UIColor {
        return this._internalPlaceholderColor;
    }
    set placeholderColor(value: UIColor) {
        this._internalPlaceholderColor = value;
        this._refreshColor();
    }

    public setText(value: string) {
        const actualText = value || this._hint || "";
        const owner = this._owner.get();

        this._hasText = !types.isNullOrUndefined(value) && value !== "";
        this.text = (actualText === "" ? " " : actualText); // HACK: If empty use <space> so the label does not collapse

        this._refreshColor();

        _setTextAttributes(owner.nativeView, owner.style);
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
        const owner = this._owner.get();

        if (result) {
            this._isInputViewOpened = false;

            owner.notify({
                eventName: DropDownBase.closedEvent,
                object: owner
            });
        }

        return result;
    }

    @ObjCMethod()
    public tap(@ObjCParam(UITapGestureRecognizer) sender: UITapGestureRecognizer) {
        if (sender.state === UIGestureRecognizerState.Ended) {
            const owner = this._owner.get();

            if (owner.isEnabled) {
                this.becomeFirstResponder();
            }
        }
    }

    private _refreshColor() {
        this.textColor = (this._hasText ? this._internalColor : this._internalPlaceholderColor);
    }
}

function _setTextAttributes(nativeView: TNSLabel, style: Style) {
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
        attributes.set(NSKernAttributeName, style.letterSpacing * nativeView.font.pointSize);
    }

    if (nativeView.textColor && attributes.size > 0) {
        attributes.set(NSForegroundColorAttributeName, nativeView.textColor);
    }

    const text: string = types.isNullOrUndefined(nativeView.text) ? "" : nativeView.text.toString();
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
        nativeView.attributedText = result;
    }
    else {
        // Clear attributedText or text won't be affected.
        nativeView.attributedText = undefined;
        nativeView.text = sourceString;
    }
}
