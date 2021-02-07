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
import {
    Color,
    Font,
    ItemsSource,
    Label,
    StackLayout,
    View,
    fontInternalProperty,
    fontSizeProperty,
    placeholderColorProperty,
    textAlignmentProperty,
    textDecorationProperty
} from "@nativescript/core";
import { TextAlignment, TextDecoration } from "@nativescript/core/ui/text-base";
import { isNullOrUndefined } from "@nativescript/core/utils/types";
import {
    DropDownBase,
    backgroundColorProperty,
    colorProperty,
    hintProperty,
    itemsPaddingProperty,
    itemsProperty,
    itemsTextAlignmentProperty,
    selectedIndexProperty
} from "./drop-down-common";

export * from "./drop-down-common";

enum RealizedViewType {
  ItemView,
  DropDownView
}

const LABELVIEWID = "spinner-label";

export class DropDown extends DropDownBase {
    public nativeView: TNSSpinner;
    public _realizedItems = [
        new Map<android.view.View, View>(),
        new Map<android.view.View, View>()
    ];

    private _androidViewId: number;

    public createNativeView() {
        initializeTNSSpinner();
        const spinner = new TNSSpinner(new WeakRef(this));

        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        spinner.setId(this._androidViewId);

        initializeDropDownAdapter();
        const adapter = new DropDownAdapter(new WeakRef(this));
        spinner.setAdapter(adapter);
        spinner.adapter = adapter;

        initializeDropDownItemSelectedListener();
        const itemSelectedListener = new DropDownItemSelectedListener(new WeakRef(this));
        spinner.setOnItemSelectedListener(itemSelectedListener);
        spinner.itemSelectedListener = itemSelectedListener;

        return spinner;
    }

    public initNativeView() {
        super.initNativeView();

        const nativeView = this.nativeView;
        nativeView.adapter.owner = new WeakRef(this);
        nativeView.itemSelectedListener.owner = new WeakRef(this);

        // When used in templates the selectedIndex changed event is fired before the native widget is init.
        // So here we must set the inital value (if any)
        if (!isNullOrUndefined(this.selectedIndex)) {
            this.android.setSelection(this.selectedIndex + 1); // +1 for the hint first element
        }
        nativeView.itemsTextAlignment = itemsTextAlignmentProperty.defaultValue;
        nativeView.itemsPadding = itemsPaddingProperty.defaultValue;
    }

    public disposeNativeView() {
        const nativeView = this.nativeView;
        nativeView.adapter.owner = null;
        nativeView.itemSelectedListener.owner = null;

        this._clearCache(RealizedViewType.DropDownView);
        this._clearCache(RealizedViewType.ItemView);

        super.disposeNativeView();
    }

    // @ts-ignore
    get android(): android.widget.Spinner {
        return this.nativeView;
    }

    public open() {
        if (this.isEnabled) {
            this.nativeView.performClick();
        }
    }

    public close() {
        this.nativeView.onDetachedFromWindowX();
    }

    public refresh() {
        this._updateSelectedIndexOnItemsPropertyChanged(this.items);

        if (this.android && this.android.getAdapter()) {
            (this.android.getAdapter() as DropDownAdapter).notifyDataSetChanged();
        }    

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }

    public [backgroundColorProperty.setNative](value: Color | number) {
        this._propagateStylePropertyToRealizedViews("backgroundColor", value, true);
    }

    public [colorProperty.setNative](value: Color | number) {
        if (!isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("color", value, false);
        }
    }
    
    public [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        this._propagateStylePropertyToRealizedViews("fontInternal", value, true);
    }

    public [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        if (!isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("fontSize", value, true);
        }
    }
    
    public [hintProperty.getDefault](): string {
        return "";
    }
    public [hintProperty.setNative](value: string) {
        (this.android.getAdapter() as DropDownAdapter).notifyDataSetChanged();
    }

    public [itemsPaddingProperty.getDefault](): string {
        return "";
    }
    public [itemsPaddingProperty.setNative](value: string) {
        this.nativeView.itemsPadding = value;
    }
    
    public [itemsProperty.getDefault](): any[] {
        return null;
    }
    public [itemsProperty.setNative](value: any[] | ItemsSource) {
        this._updateSelectedIndexOnItemsPropertyChanged(value);
        (this.android.getAdapter() as DropDownAdapter).notifyDataSetChanged();

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }
    
    public [itemsTextAlignmentProperty.getDefault](): TextAlignment {
        return "initial";
    }
    public [itemsTextAlignmentProperty.setNative](value: TextAlignment) {
        this.nativeView.itemsTextAlignment = value;
    }
    
    public [textDecorationProperty.getDefault](): TextDecoration {
        return "none";
    }
    public [textDecorationProperty.setNative](value: TextDecoration) {
        this._propagateStylePropertyToRealizedViews("textDecoration", value, true);
    }

    public [textAlignmentProperty.getDefault](): TextAlignment {
        return "left";
    }
    public [textAlignmentProperty.setNative](value: TextAlignment) {
        this._propagateStylePropertyToRealizedViews("textAlignment", value, true);
    }

