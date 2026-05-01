import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import MopedIcon from "@mui/icons-material/Moped";

export const MobileHeader = () => {
  return (
    <Box sx={{ display: 'flex',  px: 2, py: 2, gap: 2, alignItems: 'center' }}>
      <MopedIcon />
      <Typography variant="h4">CarFinance</Typography>
    </Box>
  );
};
