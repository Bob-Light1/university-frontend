import { Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/Loader';

// Lazy layouts & pages
const Home = lazy(() => import('../client/components/home/Home'));
const LoginAdmin = lazy(() => import('../admin/components/loginAdmin/LoginAdmin'));
const CreateAdmin = lazy(() => import('../admin/components/createAdmin/CreateAdmin'));
const NewCampus = lazy(() => import('../admin/components/newCampus/NewCampus'));
const  Admin = lazy(() => import('../admin/Admin'));

export const adminRoutes = (
  
    <Route
      path="/admin"
      element={
        <Suspense fallback={<Loader />}>
          <Admin />
        </Suspense>
      }
    >
      <Route
        index
        element={
          <Suspense fallback={<Loader />}>
            <LoginAdmin />
          </Suspense>
        }
      />
      <Route
        path="create"
        element={
          <Suspense fallback={<Loader />}>
            <CreateAdmin />
          </Suspense>
        }
      />
       <Route
        path="login"
        element={
          <Suspense fallback={<Loader />}>
            <LoginAdmin />
          </Suspense>
        }
      />
       <Route
        path="newcampus"
        element={
          <Suspense fallback={<Loader />}>
            <NewCampus />
          </Suspense>
        }
      />

       <Route
        path="home"
        element={
          <Suspense fallback={<Loader />}>
            <Home />
          </Suspense>
        }
      />
    </Route>
); 
