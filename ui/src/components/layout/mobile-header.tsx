import Box from "@mui/material/Box";

export const MobileHeader = () => {
  return (
    <Box sx={{ display: 'flex', px: 2, py: 1.5, alignItems: 'center', gap: 1.5 }}>
      <Box
        component="img"
        src="/icon.svg"
        alt=""
        sx={{ width: 44, height: 44, flexShrink: 0 }}
      />
      <Box
        component="span"
        sx={{ fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.5px', lineHeight: 1, userSelect: 'none' }}
      >
        <Box component="span" sx={{ color: 'text.primary' }}>Out</Box>
        <Box component="span" sx={{ color: 'text.secondary' }}>The</Box>
        <Box component="span" sx={{ color: 'primary.main' }}>Door</Box>
      </Box>
    </Box>
  );
};
