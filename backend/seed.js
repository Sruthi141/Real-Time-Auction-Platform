const mongoose = require("mongoose");
mongoose.connect(" mongodb+srv://Real-Time-Auction:R9h7WYanHAyhdsJr@cluster2.pgdmtkb.mongodb.net/?appName=Cluster2").then(() => {
    console.log("MongoDB Connected");
});

const SellerModel = require("./models/sellermodel");

async function updateSellers() {
    try {
        await SellerModel.updateMany({}, { $set: { subscription: "free" } });
        console.log("Updated all sellers with subscription: free");
    } catch (error) {
        console.error("Error updating sellers:", error);
    } finally {
        mongoose.connection.close();
    }
}

updateSellers();
