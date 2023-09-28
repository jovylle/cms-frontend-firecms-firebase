import React, { useCallback, useContext, useEffect, useMemo } from "react";
import equal from "react-fast-compare";
import { getTableCellAlignment, getTablePropertyColumnWidth, getSubcollectionColumnId } from "./internal/common";
import {
    AdditionalFieldDelegate,
    CollectionSize,
    Entity,
    EntityCollection,
    FilterValues,
    FireCMSContext,
    PropertyOrBuilder,
    ResolvedEntityCollection,
    ResolvedProperty,
    SaveEntityProps,
    User
} from "../../../types";
import { ReferencePreview, renderSkeletonText } from "../../../preview";
import { CustomFieldValidator } from "../../../form/validation";
import { PropertyTableCell } from "./internal/PropertyTableCell";
import { ErrorBoundary } from "../ErrorBoundary";
import {
    saveEntityWithCallbacks,
    useDataSource,
    useFireCMSContext,
    useLargeLayout,
    useNavigationContext,
    useSideEntityController
} from "../../../hooks";
import { PopupFormField } from "./internal/popup_field/PopupFormField";
import { CellRendererParams, VirtualTable, VirtualTableColumn } from "../VirtualTable";
import {
    enumToObjectEntries,
    getIconForProperty,
    getPropertyInPath,
    getResolvedPropertyInPath,
    getValueInPath,
    resolveCollection,
    resolveProperty
} from "../../util";
import { getRowHeight } from "../VirtualTable/common";
import { EntityCollectionRowActions } from "./internal/EntityCollectionRowActions";
import { EntityCollectionTableController, OnCellValueChange, SelectedCellProps, UniqueFieldValidator } from "./types";
import { setIn } from "formik";
import { CollectionTableToolbar } from "./internal/CollectionTableToolbar";
import { EntityCollectionTableProps } from "./EntityCollectionTableProps";
import { EntityTableCell } from "./internal/EntityTableCell";
import { FilterFormFieldProps } from "../VirtualTable/VirtualTableHeader";
import { ReferenceFilterField } from "./filters/ReferenceFilterField";
import { StringNumberFilterField } from "./filters/StringNumberFilterField";
import { BooleanFilterField } from "./filters/BooleanFilterField";
import { DateTimeFilterField } from "./filters/DateTimeFilterField";
import { Button } from "../../../components";
import { KeyboardTabIcon } from "../../../icons";

const DEFAULT_STATE = {} as any;

export const EntityCollectionTableContext = React.createContext<EntityCollectionTableController<any>>(DEFAULT_STATE);

export const useEntityCollectionTableController = () => useContext<EntityCollectionTableController<any>>(EntityCollectionTableContext);

const COLLECTION_GROUP_PARENT_ID = "collectionGroupParent";

/**
 * This component is in charge of rendering a collection table with a high
 * degree of customization. It is in charge of fetching data from
 * the {@link DataSource} and holding the state of filtering and sorting.
 *
 * This component is used internally by {@link EntityCollectionView} and
 * {@link useReferenceDialog}
 *
 * Please note that you only need to use this component if you are building
 * a custom view. If you just need to create a default view you can do it
 * exclusively with config options.
 *
 * If you want to bind a {@link EntityCollection} to a table with the default
 * options you see in collections in the top level navigation, you can
 * check {@link EntityCollectionView}
 *
 * If you need a table that is not bound to the datasource or entities and
 * properties at all, you can check {@link VirtualTable}
 *
 * @see EntityCollectionTableProps
 * @see EntityCollectionView
 * @see VirtualTable
 * @category Components
 */
