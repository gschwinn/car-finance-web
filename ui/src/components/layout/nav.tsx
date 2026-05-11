import { useContext } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { type SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';

import { UserContext } from '@/context/UserContext';

export interface NavItem {
  to:    string
  label: string
  Icon:  SvgIconComponent
}

export const NavItems: NavItem[] = [
  { to: '/lease',    label: 'Lease',    Icon: CalendarTodayOutlinedIcon },
  { to: '/purchase', label: 'Purchase', Icon: ShoppingCartOutlinedIcon },
  { to: '/compare',  label: 'Compare',  Icon: SyncAltOutlinedIcon },
]

export const Navigation = () => {
  const { userProfile, handleLogout } = useContext(UserContext);

  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        flexDirection: 'column',
        p: 1,
        height: '100%',
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', p: 2, pb: 1.5, alignItems: 'center', gap: 1.25 }}>
        <Box
          component="img"
          src="/icon.svg"
          alt=""
          sx={{ width: 34, height: 34, flexShrink: 0 }}
        />
        <Box
          component="span"
          sx={{ fontWeight: 600, fontSize: '1.15rem', letterSpacing: '-0.3px', lineHeight: 1, userSelect: 'none' }}
        >
          <Box component="span" sx={{ color: 'text.primary' }}>Out</Box>
          <Box component="span" sx={{ color: 'text.secondary' }}>The</Box>
          <Box component="span" sx={{ color: 'primary.main' }}>Door</Box>
        </Box>
      </Box>

      {/* Nav items */}
      <Box sx={{ p: 1, flexGrow: 1 }}>
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
                backgroundColor: '#1e293b',
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

      {/* Logout footer */}
      <Box sx={{ p: 1 }}>
        <Box
          onClick={handleLogout}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            color: 'text.disabled',
            '&:hover': {
              color: 'text.secondary',
              backgroundColor: '#1e293b',
            },
          }}
        >
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="caption" noWrap sx={{ display: 'block', lineHeight: 1.4 }}>
              {userProfile?.email ?? '—'}
            </Typography>
          </Box>
          <LogoutOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        </Box>
      </Box>
    </Box>
  );
};
