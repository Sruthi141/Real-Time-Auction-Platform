import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import './Login.css';
import axios from "axios";
import { ArrowLeft } from "lucide-react";

export default function Component() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errormsg, seterrormsg] = useState("");
  const navigate = useNavigate();
  const user = Cookies.get("user");

  useEffect(() => {
    if (user !== undefined) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.REACT_APP_BACKENDURL}/login`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.message === "Login Successfully") {
          Cookies.set("user", data.userId);
          navigate("/home");
        } else {
          seterrormsg(data.message);
        }
      }
    };
    xhr.onerror = function () {
      seterrormsg("An error occurred during the login process.");
    };
    xhr.send(JSON.stringify({ email, password }));
  };

  const responseGoogle = async (authResult) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKENDURL}/auth/google`, {
        params: { tokens: authResult }
      });
      if (response.status === 200) {
        Cookies.set("user", response.data.userId);
        navigate("/home");
      }
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const googlelogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate(-1)} className="text-white flex items-center">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          {errormsg && (
            <p className="text-red-500 text-sm">{errormsg}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={googlelogin}
            className="w-full border p-3 rounded mt-2"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}