import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export const Loading = () => (
  <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

    {/* Mobile header — xs only */}
    <Box sx={{ display: { xs: "flex", md: "none" }, px: 2, py: 2, gap: 2, alignItems: "center" }}>
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="rounded" width={130} height={32} />
    </Box>

    {/* Body row */}
    <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "row" }}>

      {/* Sidebar — md+ only */}
      <Box
        sx={(th) => ({
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: "14rem",
          flexShrink: 0,
          backgroundColor: th.palette.background.paper,
          borderRight: "1px solid #1e293b",
          p: 1,
        })}
      >
        {/* Logo row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="rounded" width={100} height={26} />
        </Box>
        {/* Nav items */}
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ maxWidth: "1024px", mx: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton variant="rounded" width="45%" height={28} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={80} />
        </Box>
      </Box>

    </Box>

    {/* Mobile footer — xs only */}
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        justifyContent: "space-around",
        px: 2,
        py: 3,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, justifyContent: "center" }}>
          <Skeleton variant="circular" width={22} height={22} />
          <Skeleton variant="rounded" width={52} height={16} />
        </Box>
      ))}
    </Box>

  </Box>
);
