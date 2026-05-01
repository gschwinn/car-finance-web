import { type ReactNode } from "react";

import Box from "@mui/material/Box";

import { MobileHeader } from "./mobile-header";
import { MobileFooter } from "./mobile-footer";
import { Navigation } from "./nav";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc( 100vh )",
      }}
    >
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileHeader />
      </Box>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "row" }}>
        <Box
          component="aside"
          sx={(th) => ({
            display: { xs: "none", md: "block" },
            width: "14rem",
            backgroundColor: th.palette.background.paper,
            borderColor: "#1e293b",
            borderRightWidth: "1px",
            borderStyle: "solid",
          })}
        >
          <Navigation />
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Box sx={{ maxWidth: '1024px', mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileFooter />
      </Box>
    </Box>
  );
};
