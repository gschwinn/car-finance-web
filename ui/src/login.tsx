import { useContext } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { Button } from '@/components/shared/Button';

import { UserContext } from "./context/UserContext";

export const Login = () => {
  const { handleLogin } = useContext(UserContext);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
        px: 2,
      }}
    >
      <Box
        component="img"
        src="/icon.svg"
        alt="OutTheDoor"
        sx={{ width: 140, height: 140, mb: 2.5 }}
      />
      <Typography
        variant="h3"
        sx={{ fontWeight: 700, mb: 0.75, letterSpacing: '-1.5px', lineHeight: 1 }}
      >
        <Box component="span" sx={{ color: 'text.primary' }}>Out</Box>
        <Box component="span" sx={{ color: 'text.secondary' }}>The</Box>
        <Box component="span" sx={{ color: 'primary.main' }}>Door</Box>
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        Know the real deal before you sign.
      </Typography>
      <Box sx={{ width: '100%', maxWidth: 332 }}>
        <Button
          sx={{ width: "100%" }}
          variant="contained"
          color="primary"
          onClick={() => handleLogin(false)}
        >
          Login
        </Button>
      </Box>
      <Box sx={{ mt: 2, width: '100%', maxWidth: 332 }}>
        <Button
          sx={{ width: "100%" }}
          variant="contained"
          color="info"
          onClick={() => handleLogin(true)}
        >
          Create Account
        </Button>
      </Box>
    </Box>
  );
};
