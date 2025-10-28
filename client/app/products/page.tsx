'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Search, Filter, X, TrendingUp, DollarSign, Box, AlertCircle } from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'
import { useSocket } from '@/contexts/SocketContext'

interface Product {
  _id: string
  productName: string
  brandName?: string
  shortDescription?: string
  price: number
  discount: number
  finalPrice: number
  stockQuantity: number
  productCode: string
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  createdAt: string
  updatedAt: string
}

interface ProductFormData {
  productName: string
  brandName: string
  shortDescription: string
  price: string
  discount: string
  stockQuantity: string
  productCode: string
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
}

export default function ProductsPage() {
  const { socket } = useSocket()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0
  })

  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    brandName: '',
    shortDescription: '',
    price: '',
    discount: '0',
    stockQuantity: '0',
    productCode: '',
    status: 'ACTIVE'
  })

  const calculateFinalPrice = (price: string, discount: string) => {
    const priceNum = parseFloat(price) || 0
    const discountNum = parseFloat(discount) || 0
    return priceNum - (priceNum * discountNum / 100)
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiService.getProducts(currentPage, 50, statusFilter, searchTerm)
      if (response.success && response.data) {
        setProducts(response.data as Product[])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getProductStats()
      if (response.success && response.stats) {
        setStats(response.stats)
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [currentPage, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchProducts()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (!socket) return

    const handleProductCreated = (product: Product) => {
      setProducts(prev => [product, ...prev])
      fetchStats()
      toast.success('New product added!')
    }

    const handleProductUpdated = (product: Product) => {
      setProducts(prev => prev.map(p => p._id === product._id ? product : p))
      fetchStats()
      toast.success('Product updated!')
    }

    const handleProductDeleted = ({ id }: { id: string }) => {
      setProducts(prev => prev.filter(p => p._id !== id))
      fetchStats()
      toast.success('Product deleted!')
    }

    socket.on('product_created', handleProductCreated)
    socket.on('product_updated', handleProductUpdated)
    socket.on('product_deleted', handleProductDeleted)

    return () => {
      socket.off('product_created', handleProductCreated)
      socket.off('product_updated', handleProductUpdated)
      socket.off('product_deleted', handleProductDeleted)
    }
  }, [socket])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productName || !formData.price || !formData.productCode) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const productData = {
        productName: formData.productName,
        brandName: formData.brandName || undefined,
        shortDescription: formData.shortDescription || undefined,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        productCode: formData.productCode,
        status: formData.status
      }

      if (editingProduct) {
        await apiService.updateProduct(editingProduct._id, productData)
        toast.success('Product updated successfully!')
      } else {
        await apiService.createProduct(productData)
        toast.success('Product created successfully!')
      }

      resetForm()
      fetchProducts()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      productName: product.productName,
      brandName: product.brandName || '',
      shortDescription: product.shortDescription || '',
      price: product.price.toString(),
      discount: product.discount.toString(),
      stockQuantity: product.stockQuantity.toString(),
      productCode: product.productCode,
      status: product.status
    })
    setShowAddModal(true)
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await apiService.deleteProduct(productId)
      toast.success('Product deleted successfully!')
      fetchProducts()
      fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      productName: '',
      brandName: '',
      shortDescription: '',
      price: '',
      discount: '0',
      stockQuantity: '0',
      productCode: '',
      status: 'ACTIVE'
    })
    setEditingProduct(null)
    setShowAddModal(false)
  }

  const finalPrice = calculateFinalPrice(formData.price, formData.discount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 flex items-center">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-purple-600" />
              Product Management
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your product inventory</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Add Product</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Products</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.totalProducts}</p>
              </div>
              <Box className="hidden sm:block w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Active</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.activeProducts}</p>
              </div>
              <TrendingUp className="hidden sm:block w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Inactive</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-600 mt-0.5 sm:mt-1">{stats.inactiveProducts}</p>
              </div>
              <AlertCircle className="hidden sm:block w-12 h-12 text-gray-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Out of Stock</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600 mt-0.5 sm:mt-1">{stats.outOfStockProducts}</p>
              </div>
              <Package className="hidden sm:block w-12 h-12 text-red-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-6 col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Stock Value</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-0.5 sm:mt-1">৳{stats.totalStockValue.toLocaleString()}</p>
              </div>
              <DollarSign className="hidden sm:block w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by product name, brand, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table (Desktop) & Cards (Mobile) */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Discount</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Final Price</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.productName}</div>
                          {product.shortDescription && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.shortDescription}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {product.brandName || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {product.productCode}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ৳{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {product.discount > 0 ? (
                          <span className="text-green-600 font-medium">{product.discount}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-purple-600">
                        ৳{product.finalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.stockQuantity > 10 
                            ? 'bg-green-100 text-green-700'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : product.status === 'INACTIVE'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="px-4 py-12 text-center text-gray-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                No products found
              </div>
            ) : (
              products.map((product) => (
                <div key={product._id} className="p-4 hover:bg-gray-50 transition-colors">
                  {/* Product Name & Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{product.productName}</h3>
                      {product.brandName && (
                        <p className="text-sm text-gray-500 mt-0.5">{product.brandName}</p>
                      )}
                      {product.shortDescription && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.shortDescription}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ml-2 ${
                      product.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : product.status === 'INACTIVE'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Product Code</p>
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">{product.productCode}</code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stock</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold ${
                        product.stockQuantity > 10 
                          ? 'bg-green-100 text-green-700'
                          : product.stockQuantity > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stockQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-600">Original Price</p>
                        <p className="text-base font-medium text-gray-900">৳{product.price.toLocaleString()}</p>
                      </div>
                      {product.discount > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Discount</p>
                          <p className="text-sm font-semibold text-green-600">{product.discount}% OFF</p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Final Price</p>
                        <p className="text-lg font-bold text-purple-600">৳{product.finalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600 text-sm sm:text-base">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description (Optional)
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (৳) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Final Price Display */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Final Price (Auto-calculated):</span>
                  <span className="text-2xl font-bold text-purple-600">
                    ৳{finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="PROD001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
