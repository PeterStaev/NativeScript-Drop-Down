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
import { EventData } from "data/observable";
import { ItemsSource } from "ui/list-picker";

export interface SelectedIndexChangedEventData extends EventData {
    oldIndex: number;
    newIndex: number;
}

export interface ValueItem<T> {
    value: T;
    display: string;
}

export class DropDown extends View {
    public static openedEvent: string;
    public static closedEvent: string;
    public static selectedIndexChangedEvent: string;

    public items: any[] | ItemsSource;
    public selectedIndex: number;
    public hint: string;
    public accessoryViewVisible: boolean; /* iOS ONLY! */

    public ios: any; /* UILabel */
    public android: any; /*android.widget.Spinner */

    public on(eventNames: string, callback: (data: EventData) => void, thisArg?: any);       
    public on(event: "opened", callback: (args: EventData) => void, thisArg?: any); 
    public on(event: "closed", callback: (args: EventData) => void, thisArg?: any); 
    public on(event: "selectedIndexChanged", callback: (args: SelectedIndexChangedEventData) => void, thisArg?: any);

    public open();
    public close();
}

export class ValueList<T> extends ObservableArray<ValueItem<T>> implements ItemsSource {
    public getDisplay(index: number): string;
    public getValue(index: number): T;
    public getIndex(value: T): number;   
}

export const selectedIndexProperty: CoercibleProperty<DropDown, number>;
export const itemsProperty: Property<DropDown, any[] | ItemsSource>;
export const hintProperty: Property<DropDown, string>;