export const EntityCollectionTable = React.memo<EntityCollectionTableProps<any>>(
    function EntityCollectionTable<M extends Record<string, any>, AdditionalKey extends string, UserType extends User>
    ({
         fullPath,
         initialFilter,
         initialSort,
         forceFilter,
         actionsStart,
         actions,
         title,
         tableRowActionsBuilder,
         uniqueFieldValidator,
         onValueChange,
         selectionController,
         highlightedEntities,
         onEntityClick,
         onColumnResize,
         onSizeChanged,
         textSearchEnabled = false,
         hoverRow = true,
         inlineEditing = false,
         tableController:
             {
                 data,
                 dataLoading,
                 noMoreToLoad,
                 dataLoadingError,
                 filterValues,
                 setFilterValues,
                 sortBy,
                 setSortBy,
                 searchString,
                 setSearchString,
                 clearFilter,
                 itemCount,
                 setItemCount,
                 pageSize,
                 paginationEnabled,
                 checkFilterCombination
             },
         ...collection
     }: EntityCollectionTableProps<M>) {

        const navigation = useNavigationContext();

        const resolvedFullPath = navigation.resolveAliasesFrom(fullPath);

        const largeLayout = useLargeLayout();
        const disabledFilterChange = Boolean(forceFilter);
        const selectedEntities = selectionController?.selectedEntities?.length > 0 ? selectionController?.selectedEntities : highlightedEntities;

        const tableKey = React.useRef<string>(Math.random().toString(36));

        const context: FireCMSContext<UserType> = useFireCMSContext();

        const sideEntityController = useSideEntityController();

        const resolvedCollection = useMemo(() => resolveCollection<M>({
            collection,
            path: fullPath,
            fields: context.fields
        }), [collection, fullPath]);

        const [size, setSize] = React.useState<CollectionSize>(resolvedCollection.defaultSize ?? "m");

        const [selectedCell, setSelectedCell] = React.useState<SelectedCellProps<M> | undefined>(undefined);
        const [popupCell, setPopupCell] = React.useState<SelectedCellProps<M> | undefined>(undefined);

        const selectedEntityIds = selectedEntities?.map(e => e.id);

        const filterIsSet = !!filterValues && Object.keys(filterValues).length > 0;

        const additionalFields = useMemo(() => {
            const subcollectionColumns: AdditionalFieldDelegate<M, any, any>[] = collection.subcollections?.map((subcollection) => {
                return {
                    id: getSubcollectionColumnId(subcollection),
                    name: subcollection.name,
                    width: 200,
                    dependencies: [],
                    Builder: ({ entity }) => (
                        <Button color={"primary"}
                                startIcon={<KeyboardTabIcon size={"small"}/>}
                                onClick={(event: any) => {
                                    event.stopPropagation();
                                    sideEntityController.open({
                                        path: fullPath,
                                        entityId: entity.id,
                                        selectedSubPath: subcollection.alias ?? subcollection.path,
                                        collection,
                                        updateUrl: true
                                    });
                                }}>
                            {subcollection.name}
                        </Button>
                    )
                };
            }) ?? [];

            const collectionGroupParentCollections: AdditionalFieldDelegate<M, any, any>[] = collection.collectionGroup
                ? [{
                    id: COLLECTION_GROUP_PARENT_ID,
                    name: "Parent entities",
                    width: 260,
                    dependencies: [],
                    Builder: ({ entity }) => {
                        const collectionsWithPath = navigation.getParentReferencesFromPath(entity.path);
                        return (
                            <>
                                {collectionsWithPath.map((reference) => {
                                    return (
                                        <ReferencePreview
                                            key={reference.path + "/" + reference.id}
                                            reference={reference}
                                            size={"tiny"}/>
                                    );
                                })}
                            </>
                        );
                    }
                }]
                : [];

            return [
                ...(collection.additionalFields ?? collection.additionalColumns ?? []),
                ...subcollectionColumns,
                ...collectionGroupParentCollections
            ];
        }, [collection, fullPath]);

        const loadNextPage = () => {
            if (!paginationEnabled || dataLoading || noMoreToLoad)
                return;
            if (itemCount !== undefined)
                setItemCount(itemCount + pageSize);
        };

        const resetPagination = useCallback(() => {
            setItemCount(pageSize);
        }, [pageSize]);

        const onRowClick = useCallback(({ rowData }: {
            rowData: Entity<M>
        }) => {
            if (inlineEditing)
                return;
            return onEntityClick && onEntityClick(rowData);
        }, [onEntityClick, inlineEditing]);

        const updateSize = useCallback((size: CollectionSize) => {
            if (onSizeChanged)
                onSizeChanged(size);
            setSize(size);
        }, []);

        const onTextSearch = useCallback((newSearchString?: string) => setSearchString(newSearchString), []);

        const additionalFieldsMap: Record<string, AdditionalFieldDelegate<M, string, UserType>> = useMemo(() => {
            return (additionalFields
                ? additionalFields
                    .map((aC) => ({ [aC.id]: aC }))
                    .reduce((a, b) => ({ ...a, ...b }), {})
                : {}) as Record<string, AdditionalFieldDelegate<M, string, UserType>>;
        }, [additionalFields]);

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
        }, []);

        const unselect = useCallback(() => {
            setSelectedCell(undefined);
        }, []);

        const onPopupClose = useCallback(() => {
            setPopupCell(undefined);
        }, []);

        const displayedColumnIds = useColumnIds<M>(resolvedCollection, true);

        const customFieldValidator: CustomFieldValidator | undefined = uniqueFieldValidator;

        const propertyCellRenderer = useCallback(({
                                                      column,
                                                      columnIndex,
                                                      rowData,
                                                      rowIndex
                                                  }: CellRendererParams<any>) => {

            const entity: Entity<M> = rowData;

            const propertyKey = column.key;

            let disabled = false;
            let propertyOrBuilder: PropertyOrBuilder<any, M> | undefined = getPropertyInPath<M>(collection.properties, propertyKey);

            // we might not find the property in the collection if combining property builders and map spread
            if (!propertyOrBuilder) {
                // these 2 properties are coming from the resolved collection with default values
                propertyOrBuilder = column.custom.property;
                disabled = column.custom.disabled;
            }

            const property = resolveProperty({
                propertyKey,
                propertyOrBuilder,
                path: fullPath,
                propertyValue: entity.values ? getValueInPath(entity.values, propertyKey) : undefined,
                values: entity.values,
                entityId: entity.id,
                fields: context.fields
            });

            if (!property) {
                return null;
            }

            return (
                <ErrorBoundary>
                    {entity
                        ? <PropertyTableCell
                            key={`property_table_cell_${entity.id}_${propertyKey}`}
                            readonly={!inlineEditing}
                            align={column.align ?? "left"}
                            propertyKey={propertyKey as string}
                            property={property}
                            value={entity?.values ? getValueInPath(entity.values, propertyKey) : undefined}
                            collection={collection}
                            customFieldValidator={customFieldValidator}
                            columnIndex={columnIndex}
                            width={column.width}
                            height={getRowHeight(size)}
                            entity={entity}
                            disabled={disabled}
                            path={entity.path}/>
                        : renderSkeletonText()
                    }
                </ErrorBoundary>);

        }, [collection, customFieldValidator, fullPath, inlineEditing, size, selectedEntityIds]);

        const additionalCellRenderer = useCallback(({
                                                        column,
                                                        rowData,
                                                        width
                                                    }: CellRendererParams<any>) => {

            const entity: Entity<M> = rowData;

            const additionalField = additionalFieldsMap[column.key as AdditionalKey];
            const value = additionalField.dependencies
                ? Object.entries(entity.values)
                    .filter(([key, value]) => additionalField.dependencies!.includes(key as Extract<keyof M, string>))
                    .reduce((a, b) => ({ ...a, ...b }), {})
                : entity;

            if (additionalField.builder) {
                console.warn("`additionalField.builder` is deprecated. Use `additionalField.Builder` instead.");
            }

            const Builder = additionalField.builder ?? additionalField.Builder;
            if (!Builder) {
                throw new Error("No builder provided for additional field");
            }

            return (
                <EntityTableCell
                    key={`additional_table_cell_${entity.id}_${column.key}`}
                    width={width}
                    size={size}
                    value={value}
                    selected={false}
                    disabled={true}
                    align={"left"}
                    allowScroll={false}
                    showExpandIcon={false}
                    disabledTooltip={"This column can't be edited directly"}
                >
                    <ErrorBoundary>
                        <Builder entity={entity}
                                 context={context}/>
                    </ErrorBoundary>
                </EntityTableCell>
            );

        }, [additionalFieldsMap, size, selectedEntityIds]);

        const allColumns: VirtualTableColumn[] = useMemo(() => {
                const columnsResult: VirtualTableColumn[] = Object.entries<ResolvedProperty>(resolvedCollection.properties)
                    .flatMap(([key, property]) => getColumnKeysForProperty(property, key))
                    .map(({
                              key,
                              disabled
                          }) => {
                        const property = getResolvedPropertyInPath(resolvedCollection.properties, key);
                        if (!property)
                            throw Error("Internal error: no property found in path " + key);
                        const filterable = filterableProperty(property);
                        return {
                            key: key as string,
                            align: getTableCellAlignment(property),
                            icon: (hoverOrOpen) => getIconForProperty(property, "small"),
                            title: property.name ?? key as string,
                            sortable: forceFilter ? Object.keys(forceFilter).includes(key) : true,
                            filter: !disabledFilterChange && filterable,
                            width: getTablePropertyColumnWidth(property),
                            resizable: true,
                            custom: {
                                property,
                                disabled
                            }
                        };
                    });

                const additionalTableColumns: VirtualTableColumn[] = additionalFields
                    ? additionalFields.map((additionalField) =>
                        ({
                            key: additionalField.id,
                            type: "additional",
                            align: "left",
                            sortable: false,
                            title: additionalField.name,
                            width: additionalField.width ?? 200
                        }))
                    : [];
                return [...columnsResult, ...additionalTableColumns];
            },
            [additionalFields, disabledFilterChange, forceFilter, resolvedCollection.properties]);

        const idColumn: VirtualTableColumn = useMemo(() => ({
            key: "id_ewcfedcswdf3",
            width: largeLayout ? 160 : 130,
            title: "ID",
            resizable: false,
            frozen: largeLayout,
            headerAlign: "center"
        }), [largeLayout])

        const columns: VirtualTableColumn[] = useMemo(() => [
            idColumn,
            ...displayedColumnIds
                .map((p) => {
                    return allColumns.find(c => c.key === p.key);
                }).filter(c => !!c) as VirtualTableColumn[]
        ], [allColumns, displayedColumnIds, idColumn]);

        const cellRenderer = useCallback((props: CellRendererParams<any>) => {
            const column = props.column;
            const columns = props.columns;
            const columnKey = column.key;
            if (props.columnIndex === 0) {
                if (tableRowActionsBuilder)
                    return tableRowActionsBuilder({
                        entity: props.rowData,
                        size,
                        width: column.width,
                        frozen: column.frozen
                    });
                else
                    return <EntityCollectionRowActions entity={props.rowData}
                                                       width={column.width}
                                                       frozen={column.frozen}
                                                       isSelected={false}
                                                       size={size}/>;
            } else if (additionalFieldsMap[columnKey]) {
                return additionalCellRenderer(props);
            } else if (props.columnIndex < columns.length + 1) {
                return propertyCellRenderer(props);
            } else {
                throw Error("Internal: columns not mapped properly");
            }
        }, [additionalFieldsMap, tableRowActionsBuilder, size, additionalCellRenderer, propertyCellRenderer])

        const onFilterUpdate = useCallback((updatedFilterValues?: FilterValues<any>) => {
            setFilterValues({ ...updatedFilterValues, ...forceFilter } as FilterValues<any>);
        }, [forceFilter]);

        return (

            <EntityCollectionTableContext.Provider
                value={{
                    setPopupCell,
                    select,
                    onValueChange,
                    size,
                    selectedCell,
                    selectedEntityIds,
                }}
            >

                <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950">

                    <CollectionTableToolbar
                        forceFilter={disabledFilterChange}
                        filterIsSet={filterIsSet}
                        onTextSearch={textSearchEnabled ? onTextSearch : undefined}
                        clearFilter={clearFilter}
                        size={size}
                        onSizeChanged={updateSize}
                        title={title}
                        actionsStart={actionsStart}
                        actions={actions}
                        loading={dataLoading}/>

                    <div className="flex-grow">
                        <VirtualTable
                            data={data}
                            columns={columns}
                            cellRenderer={cellRenderer}
                            onRowClick={inlineEditing ? undefined : onRowClick}
                            onEndReached={loadNextPage}
                            onResetPagination={resetPagination}
                            error={dataLoadingError}
                            paginationEnabled={paginationEnabled}
                            onColumnResize={onColumnResize}
                            size={size}
                            loading={dataLoading}
                            filter={filterValues}
                            onFilterUpdate={onFilterUpdate}
                            sortBy={sortBy}
                            onSortByUpdate={setSortBy as ((sortBy?: [string, "asc" | "desc"]) => void)}
                            hoverRow={hoverRow}
                            checkFilterCombination={checkFilterCombination}
                            createFilterField={createFilterField}
                            rowClassName={useCallback((entity: Entity<M>) => {
                                return selectedEntityIds?.includes(entity.id) ? "bg-gray-100 bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75" : "";
                            }, [selectedEntityIds])}
                        />
                    </div>

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
                        path={resolvedFullPath}
                        onCellValueChange={onValueChange}
                    />

                </div>
            </EntityCollectionTableContext.Provider>
        );

    },
    equal
);

