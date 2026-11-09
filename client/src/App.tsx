import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import NotFoundPage from './pages/NotFoundPage'
import PublicLayout from './layouts/PublicLayout'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App