import { createBrowserRouter } from "react-router-dom";

import PurchasePage   from './pages/PurchasePage'
import LeasePage      from './pages/LeasePage'
import ComparisonPage from './pages/ComparisonPage'

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
  ], { basename: import.meta.env.BASE_URL });

  return router;
}
