import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { BrowserRouter } from "react-router-dom"
import { App } from "./FirestoreApp/App";
import GraphQLApp from "./GraphQLApp/GraphQLApp";
import MongoDBApp from "./MongoDBApp/MongoDBApp";
import SupabaseApp from "./SupabaseApp/SupabaseApp";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter basename={"/"}>
            <App/>
        </BrowserRouter>
    </React.StrictMode>
)
