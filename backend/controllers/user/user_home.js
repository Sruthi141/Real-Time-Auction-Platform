const usermodel = require("../../models/usermodel");
const { itemmodel } = require("../../models/itemmodel");
const getRedisClient = require("../../redis");
const PerformanceLog = require("../../models/PerformanceLog");

// Helper for performance log
const logPerformance = async (req, source, responseTime) => {
    await PerformanceLog.create({
        endpoint: '/user/:id',
        method: req.method,
        source,
        responseTime,
    });
};

async function renderUserHome(req, res) {
    const start = Date.now();
    const { id } = req.params;
    console.log(id);
    try {
        const client = await getRedisClient(); // Ensure Redis client is connected
        let user;
        let source;
        let time = 0;
        
        // Skip cache for now to ensure fresh populated data
        // TODO: Implement smarter caching that handles populated refs
        
        // Populate items and liked arrays with full item documents
        user = await usermodel.findOne({ _id: id })
            .populate('items')
            .populate('liked');
        
        if (!user || user==null) return res.status(404).send("User not found");
        
        console.log(user._id, id);
        time = Date.now() - start;
        source = 'db';
        
        // Ensure items and liked are arrays (not undefined)
        if (!user.items) user.items = [];
        if (!user.liked) user.liked = [];

        // Get all active (unsold) items for the marketplace
        const items = await itemmodel.find({ sold: { $ne: true } });

        const data = {
            user,
            id: id,
            items
        };
        await logPerformance(req, source, time);

        res.status(200).send({ message: "Data Fetched Successfully", source, responseTime: time, data });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = { renderUserHome };