import { createBrowserRouter } from "react-router-dom";

import PurchasePage   from './pages/PurchasePage'
import LeasePage      from './pages/LeasePage'
import ComparisonPage from './pages/ComparisonPage'
import DealDetailPage from './pages/DealDetailPage'

export const createRouter = () => {

    const router = createBrowserRouter([
    {
      path: "/",
      element: <PurchasePage />,
    },
    {
      path: "/lease",
      element: <LeasePage />,
    },
    {
      path: "/compare",
      element: <ComparisonPage />,
    },
    {
      path: "/deal/:dealId",
      element: <DealDetailPage />,
    },
  ], { basename: import.meta.env.BASE_URL });

  return router;
}
