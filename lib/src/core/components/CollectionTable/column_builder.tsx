import { getCellAlignment, getPropertyColumnWidth } from "./internal/common";
import {
    AdditionalColumnDelegate,
    CollectionSize,
    Entity,
    EntityCollection,
    FireCMSContext,
    ResolvedEntityCollection,
    ResolvedProperty,
    User
} from "../../../models";
import React, { useCallback, useEffect, useMemo } from "react";
import { TableCell } from "../Table/TableCell";
import { PropertyPreview, SkeletonComponent } from "../../../preview";
import { getPreviewSizeFrom } from "../../../preview/util";
import {
    CustomFieldValidator,
    mapPropertyToYup
} from "../../../form/validation";
import {
    OnCellChangeParams,
    PropertyTableCell
} from "./internal/PropertyTableCell";
import { ErrorBoundary } from "../../internal/ErrorBoundary";
import { useFireCMSContext } from "../../../hooks";
import { PopupFormField } from "./internal/popup_field/PopupFormField";
import { TableColumn, TableColumnFilter } from "../Table";
import { getIconForProperty } from "../../util/property_utils";
import {
    resolveCollection,
    resolveEnumValues,
    resolveProperty
} from "../../util/resolutions";

export type ColumnsFromCollectionProps<M, AdditionalKey extends string, UserType extends User> = {

    /**
     * Absolute collection path
     */
    path: string;

    /**
     * Use to resolve the collection properties for specific path, entity id or values
     */
    collection: EntityCollection<M>

    /**
     * Properties displayed in this collection. If this property is not set
     * every property is displayed, you can filter
     */
    displayedProperties: string[];

    /**
     * You can add additional columns to the collection view by implementing
     * an additional column delegate.
     * Usually defined by the end user.
     */
    additionalColumns?: AdditionalColumnDelegate<M, AdditionalKey, UserType>[];

    /**
     * Can the table be edited inline
     */
    inlineEditing: ((entity: Entity<any>) => boolean) | boolean;

    /**
     * Size of the elements in the collection
     */
    size: CollectionSize;

    /**
     * Use this callback to validate if an entity field should be unique
     */
    uniqueFieldValidator?: UniqueFieldValidator;

    /**
     * Callback when the value of a cell has been edited
     * @param params
     */
    onCellValueChange?: OnCellValueChange<unknown, M>;

};

/**
 * @category Collection components
 */
export type UniqueFieldValidator = (props: { name: string, value: any, property: ResolvedProperty, entityId?: string }) => Promise<boolean>;

/**
 * Callback when a cell has changed in a table
 * @category Collection components
 */
export type OnCellValueChange<T, M extends { [Key: string]: any }> = (params: OnCellValueChangeParams<T, M>) => Promise<void>;

/**
 * Props passed in a callback when the content of a cell in a table has been edited
 * @category Collection components
 */
export interface OnCellValueChangeParams<T, M extends { [Key: string]: any }> {
    value: T,
    name: string,
    entity: Entity<M>,
    setSaved: (saved: boolean) => void
    setError: (e: Error) => void
}

export function checkInlineEditing<M>(inlineEditing: ((entity: Entity<any>) => boolean) | boolean, entity: Entity<M>) {
    if (typeof inlineEditing === "boolean") {
        return inlineEditing;
    } else if (typeof inlineEditing === "function") {
        return inlineEditing(entity);
    } else {
        return true;
    }
}

type SelectedCellProps<M> =
    {
        propertyKey: keyof M,
        columnIndex: number,
        cellRect: DOMRect;
        width: number,
        height: number,
        collection: EntityCollection<M>,
        entity: Entity<M>
    };

