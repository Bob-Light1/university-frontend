/**
 * @file main.jsx
 * @description Application entry with deployment-aware metadata.
 */
import BrandMetadata from './components/shared/BrandMetadata.jsx';
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// i18n must be imported before App so the i18next instance is ready
import './i18n/i18n.js'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { EntitlementProvider } from './context/EntitlementContext.jsx'
import { RtlProvider } from './theme/RtlProvider.jsx'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

function I18nLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RtlProvider>
          <Suspense fallback={<I18nLoader />}>
            {/* Placement is constrained on three sides, not a preference:
                inside BrowserRouter (it reads `/campus/:campusId` to know which
                tenant an ADMIN is browsing), inside AuthProvider (it keys its
                cache on the signed-in identity), and inside RtlProvider + the
                i18n Suspense boundary (it renders a themed, translated Snackbar
                for the write-in-flight case). */}
            <EntitlementProvider>
              <BrandMetadata />
              <App />
            </EntitlementProvider>
          </Suspense>
        </RtlProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
