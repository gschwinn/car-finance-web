import { NavLink } from "react-router-dom";

import Box from "@mui/material/Box";

import { NavItems } from "./nav";

export const MobileFooter = () => {
  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "24px 16px",
      }}
    >
      {NavItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `nav-tab flex-1 ${isActive ? "nav-tab-active" : "nav-tab-inactive"}`
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon />
            {label}
          </Box>
        </NavLink>
      ))}
    </Box>
  );
};
