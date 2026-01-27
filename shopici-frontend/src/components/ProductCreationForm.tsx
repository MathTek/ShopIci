import React, { useEffect, useState } from 'react';
import { supabase } from "../services/supabaseClient";

interface ProductCreationFormProps {
    onProductCreated: (product: any) => void;
    onCancel: () => void;
    isForUpdate?: boolean;
    initialData?: any | null;
}

const ProductCreationForm: React.FC<ProductCreationFormProps> = ({ onProductCreated, onCancel, isForUpdate, initialData }) => {
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        price: string;
        category: string;
        image: File | null;
    }>(() => ({
        title: isForUpdate && initialData?.title ? initialData.title : '',
        description: isForUpdate && initialData?.description ? initialData.description : '',
        price: isForUpdate && initialData?.price ? String(initialData.price) : '',
        category: isForUpdate && initialData?.category ? initialData.category : '',
        image: null 
    }));

  
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
        isForUpdate && initialData?.image_urls ? initialData.image_urls : null
    );

    useEffect(() => {
        console.log('isForUpdate:', isForUpdate);
        if (isForUpdate && initialData) {
            console.log('Setting initial data for update:', initialData);
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                price: initialData.price ? String(initialData.price) : '',
                category: initialData.category || '',
                image: null
            });
            setExistingImageUrl(initialData.image_urls || null);
            console.log('Form data after setting initial data:', formData);
        }
    }, [isForUpdate, initialData]);

    const [userId, setUserId] = useState<string | null>(null);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const getUserId = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setUserId(session?.user.id || null);
        } catch (error) {
            console.error("Error fetching user ID:", error);
            return null;
        }
    }

    useEffect(() => {
        getUserId();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        
        if (!formData.title || !formData.description || !formData.price) {
            alert('Please fill in all required fields');
            return;
        }

     
        if (!isForUpdate && !formData.image) {
            alert('Please select an image for your product');
            return;
        }

        let imageUrl = existingImageUrl || '/placeholder-image.jpg';

       
        if (formData.image) {
            try {
            
                if (!formData.image.type.startsWith('image/')) {
                    alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
                    return;
                }

                if (formData.image.size > 5 * 1024 * 1024) {
                    alert('File is too large. Maximum size allowed: 5MB');
                    return;
                }

               
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    alert('You must be logged in to upload images');
                    return;
                }

                const fileExt = formData.image.name.split('.').pop();
                const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                
                console.log('Uploading image:', fileName);
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(fileName, formData.image, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert('Failed to upload image: ' + uploadError.message);
                    return;
                }

               
                const { data: urlData } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(fileName);
                
                imageUrl = urlData.publicUrl;
                console.log('Image uploaded successfully:', imageUrl);
                
            } catch (error) {
                console.error('Error during image upload:', error);
                alert('Failed to upload image');
                return;
            }
        }

        
        const newProduct = {
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            image_urls: imageUrl,
            status: 'active',
            created_at: new Date().toISOString(),
            user_id: userId
        };

        onProductCreated(newProduct);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
      
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Product Name *
                </label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter product title"
                    required
                />
            </div>

       
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

    
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Price ($) *
                </label>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="10"
                    min="0"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                    placeholder="0.00"
                    required
                />
            </div>

          
            <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                    Category *
                </label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 appearance-none"
                    required
                >
                    <option value="" className="bg-zinc-900 text-white">Select a category</option>
                    <option value="electronics" className="bg-zinc-900 text-white">Electronics</option>
                    <option value="fashion" className="bg-zinc-900 text-white">Fashion</option>
                    <option value="home" className="bg-zinc-900 text-white">Home</option>
                </select>
            </div>

            {!isForUpdate ? (
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        Product Image *
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            name="image"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            required
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
            ) : (
                <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                        Product Image
                    </label>
                    
                 
                    {existingImageUrl && !formData.image && (
                        <div className="mb-4">
                            <p className="text-sm text-white/70 mb-2">Current image:</p>
                            <img 
                                src={existingImageUrl} 
                                alt="Current product" 
                                className="w-32 h-32 object-cover rounded-xl border border-white/20"
                            />
                        </div>
                    )}
                    
          
                    {formData.image && (
                        <div className="mb-4">
                            <p className="text-sm text-white/70 mb-2">New image selected:</p>
                            <img 
                                src={URL.createObjectURL(formData.image)} 
                                alt="New product preview" 
                                className="w-32 h-32 object-cover rounded-xl border border-white/20"
                            />
                        </div>
                    )}
                    
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
                                {formData.image ? `Selected: ${formData.image.name}` : 'Click to change image (optional)'}
                            </span>
                        </label>
                    </div>
                </div>
            )}

         
            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-3 bg-red-500 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                >
                    Cancel
                </button>

            {isForUpdate ? (
                <button
                    type="submit"
                    className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                    Update Product
                </button>
            ) : (
                <button
                    type="submit"
                    className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                    Create Product
                </button>
            )}
            </div>
        </form>
    );
};

export default ProductCreationForm;