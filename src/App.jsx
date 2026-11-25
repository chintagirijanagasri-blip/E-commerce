import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import productsData from "./products";

const money = (value) => `$${Number(value).toFixed(2)}`;
const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

function ProductCard({ product, addToCart, wishlist, toggleWishlist }) {
  const saved = wishlist.includes(product.id);
  return (
    <article className="product-card">
      <div className={`product-art ${product.color}`}>
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextSibling.style.display = "block"; }} /><span className="image-fallback" style={{ display: "none" }}>{product.emoji}</span></Link>
        <button className={`wish-button ${saved ? "saved" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}>{saved ? "♥" : "♡"}</button>
        {product.oldPrice > product.price && <span className="discount-tag">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
      </div>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <Link className="product-title" to={`/product/${product.id}`}>{product.name}</Link>
        <div className="rating"><span>★</span> {product.rating} <small>({product.reviews})</small></div>
        <div className="product-buy"><div><strong>{money(product.price)}</strong><del>{money(product.oldPrice)}</del></div><button className="add-button" disabled={product.stock === 0} onClick={() => addToCart(product.id)} aria-label={`Add ${product.name} to cart`}>{product.stock === 0 ? "×" : "+"}</button></div>
      </div>
    </article>
  );
}

function App() {
  const [products, setProducts] = useState(() => load("shopease-products", productsData).map((product) => ({ stock: 20, ...product })));
  const [cart, setCart] = useState(() => load("shopease-cart", []));
  const [wishlist, setWishlist] = useState(() => load("shopease-wishlist", []));
  const [orders, setOrders] = useState(() => load("shopease-orders", []));
  const [user, setUser] = useState(() => load("shopease-user", null));
  const [notice, setNotice] = useState("");

  useEffect(() => localStorage.setItem("shopease-products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("shopease-cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("shopease-wishlist", JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem("shopease-orders", JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem("shopease-user", JSON.stringify(user)), [user]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const addToCart = (id, quantity = 1) => {
    const product = products.find((item) => item.id === id);
    const alreadyInCart = cart.find((item) => item.id === id)?.qty || 0;
    if (!product || product.stock <= alreadyInCart) {
      setNotice("Sorry, this item is out of stock");
      return;
    }
    if (alreadyInCart + quantity > product.stock) {
      setNotice(`Only ${product.stock - alreadyInCart} left in stock`);
      quantity = product.stock - alreadyInCart;
    }
    setCart((items) => {
      const current = items.find((item) => item.id === id);
      return current ? items.map((item) => item.id === id ? { ...item, qty: item.qty + quantity } : item) : [...items, { id, qty: quantity }];
    });
    setNotice("Added to your bag");
  };
  const updateQuantity = (id, qty) => {
    const product = products.find((item) => item.id === id);
    const nextQty = Math.min(qty, product?.stock || 0);
    if (qty > (product?.stock || 0)) setNotice(`Only ${product.stock} left in stock`);
    setCart((items) => nextQty < 1 ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, qty: nextQty } : item));
  };
  const toggleWishlist = (id) => {
    const exists = wishlist.includes(id);
    setWishlist((items) => exists ? items.filter((item) => item !== id) : [...items, id]);
    setNotice(exists ? "Removed from wishlist" : "Saved to wishlist");
  };
  const cartCount = cart.reduce((total, item) => total + item.qty, 0);
  const shared = { products, setProducts, cart, setCart, wishlist, orders, setOrders, user, setUser, addToCart, updateQuantity, toggleWishlist, setNotice };

  return (
    <>
      <header className="site-header">
        <div className="topline"><div className="container d-flex justify-content-between"><span>Thoughtful finds. Delivered with ease.</span><span>Free shipping on orders over $75</span></div></div>
        <nav className="navbar navbar-expand-lg container py-3">
          <Link className="navbar-brand" to="/">shop<span>ease</span><i>.</i></Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon" /></button>
          <div className="collapse navbar-collapse" id="mainNav">
            <form className="search-form mx-lg-4 my-3 my-lg-0" action="/products" onSubmit={(event) => { event.preventDefault(); window.location.href = `/products?search=${encodeURIComponent(event.currentTarget.search.value)}`; }}>
              <span>⌕</span><input name="search" aria-label="Search products" placeholder="Search for something lovely..." defaultValue={new URLSearchParams(window.location.search).get("search") || ""} /><button aria-label="Submit search">Search</button>
            </form>
            <div className="nav-actions ms-lg-auto">
              <NavLink to="/orders" className="nav-action"><span>▤</span><small>Orders</small></NavLink>
              <NavLink to="/wishlist" className="nav-action"><span>♡</span><small>Wishlist</small></NavLink>
              <NavLink to="/cart" className="nav-action cart-action"><span>♧<b>{cartCount}</b></span><small>Bag</small></NavLink>
              <NavLink to="/login" className="nav-action"><span>♙</span><small>{user ? user.name.split(" ")[0] : "Account"}</small></NavLink>
            </div>
          </div>
        </nav>
        <div className="nav-strip"><div className="container d-flex gap-4"><NavLink to="/products">Shop all</NavLink>{["Electronics", "Home", "Fashion", "Accessories"].map((category) => <NavLink key={category} to={`/products?category=${category}`}>{category}</NavLink>)}<NavLink className="admin-link" to="/admin">Seller studio</NavLink></div></div>
      </header>
      {notice && <div className="toast-note">{notice} <span>✓</span></div>}
      <main><Routes>
        <Route path="/" element={<Home {...shared} />} />
        <Route path="/products" element={<ProductsPage {...shared} />} />
        <Route path="/product/:id" element={<ProductDetail {...shared} />} />
        <Route path="/cart" element={<CartPage {...shared} />} />
        <Route path="/checkout" element={<CheckoutPage {...shared} />} />
        <Route path="/wishlist" element={<WishlistPage {...shared} />} />
        <Route path="/orders" element={<OrdersPage {...shared} />} />
        <Route path="/admin" element={<AdminPage {...shared} />} />
        <Route path="/login" element={<AccountPage {...shared} />} />
        <Route path="*" element={<NotFound />} />
      </Routes></main>
      <Footer />
    </>
  );
}

function Home({ products, addToCart, wishlist, toggleWishlist }) {
  const categories = [
    { name: "Electronics", icon: "🎧", color: "lavender" }, { name: "Home", icon: "🪴", color: "sage" },
    { name: "Fashion", icon: "👟", color: "peach" }, { name: "Accessories", icon: "🎒", color: "sand" }
  ];
  return <>
    <section className="hero"><div className="container hero-inner"><div className="hero-copy"><span className="eyebrow">THE GOOD FINDS EDIT</span><h1>Little things.<br /><em>Big delight.</em></h1><p>Meet the things you didn't know you needed — thoughtfully picked, ready for your everyday.</p><Link className="btn btn-dark rounded-pill px-4 py-3" to="/products">Explore the collection <span>→</span></Link><div className="hero-proof"><span>★★★★★</span> Loved by 12,000+ happy shoppers</div></div><div className="hero-visual"><div className="hero-circle" /><span className="hero-emoji hero-e1">🎧</span><span className="hero-emoji hero-e2">🪴</span><span className="hero-emoji hero-e3">☕</span><div className="hero-note">YOUR NEXT<br />FAVORITE THING ✨</div></div></div><div className="hero-bottom container"><span>CURATED FOR YOUR EVERYDAY</span><span>01 — 04</span></div></section>
    <section className="container section-block"><div className="section-heading"><div><span className="eyebrow">BROWSE BY MOOD</span><h2>A little bit of everything</h2></div><Link to="/products" className="text-link">View all categories →</Link></div><div className="category-grid">{categories.map((category) => <Link className="category-tile" to={`/products?category=${category.name}`} key={category.name}><div className={`category-icon ${category.color}`}>{category.icon}</div><div><strong>{category.name}</strong><small>Explore collection</small></div><span className="category-arrow">↗</span></Link>)}</div></section>
    <section className="container section-block product-section"><div className="section-heading"><div><span className="eyebrow">GOOD THINGS, GATHERED</span><h2>Customer favorites</h2><p>Our most-loved picks, for very good reason.</p></div><Link to="/products" className="text-link">Shop all products →</Link></div><div className="row g-4">{products.slice(0, 4).map((product) => <div className="col-6 col-lg-3" key={product.id}><ProductCard {...{ product, addToCart, wishlist, toggleWishlist }} /></div>)}</div></section>
    <section className="container"><div className="promo-banner"><div><span className="eyebrow">A LITTLE TREAT, ON US</span><h2>Your everyday upgrade<br />starts right here.</h2><Link to="/products" className="btn btn-light rounded-pill px-4">Find your favorite <span>→</span></Link></div><div className="promo-art">🛍️<span>✦</span></div></div></section>
    <section className="container section-block product-section"><div className="section-heading"><div><span className="eyebrow">PICKED FOR YOU</span><h2>More to make you smile</h2></div><span className="section-aside">Thoughtful goods, everyday prices.</span></div><div className="row g-4">{products.slice(4, 8).map((product) => <div className="col-6 col-lg-3" key={product.id}><ProductCard {...{ product, addToCart, wishlist, toggleWishlist }} /></div>)}</div></section>
    <section className="promise-strip"><div className="container">{[["♧", "Free shipping", "On orders over $75"], ["♡", "Made for real life", "Useful, beautiful finds"], ["↺", "Easy returns", "30 days to decide"], ["☻", "Here to help", "Real people, always"]].map(([icon, title, caption]) => <div key={title}><span>{icon}</span><b>{title}</b><small>{caption}</small></div>)}</div></section>
  </>;
}

function ProductsPage({ products, addToCart, wishlist, toggleWishlist }) {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("featured");
  useEffect(() => {
    setQuery(params.get("search") || "");
    setCategory(params.get("category") || "All");
  }, [params]);
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const visible = useMemo(() => {
    const result = products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()));
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0);
  }, [products, query, category, sort]);
  const chooseCategory = (value) => { setCategory(value); setParams((current) => { if (value === "All") current.delete("category"); else current.set("category", value); return current; }); };
  return <div className="container page-wrap"><div className="page-intro"><span className="eyebrow">THE SHOP</span><h1>Good things, right this way.</h1><p>Browse our thoughtfully gathered collection of everyday favorites.</p></div><div className="shop-layout"><aside className="filters"><h3>Find your fit</h3><label className="filter-label">Category</label>{categories.map((item) => <button key={item} className={`filter-option ${category === item ? "active" : ""}`} onClick={() => chooseCategory(item)}>{item}<span>{item === "All" ? products.length : products.filter((p) => p.category === item).length}</span></button>)}<label className="filter-label mt-4" htmlFor="shop-search">Search</label><input id="shop-search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product name..." /></aside><section className="shop-results"><div className="results-bar"><span><strong>{visible.length}</strong> lovely finds</span><select className="form-select" aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Sort: Featured</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option></select></div>{visible.length ? <div className="row g-4">{visible.map((product) => <div className="col-6 col-md-4" key={product.id}><ProductCard {...{ product, addToCart, wishlist, toggleWishlist }} /></div>)}</div> : <EmptyState title="No finds just yet" text="Try another search or category." link="/products" action="Clear filters" />}</section></div></div>;
}

function ProductDetail({ products, addToCart, toggleWishlist, wishlist }) {
  const { id } = useParams();
  const product = products.find((item) => item.id === Number(id));
  const [quantity, setQuantity] = useState(1);
  if (!product) return <NotFound />;
  return <div className="container page-wrap"><div className="breadcrumbs"><Link to="/">Home</Link> / <Link to="/products">Shop</Link> / {product.name}</div><div className="detail-layout"><div className={`detail-art product-art ${product.color}`}><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextSibling.style.display = "block"; }} /><span style={{ display: "none" }}>{product.emoji}</span></div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()}</span><h1>{product.name}</h1><div className="rating detail-rating"><span>★</span> {product.rating} <small>({product.reviews} reviews)</small></div><div className="detail-price">{money(product.price)} <del>{money(product.oldPrice)}</del></div><p>{product.description}</p><div className="detail-points"><span>✓ Thoughtfully selected</span><span>✓ Free shipping over $75</span><span>✓ Easy 30-day returns</span></div><label className="filter-label" htmlFor="quantity">Quantity</label><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><input id="quantity" type="number" min="1" max={product.stock} value={quantity} onChange={(event) => setQuantity(Math.min(product.stock, Math.max(1, Number(event.target.value) || 1)))} /><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button></div><div className="detail-actions"><button className="btn btn-dark rounded-pill" disabled={product.stock === 0} onClick={() => addToCart(product.id, quantity)}>{product.stock === 0 ? "Out of stock" : `Add to bag — ${money(product.price * quantity)}`}</button><button className="btn btn-outline-dark rounded-pill" onClick={() => toggleWishlist(product.id)}>{wishlist.includes(product.id) ? "♥ Saved" : "♡ Save for later"}</button></div><p className="detail-note">{product.stock} in stock · A good choice, delivered with care.</p></div></div></div>;
}

function CartPage({ cart, products, updateQuantity }) {
  const navigate = useNavigate();
  const lines = cart.map((item) => ({ ...item, product: products.find((p) => p.id === item.id) })).filter((item) => item.product);
  const subtotal = lines.reduce((total, item) => total + item.product.price * item.qty, 0);
  return <div className="container page-wrap"><div className="page-intro"><span className="eyebrow">YOUR BAG</span><h1>Good things are on their way.</h1></div>{lines.length ? <div className="cart-layout"><section className="cart-items">{lines.map(({ id, qty, product }) => <div className="cart-line" key={id}><Link to={`/product/${id}`} className={`cart-thumb product-art ${product.color}`}>{product.emoji}</Link><div className="cart-line-info"><Link to={`/product/${id}`}>{product.name}</Link><small>{product.category}</small><button className="remove-link" onClick={() => updateQuantity(id, 0)}>Remove</button></div><div className="quantity-control compact"><button onClick={() => updateQuantity(id, qty - 1)}>−</button><span>{qty}</span><button onClick={() => updateQuantity(id, qty + 1)}>+</button></div><strong className="line-total">{money(product.price * qty)}</strong></div>)}</section><aside className="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{subtotal >= 75 ? "Free" : money(6.99)}</b></div><div className="summary-total"><span>Total</span><b>{money(subtotal + (subtotal >= 75 ? 0 : 6.99))}</b></div><button className="btn btn-dark rounded-pill w-100" onClick={() => navigate("/checkout")}>Continue to checkout →</button><small>Taxes calculated at checkout</small><Link className="continue-link" to="/products">← Keep browsing</Link></aside></div> : <EmptyState title="Your bag is taking a little break" text="Let's find something you'll love." link="/products" action="Explore the shop" />}</div>;
}

function CheckoutPage({ cart, products, setProducts, setCart, orders, setOrders, user, setNotice }) {
  const navigate = useNavigate();
  const lines = cart.map((item) => ({ ...item, product: products.find((p) => p.id === item.id) })).filter((item) => item.product);
  const subtotal = lines.reduce((total, item) => total + item.product.price * item.qty, 0);
  const total = subtotal + (subtotal >= 75 || subtotal === 0 ? 0 : 6.99);
  const submit = (event) => {
    event.preventDefault();
    if (!lines.length) return;
    const unavailable = lines.find((item) => item.qty > item.product.stock);
    if (unavailable) {
      setNotice(`${unavailable.product.name} no longer has enough stock`);
      return;
    }
    const form = new FormData(event.currentTarget);
    const order = { id: `SE-${Date.now().toString().slice(-8)}`, date: new Date().toISOString(), status: "Preparing your order", items: lines, total, customer: form.get("name"), email: form.get("email"), address: `${form.get("address")}, ${form.get("city")} ${form.get("zip")}`, payment: form.get("payment") };
    setOrders([order, ...orders]);
    setProducts((current) => current.map((product) => {
      const purchased = lines.find((item) => item.id === product.id);
      return purchased ? { ...product, stock: Math.max(0, product.stock - purchased.qty) } : product;
    }));
    setCart([]);
    if (user) setNotice("Order placed — thank you!");
    navigate(`/orders?placed=${order.id}`);
  };
  if (!lines.length) return <div className="container page-wrap"><EmptyState title="Nothing to check out" text="Add a few good things to your bag first." link="/products" action="Explore the shop" /></div>;
  return <div className="container page-wrap"><div className="page-intro"><span className="eyebrow">SECURE CHECKOUT</span><h1>Almost yours.</h1><p>Just a few details, and we'll take it from here.</p></div><form className="checkout-layout" onSubmit={submit}><section className="checkout-form"><div className="form-panel"><h3>Contact & delivery</h3><div className="row g-3"><div className="col-12"><label className="form-label">Full name</label><input className="form-control" name="name" defaultValue={user?.name || ""} required minLength="2" placeholder="Jamie Taylor" /></div><div className="col-12"><label className="form-label">Email address</label><input className="form-control" type="email" name="email" defaultValue={user?.email || ""} required placeholder="you@example.com" /></div><div className="col-12"><label className="form-label">Street address</label><input className="form-control" name="address" required minLength="5" placeholder="123 Main Street" /></div><div className="col-md-7"><label className="form-label">City</label><input className="form-control" name="city" required /></div><div className="col-md-5"><label className="form-label">ZIP / postal code</label><input className="form-control" name="zip" required minLength="3" maxLength="10" /></div></div></div><div className="form-panel"><h3>Payment method</h3><label className="payment-option"><input type="radio" name="payment" value="Pay on delivery" defaultChecked /> <span><b>Pay on delivery</b><small>Pay when your order arrives</small></span><span>📦</span></label><label className="payment-option"><input type="radio" name="payment" value="Demo card" /> <span><b>Demo card</b><small>Simulation only — no real payment</small></span><span>💳</span></label><p className="payment-note">This is a demo store. No payment details are collected.</p></div></section><aside className="order-summary"><h3>Your order</h3>{lines.map(({ product, qty }) => <div className="checkout-item" key={product.id}><span>{product.emoji} {product.name} × {qty}</span><b>{money(product.price * qty)}</b></div>)}<div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Shipping</span><b>{subtotal >= 75 ? "Free" : money(6.99)}</b></div><div className="summary-total"><span>Total</span><b>{money(total)}</b></div><button className="btn btn-dark rounded-pill w-100">Place your order →</button></aside></form></div>;
}

function WishlistPage({ products, wishlist, toggleWishlist, addToCart }) {
  const saved = products.filter((product) => wishlist.includes(product.id));
  return <div className="container page-wrap"><div className="page-intro"><span className="eyebrow">YOUR LITTLE LIST</span><h1>Saved for a good day.</h1><p>All the things that caught your eye, in one place.</p></div>{saved.length ? <div className="row g-4">{saved.map((product) => <div className="col-6 col-md-4 col-lg-3" key={product.id}><ProductCard {...{ product, addToCart, wishlist, toggleWishlist }} /></div>)}</div> : <EmptyState title="Your wishlist is waiting" text="Tap the heart on anything you love to save it here." link="/products" action="Find something lovely" />}</div>;
}

function OrdersPage({ orders, user }) {
  const [params] = useSearchParams();
  return <div className="container page-wrap"><div className="page-intro"><span className="eyebrow">THE GOOD STUFF, ON ITS WAY</span><h1>Your orders</h1><p>Every order, together in one place.</p></div>{params.get("placed") && <div className="success-message"><span>✓</span><div><b>Order placed. Nice choice!</b><small>Your confirmation number is {params.get("placed")}. This demo order is saved on this device.</small></div></div>}{orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-head"><div><small>ORDER PLACED</small><b>{new Date(order.date).toLocaleDateString()}</b></div><div><small>ORDER ID</small><b>{order.id}</b></div><div><small>SHIP TO</small><b>{order.customer || user?.name || "Customer"}</b></div><strong>{money(order.total)}</strong></div><div className="order-body"><div><span className="order-status"><i />{order.status}</span><p>Your order is being carefully prepared.</p>{order.items.map((item) => <span className="order-product" key={item.id}>{item.product?.emoji || "📦"} {item.product?.name || "ShopEase item"} × {item.qty}</span>)}</div><div className="tracking-box"><b>Shipment tracking</b><small>Tracking details will appear here once your order ships.</small><div className="tracking-progress"><i /><i /><i /><i /></div><small>Order placed <span>Preparing</span> On the way <span>Delivered</span></small></div></div></article>)}</div> : <EmptyState title="No orders just yet" text="When you find your next favorite, it'll show up here." link="/products" action="Start exploring" />}</div>;
}

function AdminPage({ products, setProducts, orders }) {
  const blank = { name: "", category: "Home", price: "", oldPrice: "", rating: "4.5", reviews: "0", stock: "20", emoji: "✨", color: "cream", description: "" };
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const save = (event) => {
    event.preventDefault();
    const item = { ...form, id: editing || Date.now(), price: Number(form.price), oldPrice: Number(form.oldPrice || form.price), rating: Number(form.rating), reviews: Number(form.reviews), stock: Number(form.stock), name: form.name.trim(), description: form.description.trim() };
    if (editing) setProducts((all) => all.map((product) => product.id === editing ? item : product));
    else setProducts((all) => [item, ...all]);
    setForm(blank); setEditing(null); setMessage(editing ? "Product updated." : "Product added.");
    setTimeout(() => setMessage(""), 2500);
  };
  const edit = (product) => { setEditing(product.id); setForm({ ...product, price: String(product.price), oldPrice: String(product.oldPrice), rating: String(product.rating), reviews: String(product.reviews), stock: String(product.stock) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (id) => { if (window.confirm("Delete this product from the catalog?")) setProducts((all) => all.filter((product) => product.id !== id)); };
  const inventory = products.length;
  const unitsSold = orders.reduce((count, order) => count + order.items.reduce((sum, item) => sum + item.qty, 0), 0);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  return <div className="container page-wrap admin-page"><div className="page-intro"><span className="eyebrow">SELLER STUDIO</span><h1>A little look behind the shop.</h1><p>Manage your catalog and keep an eye on how things are going.</p></div><div className="stats-grid"><div><small>PRODUCTS IN CATALOG</small><b>{inventory}</b><span>Active finds</span></div><div><small>ORDERS PLACED</small><b>{orders.length}</b><span>{unitsSold} items ordered</span></div><div><small>GROSS SALES</small><b>{money(revenue)}</b><span>Across all orders</span></div></div><div className="admin-layout"><form className="form-panel admin-form" onSubmit={save}><h3>{editing ? "Edit this find" : "Add a new find"}</h3>{message && <div className="inline-success">{message}</div>}<label className="form-label">Product name</label><input className="form-control mb-3" required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><label className="form-label">Description</label><textarea className="form-control mb-3" rows="3" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="row g-2"><div className="col-6"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{["Electronics", "Home", "Fashion", "Accessories"].map((category) => <option key={category}>{category}</option>)}</select></div><div className="col-6"><label className="form-label">Icon / emoji</label><input className="form-control" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></div><div className="col-6"><label className="form-label">Price ($)</label><input className="form-control" type="number" min="0.01" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>  <div className="col-6"><label className="form-label">Original price ($)</label><input className="form-control" type="number" min="0.01" step="0.01" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} /></div><div className="col-6"><label className="form-label">Inventory units</label><input className="form-control" type="number" min="0" step="1" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div></div><div className="admin-form-actions"><button className="btn btn-dark rounded-pill">{editing ? "Save changes" : "Add product"}</button>{editing && <button type="button" className="btn btn-outline-dark rounded-pill" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}</div></form><section className="inventory-panel"><div className="inventory-heading"><div><h3>Product inventory</h3><p>Manage the things in your shop.</p></div><span>{products.length} items</span></div><div className="table-responsive"><table className="table inventory-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>IN STOCK</th><th>ACTIONS</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><span className={`mini-art ${product.color}`}>{product.emoji}</span><b>{product.name}</b></td><td>{product.category}</td><td>{money(product.price)}</td><td><span className="stock-status"><i />{product.stock} units</span></td><td><button className="table-action" onClick={() => edit(product)}>Edit</button><button className="table-action delete" onClick={() => remove(product.id)}>Delete</button></td></tr>)}</tbody></table></div><h3 className="admin-orders-heading">Recent orders <span>{orders.length}</span></h3>{orders.length ? orders.slice(0, 5).map((order) => <div className="admin-order" key={order.id}><div><b>{order.id}</b><small>{order.customer} · {new Date(order.date).toLocaleDateString()}</small></div><strong>{money(order.total)}</strong><span className="order-status"><i />{order.status}</span></div>) : <p className="muted-copy">Orders placed by customers will appear here.</p>}</section></div></div>;
}

function AccountPage({ user, setUser, setNotice }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  if (user) return <div className="container page-wrap account-wrap"><div className="account-card"><span className="account-icon">✦</span><span className="eyebrow">YOUR ACCOUNT</span><h1>Good to see you, {user.name}.</h1><p>You're signed in as {user.email}.</p><div className="d-flex gap-2 justify-content-center"><Link className="btn btn-dark rounded-pill" to="/orders">View your orders</Link><button className="btn btn-outline-dark rounded-pill" onClick={() => { setUser(null); setNotice("You have been signed out"); }}>Sign out</button></div><Link className="seller-link" to="/admin">Visit seller studio →</Link></div></div>;
  const submit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const account = { name: mode === "register" ? data.get("name").trim() : data.get("email").split("@")[0], email: data.get("email").trim() };
    setUser(account); setNotice(mode === "register" ? "Welcome to ShopEase!" : "Welcome back!"); navigate("/");
  };
  return <div className="container page-wrap account-wrap"><form className="account-card" onSubmit={submit}><span className="account-icon">✦</span><span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN THE GOOD FINDS CLUB"}</span><h1>{mode === "login" ? "Hello again." : "Make yourself at home."}</h1><p>{mode === "login" ? "Sign in and pick up where you left off." : "Create an account to keep your good things together."}</p>{error && <div className="form-error">{error}</div>}{mode === "register" && <div className="mb-3 text-start"><label className="form-label">Your name</label><input className="form-control" name="name" required minLength="2" placeholder="Jamie Taylor" /></div>}<div className="mb-3 text-start"><label className="form-label">Email address</label><input className="form-control" name="email" type="email" required placeholder="you@example.com" /></div><div className="mb-4 text-start"><label className="form-label">Password</label><input className="form-control" name="password" type="password" required minLength="6" placeholder="At least 6 characters" /></div><button className="btn btn-dark rounded-pill w-100">{mode === "login" ? "Sign in" : "Create account"} →</button><small className="account-demo">Demo frontend only — your account is saved on this device.</small><div className="account-switch">{mode === "login" ? "New around here?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></div><Link className="seller-link" to="/admin">Open seller studio →</Link></form></div>;
}

function EmptyState({ title, text, link, action }) {
  return <div className="empty-state"><span>✳</span><h2>{title}</h2><p>{text}</p><Link className="btn btn-dark rounded-pill px-4" to={link}>{action} →</Link></div>;
}

function NotFound() {
  return <div className="container page-wrap"><EmptyState title="This page wandered off" text="Let's get you back to the good finds." link="/" action="Back to home" /></div>;
}

function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-main"><div><Link className="navbar-brand" to="/">shop<span>ease</span><i>.</i></Link><p>Thoughtful finds for your<br />everyday kind of wonderful.</p></div><div><b>THE SHOP</b><Link to="/products">Shop all</Link><Link to="/products?category=Home">Home & living</Link><Link to="/products?category=Fashion">Wear & carry</Link></div><div><b>HERE TO HELP</b><Link to="/orders">Your orders</Link><Link to="/wishlist">Your wishlist</Link><Link to="/login">Your account</Link></div><div><b>OUR LITTLE PROMISE</b><p>Good things, fair prices,<br />and care in every detail.</p><span className="footer-stars">★★★★★</span></div></div><div className="footer-bottom"><span>© 2026 ShopEase. Made for good finds.</span><span>Demo storefront · No real payments</span></div></div></footer>;
}

export default App;
