import { useContext } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { UserContext } from "./context/UserContext";

export const Login = () => {
  const { handleLogin } = useContext(UserContext);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mx: "auto",
      }}
    >
      <Box> LOGO HERE - LOGIN YES </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          sx={{ width: "332px" }}
          variant="contained"
          color="primary"
          onClick={() => handleLogin(false)}
        >
          Login
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button
          sx={{ width: "332px" }}
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
