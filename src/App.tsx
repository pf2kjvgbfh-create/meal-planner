import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import MenuPage from './pages/MenuPage'
import RecipesPage from './pages/RecipesPage'
import ShoppingListPage from './pages/ShoppingListPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 pb-20">
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/shopping" element={<ShoppingListPage />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}
