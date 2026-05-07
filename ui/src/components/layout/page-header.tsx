import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

export type PageHeaderProps = {
  title: string;
  subtitle?: string | null;
  action?: ReactNode;
  backPath?: string;
};

export function PageHeader({ title, subtitle, action, backPath }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{ display: "flex", flexDirection: "row", alignItems: "top", mb: 2 }}
    >
      {backPath && (
        <Box sx={{ mr: 1 }}>
          <Button
            sx={{ padding: '4px 0' }}
            color="primary"
            variant="outlined"
            onClick={() => navigate(backPath)}
          >
            <ArrowBackOutlinedIcon />
          </Button>
        </Box>
      )}
      <Box>
        <Typography component="h1" variant="h5">
          {title}
        </Typography>
        {subtitle && (
          <Typography component="div" variant="body1" color="textDisabled">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ ml: "auto" }}>{action}</Box>}
    </Box>
  );
}
