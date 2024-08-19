import {
    FieldHelperText,
    FieldProps,
    getIconForProperty,
    LabelWithIcon,
    randomString,
    useStorageSource
} from "../../index";
import { Paper } from "@firecms/ui";
import { FireCMSEditor } from "@firecms/editor";
import React, { useCallback, useEffect, useRef } from "react";
import { resolveFilenameString, resolveStoragePathString } from "../../util/storage";

interface MarkdownEditorFieldProps {
}

export function MarkdownEditorFieldBinding({
                                               property,
                                               propertyKey,
                                               value,
                                               setValue,
                                               includeDescription,
                                               showError,
                                               error,
                                               minimalistView,
                                               isSubmitting,
                                               context, // the rest of the entity values here
                                               ...props
                                           }: FieldProps<string, MarkdownEditorFieldProps>) {

    const storageSource = useStorageSource();
    const storage = property.storage;

    const entityValues = context.values;
    const entityId = context.entityId;
    const path = context.path;

    const fieldVersion = useRef(0);
    const internalValue = useRef(value);

    const onContentChange = useCallback((content: string) => {
        internalValue.current = content;
        setValue(content);
    }, [setValue]);

    useEffect(() => {
        if (internalValue.current !== value) {
            fieldVersion.current = fieldVersion.current++;
        }
    }, [value]);

    const fileNameBuilder = useCallback(async (file: File) => {
        if (storage?.fileName) {
            const fileName = await resolveFilenameString({
                input: storage.fileName,
                storage,
                values: entityValues,
                entityId,
                path,
                property,
                file,
                propertyKey
            });
            if (!fileName || fileName.length === 0) {
                throw Error("You need to return a valid filename");
            }
            return fileName;
        }
        return randomString() + "_" + file.name;
    }, [entityId, entityValues, path, property, propertyKey, storage]);

    const storagePathBuilder = useCallback((file: File) => {
        if (!storage) return "/";
        return resolveStoragePathString({
            input: storage.storagePath,
            storage,
            values: entityValues,
            entityId,
            path,
            property,
            file,
            propertyKey
        }) ?? "/";
    }, [entityId, entityValues, path, property, propertyKey, storage]);

    const editor = <FireCMSEditor
        content={value}
        onMarkdownContentChange={onContentChange}
        version={context.formex.version + fieldVersion.current}
        handleImageUpload={async (file: File) => {
            console.log("Uploading file", file);
            const storagePath = storagePathBuilder(file);
            const fileName = await fileNameBuilder(file);
            const result = await storageSource.uploadFile({
                file,
                fileName,
                path: storagePath,
            });
            const downloadConfig = await storageSource.getDownloadURL(result.path);
            const url = downloadConfig.url;
            if (!url) {
                throw new Error("Error uploading image");
            }
            return url;
        }}/>;

    if (minimalistView)
        return editor;

    return (
        <>
            <LabelWithIcon icon={getIconForProperty(property, "small")}
                           required={property.validation?.required}
                           title={property.name}
                           className={"text-text-secondary dark:text-text-secondary-dark ml-3.5"}/>
            <Paper>
                {editor}
            </Paper>
            <FieldHelperText includeDescription={includeDescription}
                             showError={showError}
                             error={error}
                             property={property}/>
        </>

    );

}
