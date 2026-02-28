import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./Home.css";

export default function Auction() {
  const [itemData, setItemData] = useState(null);

  const { item } = useParams();
  const userid = Cookies.get("user");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItemData = () => {
      fetch(`${process.env.REACT_APP_BACKENDURL}/auction/${userid}/item/${item}`)
        .then((response) => {
          if (response.status === 404) {
            navigate("/home");
            return null;
          }
          return response.json();
        })
        .then((data) => {
          if (data) setItemData(data.data.item);
        })
        .catch((error) => console.error("Error fetching item data:", error));
    };

    fetchItemData();
    const intervalId = setInterval(fetchItemData, 3000);
    return () => clearInterval(intervalId);
  }, [item, userid, navigate]);

  if (!itemData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="m-4 shadow-xl min-h-screen bg-gradient-to-br from-teal-100 via-white to-gray-500 p-8">
      <h2 className="text-2xl font-bold">{itemData.name}</h2>
    </div>
  );
}