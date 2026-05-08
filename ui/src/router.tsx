import { createBrowserRouter, Navigate } from "react-router-dom";

import PurchasePage from "./pages/PurchasePage";
import LeasePage from "./pages/LeasePage";
import ComparisonPage from "./pages/ComparisonPage";
import DealDetailPage from "./pages/DealDetailPage";

export const createRouter = () => {
  const router = createBrowserRouter(
    [
      { index: true, element: <Navigate to="/lease" replace /> },
      {
        path: "/purchase",
        element: <PurchasePage />,
      },
      {
        path: "/lease",
        element: <LeasePage />,
      },
      {
        path: "/purchase/:dealId",
        element: <DealDetailPage />,
      },
      {
        path: "/lease/:dealId",
        element: <DealDetailPage />,
      },
      {
        path: "/compare",
        element: <ComparisonPage />,
      },
    ],
    { basename: import.meta.env.BASE_URL },
  );

  return router;
};
