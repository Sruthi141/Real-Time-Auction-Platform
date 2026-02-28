import React from "react";
import "../../../App.css";
import "./myitems.css";
import PaymentButton from "./PaymentButton";

export default function MyItems({ MyfilteredItems }) {
  return (
    <div className="user-myitems-div-container">
      {MyfilteredItems?.map((item) => (
        <div key={item?._id} className="user-myitems-div-item">
          <img
            src={item?.url}
            alt={item?.name}
            className="user-myitems-div-image"
          />

          <div className="user-myitems-div-content">
            <h3 className="user-myitems-div-title">{item?.name}</h3>

            <div className="user-myitems-div-details">
              <span className="user-myitems-div-owner">Owner: {item?.person}</span>
              <span className="user-myitems-div-base-price">
                Base Price: ₹{item?.base_price}
              </span>
            </div>

            <div className="user-myitems-div-current-price">
              <span className="user-myitems-div-brought-price">
                Bought Price: ₹{item?.current_price}
              </span>

              {/* ✅ Payment button */}
              <PaymentButton item={item} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}