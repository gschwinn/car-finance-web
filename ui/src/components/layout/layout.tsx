import { type ReactNode } from "react";

import Box from "@mui/material/Box";

import { Navigation } from "./nav";
import {
  PageHeader,
  type PageHeaderProps,
} from "@/components/layout/page-header";
import { MobileHeader } from "./mobile-header";
import { MobileFooter } from "./mobile-footer";

const mobileHeaderHeight = 80;
const mobileFooterHeight = 88;

export type LayoutProps = {
  children: ReactNode;
  showHeader?: boolean;
} & PageHeaderProps;

export const Layout = ({
  title,
  subtitle,
  action,
  backPath,
  children,
  showHeader = true,
}: LayoutProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          boxShadow: "0 16px 16px -16px #000",
          zIndex: 40,
        }}
      >
        <MobileHeader />
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          height: {
            xs: `calc( 100vh - ${mobileHeaderHeight + mobileFooterHeight}px)`,
            md: "100vh",
          },
        }}
      >
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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            height: {
              xs: `calc( 100vh - ${mobileHeaderHeight + mobileFooterHeight}px)`,
              md: "100vh",
            },
            overflowY: "auto",
          }}
        >
          <Box sx={{ maxWidth: "1024px", mx: "auto" }}>
            {showHeader && (
              <PageHeader title={title} subtitle={subtitle} action={action} backPath={backPath} />
            )}
            <Box>{children}</Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          boxShadow: "0 -16px 16px -16px #000",
          zIndex: 40,
        }}
      >
        <MobileFooter />
      </Box>
    </Box>
  );
};
