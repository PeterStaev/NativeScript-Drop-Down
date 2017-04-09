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
import { ObservableArray } from "data/observable-array";
import { CoercibleProperty, Property, View } from "ui/core/view";
import { ItemsSource } from "ui/list-picker";
import * as types from "utils/types";
import { DropDown as DropDownDefinition, ValueItem, ValueList as ValueListDefinition } from ".";

export * from "ui/core/view";

export abstract class DropDownBase extends View implements DropDownDefinition {
    public static openedEvent = "opened";
    public static selectedIndexChangedEvent = "selectedIndexChanged";
    
    public hint: string;    
    public selectedIndex: number;    
    public items: any[] | ItemsSource;
    public accessoryViewVisible: boolean;
    public isItemsSourceIn: boolean;
    public isValueListIn: boolean;

    public abstract open();

    public _getItemAsString(index: number) {
        const items = this.items;

        if (!items) {
            return " ";
        }

        if (types.isNullOrUndefined(index)) {
            return null;
        }

        if (this.isValueListIn) {
            return (items as ValueList<any>).getText(index);
        }

        const item = this.isItemsSourceIn ? (this.items as ItemsSource).getItem(index) : this.items[index];
        return (item === undefined || item === null) ? index + "" : item + "";        
    }
}

export class ValueList<T> extends ObservableArray<ValueItem<T>> implements ValueListDefinition<T> {
    private _array: Array<ValueItem<T>>;

    public getText(index: number): string {
        if (types.isNullOrUndefined(index)) {
            return null;
        }
        
        if (index < 0 || index >= this.length) {
            return "";
        }

        return this._array[index].DisplayMember;
    }

    public getValue(index: number): T {
        if (types.isNullOrUndefined(index) || index < 0 || index >= this.length) {
            return null;
        }

        return this._array[index].ValueMember;
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
        const getText = newValue && (newValue as ValueList<any>).getText;

        target.isItemsSourceIn = typeof getItem === "function";
        target.isValueListIn = typeof getText === "function";
    }
});
itemsProperty.register(DropDownBase);

export const hintProperty = new Property<DropDownBase, string>({
    name: "hint",
    defaultValue: ""
});
hintProperty.register(DropDownBase);