import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'

const PRODUCTS_API = 'http://localhost:3001/products'
const CART_API = 'http://localhost:3001/cart'

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')

  const loadProducts = async () => {
    const res = await fetch(PRODUCTS_API)
    const data = await res.json()
    setProducts(data)
  }

  const loadCart = async () => {
    const res = await fetch(CART_API)
    const data = await res.json()
    setCart(data)
  }

  useEffect(() => {
    loadProducts()
    loadCart()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = async (product) => {
    const existing = cart.find((item) => String(item.productId) === String(product.id))

    if (existing) {
      await fetch(`${CART_API}/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: existing.quantity + 1 })
      })
    } else {
      await fetch(CART_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          description: product.description,
          quantity: 1
        })
      })
    }

    loadCart()
  }

  const increaseQty = async (cartId) => {
    const item = cart.find((i) => String(i.id) === String(cartId))
    if (!item) return

    await fetch(`${CART_API}/${cartId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: item.quantity + 1 })
    })

    loadCart()
  }

  const decreaseQty = async (cartId) => {
    const item = cart.find((i) => String(i.id) === String(cartId))
    if (!item) return

    if (item.quantity <= 1) {
      await fetch(`${CART_API}/${cartId}`, { method: 'DELETE' })
    } else {
      await fetch(`${CART_API}/${cartId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity - 1 })
      })
    }

    loadCart()
  }

  const removeFromCart = async (cartId) => {
    await fetch(`${CART_API}/${cartId}`, { method: 'DELETE' })
    loadCart()
  }

  return (
    <>
      <nav className="amazon-nav">
        <Link to="/" className="amazon-logo">amazon clone</Link>

        <input
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <span className="cart-link">Cart ({cartCount})</span>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <Home
              products={filteredProducts}
              addToCart={addToCart}
              cart={cart}
              increaseQty={increaseQty}
              decreaseQty={decreaseQty}
              removeFromCart={removeFromCart}
            />
          }
        />

        <Route
          path="/product/:id"
          element={<ProductPage products={products} addToCart={addToCart} />}
        />
      </Routes>
    </>
  )
}

function Home({ products, addToCart, cart, increaseQty, decreaseQty, removeFromCart }) {
  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-lg-9">
          <div className="hero-banner mb-4">
            <h2>Today's Deals</h2>
            <p>Browse products, search items, view details, and add items to your cart.</p>
          </div>

          <div className="row g-4">
            {products.map((product) => (
              <div className="col-md-6 col-xl-4" key={product.id}>
                <div className="product-card card h-100 shadow-sm">
                  <Link to={`/product/${product.id}`}>
                    <img src={product.image} alt={product.title} className="product-image card-img-top" />
                  </Link>

                  <div className="card-body d-flex flex-column">
                    <h5>{product.title}</h5>
                    <p className="price-tag">${Number(product.price).toFixed(2)}</p>
                    <p className="text-muted">{product.description}</p>

                    <button className="btn btn-warning fw-bold mt-auto" onClick={() => addToCart(product)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-3">
          <SideCart
            cart={cart}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            removeFromCart={removeFromCart}
          />
        </div>
      </div>
    </div>
  )
}

function ProductPage({ products, addToCart }) {
  const { id } = useParams()
  const product = products.find((p) => String(p.id) === String(id))

  if (!product) {
    return (
      <div className="container mt-5">
        <h2>Product not found</h2>
        <Link to="/">Back Home</Link>
      </div>
    )
  }

  return (
    <div className="container mt-5">
      <Link to="/" className="btn btn-outline-secondary mb-4">Back to Products</Link>

      <div className="card p-4 shadow-sm">
        <div className="row align-items-center">
          <div className="col-md-5 text-center">
            <img src={product.image} alt={product.title} className="detail-image" />
          </div>

          <div className="col-md-7">
            <h2>{product.title}</h2>
            <p className="price-tag">${Number(product.price).toFixed(2)}</p>
            <p>{product.description}</p>
            <button className="btn btn-warning fw-bold" onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SideCart({ cart, increaseQty, decreaseQty, removeFromCart }) {
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  return (
    <div className="card shadow-sm p-3 shopping-cart-box">
      <h4 className="mb-3">Shopping Cart</h4>

      {cart.length === 0 ? (
        <p className="text-muted">Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.id} className="cart-item border-bottom pb-3 mb-3">
              <h6>{item.title}</h6>
              <p>${Number(item.price).toFixed(2)} each</p>

              <div className="d-flex align-items-center gap-2">
                {item.quantity === 1 ? (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeFromCart(item.id)}>
                    🗑️
                  </button>
                ) : (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => decreaseQty(item.id)}>
                    -
                  </button>
                )}

                <span>{item.quantity}</span>

                <button className="btn btn-sm btn-outline-secondary" onClick={() => increaseQty(item.id)}>
                  +
                </button>
              </div>
            </div>
          ))}

          <h5>Subtotal: ${total.toFixed(2)}</h5>
        </>
      )}
    </div>
  )
}

export default App
