import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Landing from "./components/user/Landing";
import Login from "./components/user/Login";
import RegisterPage from "./components/user/Register";
import Home from "./components/user/Home";
import Auction from "./components/user/Auction";
import VerifyEmail from "./components/user/VerifyEmail";
import VerifyOTP from "./components/user/VerifyOTP";
import FeedBack from "./components/user/FeedBAckForm";

import SellerAuth from "./components/seller/Login";
import SellerHome from "./components/seller/Home";
import VerifySellerEmail from "./components/seller/Verifyseller";
import SellerSoldItems from "./components/seller/solditems";
import Item from "./components/seller/Item";

import AdminLogin from "./components/admin/Login";
import AdminUserDashboard from "./components/admin/UserDashboard";
import ItemsDashboard from "./components/admin/ItemsDashboard";
import TimeFrame from "./components/admin/TimeFrame";
import Reviews from "./components/admin/Reviews";
import Subscriptions from "./components/admin/Susriptions";
import Performance from "./Performance";

import PaymentPage from "./components/user/homecomponents/PaymentPage";
import PaymentSuccess from "./components/user/homecomponents/PaymentSuccess";
import PaymentCancel from "./components/user/PaymentCancel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* importing routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify/:userid" element={<VerifyEmail />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/home" element={<Home />} />
        <Route path="/feedback" element={<FeedBack />} />

        {/* Seller */}
        <Route path="/seller" element={<SellerAuth />} />
        <Route path="/sellerhome" element={<SellerHome />} />
        <Route path="/seller/solditems" element={<SellerSoldItems />} />
        <Route path="/seller/verify/:sellerId" element={<VerifySellerEmail />} />
        <Route path="/item/:item" element={<Item />} />

        {/* User Auction */}
        <Route path="/auction/:item" element={<Auction />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/" element={<AdminUserDashboard />} />
        <Route path="/admin/items" element={<ItemsDashboard />} />
        <Route path="/admin/calender" element={<TimeFrame />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/performance" element={<Performance />} />

        {/* ✅ Payment */}
        <Route path="/pay/:itemId" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/cancel" element={<PaymentCancel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;