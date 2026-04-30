import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export const Loading = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "row", height: "calc(100vh)" }}>
      <MainLoading />
    </Box>
  );
};

const MainLoading = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          height: "calc(100vh)",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Skeleton
          variant="circular"
          width={20}
          height={20}
        />
        <Skeleton width={72} />
      </Box>
    </Box>
  );
};
