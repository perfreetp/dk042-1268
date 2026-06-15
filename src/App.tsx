import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import DiagnosisPage from "@/pages/DiagnosisPage";
import ArticleDetailPage from "@/pages/ArticleDetailPage";
import FavoritesPage from "@/pages/FavoritesPage";
import ReviewPage from "@/pages/ReviewPage";
import DashboardPage from "@/pages/DashboardPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnosis" element={<DiagnosisPage />} />
        <Route path="/article/:id" element={<ArticleDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}
