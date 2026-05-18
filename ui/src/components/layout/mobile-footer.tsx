import { NavLink as RouterNavLink } from "react-router-dom";
import Link from "@mui/material/Link";
import { alpha } from '@mui/material/styles';

import Box from "@mui/material/Box";

import { NavItems } from "./nav";

export const MobileFooter = () => {
  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      {NavItems.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          end={to === "/"}
          component={RouterNavLink}
          sx={(th) => ({
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            gap: 1,
            py: 2,
            color: "text.disabled",
            "&.active": {
              color: th.palette.primary.main,
              backgroundColor: alpha(th.palette.primary.main, 0.1),
            },
          })}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </Box>
  );
};