function getDefaultColumnKeys<M extends Record<string, any> = any>(collection: ResolvedEntityCollection<M>, includeSubcollections: boolean) {
    const propertyKeys = Object.keys(collection.properties);

    if (collection.additionalColumns) {
        console.warn("`additionalColumns` is deprecated and will be removed in previous versions. Use `additionalFields` instead, with the same structure.");
    }

    const additionalFields = collection.additionalFields ?? collection.additionalColumns ?? [];
    const subCollections: EntityCollection[] = collection.subcollections ?? [];

    const columnIds: string[] = [
        ...propertyKeys,
        ...additionalFields.map((field) => field.id)
    ];

    if (includeSubcollections) {
        const subCollectionIds = subCollections
            .map((collection) => getSubcollectionColumnId(collection));
        columnIds.push(...subCollectionIds.filter((subColId) => !columnIds.includes(subColId)));
    }

    if (collection.collectionGroup) {
        columnIds.push(COLLECTION_GROUP_PARENT_ID);
    }

    return hideAndExpandKeys(collection, columnIds);
}

function useColumnIds<M extends Record<string, any>>(collection: ResolvedEntityCollection<M>, includeSubcollections: boolean): PropertyColumnConfig[] {
    return useMemo(() => {
        if (collection.propertiesOrder)
            return hideAndExpandKeys(collection, collection.propertiesOrder);
        return getDefaultColumnKeys(collection, includeSubcollections);

    }, [collection, includeSubcollections]);
}

