import React from 'react'
import './TopPage.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';

const TopPage = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState('居酒屋');
    const [userlocation, setUserLocation] = useState(null);
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("現在地の取得に失敗しました:", error);
                }
            );
        } else {
            alert("このブラウザは位置情報をサポートしていません。");
        }
    }

    useEffect(() => {
        getUserLocation();
    }, []);

    const handleSearch = () => {
        if (!userlocation) {
            alert("現在地を取得できませんでした。位置情報の許可を確認してください。");
            return;
        }
        navigate('/shop-list', {
            state: {
                keyword: keyword,
                location: userlocation,
            }
        });
    };

  return (
    <div className="top-page">
        <h1 className='title'>ツギドコ？</h1>
        <p className='sub-title'>次の場所どこにします？</p>
        <label className="select-label">
            <select onChange={(e) => setKeyword(e.target.value)} value={keyword}>
                <option>居酒屋</option>
                <option>バー</option>
                <option>カラオケ</option>
                <option>コンビニ</option>
                <option>ビリヤード・ダーツ</option>
                <option>ラーメン</option>
            </select>
        </label>
        <button className='submit' onClick={handleSearch}>探す</button>
    </div>
  )
}

export default TopPage