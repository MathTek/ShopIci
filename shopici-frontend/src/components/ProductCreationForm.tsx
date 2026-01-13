import React, { useState } from 'react';

interface ProductCreationFormProps {
    onProductCreated: (product: any) => void;
    onCancel: () => void;
}

const ProductCreationForm: React.FC<ProductCreationFormProps> = ({ onProductCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: null as File | null
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            image: file
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation simple
        if (!formData.name || !formData.description || !formData.price) {
            alert('Please fill in all required fields');
            return;
        }

        // Créer un objet produit
        const newProduct = {
            id: Date.now(), // ID temporaire
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image_url: formData.image ? URL.createObjectURL(formData.image) : '/placeholder-image.jpg',
            status: 'active'
        };

        onProductCreated(newProduct);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Product Name *
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter product name"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Description *
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Describe your product..."
                    required
                />
            </div>

            {/* Price */}
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Price ($) *
                </label>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    placeholder="0.00"
                    required
                />
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Product Image
                </label>
                <div className="relative">
                    <input
                        type="file"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                    />
                    <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-cyan-400 transition-all duration-300 bg-white/5 hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-white/70 text-sm">
                            {formData.image ? formData.image.name : 'Click to upload image'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                    Create Product
                </button>
            </div>
        </form>
    );
};

export default ProductCreationForm;