import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import './App.css';

function App() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F0F3FA]">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
