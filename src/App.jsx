import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { LoginPage } from './LoginPage'
import { AdminDashboard } from './Admin/AdminDashboard'
import { SellerDashboard } from './Seller/SellerDashboard'
import { BuyerDashboard } from './Buyer/BuyerDashboard'

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/seller/*" element={<SellerDashboard />} />
        <Route path="/buyer/*" element={<BuyerDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
