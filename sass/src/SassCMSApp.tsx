import React from "react";

import { GoogleAuthProvider } from "firebase/auth";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";

import "typeface-rubik";
import "typeface-space-mono";

import {
    Authenticator,
    buildCollection,
    CircularProgressCenter,
    createCMSDefaultTheme,
    FirebaseAuthDelegate,
    FirebaseLoginView,
    FireCMS,
    Scaffold,
    SideDialogs,
    useFirebaseAuthDelegate,
    useFirebaseStorageSource,
    useFirestoreDataSource,
    useInitialiseFirebase
} from "@camberi/firecms";

import { firebaseConfig } from "./firebase_config";
import { SassNavigationRoutes } from "./components/SassNavigationRoutes";
import { CollectionEditorsProvider } from "./CollectionEditorProvider";
import { ConfigPermissions } from "./config_permissions";
import { SassDrawer } from "./components/SassDrawer";
import {
    useBuildFirestoreConfigController
} from "./useBuildFirestoreConfigController";
import { CollectionControllerProvider } from "./CollectionControllerProvider";

const DEFAULT_SIGN_IN_OPTIONS = [
    GoogleAuthProvider.PROVIDER_ID
];

const productsCollection = buildCollection({
    path: "products",
    permissions: ({ user }) => ({
        edit: true,
        create: true,
        delete: true
    }),
    name: "Product",
    properties: {
        name: {
            name: "Name",
            validation: { required: true },
            dataType: "string"
        },
        price: {
            name: "Price",
            validation: {
                required: true,
                requiredMessage: "You must set a price between 0 and 1000",
                min: 0,
                max: 1000
            },
            description: "Price with range validation",
            dataType: "number"
        },
        status: {
            name: "Status",
            validation: { required: true },
            dataType: "string",
            description: "Should this product be visible in the website",
            longDescription: "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
            enumValues: {
                private: "Private",
                public: "Public"
            }
        }
    }
});

/**
 * This is an example of how to use the components provided by FireCMS for
 * a better customisation.
 * @constructor
 */
export function SassCMSApp() {

    const signInOptions = DEFAULT_SIGN_IN_OPTIONS;

    const myAuthenticator: Authenticator = ({ user }) => {
        console.log("Allowing access to", user?.email);
        return true;
    };

    const {
        firebaseApp,
        firebaseConfigLoading,
        configError,
        firebaseConfigError
    } = useInitialiseFirebase({ firebaseConfig });

    const authDelegate: FirebaseAuthDelegate = useFirebaseAuthDelegate({
        firebaseApp,
        signInOptions
    });

    const dataSource = useFirestoreDataSource({
        firebaseApp
    });

    const storageSource = useFirebaseStorageSource({ firebaseApp: firebaseApp });

    const collectionsController = useBuildFirestoreConfigController({
        firebaseApp,
        // configPath,
        collections: [productsCollection]
    });

    if (configError) {
        return <div> {configError} </div>;
    }

    if (firebaseConfigError) {
        return <div>
            It seems like the provided Firebase config is not correct. If you
            are using the credentials provided automatically by Firebase
            Hosting, make sure you link your Firebase app to Firebase
            Hosting.
        </div>;
    }

    if (firebaseConfigLoading || !firebaseApp) {
        return <CircularProgressCenter/>;
    }

    const configPermissions: ConfigPermissions = {
        createCollections: true,
        editCollections: true,
        deleteCollections: true
    }

    return (
        <Router>
            <FireCMS authDelegate={authDelegate}
                     collections={collectionsController.collections}
                     authentication={myAuthenticator}
                     dataSource={dataSource}
                     storageSource={storageSource}
                     entityLinkBuilder={({ entity }) => `https://console.firebase.google.com/project/${firebaseApp.options.projectId}/firestore/data/${entity.path}/${entity.id}`}>
                {({ context, mode, loading }) => {

                    const theme = createCMSDefaultTheme({ mode });

                    let component;
                    if (loading || collectionsController.loading) {
                        component = <CircularProgressCenter/>;
                    } else if (!context.authController.canAccessMainView) {
                        component = (
                            <FirebaseLoginView
                                allowSkipLogin={false}
                                signInOptions={signInOptions}
                                firebaseApp={firebaseApp}
                                authDelegate={authDelegate}/>
                        );
                    } else {
                        component = (
                            <Scaffold name={"My Online Shop"}
                                      Drawer={SassDrawer}>
                                <SassNavigationRoutes/>
                                <SideDialogs/>
                            </Scaffold>
                        );
                    }

                    return (
                        <ThemeProvider theme={theme}>
                            <CollectionControllerProvider
                                collectionsController={collectionsController}>
                                <CollectionEditorsProvider
                                    saveCollection={collectionsController.saveCollection}
                                    configPermissions={configPermissions}>
                                    <CssBaseline/>
                                    {component}
                                </CollectionEditorsProvider>
                            </CollectionControllerProvider>
                        </ThemeProvider>
                    );
                }}
            </FireCMS>
        </Router>
    );

}