export function useBuildColumnsFromCollection<M, AdditionalKey extends string, UserType extends User>({
                                                                                                          collection: inputCollection,
                                                                                                          additionalColumns,
                                                                                                          displayedProperties,
                                                                                                          path,
                                                                                                          inlineEditing,
                                                                                                          size,
                                                                                                          onCellValueChange,
                                                                                                          uniqueFieldValidator
                                                                                                      }: ColumnsFromCollectionProps<M, AdditionalKey, UserType>
): { columns: TableColumn<M>[], popupFormField: React.ReactElement } {

    const context: FireCMSContext<UserType> = useFireCMSContext();

    const [selectedCell, setSelectedCell] = React.useState<SelectedCellProps<M> | undefined>(undefined);
    const [popupCell, setPopupCell] = React.useState<SelectedCellProps<M> | undefined>(undefined);
    const [focused, setFocused] = React.useState<boolean>(false);

    const [preventOutsideClick, setPreventOutsideClick] = React.useState<boolean>(false);

    const tableKey = React.useRef<string>(Math.random().toString(36));

    const additionalColumnsMap: Record<string, AdditionalColumnDelegate<M, string, UserType>> = useMemo(() => {
        return additionalColumns
            ? additionalColumns
                .map((aC) => ({ [aC.id]: aC }))
                .reduce((a, b) => ({ ...a, ...b }), {})
            : {};
    }, [additionalColumns]);

    // on ESC key press
    useEffect(() => {
        const escFunction = (event: any) => {
            if (event.keyCode === 27) {
                unselect();
            }
        };
        document.addEventListener("keydown", escFunction, false);
        return () => {
            document.removeEventListener("keydown", escFunction, false);
        };
    });

    const select = useCallback((cell?: SelectedCellProps<M>) => {
        setSelectedCell(cell);
        setFocused(true);
    }, []);

    const unselect = useCallback(() => {
        setSelectedCell(undefined);
        setFocused(false);
        setPreventOutsideClick(false);
    }, []);

    const onPopupClose = useCallback(() => {
        setPopupCell(undefined);
        setFocused(true);
    }, []);

    const buildFilterableFromProperty = useCallback((property: ResolvedProperty,
                                                     isArray = false): TableColumnFilter | undefined => {

        if (property.dataType === "number" || property.dataType === "string") {
            const name = property.name;
            const enumValues = property.enumValues ? resolveEnumValues(property.enumValues) : undefined;
            return {
                dataType: property.dataType,
                isArray,
                title: name,
                enumValues
            };
        } else if (property.dataType === "array" && property.of) {
            if (Array.isArray(property.of)) {
                return undefined;
            }
            return buildFilterableFromProperty(property.of, true);
        } else if (property.dataType === "boolean") {
            const name = property.name;
            return {
                dataType: property.dataType,
                isArray,
                title: name
            };
        } else if (property.dataType === "date") {
            const title = property.name;
            return {
                dataType: property.dataType,
                isArray,
                title,
                dateMode: property.mode
            };
        }

        return undefined;

    }, []);

    const resolvedCollection: ResolvedEntityCollection<M> = useMemo(() => resolveCollection({
        collection: inputCollection,
        path
    }), [inputCollection, path]);

    const propertyCellRenderer = useCallback(({
                                      column,
                                      columnIndex,
                                      rowData,
                                      rowIndex
                                  }: any) => {

        const entity: Entity<M> = rowData;

        const propertyKey = column.dataKey;

        const propertyOrBuilder = inputCollection.properties[propertyKey];
        const property = resolveProperty({
            propertyOrBuilder,
            path,
            propertyValue: entity.values ? entity.values[propertyKey] : undefined,
            values: entity.values,
            entityId: entity.id
        });

        if (!property)
            return null;

        const inlineEditingEnabled = checkInlineEditing(inlineEditing, entity);

        if (!inlineEditingEnabled) {
            return (
                <TableCell
                    key={`preview_cell_${propertyKey}_${rowIndex}_${columnIndex}`}
                    size={size}
                    value={entity.values[propertyKey]}
                    align={column.align}
                    disabled={true}>
                    <PropertyPreview
                        width={column.width}
                        height={column.height}
                        propertyKey={`preview_${propertyKey}_${rowIndex}_${columnIndex}`}
                        property={property as any}
                        entity={entity}
                        value={entity.values[propertyKey]}
                        size={getPreviewSizeFrom(size)}
                    />
                </TableCell>
            );
        } else {

            const openPopup = (cellRect: DOMRect | undefined) => {
                if (!cellRect) {
                    setPopupCell(undefined);
                } else {
                    setPopupCell({
                        columnIndex,
                        width: column.width,
                        height: column.height,
                        entity,
                        cellRect,
                        propertyKey,
                        collection: inputCollection
                    });
                }
            };

            const onSelect = (cellRect: DOMRect | undefined) => {
                if (!cellRect) {
                    select(undefined);
                } else {
                    select({
                        columnIndex,
                        // rowIndex,
                        width: column.width,
                        height: column.height,
                        entity,
                        cellRect,
                        propertyKey,
                        collection: inputCollection
                    });
                }
            };

            const selected = selectedCell?.columnIndex === columnIndex &&
                selectedCell?.entity.id === entity.id;

            const isFocused = selected && focused;

            const customFieldValidator: CustomFieldValidator | undefined = uniqueFieldValidator
                ? ({ name, value, property }) => uniqueFieldValidator({
                    name, value, property, entityId: entity.id
                })
                : undefined;

            const validation = mapPropertyToYup({
                property,
                customFieldValidator,
                name: propertyKey
            });

            const onValueChange = onCellValueChange
                ? (props: OnCellChangeParams<any>) => onCellValueChange({
                    ...props,
                    entity
                })
                : undefined;

            return <ErrorBoundary>
                {entity
                    ? <PropertyTableCell
                        key={`table_cell_${propertyKey}_${rowIndex}_${columnIndex}`}
                        size={size}
                        align={column.align}
                        name={propertyKey as string}
                        validation={validation}
                        onValueChange={onValueChange}
                        selected={selected}
                        focused={isFocused}
                        setPreventOutsideClick={setPreventOutsideClick}
                        setFocused={setFocused}
                        value={entity?.values ? entity.values[propertyKey] : undefined}
                        property={property}
                        openPopup={openPopup}
                        onSelect={onSelect}
                        width={column.width}
                        height={column.height}
                        entity={entity}
                        path={entity.path}/>
                    : <SkeletonComponent property={property}
                                         size={getPreviewSizeFrom(size)}/>
                }
            </ErrorBoundary>;
        }

    }, [focused, inlineEditing, onCellValueChange, path, inputCollection, select, selectedCell?.columnIndex, selectedCell?.entity.id, size]);

    const additionalCellRenderer = useCallback(({
                                        column,
                                        columnIndex,
                                        rowData,
                                        rowIndex
                                    }: any) => {

        const entity: Entity<M> = rowData;

        const additionalColumn = additionalColumnsMap[column.dataKey as AdditionalKey];
        const value = additionalColumn.dependencies
            ? Object.entries(entity.values)
                .filter(([key, value]) => additionalColumn.dependencies!.includes(key as any))
                .reduce((a, b) => ({ ...a, ...b }), {})
            : undefined;

        return (
            <TableCell
                value={value}
                focused={false}
                selected={false}
                disabled={true}
                size={size}
                align={"left"}
                allowScroll={false}
                showExpandIcon={false}
                disabledTooltip={"This column can't be edited directly"}
            >
                <ErrorBoundary>
                    {additionalColumn.builder({
                        entity,
                        context
                    })}
                </ErrorBoundary>
            </TableCell>
        );

    }, [additionalColumnsMap, size]);

    const allColumns: TableColumn<M>[] = (Object.keys(resolvedCollection.properties) as (keyof M)[])
        .map((key) => {
            const property = resolvedCollection.properties[key];
            return ({
                key: key as string,
                property,
                align: getCellAlignment(property),
                icon: (hoverOrOpen) => getIconForProperty(property, hoverOrOpen ? undefined : "disabled", "small"),
                label: property.name || key as string,
                sortable: true,
                filter: buildFilterableFromProperty(property),
                width: getPropertyColumnWidth(property),
                cellRenderer: propertyCellRenderer
            });
        });

    if (additionalColumns) {
        const items: TableColumn<M>[] = additionalColumns.map((additionalColumn) =>
            ({
                key: additionalColumn.id,
                type: "additional",
                align: "left",
                sortable: false,
                label: additionalColumn.name,
                width: additionalColumn.width ?? 200,
                cellRenderer: additionalCellRenderer
            }));
        allColumns.push(...items);
    }

    const columns = displayedProperties
        .map((p) => {
            return allColumns.find(c => c.key === p);
        }).filter(c => !!c) as TableColumn<M>[];

    const customFieldValidator: CustomFieldValidator | undefined = uniqueFieldValidator
        ? ({ name, value, property }) => uniqueFieldValidator({
            name,
            value,
            property,
            entityId: selectedCell?.entity.id
        })
        : undefined;

    const popupFormField = (
        <PopupFormField
            key={`popup_form_${popupCell?.columnIndex}_${popupCell?.entity?.id}`}
            open={Boolean(popupCell)}
            onClose={onPopupClose}
            cellRect={popupCell?.cellRect}
            columnIndex={popupCell?.columnIndex}
            propertyKey={popupCell?.propertyKey}
            collection={popupCell?.collection}
            entity={popupCell?.entity}
            tableKey={tableKey.current}
            customFieldValidator={customFieldValidator}
            path={path}
            onCellValueChange={onCellValueChange}
            setPreventOutsideClick={setPreventOutsideClick}
        />
    );

    return { columns, popupFormField };

}
