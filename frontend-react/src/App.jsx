import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import MapSearch from './pages/MapSearch'; // Map-based property search page
import AddProperty from './pages/AddProperty'; // Property listing creation page
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/map" element={<MapSearch />} /> {/* Interactive map search */}
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;