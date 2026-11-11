import { Routes, Route } from 'react-router'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import NotFoundPage from './pages/NotFoundPage'
import PublicLayout from './layouts/PublicLayout'
import BookDetailsPage from './pages/BoohDetails'
import RegisterPage from './pages/RegistrationPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/books/:id" element={<BookDetailsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  )
}

export default App