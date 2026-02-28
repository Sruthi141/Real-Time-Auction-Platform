import "./Landing.css"; // Import the CSS file
import { Navbar } from "./LandingComponents/NavBAr";
import Hero from "./LandingComponents/Hero";
import { Features } from "./LandingComponents/Features";
import FeedBack from "./LandingComponents/FeedBack";

// landing page
export default function Component() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <FeedBack />
      </main>
    </div>
  );
}