
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';

function App() {
  const [orderCount, setOrderCount] = useState(0);
  const fetchOrderCount = () => setOrderCount(orderCount + 1); // Dummy handler
  const hideHeaderFooter = false; // Set logic as needed

  return (
    <Router>
      <>
        {!hideHeaderFooter && (
          <Header orderCount={orderCount} onUpdateOrderCount={fetchOrderCount} />
        )}
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
        {!hideHeaderFooter && <Footer />}
      </>
    </Router>
  );
}

export default App;
