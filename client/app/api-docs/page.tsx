'use client'

import { useState } from 'react'
import { Copy, Check, Code, Zap, MessageSquare, ThumbsUp, Package, Server } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'reactions' | 'comments' | 'orders' | 'products'>('reactions')

  const serverUrl = typeof window !== 'undefined' ? window.location.origin.replace('3000', '3001') : 'http://localhost:3001'

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(label)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const CodeBlock = ({ code, language = 'json', label }: { code: string; language?: string; label: string }) => (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => copyToClipboard(code, label)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {copiedCode === label ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-300" />
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )

  const ApiEndpoint = ({ method, endpoint, description }: { method: string; endpoint: string; description: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`px-3 py-1 rounded font-semibold text-sm w-fit ${
        method === 'POST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {method}
      </span>
      <code className="flex-1 text-xs sm:text-sm font-mono text-gray-700 break-all">{endpoint}</code>
      <span className="text-xs sm:text-sm text-gray-500">{description}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <Server className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Public Webhook API</h1>
            <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold w-fit">
              ✓ NO AUTH REQUIRED
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600">4 Public endpoints for webhook data integration - No authentication needed</p>
        </div>

        {/* Server URL */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
            Base URL
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <code className="flex-1 bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-mono text-xs sm:text-lg break-all">
              {serverUrl}
            </code>
            <button
              onClick={() => copyToClipboard(serverUrl, 'baseUrl')}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {copiedCode === 'baseUrl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('reactions')}
            className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'reactions'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Save Reaction</span>
            <span className="sm:hidden">Reaction</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'comments'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Save Comment</span>
            <span className="sm:hidden">Comment</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Order</span>
            <span className="sm:hidden">Order</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Get Products</span>
            <span className="sm:hidden">Products</span>
          </button>
        </div>

        {/* Reactions API */}
        {activeTab === 'reactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <ThumbsUp className="w-6 h-6 mr-2 text-purple-600" />
                Save Reaction API
              </h2>

              {/* Endpoint */}
              <div className="space-y-3 mb-6">
                <ApiEndpoint method="POST" endpoint="/api/save-reaction" description="Save or remove user reactions" />
              </div>

              {/* Save Reaction */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">👍 Save User Reaction</h3>
                <p className="text-gray-600 mb-4">Track when users add or remove reactions (LIKE, LOVE, CARE, HAHA, WOW, SAD, ANGRY)</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">🔗 Endpoint:</h4>
                  <CodeBlock
                    label="reaction-endpoint"
                    language="text"
                    code={`POST ${serverUrl}/api/save-reaction`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📋 Required Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-purple-600">user_id</span>
                      <p className="text-xs text-gray-600 mt-1">User's unique identifier</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-purple-600">reaction_type</span>
                      <p className="text-xs text-gray-600 mt-1">LIKE, LOVE, CARE, HAHA, WOW, SAD, ANGRY</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📝 Optional Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">post_id</span>
                      <p className="text-xs text-gray-500 mt-1">Post identifier</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">post_url</span>
                      <p className="text-xs text-gray-500 mt-1">URL to the post</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">action_type</span>
                      <p className="text-xs text-gray-500 mt-1">ADDED or REMOVED</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📤 Request Example:</h4>
                  <CodeBlock
                    label="reaction-request"
                    language="javascript"
                    code={`// n8n HTTP Request Node
Method: POST
URL: ${serverUrl}/api/save-reaction

Headers:
  Content-Type: application/json

Body (JSON):
{
  "user_id": "facebook_user_12345",
  "reaction_type": "LOVE",
  "post_id": "post_67890",
  "post_url": "https://facebook.com/posts/67890",
  "action_type": "ADDED"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">✅ Success Response (201):</h4>
                  <CodeBlock
                    label="reaction-success"
                    code={`{
  "success": true,
  "message": "Reaction saved successfully",
  "data": {
    "user_id": "facebook_user_12345",
    "reaction_type": "LOVE",
    "post_id": "post_67890",
    "post_url": "https://facebook.com/posts/67890",
    "action_type": "ADDED",
    "createdAt": "2025-10-21T10:30:00.000Z",
    "_id": "67168abc123def456789"
  }
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">❌ Error Response (400):</h4>
                  <CodeBlock
                    label="reaction-error"
                    code={`{
  "success": false,
  "message": "Validation error",
  "error": "user_id and reaction_type are required"
}`}
                  />
                </div>
              </div>

              {/* n8n Example */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center text-purple-900">
                  <Code className="w-5 h-5 mr-2" />
                  n8n Integration Example
                </h4>
                <CodeBlock
                  label="reaction-n8n"
                  language="javascript"
                  code={`// n8n Function Node - Process Facebook Reaction Webhook
const reaction = $input.item.json;

return {
  json: {
    user_id: reaction.sender?.id || '',
    reaction_type: (reaction.reaction || 'LIKE').toUpperCase(),
    post_id: reaction.post_id || '',
    post_url: reaction.post_url || '',
    action_type: reaction.verb === 'remove' ? 'REMOVED' : 'ADDED'
  }
};`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Orders API */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Package className="w-6 h-6 mr-2 text-blue-600" />
                Create Order API
              </h2>

              {/* Endpoint */}
              <div className="space-y-3 mb-6">
                <ApiEndpoint method="POST" endpoint="/api/create-order" description="Create new customer order" />
              </div>

              {/* Create Order */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">📦 Create Customer Order</h3>
                <p className="text-gray-600 mb-4">Create new orders from Facebook messages or webhooks</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">🔗 Endpoint:</h4>
                  <CodeBlock
                    label="order-endpoint"
                    language="text"
                    code={`POST ${serverUrl}/api/create-order`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📋 Required Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-blue-600">name</span>
                      <p className="text-xs text-gray-600 mt-1">Customer name</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-blue-600">number</span>
                      <p className="text-xs text-gray-600 mt-1">Customer phone number</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📝 Optional Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">address</span>
                      <p className="text-xs text-gray-500 mt-1">Delivery address</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">product_name</span>
                      <p className="text-xs text-gray-500 mt-1">Product name</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">total_product</span>
                      <p className="text-xs text-gray-500 mt-1">Quantity (number)</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">total_price</span>
                      <p className="text-xs text-gray-500 mt-1">Total price (number)</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">sender_id</span>
                      <p className="text-xs text-gray-500 mt-1">Facebook user ID</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">recipient_id</span>
                      <p className="text-xs text-gray-500 mt-1">Facebook page ID</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">text</span>
                      <p className="text-xs text-gray-500 mt-1">Full message text</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📤 Request Example:</h4>
                  <CodeBlock
                    label="order-request"
                    language="javascript"
                    code={`// n8n HTTP Request Node
Method: POST
URL: ${serverUrl}/api/create-order

Headers:
  Content-Type: application/json

Body (JSON):
{
  "name": "আহমেদ হাসান",
  "number": "01712345678",
  "address": "Dhaka, Mirpur 10",
  "product_name": "Premium T-Shirt (Blue)",
  "total_product": 3,
  "total_price": 2400,
  "sender_id": "facebook_user_12345",
  "recipient_id": "page_67890",
  "text": "Full Facebook message text"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">✅ Success Response (201):</h4>
                  <CodeBlock
                    label="order-success"
                    code={`{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "ORD1729500012345",
    "name": "আহমেদ হাসান",
    "number": "01712345678",
    "address": "Dhaka, Mirpur 10",
    "product_name": "Premium T-Shirt (Blue)",
    "total_product": 3,
    "total_price": 2400,
    "status": "PENDING",
    "sender_id": "facebook_user_12345",
    "recipient_id": "page_67890",
    "createdAt": "2025-10-21T10:30:00.000Z",
    "_id": "67168abc123def456789"
  }
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">❌ Error Response (400):</h4>
                  <CodeBlock
                    label="order-error"
                    code={`{
  "success": false,
  "message": "Bad request - please check your parameters",
  "error": "VALIDATION_ERROR",
  "details": {
    "missing_fields": [
      "Customer name (name)",
      "Phone number (number)"
    ],
    "hint": "name and number are required fields"
  }
}`}
                  />
                </div>
              </div>

              {/* n8n Example */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center text-blue-900">
                  <Code className="w-5 h-5 mr-2" />
                  n8n Integration Example
                </h4>
                <CodeBlock
                  label="order-n8n"
                  language="javascript"
                  code={`// n8n Function Node - Extract order from Facebook message
const message = $input.item.json.message || '';
const senderId = $input.item.json.sender?.id || '';
const recipientId = $input.item.json.recipient?.id || '';

// Helper function to extract field values
function extractField(text, fieldName) {
  const regex = new RegExp(\`\${fieldName}\\\\s*:?\\\\s*(.+?)(?:\\\\n|$)\`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Extract order details
const name = extractField(message, 'Name|নাম');
const number = extractField(message, 'Phone|Number|মোবাইল');
const address = extractField(message, 'Address|ঠিকানা');
const product = extractField(message, 'Product|পণ্য');
const quantity = extractField(message, 'Quantity|সংখ্যা');
const price = extractField(message, 'Price|দাম');

return {
  json: {
    name: name,
    number: number,
    address: address,
    product_name: product,
    total_product: parseInt(quantity) || 1,
    total_price: parseFloat(price) || 0,
    sender_id: senderId,
    recipient_id: recipientId,
    text: message
  }
};`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Reactions API */}
        {activeTab === 'reactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <ThumbsUp className="w-6 h-6 mr-2 text-blue-600" />
                Reactions API
              </h2>

              {/* Endpoints */}
              <div className="space-y-3 mb-6">
                <ApiEndpoint method="POST" endpoint="/api/public/reactions" description="Save reaction" />
                <ApiEndpoint method="GET" endpoint="/api/public/reactions" description="Get all reactions" />
              </div>

              {/* Save Reaction */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">👍 Save Reaction</h3>
                <p className="text-gray-600 mb-4">Track user reactions (LIKE, LOVE, CARE, HAHA, WOW, SAD, ANGRY)</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Request:</h4>
                  <CodeBlock
                    label="reaction-request"
                    language="javascript"
                    code={`// HTTP Request Node Configuration
Method: POST
URL: ${serverUrl}/api/public/reactions

Headers:
  Content-Type: application/json

Body (JSON):
{
  "user_id": "facebook_user_123",
  "reaction_type": "LOVE",
  "post_id": "post_456",
  "post_url": "https://facebook.com/posts/456",
  "action_type": "ADDED"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Valid Reaction Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'].map(type => (
                      <span key={type} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Success Response (201):</h4>
                  <CodeBlock
                    label="reaction-success"
                    code={`{
  "success": true,
  "message": "Reaction saved successfully",
  "data": {
    "user_id": "facebook_user_123",
    "reaction_type": "LOVE",
    "post_id": "post_456",
    "action_type": "ADDED",
    "createdAt": "2025-10-15T10:30:00.000Z"
  }
}`}
                  />
                </div>
              </div>

              {/* n8n Example */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center text-purple-900">
                  <Code className="w-5 h-5 mr-2" />
                  n8n Setup Example
                </h4>
                <CodeBlock
                  label="reaction-n8n"
                  language="javascript"
                  code={`// In n8n HTTP Request Node
return {
  json: {
    user_id: $json.sender.id,
    reaction_type: $json.reaction.toUpperCase(),
    post_id: $json.post_id,
    post_url: $json.post_url,
    action_type: "ADDED"
  }
};`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Comments API */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-green-600" />
                Save Comment API
              </h2>

              {/* Endpoint */}
              <div className="space-y-3 mb-6">
                <ApiEndpoint method="POST" endpoint="/api/save-comment" description="Save user comments and replies" />
              </div>

              {/* Save Comment */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">💬 Save User Comment</h3>
                <p className="text-gray-600 mb-4">Track user comments on posts or as replies to other comments</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">🔗 Endpoint:</h4>
                  <CodeBlock
                    label="comment-endpoint"
                    language="text"
                    code={`POST ${serverUrl}/api/save-comment`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📋 Required Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-green-600">user_id</span>
                      <p className="text-xs text-gray-600 mt-1">User's unique identifier</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-green-600">comment</span>
                      <p className="text-xs text-gray-600 mt-1">The comment text content</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📝 Optional Fields:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">user_name</span>
                      <p className="text-xs text-gray-500 mt-1">User's display name</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">comment_id</span>
                      <p className="text-xs text-gray-500 mt-1">Comment unique ID</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">post_id</span>
                      <p className="text-xs text-gray-500 mt-1">Post identifier</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">post_url</span>
                      <p className="text-xs text-gray-500 mt-1">URL to the post</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">parent_comment_id</span>
                      <p className="text-xs text-gray-500 mt-1">If reply, parent comment ID</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-gray-600">action_type</span>
                      <p className="text-xs text-gray-500 mt-1">ADDED or REMOVED</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📤 Request Example:</h4>
                  <CodeBlock
                    label="comment-request"
                    language="javascript"
                    code={`// n8n HTTP Request Node
Method: POST
URL: ${serverUrl}/api/save-comment

Headers:
  Content-Type: application/json

Body (JSON):
{
  "user_id": "facebook_user_12345",
  "user_name": "John Doe",
  "comment": "This is an amazing product! 👍",
  "comment_id": "comment_67890",
  "post_id": "post_12345",
  "post_url": "https://facebook.com/posts/12345",
  "action_type": "ADDED"
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">✅ Success Response (201):</h4>
                  <CodeBlock
                    label="comment-success"
                    code={`{
  "success": true,
  "message": "Comment saved successfully",
  "data": {
    "user_id": "facebook_user_12345",
    "user_name": "John Doe",
    "comment": "This is an amazing product! 👍",
    "comment_id": "comment_67890",
    "post_id": "post_12345",
    "post_url": "https://facebook.com/posts/12345",
    "action_type": "ADDED",
    "createdAt": "2025-10-21T10:30:00.000Z",
    "_id": "67168abc123def456789"
  }
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">❌ Error Response (400):</h4>
                  <CodeBlock
                    label="comment-error"
                    code={`{
  "success": false,
  "message": "Validation error",
  "error": "user_id and comment are required"
}`}
                  />
                </div>
              </div>

              {/* n8n Example */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center text-green-900">
                  <Code className="w-5 h-5 mr-2" />
                  n8n Integration Example
                </h4>
                <CodeBlock
                  label="comment-n8n"
                  language="javascript"
                  code={`// n8n Function Node - Process Facebook Comment Webhook
const comment = $input.item.json;

return {
  json: {
    user_id: comment.sender?.id || '',
    user_name: comment.sender?.name || '',
    comment: comment.message || '',
    comment_id: comment.comment_id || '',
    post_id: comment.post_id || '',
    post_url: comment.post_url || '',
    parent_comment_id: comment.parent_id || null,
    action_type: comment.verb === 'remove' ? 'REMOVED' : 'ADDED'
  }
};`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Products API */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Package className="w-6 h-6 mr-2 text-orange-600" />
                Get Products API
              </h2>

              {/* Endpoint */}
              <div className="space-y-3 mb-6">
                <ApiEndpoint method="GET" endpoint="/api/public/products" description="Get all products (public access)" />
              </div>

              {/* Get Products */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">📦 Get All Products</h3>
                <p className="text-gray-600 mb-4">Fetch all active products from the database for n8n integration</p>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">🔗 Endpoint:</h4>
                  <CodeBlock
                    label="product-endpoint"
                    language="text"
                    code={`GET ${serverUrl}/api/public/products`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📝 Query Parameters (Optional):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-orange-600">status</span>
                      <p className="text-xs text-gray-600 mt-1">Filter by status: ACTIVE, INACTIVE, OUT_OF_STOCK</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-orange-600">page</span>
                      <p className="text-xs text-gray-600 mt-1">Page number (default: 1)</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-mono text-sm text-orange-600">limit</span>
                      <p className="text-xs text-gray-600 mt-1">Items per page (default: 100)</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">📤 Request Example:</h4>
                  <CodeBlock
                    label="product-request"
                    language="javascript"
                    code={`// n8n HTTP Request Node
Method: GET
URL: ${serverUrl}/api/public/products

// With filters:
URL: ${serverUrl}/api/public/products?status=ACTIVE&page=1&limit=50

Headers:
  Content-Type: application/json`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">✅ Success Response (200):</h4>
                  <CodeBlock
                    label="product-success"
                    code={`{
  "success": true,
  "data": [
    {
      "_id": "67168abc123def456789",
      "productName": "Premium T-Shirt",
      "brandName": "Fashion Brand",
      "shortDescription": "Comfortable cotton t-shirt",
      "price": 1200,
      "discount": 10,
      "finalPrice": 1080,
      "stockQuantity": 50,
      "productCode": "TSHIRT001",
      "status": "ACTIVE",
      "createdAt": "2025-10-21T10:30:00.000Z",
      "updatedAt": "2025-10-21T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 25,
    "pages": 1
  }
}`}
                  />
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">❌ Error Response (500):</h4>
                  <CodeBlock
                    label="product-error"
                    code={`{
  "success": false,
  "message": "Error fetching products",
  "error": "Database connection error"
}`}
                  />
                </div>
              </div>

              {/* n8n Example */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center text-orange-900">
                  <Code className="w-5 h-5 mr-2" />
                  n8n Integration Example
                </h4>
                <CodeBlock
                  label="product-n8n"
                  language="javascript"
                  code={`// n8n HTTP Request Node - Fetch all active products
// Step 1: Configure HTTP Request Node
// Method: GET
// URL: ${serverUrl}/api/public/products?status=ACTIVE

// Step 2: Process products in Function Node
const products = $input.item.json.data;

// Filter products with stock
const inStockProducts = products.filter(p => p.stockQuantity > 0);

// Format for display
const productList = inStockProducts.map(p => {
  return {
    name: p.productName,
    brand: p.brandName || 'N/A',
    code: p.productCode,
    price: \`৳\${p.finalPrice}\`,
    stock: p.stockQuantity,
    discount: p.discount > 0 ? \`\${p.discount}% OFF\` : 'No discount'
  };
});

return {
  json: {
    totalProducts: products.length,
    inStockProducts: inStockProducts.length,
    products: productList
  }
};`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mt-8">
          <h3 className="text-xl font-bold mb-4">💡 Integration Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Public Endpoints (No Auth)</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>POST /api/save-reaction</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>POST /api/save-comment</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>POST /api/create-order</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>GET /api/public/products</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔒 Security Notes</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>All other APIs require admin authentication</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Login from dashboard to access protected endpoints</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Session tokens expire after 24 hours</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🚀 Best Practices</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Always send Content-Type: application/json header</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Handle both success and error responses</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Test with sample data before going live</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔧 Integration Tips</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use n8n Function Node to transform webhook data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Real-time updates via Socket.IO after save</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check response status codes (201 = success)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

