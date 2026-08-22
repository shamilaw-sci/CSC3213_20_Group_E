import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../context/api";
import { useAuth } from "../context/UserAuthContext";

export const usePayhere = (setMessage) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [paymentConfig, setPaymentConfig] = useState({
    listingFee: "500.00",
    merchantId: "1236024", // Fallback sandbox ID
  });

  // Fetch dynamic payment configuration
  useEffect(() => {
    api
      .get('/payment/config')
      .then((res) => {
        if (res.data) {
          setPaymentConfig({
            listingFee: res.data.listing_fee || "500.00",
            merchantId: res.data.merchant_id || "1236024",
          });
        }
      })
      .catch((err) => console.error("Failed to fetch payment config:", err));
  }, []);

  // Trigger PayHere after property is successfully saved as Draft
  const triggerPayment = async (propertyId) => {
    const amount = paymentConfig.listingFee;

    try {
      const response = await api.post('/payment/generate-hash', {
        order_id: propertyId,
        amount: amount,
      });

      const hash = response.data.hash;

      const payment = {
        sandbox: true,
        merchant_id: paymentConfig.merchantId,
        return_url: `${window.location.origin}/seller-dashboard`,
        cancel_url: `${window.location.origin}/seller-dashboard`,
        notify_url: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/notify`,
        order_id: propertyId,
        items: "Thirasara Property Listing Fee",
        amount: amount,
        currency: "LKR",
        hash: hash,
        first_name: user?.name?.split(" ")[0] || "Seller",
        last_name: user?.name?.split(" ")[1] || "Name",
        email: user?.email || "seller@gmail.com",
        phone: "0700000000",
        address: "N/A",
        city: "N/A",
        country: "Sri Lanka",
      };

      window.payhere.onCompleted = async function onCompleted(orderId) {
        try {
          await api.post('/payment/confirm-client-success', {
            property_id: orderId || propertyId,
            payment_id: orderId || `PAY-${Date.now()}`
          });
        } catch (confirmErr) {
          console.warn("Client confirmation note:", confirmErr);
        }

        setMessage({
          type: "success",
          text: `Payment confirmed! Property is now submitted for Super Admin deed verification.`,
        });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 2500);
      };

      window.payhere.onDismissed = function onDismissed() {
        setMessage({
          type: "success",
          text: "Listing saved as a private Draft in your dashboard. You can complete payment anytime to submit for Admin review.",
        });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
      };

      window.payhere.onError = function onError(error) {
        setMessage({ type: "error", text: `Payment Error: ${error}. Listing is safely saved in your Drafts.` });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
      };

      window.payhere.startPayment(payment);
      
    } catch (error) {
      console.error("Payment Initialization Error:", error);
      setMessage({
        type: "error",
        text: "Listing saved to Drafts! Please try completing payment from your dashboard.",
      });
      setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
    }
  };

  return { paymentConfig, triggerPayment };
};
