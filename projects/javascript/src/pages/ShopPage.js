import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function ShopPage() {
  return (
    <div className="app-container">
      <Header />
      <div className="page-container">
        <div className="content-section">
          <h2>Shop</h2>
          <div className="shop-items">
            <div className="shop-item">
              <img src="/assets/shop/item1.jpg" alt="Shop Item 1" />
              <div className="shop-item-content">
                <h3>Item 1</h3>
                <p>Description of the item</p>
                <button className="submit-button">Add to Cart</button>
              </div>
            </div>
            <div className="shop-item">
              <img src="/assets/shop/item2.jpg" alt="Shop Item 2" />
              <div className="shop-item-content">
                <h3>Item 2</h3>
                <p>Description of the item</p>
                <button className="submit-button">Add to Cart</button>
              </div>
            </div>
            <div className="shop-item">
              <img src="/assets/shop/item3.jpg" alt="Shop Item 3" />
              <div className="shop-item-content">
                <h3>Item 3</h3>
                <p>Description of the item</p>
                <button className="submit-button">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ShopPage; 