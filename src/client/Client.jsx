/**
 * @file Client.jsx
 * @description Shared public shell with one footer and a focusable content target.
 */
import { Outlet } from 'react-router-dom';
import Navbar from './utility-components/navbar/Navbar';
import Footer from './utility-components/footer/Footer';

/** Render public routes without leaking their presentation into role workspaces. */
export default function Client() {
  return <><Navbar /><main className="product-main" id="main-content" tabIndex={-1}><Outlet /></main><Footer /></>;
}
