// SellerSoldItems.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const BACKEND = process.env.REACT_APP_BACKENDURL;

export default function SellerSoldItems() {
  const navigate = useNavigate();
  const sellerid = Cookies.get("seller");

  const [soldItems, setSoldItems] = useState([]);
  const [unsoldItems, setUnsoldItems] = useState([]);
  const [activeItems, setActiveItems] = useState([]); // ✅ NEW: active items show after add
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const [analytics, setAnalytics] = useState({
    totalSold: 0,
    totalUnsold: 0,
    totalActive: 0,
    totalRevenue: 0,
    averageSoldPrice: 0,
    successRate: 0,
    timeSeriesData: [],
    categoryData: [],
  });

  const COLORS = useMemo(
    () => ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"],
    []
  );

  const normalizeItem = (raw) => {
    if (!raw) return null;

    const base_price = Number(raw.base_price ?? raw.basePrice ?? 0);
    const current_price = Number(raw.current_price ?? raw.currentPrice ?? 0);

    return {
      ...raw,
      _id: raw._id || raw.id,
      name: raw.name ?? "",
      type: raw.type ?? "Other",
      url: raw.url ?? raw.imageUrl ?? raw.image ?? "",
      base_price,
      current_price,
      current_bidder: raw.current_bidder ?? raw.currentBidder ?? "",
      date: raw.date ?? raw.createdAt ?? raw.updatedAt,
      updatedAt: raw.updatedAt ?? raw.createdAt,
      soldDate: raw.soldDate ?? raw.updatedAt,
      // ✅ key fix + typo support
      auction_active:
        raw.auction_active ??
        raw.aution_active ?? // backend typo support
        raw.auctionActive ??
        true,
    };
  };

  const processChartData = useCallback((soldItemsArr, filter) => {
    const now = new Date();
    let timeSeriesData = [];
    let categoryData = [];

    // category data from SOLD only
    const categoryMap = {};
    soldItemsArr.forEach((item) => {
      const category = item.type || "Other";
      if (!categoryMap[category]) {
        categoryMap[category] = { name: category, value: 0, revenue: 0 };
      }
      categoryMap[category].value += 1;
      categoryMap[category].revenue += Number(item.current_price || 0);
    });
    categoryData = Object.values(categoryMap);

    const soldItemsWithDate = soldItemsArr.map((x) => ({
      ...x,
      _soldDate: new Date(x.soldDate || x.updatedAt || Date.now()),
    }));

    switch (filter) {
      case "day":
        timeSeriesData = Array(24)
          .fill(null)
          .map((_, i) => {
            const hour = new Date(now);
            hour.setHours(now.getHours() - 23 + i);
            return {
              name: hour.getHours().toString().padStart(2, "0") + ":00",
              sales: 0,
              revenue: 0,
            };
          });

        soldItemsWithDate.forEach((item) => {
          const hourDiff = Math.floor((now - item._soldDate) / (1000 * 60 * 60));
          if (hourDiff >= 0 && hourDiff < 24) {
            const idx = 23 - hourDiff;
            timeSeriesData[idx].sales += 1;
            timeSeriesData[idx].revenue += Number(item.current_price || 0);
          }
        });
        break;

      case "week":
        timeSeriesData = Array(7)
          .fill(null)
          .map((_, i) => {
            const date = new Date(now);
            date.setDate(now.getDate() - 6 + i);
            return {
              name: date.toLocaleDateString("en-US", { weekday: "short" }),
              sales: 0,
              revenue: 0,
            };
          });

        soldItemsWithDate.forEach((item) => {
          const dayDiff = Math.floor((now - item._soldDate) / (1000 * 60 * 60 * 24));
          if (dayDiff >= 0 && dayDiff < 7) {
            const idx = 6 - dayDiff;
            timeSeriesData[idx].sales += 1;
            timeSeriesData[idx].revenue += Number(item.current_price || 0);
          }
        });
        break;

      case "month":
        timeSeriesData = Array(4)
          .fill(null)
          .map((_, i) => ({
            name: `Week ${i + 1}`,
            sales: 0,
            revenue: 0,
          }));

        soldItemsWithDate.forEach((item) => {
          const weekDiff = Math.floor((now - item._soldDate) / (1000 * 60 * 60 * 24 * 7));
          if (weekDiff >= 0 && weekDiff < 4) {
            const idx = 3 - weekDiff;
            timeSeriesData[idx].sales += 1;
            timeSeriesData[idx].revenue += Number(item.current_price || 0);
          }
        });
        break;

      case "year":
        timeSeriesData = Array(12)
          .fill(null)
          .map((_, i) => {
            const month = new Date(now);
            month.setMonth(now.getMonth() - 11 + i);
            return {
              name: month.toLocaleDateString("en-US", { month: "short" }),
              sales: 0,
              revenue: 0,
            };
          });

        soldItemsWithDate.forEach((item) => {
          const soldDate = item._soldDate;
          const monthDiff =
            (now.getFullYear() - soldDate.getFullYear()) * 12 +
            now.getMonth() -
            soldDate.getMonth();
          if (monthDiff >= 0 && monthDiff < 12) {
            const idx = 11 - monthDiff;
            timeSeriesData[idx].sales += 1;
            timeSeriesData[idx].revenue += Number(item.current_price || 0);
          }
        });
        break;

      default:
        timeSeriesData = Array(12)
          .fill(null)
          .map((_, i) => ({
            name: new Date(0, i).toLocaleDateString("en-US", { month: "short" }),
            sales: 0,
            revenue: 0,
          }));

        soldItemsWithDate.forEach((item) => {
          const month = item._soldDate.getMonth();
          timeSeriesData[month].sales += 1;
          timeSeriesData[month].revenue += Number(item.current_price || 0);
        });
    }

    return { timeSeriesData, categoryData };
  }, []);

  const filterItemsByTime = useCallback((items, filter) => {
    if (filter === "all") return items;

    const now = new Date();
    const filterDate = new Date();

    switch (filter) {
      case "day":
        filterDate.setDate(now.getDate() - 1);
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return items;
    }

    return items.filter((item) => {
      const itemDate = new Date(item.updatedAt || item.date || Date.now());
      return itemDate >= filterDate && itemDate <= now;
    });
  }, []);

  const calculateAnalytics = useCallback(
    (sold, unsold, active, filter) => {
      const totalSold = sold.length;
      const totalUnsold = unsold.length;
      const totalActive = active.length;

      const totalRevenue = sold.reduce(
        (sum, item) => sum + Number(item.current_price || 0),
        0
      );
      const averageSoldPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

      // success rate: sold / (sold + unsold)  (active excluded)
      const denom = totalSold + totalUnsold;
      const successRate = denom > 0 ? (totalSold / denom) * 100 : 0;

      const { timeSeriesData, categoryData } = processChartData(sold, filter);

      setAnalytics({
        totalSold,
        totalUnsold,
        totalActive,
        totalRevenue,
        averageSoldPrice,
        successRate,
        timeSeriesData,
        categoryData,
      });
    },
    [processChartData]
  );

  useEffect(() => {
    const fetchSoldItems = async () => {
      try {
        if (!sellerid) return navigate("/seller");

        const response = await axios.get(`${BACKEND}/sellerhome/${sellerid}`);

        const sellerObj = response?.data?.seller;
        const itemsRaw = response?.data?.items || [];
        const soldRaw = sellerObj?.solditems || [];

        setSeller(sellerObj || null);

        const items = itemsRaw.map(normalizeItem).filter(Boolean);
        const sold = soldRaw.map(normalizeItem).filter(Boolean);

        // ✅ IMPORTANT FIX: auction_active spelling (and support aution_active)
        const active = items.filter((i) => i.auction_active === true);
        const unsold = items.filter((i) => i.auction_active === false);

        setSoldItems(sold);
        setActiveItems(active);
        setUnsoldItems(unsold);

        calculateAnalytics(sold, unsold, active, timeFilter);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoldItems();
  }, [sellerid, navigate, calculateAnalytics, timeFilter]);

  const logout = () => {
    Cookies.remove("seller");
    navigate("/");
  };

  // ✅ FIXED ESLINT: include calculateAnalytics in deps (now memoized)
  useEffect(() => {
    calculateAnalytics(
      filterItemsByTime(soldItems, timeFilter),
      filterItemsByTime(unsoldItems, timeFilter),
      filterItemsByTime(activeItems, timeFilter),
      timeFilter
    );
  }, [
    timeFilter,
    soldItems,
    unsoldItems,
    activeItems,
    filterItemsByTime,
    calculateAnalytics,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-4 rounded-full bg-blue-100">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-700">Seller not found. Please login again.</p>
          <button
            onClick={() => navigate("/seller")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const filteredSoldItems = filterItemsByTime(soldItems, timeFilter);
  const filteredUnsoldItems = filterItemsByTime(unsoldItems, timeFilter);
  const filteredActiveItems = filterItemsByTime(activeItems, timeFilter);

  const renderTimeSeriesChart = () => {
    let chartTitle = "";
    switch (timeFilter) {
      case "day":
        chartTitle = "Hourly Sales (Last 24 Hours)";
        break;
      case "week":
        chartTitle = "Daily Sales (Last 7 Days)";
        break;
      case "month":
        chartTitle = "Weekly Sales (Last 4 Weeks)";
        break;
      case "year":
        chartTitle = "Monthly Sales (Last 12 Months)";
        break;
      default:
        chartTitle = "Monthly Sales (All Time)";
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">{chartTitle}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics.timeSeriesData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="sales" name="Items Sold" stackId="1" />
              <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stackId="2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderCategoryChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-2">Category Distribution (Sold)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={analytics.categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {analytics.categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                value,
                `${name} (₹${(props?.payload?.revenue || 0).toLocaleString()})`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRevenueVsItemsChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-2">Revenue vs Items Sold</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={analytics.timeSeriesData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" name="Items Sold" />
            <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out bg-indigo-900 text-white shadow-lg`}
      >
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-xl font-bold">Auction Dashboard</h1>
          <p className="text-indigo-200 text-sm mt-1">
            {seller.subscription === "free"
              ? "Free Plan"
              : seller.subscription === "standard"
              ? "Standard Plan"
              : "Premium Plan"}
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {(seller.name || "S").charAt(0)}
            </div>
            <div>
              <p className="font-medium">{seller.name}</p>
              <p className="text-xs text-indigo-200">{seller.email}</p>
            </div>
          </div>
        </div>

        <nav className="mt-2">
          <Link to="/sellerhome" className="flex items-center w-full px-6 py-3 text-left hover:bg-indigo-800">
            <span className="mr-3">🏠</span> Dashboard
          </Link>

          <Link to="/sellerhome" className="flex items-center w-full px-6 py-3 text-left hover:bg-indigo-800">
            <span className="mr-3">📦</span> My Items
          </Link>

          <Link to="/seller/solditems" className="flex items-center w-full px-6 py-3 bg-indigo-700 text-left">
            <span className="mr-3">📊</span> Sales Overview
          </Link>

          <Link to="/sellerhome" className="flex items-center w-full px-6 py-3 hover:bg-indigo-800">
            <span className="mr-3">➕</span> Add Item
          </Link>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-800">
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-indigo-200 hover:text-white">
            <span className="mr-3">🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden mr-4 text-gray-600">
                ☰
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Sales Overview</h2>
            </div>
            <div className="flex space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "all"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab("active")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "active"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Active Items
              </button>

              <button
                onClick={() => setActiveTab("sold")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "sold"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sold Items
              </button>

              <button
                onClick={() => setActiveTab("unsold")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "unsold"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Unsold Items
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === "all" && (
            <div className="space-y-6">
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Active Items</p>
                  <p className="text-2xl font-semibold">{analytics.totalActive}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Sold Items</p>
                  <p className="text-2xl font-semibold">{analytics.totalSold}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Unsold Items</p>
                  <p className="text-2xl font-semibold">{analytics.totalUnsold}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold">₹{analytics.totalRevenue.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold">{analytics.successRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderTimeSeriesChart()}
                {renderCategoryChart()}
              </div>
              <div className="grid grid-cols-1">{renderRevenueVsItemsChart()}</div>
            </div>
          )}

          {activeTab === "active" && (
            <ItemsGrid
              items={filteredActiveItems}
              emptyTitle="No active items"
              emptyDesc="If you just added an item, it should appear here if auction_active is true."
              badgeText="Active"
              badgeClass="bg-green-500"
              showBuyer={false}
              showAuctionTime={true}
            />
          )}

          {activeTab === "sold" && (
            <ItemsGrid
              items={filteredSoldItems}
              emptyTitle="No sold items in this time period"
              emptyDesc="Try changing the time filter or check back later."
              badgeText="Sold"
              badgeClass="bg-blue-500"
              showBuyer={true}
              showAuctionTime={false}
            />
          )}

          {activeTab === "unsold" && (
            <ItemsGrid
              items={filteredUnsoldItems}
              emptyTitle="No unsold items in this time period"
              emptyDesc="Try changing the time filter or check back later."
              badgeText="Unsold"
              badgeClass="bg-red-500"
              showBuyer={false}
              showAuctionTime={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function ItemsGrid({
  items,
  emptyTitle,
  emptyDesc,
  badgeText,
  badgeClass,
  showBuyer,
  showAuctionTime,
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-gray-500">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="relative h-48">
            <img
              src={item.url || "/placeholder.svg"}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-2 right-2 px-2 py-1 text-white text-xs font-medium rounded ${badgeClass}`}>
              {badgeText}
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full">
                {item.type || "Other"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Base Price</p>
                <p className="text-sm font-medium">
                  ₹{Number(item.base_price || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{badgeText === "Sold" ? "Sold Price" : "Current Price"}</p>
                <p className="text-sm font-medium">
                  ₹{Number(item.current_price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>{badgeText === "Sold" ? "Sold Date:" : "Date:"}</span>
                <span className="font-medium">
                  {new Date(item.soldDate || item.updatedAt || item.date || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {showBuyer && (
                <div className="flex justify-between">
                  <span>Buyer:</span>
                  <span className="font-medium">{item.current_bidder || "Unknown"}</span>
                </div>
              )}

              {showAuctionTime && (
                <>
                  <div className="flex justify-between mb-1">
                    <span>Start:</span>
                    <span className="font-medium">{item.StartTime || item.startTime || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End:</span>
                    <span className="font-medium">{item.EndTime || item.endTime || "--"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}