function hideAndExpandKeys<M extends Record<string, any>>(collection: ResolvedEntityCollection<M>, keys: string[]): PropertyColumnConfig[] {

    return keys.flatMap((key) => {
        const property = collection.properties[key];
        if (property) {
            if (property.hideFromCollection)
                return [null];
            if (property.disabled && typeof property.disabled === "object" && property.disabled.hidden)
                return [null];
            if (property.dataType === "map" && property.spreadChildren && property.properties) {
                return getColumnKeysForProperty(property, key);
            }
            return [{
                key,
                disabled: Boolean(property.disabled) || Boolean(property.readOnly)
            }];
        }

        const additionalField = collection.additionalFields?.find(field => field.id === key);
        if (additionalField) {
            return [{
                key,
                disabled: true
            }];
        }

        if (collection.collectionGroup && key === COLLECTION_GROUP_PARENT_ID) {
            return [{
                key,
                disabled: true
            }];
        }

        return [null];
    }).filter(Boolean) as PropertyColumnConfig[];
}

function createFilterField({
                               id,
                               filterValue,
                               setFilterValue,
                               column,
                               popupOpen,
                               setPopupOpen
                           }: FilterFormFieldProps<{
    property: ResolvedProperty,
    disabled: boolean,
}>): React.ReactNode {

    if (!column.custom) {
        return null;
    }

    const { property } = column.custom;
    const isArray = property?.dataType === "array";
    const baseProperty: ResolvedProperty = isArray ? property.of : property;
    if (!baseProperty) {
        return null;
    }
    if (baseProperty.dataType === "reference") {
        return <ReferenceFilterField value={filterValue}
                                     setValue={setFilterValue}
                                     name={id as string}
                                     isArray={isArray}
                                     path={baseProperty.path}
                                     title={property?.name}
                                     previewProperties={baseProperty?.previewProperties}
                                     popupOpen={popupOpen}
                                     setPopupOpen={setPopupOpen}/>;
    } else if (baseProperty.dataType === "number" || baseProperty.dataType === "string") {
        const name = baseProperty.name;
        const enumValues = baseProperty.enumValues ? enumToObjectEntries(baseProperty.enumValues) : undefined;
        return <StringNumberFilterField value={filterValue}
                                        setValue={setFilterValue}
                                        name={id as string}
                                        dataType={baseProperty.dataType}
                                        isArray={isArray}
                                        enumValues={enumValues}
                                        title={name}/>;
    } else if (baseProperty.dataType === "boolean") {
        const name = baseProperty.name;
        return <BooleanFilterField value={filterValue}
                                   setValue={setFilterValue}
                                   name={id as string}
                                   title={name}/>;

    } else if (baseProperty.dataType === "date") {
        const title = baseProperty.name;
        return <DateTimeFilterField value={filterValue}
                                    setValue={setFilterValue}
                                    name={id as string}
                                    mode={baseProperty.mode}
                                    isArray={isArray}
                                    title={title}/>;
    }

    return (
        <div>{`Currently the filter field ${property.dataType} is not supported`}</div>
    );
}

function filterableProperty(property: ResolvedProperty, partOfArray = false): boolean {
    if (partOfArray) {
        return ["string", "number", "date", "reference"].includes(property.dataType);
    }
    if (property.dataType === "array") {
        if (property.of)
            return filterableProperty(property.of, true);
        else
            return false;
    }
    return ["string", "number", "boolean", "date", "reference", "array"].includes(property.dataType);
}

type PropertyColumnConfig = {
    key: string,
    disabled: boolean,
};

function getColumnKeysForProperty(property: ResolvedProperty, key: string, disabled?: boolean): PropertyColumnConfig[] {
    if (property.dataType === "map" && property.spreadChildren && property.properties) {
        return Object.entries(property.properties)
            .flatMap(([childKey, childProperty]) => getColumnKeysForProperty(
                childProperty,
                `${key}.${childKey}`,
                disabled || Boolean(property.disabled) || Boolean(property.readOnly))
            );
    }
    return [{
        key,
        disabled: disabled || Boolean(property.disabled) || Boolean(property.readOnly)
    }];
}