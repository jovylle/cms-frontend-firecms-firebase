import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Box, Button, Dialog } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import {
    CustomDialogActions,
    EntityCollection,
    removeInitialAndTrailingSlashes,
    removeUndefined,
    useSnackbarController
} from "@camberi/firecms";
import { Form, Formik } from "formik";
import { YupSchema } from "./SchemaYupValidation";
import { LoadingButton } from "@mui/lab";
import { CollectionDetailsForm } from "./CollectionDetailsForm";
import { CollectionEditorForm } from "./CollectionEditor";

export interface NewCollectionEditorDialogProps {
    open: boolean;
    group?: string;
    parentPath?: string;
    handleClose: (collection?: EntityCollection) => void;
    saveCollection: <M>(path: string, collection: EntityCollection<M>) => Promise<void>;
}

export function NewCollectionEditorDialog<M>({
                                                 open,
                                                 group,
                                                 saveCollection,
                                                 parentPath,
                                                 handleClose
                                             }: NewCollectionEditorDialogProps) {

    const snackbarController = useSnackbarController();

    // Use this ref to store which properties have errors
    const propertyErrorsRef = useRef({});

    const [mode, setMode] = useState<"details" | "properties">("details"); // this view can edit either the details view or the properties one

    const [error, setError] = React.useState<Error | undefined>();

    const onSaveCollection = useCallback((collection: EntityCollection<M>): Promise<boolean> => {
        const fullPath = parentPath ? removeInitialAndTrailingSlashes(parentPath) + "/" + collection.path : collection.path;
        return saveCollection(fullPath, collection)
            .then(() => {
                setError(undefined);
                return true;
            })
            .catch((e) => {
                setError(e);
                console.error(e);
                snackbarController.open({
                    type: "error",
                    title: "Error persisting collection",
                    message: e.message ?? "Details in the console"
                });
                return false;
            });
    }, [saveCollection, snackbarController, parentPath]);

    const initialValues: EntityCollection = {
        path: "",
        name: "",
        group: group,
        properties: {},
        propertiesOrder: []
    };
    return (
        <Dialog
            open={open}
            maxWidth={"lg"}
            fullWidth
            keepMounted={false}
            PaperProps={{
                sx: (theme) => ({
                    height: "100%",
                    "@media (min-height:964px)": {
                        maxHeight: "900px"
                    },
                    background: theme.palette.background.default
                })
            }}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={YupSchema}
                validate={() => {
                    if (mode === "properties") return propertyErrorsRef.current;
                    return undefined;
                }}
                onSubmit={(newCollection: EntityCollection, formikHelpers) => {
                    if (mode === "details") {
                        setMode("properties");
                        formikHelpers.resetForm({
                            values: newCollection,
                            touched: { path: true, name: true }
                        });
                    } else {
                        onSaveCollection(newCollection).then(() => {
                            formikHelpers.resetForm({ values: initialValues });
                            setMode("details");
                            handleClose(newCollection);
                        });
                    }
                }}
            >
                {({ isSubmitting, dirty, submitCount }) => {
                    return (

                        <Form noValidate style={{
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            height: "100%"
                        }}>
                            <Box sx={{
                                height: "100%",
                                flexGrow: 1
                            }}>
                                {mode === "details" &&
                                    <CollectionDetailsForm isNewCollection={true}/>}

                                {mode === "properties" &&
                                    <CollectionEditorForm
                                        showErrors={submitCount > 0}
                                        isNewCollection={true}
                                        onPropertyError={(propertyKey, error) => {
                                            propertyErrorsRef.current = removeUndefined({
                                                ...propertyErrorsRef.current,
                                                [propertyKey]: error
                                            })
                                        }}/>
                                }
                            </Box>

                            <CustomDialogActions
                                position={ "absolute" }>
                                <Button variant={"text"}
                                        onClick={() => {
                                            handleClose();
                                            setMode("details");
                                        }}>
                                    Cancel
                                </Button>
                                <LoadingButton
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={!dirty}
                                    loading={isSubmitting}
                                    loadingPosition="start"
                                    startIcon={mode === "properties"
                                        ? <SaveIcon/>
                                        : undefined}
                                >
                                    {mode === "details" ? "Next" : "Create collection"}
                                </LoadingButton>
                            </CustomDialogActions>
                        </Form>
                    );
                }}

            </Formik>
        </Dialog>
    );
}