    public [placeholderColorProperty.setNative](value: Color | number) {
        this._propagateStylePropertyToRealizedViews("placeholderColor", value, true);
    }
    
    public [selectedIndexProperty.getDefault](): number {
        return null;
    }
    public [selectedIndexProperty.setNative](value: number) {
        const actualIndex = (isNullOrUndefined(value) ? 0 : value + 1);
        this.nativeView.setSelection(actualIndex);
    }

    public _getRealizedView(convertView: android.view.View, realizedViewType: RealizedViewType): View {
        if (!convertView) {
            const view = new Label();
            const layout = new StackLayout();

            layout.style.horizontalAlignment = "stretch";
            view.id = LABELVIEWID;

            layout.addChild(view);

            return layout;
        }

        return this._realizedItems[realizedViewType].get(convertView);
    }

    public _clearCache(realizedViewType: RealizedViewType) {
        const realizedItems = this._realizedItems[realizedViewType];
        realizedItems.forEach((view) => {
            if (view.parent) {
                view.parent._removeView(view);
            }
        });
        realizedItems.clear();
    }

    private _propagateStylePropertyToRealizedViews(property: string, value: any, isIncludeHintIn = true) {
        const realizedItems = this._realizedItems;
        for (const item of realizedItems) {
            item.forEach((view) => {
                if (isIncludeHintIn || !(view as any).isHintViewIn) {
                    if (property === "textAlignment" || property === "textDecoration"
                        || property === "fontInternal" || property === "fontSize"
                        || property === "color"
                        || property === "placeholderColor") {
                        const label = view.getViewById<Label>(LABELVIEWID);
                        label.style[property] = value as never;
                    }
                    else {
                        view.style[property] = value;
                    }
                }
            });
        }
    }

    private _updateSelectedIndexOnItemsPropertyChanged(newItems: any[] | ItemsSource) {
        let newItemsCount = 0;
        if (newItems && newItems.length) {
            newItemsCount = newItems.length;
        }

        if (newItemsCount === 0 || this.selectedIndex >= newItemsCount) {
            this.selectedIndex = null;
        }
    }
}

/* A snapshot-friendly, lazy-loaded class for TNSSpinner BEGIN */
interface TNSSpinner extends android.widget.Spinner {
    adapter;
    itemSelectedListener;
    itemsTextAlignment;
    itemsPadding;
    
    /*tslint:disable-next-line no-misused-new*/
    new (owner: WeakRef<DropDown>): TNSSpinner;

    /** onDetachedFromWindow is protected so public version renamed */
    onDetachedFromWindowX();
}

let TNSSpinner: TNSSpinner;

function initializeTNSSpinner() {
    if (TNSSpinner) {
        return;
    }

    @NativeClass()
    class TNSSpinnerImpl extends android.widget.Spinner {
        private _isOpenedIn = false;
        private _itemsTextAlignment: TextAlignment;
        private _itemsPadding: string;

        constructor(private owner: WeakRef<DropDown>) {
            super(owner.get()._context);
            return global.__native(this);
        }
        
        get itemsTextAlignment(): TextAlignment {
            return this._itemsTextAlignment;
        }
        set itemsTextAlignment(value: TextAlignment) {
            this._itemsTextAlignment = value;
        }
        
        get itemsPadding(): string {
            return this._itemsPadding;
        }
        set itemsPadding(value: string) {
            this._itemsPadding = value;
        }
        
        public performClick() {
            const owner = this.owner.get();

            this._isOpenedIn = true;

            owner.notify({
                eventName: DropDownBase.openedEvent,
                object: owner
            });

            return super.performClick();
        }

        public onWindowFocusChanged(hasWindowFocus: boolean) {
            super.onWindowFocusChanged(hasWindowFocus);

            if (this._isOpenedIn && hasWindowFocus) {
                const owner = this.owner.get();
                owner.notify({
                    eventName: DropDownBase.closedEvent,
                    object: owner
                });
                this._isOpenedIn = false;
            }
        }

        public onDetachedFromWindowX(): void {
            super.onDetachedFromWindow();
        }
    }

    TNSSpinner = TNSSpinnerImpl as any;
}
/* TNSSpinner END */

/* A snapshot-friendly, lazy-loaded class for DropDownAdpater BEGIN */
interface DropDownAdapter extends android.widget.BaseAdapter, android.widget.SpinnerAdapter {
    /*tslint:disable-next-line no-misused-new*/
    new (owner: WeakRef<DropDown>): DropDownAdapter;
}

let DropDownAdapter: DropDownAdapter;

