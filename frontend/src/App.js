import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ShopList from './pages/ShopList';
import TopPage from './pages/TopPage';
function App() {

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/shop-list" element={<ShopList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
