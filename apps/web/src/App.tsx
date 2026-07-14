import { Route, Routes } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { SpaceBackground } from './components/ui/SpaceBackground';
import { DownloadPage } from './pages/DownloadPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UploadPage } from './pages/UploadPage';

export function App() {
  return (
    <div className="min-h-screen relative">
      <SpaceBackground />
      <Navbar />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/f/:slug" element={<DownloadPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
