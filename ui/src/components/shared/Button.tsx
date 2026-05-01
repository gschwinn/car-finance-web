import MUIButton, { type ButtonProps } from "@mui/material/Button";

export const Button = ({ color, children, sx, ...props }: ButtonProps) => {
  return (
    <MUIButton
      {...props}
      color={color}
      variant="contained"
      sx={{
        ...sx,
        ...(color === 'info' ? { border: 1, borderColor: 'divider' } : {}),
        '&:hover': {
          bgcolor: `${color}.light`
        },                
      }}
    >
      {children}
    </MUIButton>
  );
}