import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gavel, Upload, Calendar, DollarSign, Image } from 'lucide-react';

const CreateAuction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    item_image: '',
    base_price: '',
    start_time: '',
    end_time: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }

    if (!formData.item_image.trim()) {
      newErrors.item_image = 'Image URL is required';
    } else if (!isValidUrl(formData.item_image)) {
      newErrors.item_image = 'Please enter a valid image URL';
    }

    if (!formData.base_price) {
      newErrors.base_price = 'Base price is required';
    } else if (parseFloat(formData.base_price) <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      const now = new Date();

      if (start <= now) {
        newErrors.start_time = 'Start time must be in the future';
      }

      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('pulasa_ecommerce_token');
      const response = await axios.post('https://pulasa-auction-server.onrender.com/api/auction/create', {
        ...formData,
        base_price: parseFloat(formData.base_price)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Auction created successfully!');
      navigate(`/auction/${response.data.auction.id}`);
    } catch (error) {
      console.error('Create auction error:', error);
      const message = error.response?.data?.error || 'Failed to create auction';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Set minimum dates for form
  const now = new Date();
  const minStartTime = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16); // 5 minutes from now
  const minEndTime = new Date(now.getTime() + 10 * 60000).toISOString().slice(0, 16); // 10 minutes from now

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Auction</h1>
          <p className="text-gray-600">Set up a new auction for rare fish specimens</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Gavel className="h-5 w-5 mr-2" />
                Item Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="item_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    className={`input-field ${errors.item_name ? 'border-error-500' : ''}`}
                    placeholder="e.g., Premium Pulasa Fish"
                    required
                  />
                  {errors.item_name && (
                    <p className="mt-1 text-sm text-error-600">{errors.item_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`input-field ${errors.description ? 'border-error-500' : ''}`}
                    placeholder="Add details about the fish, its rarity, origin, or any special notes."
                    rows={4}
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (INR) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="base_price"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      className={`input-field pl-10 ${errors.base_price ? 'border-error-500' : ''}`}
                      placeholder="1000.00"
                      required
                    />
                  </div>
                  {errors.base_price && (
                    <p className="mt-1 text-sm text-error-600">{errors.base_price}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Item Image */}
            <div>
              <label htmlFor="item_image" className="block text-sm font-medium text-gray-700 mb-2">
                Item Image URL *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="item_image"
                  name="item_image"
                  value={formData.item_image}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.item_image ? 'border-error-500' : ''}`}
                  placeholder="https://example.com/fish-image.jpg"
                  required
                />
              </div>
              {errors.item_image && (
                <p className="mt-1 text-sm text-error-600">{errors.item_image}</p>
              )}
              
              {/* Image Preview */}
              {formData.item_image && isValidUrl(formData.item_image) && (
                <div className="mt-3">
                  <img
                    src={formData.item_image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Auction Timing */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Auction Timing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    min={minStartTime}
                    className={`input-field ${errors.start_time ? 'border-error-500' : ''}`}
                    required
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-error-600">{errors.start_time}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    min={minEndTime}
                    className={`input-field ${errors.end_time ? 'border-error-500' : ''}`}
                    required
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-error-600">{errors.end_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Auction Summary */}
            {formData.item_name && formData.base_price && formData.start_time && formData.end_time && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Auction Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Item:</span>
                    <div className="font-medium">{formData.item_name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Base Price:</span>
                    <div className="font-medium">₹{formData.base_price}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-medium">
                      {formData.start_time && formData.end_time ? (
                        `${Math.round((new Date(formData.end_time) - new Date(formData.start_time)) / (1000 * 60 * 60))} hours`
                      ) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-medium text-primary-600">Ready to Create</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/auctions')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction; 