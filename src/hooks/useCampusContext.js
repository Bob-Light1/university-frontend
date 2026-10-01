/**
 * @file useCampusContext.js
 * @description Resolve the campus route for global actors and identity for scoped actors.
 */
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/** Return the campus selected in the workspace, without broadening scoped identities. */
export default function useCampusContext() {
  const { campusId } = useParams();
  const { user } = useContext(AuthContext);
  const identityCampus = user?.campusId ?? user?.schoolCampus;
  return user?.role === 'ADMIN' || user?.role === 'DIRECTOR'
    ? campusId ?? identityCampus ?? ''
    : identityCampus ?? campusId ?? '';
}
