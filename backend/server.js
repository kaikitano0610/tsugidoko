const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello from Backend API!");
});

app.get("/api/places", async (req, res) => {
    const { keyword, location, radius = 500 } = req.query;

    if (!keyword || !location) {
        return res.status(400).json({
            error: "キーワード (keyword) と位置情報 (location) は必須です。",
            example:
                "/api/places?keyword=カラオケ&location=33.59035,130.42068&radius=1500",
        });
    }

    const nearbySearchUrl =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location}&` +
        `radius=${radius}&` +
        `keyword=${encodeURIComponent(keyword)}&` +
        `opennow=true&` +
        `key=${process.env.Maps_API_KEY}`;

    console.log(`Calling Nearby Search API: ${nearbySearchUrl}`);

    try {
        const nearbyResponse = await fetch(nearbySearchUrl);
        const nearbyData = await nearbyResponse.json();

        if (nearbyData.status !== "OK" && nearbyData.status !== "ZERO_RESULTS") {
            console.error(
                "Google Places API Error:",
                nearbyData.status,
                nearbyData.error_message
            );
            return res.status(500).json({
                error: `Google Places API エラー: ${nearbyData.status} - ${nearbyData.error_message || "不明なエラー"
                    }`,
                googleApiStatus: nearbyData.status,
                googleErrorMessage: nearbyData.error_message,
            });
        }

        if (nearbyData.results.length === 0) {
            return res.json([]);
        }

        const fields =
            "name,formatted_address,geometry/location,international_phone_number,website,opening_hours,rating,user_ratings_total,price_level,photos";

        const detailedPlaces = await Promise.all(
            nearbyData.results.map(async (place) => {
                const detailsApiUrl =
                    `https://maps.googleapis.com/maps/api/place/details/json?` +
                    `place_id=${place.place_id}&` +
                    `fields=${fields}&` +
                    `key=${process.env.Maps_API_KEY}`;
                try {
                    const detailsResponse = await fetch(detailsApiUrl);
                    const detailsData = await detailsResponse.json();
                    const details = detailsData.result || {};

                    const photoUrl =
                        details.photos && details.photos.length > 0
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${details.photos[0].photo_reference}&key=${process.env.Maps_API_KEY}`
                            : null;

                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        place.name
                    )},${encodeURIComponent(
                        place.vicinity || place.formatted_address
                    )}&query_place_id=${place.place_id}`;

                    const types = place.types
                        ? place.types
                            .filter(
                                (type) =>
                                    type !== "point_of_interest" && type !== "establishment"
                            )
                            .join(", ")
                        : null;

                    return {
                        id: place.place_id,
                        name: details.name || place.name,
                        mainPhotoUrl: photoUrl,
                        mapUrl: mapUrl,
                        address: details.formatted_address || place.vicinity,
                        phoneNumber: details.international_phone_number || null,
                        website: details.website || null,
                        priceLevel:
                            details.price_level !== undefined ? details.price_level : null,
                        rating: details.rating !== undefined ? details.rating : null,
                        userRatingsTotal:
                            details.user_ratings_total !== undefined
                                ? details.user_ratings_total
                                : null,
                        opening_hours: details.opening_hours || null,
                        openNow:
                            details.opening_hours &&
                                details.opening_hours.open_now !== undefined
                                ? details.opening_hours.open_now
                                : null,
                        latitude: place.geometry.location.lat,
                        longitude: place.geometry.location.lng,
                        types: types,
                        businessStatus: place.business_status || null,
                    };
                } catch (detailsError) {
                    console.error("Place Details API Error:", detailsError);
                    return {
                        id: place.place_id,
                        name: place.name,
                        address: place.vicinity || place.formatted_address,
                        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            place.name
                        )},${encodeURIComponent(
                            place.vicinity || place.formatted_address
                        )}&query_place_id=${place.place_id}`,
                    };
                }
            })
        );

        res.json(detailedPlaces.slice(0, 10));
    } catch (error) {
        console.error("APIプロキシでの予期せぬエラー:", error);
        res.status(500).json({ error: "サーバー内部エラーが発生しました。" });
    }
});

app.listen(port, () => {
    console.log(`Backend API listening at http://localhost:${port}`);
});
