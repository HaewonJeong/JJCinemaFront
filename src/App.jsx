import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import MoviesLayout from './components/MoviesLayout';
import BookingsLayout from './components/BookingsLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MovieListPage from './pages/MovieListPage';
import ShowtimesPage from './pages/ShowtimesPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import PaymentPage from './pages/PaymentPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminSchedulePage from './pages/AdminSchedulePage';
import AdminMoviesPage from './pages/AdminMoviesPage';
import AdminMovieFormPage from './pages/AdminMovieFormPage';
import AdminShowtimeFormPage from './pages/AdminShowtimeFormPage';
import AdminShowtimeManagePage from './pages/AdminShowtimeManagePage';
import AdminShowtimeEditPage from './pages/AdminShowtimeEditPage';
import AdminUsersPage from './pages/AdminUsersPage';
import TodoChecklistPage from './pages/TodoChecklistPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<Layout />}>
        <Route path="/movies" element={<MoviesLayout />}>
          <Route index element={<Navigate to="now-showing" replace />} />
          <Route path="now-showing" element={<MovieListPage status="상영중" />} />
          <Route path="upcoming" element={<MovieListPage status="상영예정" />} />
        </Route>
        <Route path="/movies/:movieId" element={<ShowtimesPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:showtimeId" element={<SeatSelectionPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/my-bookings" element={<BookingsLayout />}>
            <Route index element={<MyBookingsPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="schedule" replace />} />
              <Route path="schedule" element={<AdminSchedulePage />} />
              <Route path="movies" element={<AdminMoviesPage />} />
              <Route path="movies/new" element={<AdminMovieFormPage />} />
              <Route path="movies/:movieId/edit" element={<AdminMovieFormPage />} />
              <Route path="showtimes/new" element={<AdminShowtimeFormPage />} />
              <Route path="showtimes" element={<AdminShowtimeManagePage />} />
              <Route path="showtimes/:showtimeId/edit" element={<AdminShowtimeEditPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="todo" element={<TodoChecklistPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/movies" replace />} />
      <Route path="*" element={<Navigate to="/movies" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