function initializeDropDownAdapter() {
    if (DropDownAdapter) {
        return;
    }

    @NativeClass()
    class DropDownAdapterImpl extends android.widget.BaseAdapter implements android.widget.SpinnerAdapter {
        constructor(private owner: WeakRef<DropDown>) {
            super();

            return global.__native(this);
        }

        public isEnabled(i: number) {
            return i !== 0;
        }

        public getCount() {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return 0;
            }

            const owner = this.owner.get();
            return (owner && owner.items ? owner.items.length : 0) + 1; // +1 for the hint
        }

        public getItem(i: number) {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return "";
            }

            const owner = this.owner.get();

            if (i === 0) {
                return owner.hint;
            }

            const realIndex = i - 1;
            return owner._getItemAsString(realIndex);
        }

        public getItemId(i: number) {
            return long(i);
        }

        public hasStableIds(): boolean {
            return true;
        }

        public getView(index: number, convertView: android.view.View, parent: android.view.ViewGroup): android.view.View {
            return this._generateView(index, convertView, parent, RealizedViewType.ItemView);
        }

        public getDropDownView(index: number, convertView: android.view.View, parent: android.view.ViewGroup): android.view.View {
            return this._generateView(index, convertView, parent, RealizedViewType.DropDownView);
        }

        private _generateView(index: number, convertView: android.view.View, parent: android.view.ViewGroup, realizedViewType: RealizedViewType): android.view.View {
            // In some strange situations owner can become null (see #181)
            if (!this.owner) {
                return null;
            }

            const owner = this.owner.get();

            if (!owner) {
                return null;
            }

            const view = owner._getRealizedView(convertView, realizedViewType);

            if (view) {
                if (!view.parent) {
                    owner._addView(view);
                    convertView = view.android;
                }

                const label = view.getViewById<Label>(LABELVIEWID);
                label.text = this.getItem(index);

                // Copy root styles to view
                if (owner.style.color) {
                    label.style.color = owner.style.color;
                }
                if (owner.style.placeholderColor) {
                    label.style.placeholderColor = owner.style.placeholderColor;
                }
                label.style.textDecoration = owner.style.textDecoration;
                
                label.style.textAlignment = owner.nativeView.itemsTextAlignment !== itemsTextAlignmentProperty.defaultValue 
                    && realizedViewType === 1 ? owner.nativeView.itemsTextAlignment : owner.style.textAlignment;
                
                label.style.fontInternal = owner.style.fontInternal;
                if (owner.style.fontSize) {
                    label.style.fontSize = owner.style.fontSize;
                }
                view.style.backgroundColor = owner.style.backgroundColor;
                
                view.style.padding = owner.nativeView.itemsPadding !== itemsPaddingProperty.defaultValue 
                    && realizedViewType === 1 ? owner.nativeView.itemsPadding : owner.style.padding;
                
                view.style.height = owner.style.height;

                if (realizedViewType === RealizedViewType.DropDownView) {
                    view.style.opacity = owner.style.opacity;
                }

                (view as any).isHintViewIn = false;

                // Hint View styles
                if (index === 0) {
                    if (label.style.placeholderColor) {
                        label.style.color = label.style.placeholderColor;
                    } else {
                        label.style.color = new Color(255, 148, 150, 148);
                    }
                    (view as any).isHintViewIn = true;

                    // HACK: if there is no hint defined, make the view in the drop down virtually invisible.
                    if (realizedViewType === RealizedViewType.DropDownView
                        && (isNullOrUndefined(owner.hint) || owner.hint === "")) {
                        view.height = 1;
                    }
                    // END HACK
                }

                owner._realizedItems[realizedViewType].set(convertView, view);
            }

            return convertView;
        }
    }

    DropDownAdapter = DropDownAdapterImpl as any;
}
/* DropDownAdpater END */

/* A snapshot-friendly, lazy-loaded class for DropDownItemSelectedListener BEGIN */
interface DropDownItemSelectedListener extends java.lang.Object, android.widget.AdapterView.OnItemSelectedListener {
    /*tslint:disable-next-line no-misused-new*/
    new (owner: WeakRef<DropDown>): DropDownItemSelectedListener;
}

let DropDownItemSelectedListener: DropDownItemSelectedListener;

function initializeDropDownItemSelectedListener() {
    if (DropDownItemSelectedListener) {
        return;
    }

    @NativeClass()
    @Interfaces([android.widget.AdapterView.OnItemSelectedListener])
    class DropDownItemSelectedListenerImpl extends java.lang.Object implements android.widget.AdapterView.OnItemSelectedListener {
        constructor(private owner: WeakRef<DropDown>) {
            super();

            return global.__native(this);
        }

        public onItemSelected(parent: any, convertView: android.view.View, index: number, id: number) {
            const owner = this.owner.get();
            const oldIndex = owner.selectedIndex;
            const newIndex = (index === 0 ? null : index - 1);

            owner.selectedIndex = newIndex;

            if (newIndex !== oldIndex) {
                owner.notify({
                    eventName: DropDownBase.selectedIndexChangedEvent,
                    object: owner,
                    oldIndex,
                    newIndex
                });
            
                // Seems if the user does not select an item the control reuses the views on the next open.
                // So it should be safe to clear the cache once the user selects an item (and not when the dropdown is closed)
                owner._clearCache(RealizedViewType.DropDownView);
            }
        }

        public onNothingSelected() {
            /* Currently Not Needed */
        }
    }

    DropDownItemSelectedListener = DropDownItemSelectedListenerImpl as any;
}
/* DropDownItemSelectedListener END */
