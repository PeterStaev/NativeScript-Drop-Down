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

import { CoercibleProperty, Property, PropertyChangeData, View } from "ui/core/view";
import { ItemsSource } from "ui/list-picker";
import { DropDown as DropDownDefinition } from ".";

export * from "ui/core/view";

export abstract class DropDownBase extends View implements DropDownDefinition {
    public static openedEvent = "opened";
    public static selectedIndexChangedEvent = "selectedIndexChanged";
    
    public hint: string;    
    public selectedIndex: number;    
    public items: any[] | ItemsSource;
    public accessoryViewVisible: boolean;
    public isItemsSourceIn: boolean;

    public abstract open();
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
        if (items) {
            const max = items.length - 1;
            if (value < 0) {
                value = 0;
            }
            if (value > max) {
                value = max;
            }
        }
        else {
            value = undefined;
        }

        return value;
    }
});
selectedIndexProperty.register(DropDownBase);

export const itemsProperty = new Property<DropDownBase, any[] | ItemsSource>({
    name: "items",
    valueChanged: (target, oldValue, newValue) => {
        const getItem = newValue && (newValue as ItemsSource).getItem;
        target.isItemsSourceIn = typeof getItem === "function";
    }
});
itemsProperty.register(DropDownBase);

export const hintProperty = new Property<DropDownBase, string>({
    name: "hint",
    defaultValue: ""
});
hintProperty.register(DropDownBase);