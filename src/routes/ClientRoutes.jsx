import { Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from '../components/Loader';
import AllCampus from '../client/components/allCampus/AllCampus';
import Contact from '../client/components/contact/Contact';

// Lazy layouts & pages
const Client = lazy(() => import('../client/Client'));
const Home = lazy(() => import('../client/components/home/Home'));
const Login = lazy(() => import('../client/components/login/Login'));

export const clientRoutes = (
  
    <Route
      path="/"
      element={
        <Suspense fallback={<Loader />}>
          <Client />
        </Suspense>
      }
    >
      <Route
        index
        element={
          <Suspense fallback={<Loader />}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path="login"
        element={
          <Suspense fallback={<Loader />}>
            <Login />
          </Suspense>
        }
      />
      
       <Route
        path="allcampus"
        element={
          <Suspense fallback={<Loader />}>
            <AllCampus />
          </Suspense>
        }
      />

      <Route
        path="contact"
        element={
          <Suspense fallback={<Loader />}>
            <Contact />
          </Suspense>
        }
      />
    </Route>
  
); 
