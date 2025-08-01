import React from 'react'
import './ShopList.css';
import { LocationOn, Phone, Public } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';

const ShopList = () => {
    const location = useLocation();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { keyword, location: userLocation } = location.state || {};

    useEffect(() => {
        if (keyword && userLocation) {
            fetchShops();
        } else {
            setError("キーワードと位置情報は必須です。");
            setLoading(false);
        }
    }, [keyword, userLocation]); 

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 地球の半径（km）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const fetchShops = async () => {

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5001/api/places?keyword=${keyword}&location=${userLocation.lat},${userLocation.lng}&radius=8000`);
            if (!response.ok) {
                throw new Error('ネットワークエラー');
            }
            const data = await response.json();
            const sortedShops = data.map(shop => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    shop.latitude,
                    shop.longitude
                );
                return {
                    ...shop,
                    distance: distance
                };
            }).sort((a,b) => a.distance - b.distance);
            console.log(sortedShops);
            setShops(sortedShops);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTodayOpeningHours = (weekdayText) => {
        if (!weekdayText) {
            return '営業時間情報なし';
        }
        const today = new Date().getDay();
        const weekdayIndex = (today - 1 + 7) % 7;

        return weekdayText[weekdayIndex].split(': ')[1] || '営業時間情報なし';
    }
  return (
    <div className="shop-list">
        <h1 className='title'>お店一覧</h1>
        <div className="shopsWrapper">
            {loading && <p className='loading'>データを取得中...</p>}
            {shops.length === 0 && !loading && <p className='notshop'>お店が見つかりませんでした。</p>}
            {error && <p className='error'>エラー: {error}</p>}
            {shops.map((shop, index) => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    shop.latitude,
                    shop.longitude
                );
                return (
                    <div className="shop" key={index}>
                        {shop.mainPhotoUrl ? (
                            <img className='shop-img' src={shop.mainPhotoUrl} alt={shop.name} />
                        ) : (
                            <div className='tmp-img'>写真がみつかりませんでした。</div>
                        )}
                        <p className='review'>⭐️{shop.rating} ({shop.userRatingsTotal})</p>
                        <h2 className='shopName'>{shop.name}</h2>
                        <p className='time'>{shop.openNow ? getTodayOpeningHours(shop.opening_hours ? shop.opening_hours.weekday_text : null) : '営業時間情報なし'}</p>
                        <div className='bottom-wrapper'>
                            <span>ここから{ distance.toFixed(2) }km先</span>
                            <div>
                                <Phone 
                                    className='icon' 
                                    sx={{ color: shop.phoneNumber ? '#616161' : '#E0E0E0' }}
                                    onClick={() => {
                                    if (shop.phoneNumber) {
                                        window.location.href = `tel:${shop.phoneNumber}`;
                                    }
                                }}
                                />
                                <Public 
                                    className='icon' 
                                    sx={{ color: shop.website ? '#616161' : '#E0E0E0' }}
                                    onClick={() => {
                                        if (shop.website) {
                                            window.open(shop.website, '_blank');
                                        }
                                    }}
                                />
                                <LocationOn 
                                    className='icon' 
                                    sx={{ color:'#616161'}}
                                    onClick={() => {
                                        if (shop.mapUrl) {
                                            window.open(shop.mapUrl, '_blank');
                                        } else {
                                            alert('マップ情報が見つかりませんでした。');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  )
}

export default ShopList