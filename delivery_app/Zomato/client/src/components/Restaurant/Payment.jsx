import React, { useEffect, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";

const Payment = ({ totalCost, restaurant, setPopup, items }) => {
   const { user } = useAuth0();
   const { email, name } = user;
   const [message, setMessage] = useState({
      text: "",
      color: "text-white",
   });
   const [otpVerification, setOtpVerification] = useState(false);
   const [otpEntered, setOtpEntered] = useState("");
   const [addressDone, setAddressDone] = useState(false);
   const [address, setAddress] = useState(user.address || "");

   const removeMessage = () => {
      setMessage({ text: "", color: "text-white" });
   };

   const createNewOTP = useCallback(async () => {
      setMessage({ text: "Sending OTP...", color: "text-secondary" });
      try {
         const response = await axios.post("/api/createotp", { email, name });
         setMessage({ text: response.data.message, color: "text-secondary" });
      } catch (error) {
         setMessage({
            text: error.response?.data?.message || "Failed to send OTP",
            color: "text-danger",
         });
      }
   }, [email, name]);

   const handleOtpVerify = async () => {
      removeMessage();
      if (!otpEntered) {
         return setMessage({ text: "Enter the OTP sent to your email", color: "text-danger" });
      }
      try {
         const response = await axios.post("/api/verifyotp", { email, otp: parseInt(otpEntered) });
         setMessage({ text: response.data.message, color: "text-success" });
         setOtpVerification(true);
      } catch (error) {
         setMessage({
            text: error.response?.data?.message || "OTP verification failed",
            color: "text-danger",
         });
      }
   };

   const handleAddressSubmit = () => {
      if (!address) {
         setMessage({ text: "Add your address for delivery", color: "text-danger" });
      } else {
         removeMessage();
         setAddressDone(true);
      }
   };

   const handleConfirmOrder = () => {
      removeMessage();
      if (!addressDone) return handleAddressSubmit();
      if (!otpVerification) {
         return setMessage({ text: "Verify OTP first", color: "text-danger" });
      }
      const postData = {
         email,
         name,
         address,
         totalCost,
         order: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.amount,
         })),
      };
      axios.post("/api/placeorder", postData).then(
         (response) => {
            alert(response.data.message);
            setPopup("");
         },
         (error) => {
            setMessage({
               text: error.response?.data?.message || "Failed to place order",
               color: "text-danger",
            });
         }
      );
   };

   useEffect(() => {
      if (addressDone && !otpVerification) {
         createNewOTP();
      }
   }, [addressDone, otpVerification, createNewOTP]);

   return (
      <div className="d-flex position-fixed w-100 h-100 flex-column top-0 start-0 align-items-center justify-content-center z-20">
         <div className="h-mobile-100 max-h-mobile-100 w-100 max-w-md-550 shadow-md overflow-y-scroll">
            <div className="w-100 max-w-md-550 max-h-600 border h-mobile-100 bg-white p-md-5 px-4 py-5 position-relative">
               <button
                  onClick={() => setPopup("")}
                  className="bg-transparent border-0 position-absolute top-0 end-0 p-4 fs-3 text-primary fw-semibold"
               >
                  <RxCross1 />
               </button>
               {!addressDone ? (
                  <>
                     <h2 className="text-primary fw-semibold">Delivery Address</h2>
                     <div className="pt-4">
                        <label htmlFor="address">
                           Enter the full address with additional delivery instructions if needed.
                        </label>
                        <textarea
                           rows={4}
                           onChange={(e) => setAddress(e.target.value)}
                           value={address}
                           className="border border-primary rounded-2 p-2 my-3 w-100"
                        />
                        <button onClick={handleAddressSubmit} className="btn btn-primary d-block my-2">
                           Submit
                        </button>
                        <p className={message.color}>{message.text || "."}</p>
                     </div>
                  </>
               ) : !otpVerification ? (
                  <>
                     <h2 className="text-primary fw-semibold">
                        Paying <span className="text-danger">₹ {totalCost}</span> to {restaurant.name}
                     </h2>
                     <div className="pt-4">
                        <label htmlFor="otp">Enter the OTP sent to {email}</label>
                        <input
                           type="number"
                           onChange={(e) => setOtpEntered(e.target.value)}
                           value={otpEntered}
                           className="border border-primary rounded-2 p-2 my-3"
                        />
                        <button onClick={handleOtpVerify} className="btn btn-primary d-block my-2">
                           Verify
                        </button>
                        <p className={message.color}>{message.text || "."}</p>
                        <p className="d-inline my-2">Didn't receive the OTP?</p>
                        <button onClick={createNewOTP} className="text-danger bg-transparent border-0 px-2">
                           Resend
                        </button>
                     </div>
                  </>
               ) : (
                  <>
                     <h2 className="text-primary fw-semibold">
                        Paying <span className="text-danger">₹ {totalCost}</span> to {restaurant.name}
                     </h2>
                     <p className="text-primary">Delivery Address: {address}</p>
                     <h4 className="text-primary">Items</h4>
                     <table className="table table-striped">
                        <thead>
                           <tr className="text-primary">
                              <th>#</th>
                              <th>Item Name</th>
                              <th>Price (₹)</th>
                              <th>Quantity</th>
                              <th>Total</th>
                           </tr>
                        </thead>
                        <tbody>
                           {items.map((item, index) => (
                              <tr key={index}>
                                 <td>{index + 1}</td>
                                 <td>{item.name}</td>
                                 <td>{item.price}</td>
                                 <td>{item.amount}</td>
                                 <td>{item.price * item.amount}</td>
                              </tr>
                           ))}
                           <tr className="table-primary">
                              <td>--</td>
                              <td>Total</td>
                              <td>--</td>
                              <td>
                                 {items.reduce((sum, item) => sum + item.amount, 0)}
                              </td>
                              <td>{totalCost}</td>
                           </tr>
                        </tbody>
                     </table>
                     <p>All verifications are complete. Click Confirm Order to proceed.</p>
                     <p className={message.color}>{message.text || "."}</p>
                  </>
               )}
            </div>
            <div className="w-100 bg-light d-flex justify-content-between py-3 px-4">
               <button onClick={handleConfirmOrder} className="btn btn-primary">
                  Confirm Order
               </button>
               <button onClick={() => setPopup("")} className="btn btn-danger">
                  Cancel Order
               </button>
            </div>
         </div>
      </div>
   );
};

export default Payment;
