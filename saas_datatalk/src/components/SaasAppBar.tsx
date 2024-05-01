import React from "react";
import { FireCMSAppBar, FireCMSAppBarProps, FireCMSLogo } from "@firecms/core";
import { LogoutIcon, MenuItem, PaymentIcon } from "@firecms/ui";

import { ProjectsSelect } from "./ProjectsSelect";
import { useSaasClientController } from "../SaasApp";
import { Link, useNavigate } from "react-router-dom";

export const SaasCMSAppBar = function SaasCMSAppBar({
                                                        title,
                                                        drawerOpen,
                                                        includeProjectSelect = true,
                                                        includeDrawer
                                                    }: FireCMSAppBarProps & {
    includeProjectSelect?: boolean;
    includeDrawer?: boolean;
}) {

    const navigate = useNavigate();
    const {
        fireCMSBackend,
        goToUser
    } = useSaasClientController();

    return <FireCMSAppBar title={title}
                          drawerOpen={drawerOpen}
                          includeDrawer={includeDrawer}
                          user={fireCMSBackend?.user ?? undefined}
                          endAdornment={includeProjectSelect && <ProjectsSelect key={"project_select"}/>}
                          dropDownActions={
                              <>
                                  <MenuItem onClick={goToUser}>
                                      <PaymentIcon size="small"/> Subscriptions
                                  </MenuItem>
                                  <MenuItem onClick={() => {
                                      console.log("Signing out");
                                      fireCMSBackend?.signOut();
                                      navigate("/", { replace: true });
                                  }}>
                                      <LogoutIcon size="small"/>
                                      Logout
                                  </MenuItem>
                              </>
                          }/>
}
