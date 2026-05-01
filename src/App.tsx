import { useContext } from "react";
import { RouterProvider } from "react-router-dom";

import { UserContext } from "@/context/UserContext";
import { DealsProvider } from '@/context/DealsContext'

import { Login } from "./login";
import { Loading } from "./loading";
import { createRouter } from "./router";

export default function App() {
  const { loggedIn, loading } = useContext(UserContext);

  return (
    <>
      {loading && <Loading />}
      {!loading && (
        <>
          {!loggedIn && <Login />}
          {loggedIn && (
            <DealsProvider>
              <RouterProvider router={createRouter()} />
            </DealsProvider>
          )}
        </>
      )}
    </>
  );
}
