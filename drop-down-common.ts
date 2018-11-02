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
import { ObservableArray } from "data/observable-array";
import { AddChildFromBuilder, CSSType, CoercibleProperty, EventData, Property, View } from "ui/core/view";
import { addWeakEventListener, removeWeakEventListener } from "ui/core/weak-event-listener";
import { ItemsSource } from "ui/list-picker";
import { Style } from "ui/styling/style";
import { Color, Length, TextAlignment, TextBase, TextDecoration, TextTransform, letterSpacingProperty, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, textAlignmentProperty, textDecorationProperty, textTransformProperty } from "ui/text-base";
import * as types from "utils/types";
import { DropDown as DropDownDefinition, SelectedIndexChangedEventData, ValueItem, ValueList as ValueListDefinition } from ".";

import { Font } from "tns-core-modules/ui/styling/font";
import {backgroundColorProperty, colorProperty, fontInternalProperty, layout} from "ui/core/view";
export * from "ui/core/view";

@CSSType("DropDownList")
export class DropDownListBase extends TextBase {
    
    public [colorProperty.getDefault](): UIColor {
        return this.nativeView.color;
    }
    public [colorProperty.setNative](value: Color | UIColor) {
        const color = value instanceof Color ? value.ios : value;

        this.nativeView.color = color;
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
}

@CSSType("DropDown")
export abstract class DropDownBase extends View implements DropDownDefinition, AddChildFromBuilder {
    public static openedEvent = "opened";
    public static closedEvent = "closed";
    public static selectedIndexChangedEvent = "selectedIndexChanged";

    public dropDownList: DropDownListBase;
    public hint: string;
    public selectedIndex: number;
    public items: any[] | ItemsSource;
    public accessoryViewVisible: boolean;
    public isItemsSourceIn: boolean;
    public isValueListIn: boolean;

    public abstract open();
    public abstract close();
    public abstract refresh();

    public _getDropDownStyle(): Style | void {
        if (this.dropDownList) {
            return this.dropDownList.style;
        }
    }

    public _addChildFromBuilder(name: string, value: any): void {
        if (name === "DropDownList") {
            this.dropDownList = value;
        }
    }

    public _getItemAsString(index: number) {
        const items = this.items;

        if (!items) {
            return " ";
        }

        if (types.isNullOrUndefined(index)) {
            return null;
        }

        if (this.isValueListIn) {
            return (items as ValueList<any>).getDisplay(index);
        }

        const item = this.isItemsSourceIn ? (this.items as ItemsSource).getItem(index) : this.items[index];
        return (item === undefined || item === null) ? index + "" : item + "";
    }
}

export interface DropDownBase {
    on(eventNames: string, callback: (data: EventData) => void, thisArg?: any);
    on(event: "selectedIndexChanged", callback: (args: SelectedIndexChangedEventData) => void, thisArg?: any);
}

export class ValueList<T> extends ObservableArray<ValueItem<T>> implements ValueListDefinition<T> {
    private _array: Array<ValueItem<T>>;

    public getDisplay(index: number): string {
        if (types.isNullOrUndefined(index)) {
            return null;
        }

        if (index < 0 || index >= this.length) {
            return "";
        }

        return this._array[index].display;
    }

    public getValue(index: number): T {
        if (types.isNullOrUndefined(index) || index < 0 || index >= this.length) {
            return null;
        }

        return this._array[index].value;
    }

    public getIndex(value: T): number {
        let loop: number;

        for (loop = 0; loop < this.length; loop++) {
            if (this.getValue(loop) === value) {
                return loop;
            }
        }

        return null;
    }
}

export const selectedIndexProperty = new CoercibleProperty<DropDownBase, number>({
    name: "selectedIndex",
    defaultValue: null,
    valueConverter: (v) => {
        if (v === undefined || v === null) {
            return null;
        }

        return parseInt(v, 10);
    },
    coerceValue: (target, value) => {
        const items = target.items;
        if (items && items.length !== 0) {
            const max = items.length - 1;
            if (value < 0) {
                value = 0;
            }
            if (value > max) {
                value = max;
            }
        }
        else {
            value = null;
        }

        return value;
    }
});
selectedIndexProperty.register(DropDownBase);

export const itemsProperty = new Property<DropDownBase, any[] | ItemsSource>({
    name: "items",
    valueChanged: (target, oldValue, newValue) => {
        const getItem = newValue && (newValue as ItemsSource).getItem;
        const getDisplay = newValue && (newValue as ValueList<any>).getDisplay;

        target.isItemsSourceIn = typeof getItem === "function";
        target.isValueListIn = typeof getDisplay === "function";

        if (oldValue instanceof ObservableArray) {
            removeWeakEventListener(oldValue, ObservableArray.changeEvent, target.refresh, target);
        }

        if (newValue instanceof ObservableArray) {
            addWeakEventListener(newValue, ObservableArray.changeEvent, target.refresh, target);
        }
    }
});
itemsProperty.register(DropDownBase);

export const hintProperty = new Property<DropDownBase, string>({
    name: "hint",
    defaultValue: ""
});
hintProperty.register(DropDownBase);

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