import type { ReactNode } from "react";
import { type SvgIconComponent } from "@mui/icons-material";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export type EmptyCardProps = {
  Icon: SvgIconComponent;
  title: string;
  description: string;
  action?: ReactNode;
};
export const EmptyCard = ({
  Icon,
  title,
  description,
  action,
}: EmptyCardProps) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: '5rem',
      }}
    >
      <Box>
        <FancyIcon Icon={Icon} />
      </Box>
      <Box sx={{ mb: 1 }}>
        <Typography component="h6" variant="h6">
          {title}
        </Typography>
      </Box>
      <Box sx={{ mb: 4, maxWidth: "20rem" }}>
        <Typography component="p" variant="body2" color="textDisabled">
          {description}
        </Typography>
      </Box>
      <Box>{action}</Box>
    </Box>
  );
};

const FancyIcon = ({ Icon }: { Icon: SvgIconComponent; }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 2,
        width: "4rem",
        height: "4rem",
        borderRadius: "1rem",
        border: '1px solid rgb(51 65 85)',
        backgroundColor: 'rgb(30 41 59)',
      }}
    >
      <Icon sx={{ color: 'rgb(100 116 139)' }} />
    </Box>
  );
}
