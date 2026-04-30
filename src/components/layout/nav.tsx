import { NavLink as RouterNavLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import { alpha } from '@mui/material/styles';

import { type SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import MopedIcon from "@mui/icons-material/Moped";

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';

export interface NavItem {
  to:    string
  label: string
  Icon:  SvgIconComponent
}

export const NavItems: NavItem[] = [
  { to: '/',        label: 'Purchase', Icon: ShoppingCartOutlinedIcon },
  { to: '/lease',   label: 'Lease',    Icon: CalendarTodayOutlinedIcon },
  { to: '/compare', label: 'Compare',  Icon: SyncAltOutlinedIcon },
]

export const Navigation = () => {
  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        flexDirection: 'column',
        p: 1,
      }}
    >
      <Box sx={{ display: 'flex', p: 2, alignItems: 'center' }}>
        <MopedIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5">CarFinance</Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {NavItems.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            end={to === "/"}
            component={RouterNavLink}
            sx={(th) => ({
              display: 'block',
              borderRadius: 1,
              px: 1,
              mb: 1,
              color: 'text.disabled',
              '&:hover': {
                color: '#cbd5e1',
                backgroundColor: '#1e293b', // surface-700
              },
              '&.active': {
                color: th.palette.primary.main,
                backgroundColor: alpha(th.palette.primary.main, 0.1),
              },
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1 }}>
              <Icon />
              {label}
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
};
